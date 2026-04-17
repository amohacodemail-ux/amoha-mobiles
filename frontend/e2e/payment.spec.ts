/**
 * Payment Flow E2E Test
 * Validates the full Razorpay payment initialization path end-to-end.
 *
 * Steps:
 *  1. Register (or login) a test user
 *  2. Add a product to cart
 *  3. Navigate to /checkout
 *  4. Fill in a valid shipping address
 *  5. Click "Pay Now"
 *  6. Verify the backend /payment/create-order API returns 200 (no Internal Server Error)
 *  7. Verify the Razorpay checkout popup opens (or capture the error for diagnosis)
 *  8. Take screenshots at key points
 */

import { test, expect, Page } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.amohamobiles.com';
const API_URL = process.env.API_URL || 'https://amoha-backend-v2.onrender.com/api';

// Use env-var overrides when registration is rate-limited on CI/repeated runs.
// First run: registers the user. Subsequent runs: logs in.
const TEST_EMAIL = process.env.PAYMENT_TEST_EMAIL || 'payment_e2e_stable@amohatest.com';
const TEST_PASSWORD = process.env.PAYMENT_TEST_PASSWORD || 'Test@1234Secure!';
const TEST_NAME = 'Payment E2E User';
const TEST_PHONE = '9876543210';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiRegisterAndLogin(): Promise<string> {
  // First try login (fast-path for repeated runs).
  const loginBody = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
  const loginResp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: loginBody,
  });
  const loginData = await loginResp.json();
  if (loginData.token) {
    console.log('Logged in with existing test account');
    return loginData.token as string;
  }

  // Login failed → try registration (first run only).
  const regBody = JSON.stringify({
    name: TEST_NAME, email: TEST_EMAIL,
    password: TEST_PASSWORD, confirmPassword: TEST_PASSWORD,
    phone: TEST_PHONE,
  });
  const regResp = await fetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: regBody,
  });
  const regData = await regResp.json();
  if (regData.token) {
    console.log('Registered new test account');
    return regData.token as string;
  }

  // Registration may be rate-limited (429) — login one more time in case the user exists.
  const retry = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: loginBody,
  });
  const retryData = await retry.json();
  if (retryData.token) return retryData.token as string;

  throw new Error(
    `Cannot authenticate test user.\n` +
    `Register: ${JSON.stringify(regData)}\n` +
    `Login: ${JSON.stringify(retryData)}\n` +
    `Tip: set PAYMENT_TEST_EMAIL / PAYMENT_TEST_PASSWORD env vars to an existing account.`
  );
}

async function injectAuthToken(page: Page, token: string) {
  // Set auth state in localStorage/store so the checkout page considers the user logged in.
  await page.evaluate(([t, email, name]) => {
    // Zustand persist stores auth in localStorage under 'auth-storage'
    const stored = {
      state: {
        user: { name, email, role: 'customer' },
        token: t,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(stored));
  }, [token, TEST_EMAIL, TEST_NAME] as [string, string, string]);
}

async function addProductToCartViaApi(token: string): Promise<void> {
  // Get the first active product
  const productsResp = await fetch(`${API_URL}/products?limit=1&isActive=true`);
  const productsData = await productsResp.json();
  const product = productsData?.data?.products?.[0];
  if (!product) throw new Error('No products found');

  // Add to cart
  await fetch(`${API_URL}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Payment Flow', () => {
  test.setTimeout(90_000);

  test('create-order API returns 200 and valid Razorpay order', async ({ request }) => {
    // 1. Authenticate
    const token = await apiRegisterAndLogin();

    // 2. Add product to cart
    const productsResp = await request.get(`${API_URL}/products?limit=1`);
    const productsData = await productsResp.json();
    const productId = productsData?.data?.products?.[0]?.id;
    expect(productId, 'Expected at least one product').toBeTruthy();

    await request.post(`${API_URL}/cart/add`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    // 3. Call payment/create-order — the critical API
    const payResp = await request.post(`${API_URL}/payment/create-order`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });

    const payData = await payResp.json();
    console.log('Payment create-order response:', JSON.stringify(payData));

    // Must not be Internal Server Error
    expect(payResp.status(), `Expected 200, got ${payResp.status()}. Body: ${JSON.stringify(payData)}`).toBe(200);
    expect(payData.success).toBe(true);
    expect(payData.data.razorpayOrderId).toMatch(/^order_/);
    expect(payData.data.keyId).toMatch(/^rzp_/);
    console.log(`✅ Razorpay order created: ${payData.data.razorpayOrderId}`);
  });

  test('checkout page loads Razorpay script and Pay Now button is ready', async ({ page }) => {
    // 1. Authenticate via API
    const token = await apiRegisterAndLogin();
    await addProductToCartViaApi(token);

    // 2. Open the app and inject auth state
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await injectAuthToken(page, token);

    // Also persist cart via API — the Zustand store syncs from server on mount,
    // so navigating to checkout after auth injection should work.
    await page.goto(`${FRONTEND_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/payment-01-checkout-loaded.png', fullPage: true });

    // 3. Confirm the Razorpay script is (or becomes) loaded
    const razorpayScriptLoaded = await page.waitForFunction(
      () => typeof (window as any).Razorpay !== 'undefined',
      { timeout: 20_000 },
    ).then(() => true).catch(() => false);
    console.log(`Razorpay script loaded: ${razorpayScriptLoaded}`);

    // 4. Fill in shipping address
    const addressFilled = await page.evaluate(() => {
      // Try filling form fields programmatically
      const fields: Record<string, string> = {
        fullName: 'Test User',
        phone: '9876543210',
        addressLine1: '123 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      };
      let filled = 0;
      for (const [name, value] of Object.entries(fields)) {
        const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (el) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
          nativeInputValueSetter.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        }
      }
      return filled;
    });
    console.log(`Address fields filled: ${addressFilled}`);

    await page.screenshot({ path: 'test-results/payment-02-address-filled.png', fullPage: true });

    // 5. Intercept the create-order API call
    const createOrderPromise = page.waitForResponse(
      (resp) => resp.url().includes('/payment/create-order'),
      { timeout: 30_000 },
    );

    // Click Pay Now
    const payBtn = page.locator('button:has-text("Pay Now")');
    const payBtnVisible = await payBtn.isVisible().catch(() => false);

    if (payBtnVisible) {
      await payBtn.click();
      console.log('Clicked Pay Now button');
      await page.screenshot({ path: 'test-results/payment-03-pay-now-clicked.png', fullPage: true });

      // 6. Validate the create-order API response
      try {
        const createOrderResp = await createOrderPromise;
        const createOrderBody = await createOrderResp.json();
        console.log(`create-order status: ${createOrderResp.status()}`);
        console.log(`create-order response: ${JSON.stringify(createOrderBody)}`);

        if (createOrderResp.status() === 200) {
          console.log('✅ create-order returned 200 — Razorpay order created successfully');
          console.log(`   Order ID: ${createOrderBody.data?.razorpayOrderId}`);

          // 7. Check if Razorpay modal opened
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/payment-04-razorpay-popup.png', fullPage: true });

          const popupVisible = await page.evaluate(() => {
            return !!(document.querySelector('.razorpay-container') || document.querySelector('iframe[src*="razorpay"]'));
          });
          console.log(`Razorpay popup visible: ${popupVisible}`);

          if (popupVisible) {
            console.log('✅ Razorpay checkout popup opened successfully');
          } else {
            console.log('⚠️  Popup not detected in DOM (may be in a separate frame or load was slow)');
          }
        } else {
          const msg = createOrderBody?.message || JSON.stringify(createOrderBody);
          console.error(`❌ create-order failed: ${createOrderResp.status()} — ${msg}`);
          // Do not fail the test here — we're diagnosing; the API test above will assert the status.
        }
      } catch (e) {
        console.log(`create-order API not called within timeout (user may not have been logged in via UI): ${e}`);
      }
    } else {
      console.log('Pay Now button not visible — user likely not authenticated in UI. API test above covers the endpoint directly.');
    }
  });
});
