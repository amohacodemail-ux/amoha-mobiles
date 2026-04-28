/**
 * COD Payment System E2E Tests
 *
 * Covers:
 *  1. COD fee (₹49) visible in order summary BEFORE placement — separate from Delivery Charge
 *  2. Total updates dynamically when COD is selected/deselected
 *  3. COD disabled / "Not available" when cart value > ₹50,000
 *  4. "Cash on Delivery is not available for orders above ₹50,000" banner shown
 *  5. No generic error messages for COD validation failures
 *  6. Order-success page shows human-readable orderNumber (not raw UUID)
 *  7. Invoice COD fee line (visual snapshot — skipped if backend unavailable)
 *
 * Strategy: addInitScript + route mocking (no real auth required)
 */

import { test, expect, Page } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';
const API_ORIGIN   = (process.env.API_URL || 'https://amoha-backend-v2.onrender.com/api').replace(/\/api$/, '');

const COD_FEE         = 49;
const NORMAL_SUBTOTAL = 9_999;   // under ₹50k → COD available
const HIGH_SUBTOTAL   = 55_000;  // over ₹50k → COD NOT available

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockCartState(subtotal: number) {
  const deliveryCharge = 0;
  const discount       = 0;
  const totalAmount    = subtotal - discount + deliveryCharge;
  return {
    items: [
      {
        _id: 'mock-item-1',
        product: {
          _id: 'mock-prod-1', id: 'mock-prod-1', name: 'Mock Phone',
          slug: 'mock-phone', thumbnail: '/images/no-product.svg',
          images: ['/images/no-product.svg'], price: subtotal,
          sellingPrice: subtotal, stock: 5, inStock: true,
        },
        quantity: 1, price: subtotal, totalPrice: subtotal,
      },
    ],
    savedForLater: [], totalItems: 1,
    subtotal, discount, deliveryCharge, totalAmount, coupon: null,
  };
}

function buildInitScript(subtotal: number): string {
  const auth = {
    state: {
      user: { _id: 'mu1', name: 'Test User', email: 'test@amohatest.com', role: 'customer', phone: '9876543210' },
      token: 'mock-cod-test-token',
      isAuthenticated: true,
    },
    version: 0,
  };
  const cart = { state: mockCartState(subtotal), version: 0 };
  return `
    try {
      localStorage.setItem('amoha-auth', ${JSON.stringify(JSON.stringify(auth))});
      localStorage.setItem('amoha-cart', ${JSON.stringify(JSON.stringify(cart))});
      document.cookie = 'token=mock-cod-test-token; path=/; max-age=86400';
    } catch(e) {}
  `;
}

async function setupMocks(page: Page, subtotal: number) {
  const cartData = mockCartState(subtotal);
  const cartResponse = { success: true, data: { _id: 'mc1', ...cartData } };

  // Mock relative /api/** (Next.js proxy)
  await page.route(`${FRONTEND_URL}/api/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/cart')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cartResponse) });
    }
    if (url.includes('/auth/')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mu1', name: 'Test User' } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });

  // Mock direct backend calls
  await page.route(`${API_ORIGIN}/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/cart')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cartResponse) });
    }
    if (url.includes('/auth/')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mu1', name: 'Test User' } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openCheckout(page: Page, subtotal: number) {
  await page.addInitScript(buildInitScript(subtotal));
  await setupMocks(page, subtotal);
  await page.goto(`${FRONTEND_URL}/checkout`);
  // Wait for Order Summary heading
  await page.waitForSelector('text=Order Summary', { timeout: 10_000 });
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.describe('COD Payment System', () => {

  // ── 1. COD fee visible BEFORE order placement ────────────────────────────
  test('shows COD fee (₹49) in order summary when COD is selected', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);

    // Select COD
    await page.getByText('Cash on Delivery').first().click();

    // COD fee line should appear in order summary (the span in the summary row, exact match)
    await expect(page.getByText('Cash on Delivery Fee', { exact: true })).toBeVisible();
    await expect(page.getByText(formatINR(COD_FEE)).first()).toBeVisible();
  });

  // ── 2. COD fee NOT shown when Razorpay is selected ───────────────────────
  test('does NOT show COD fee when Pay Online (Razorpay) is selected', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);

    // Ensure Razorpay is selected (default)
    const razorpayBtn = page.getByText('Pay Online (Razorpay)').first();
    await razorpayBtn.click();

    // COD fee line should NOT be visible
    await expect(page.getByText('Cash on Delivery Fee')).not.toBeVisible();
  });

  // ── 3. Total updates when switching between COD and Razorpay ────────────
  test('total amount includes COD fee (₹49) when COD selected and excludes it when Razorpay selected', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    const expectedTotalWithCod   = formatINR(NORMAL_SUBTOTAL + COD_FEE);
    const expectedTotalNoCod     = formatINR(NORMAL_SUBTOTAL);

    // Select COD → total should include ₹49
    await page.getByText('Cash on Delivery').first().click();
    const summarySection = page.locator('text=Order Summary').locator('..').locator('..');
    await expect(page.getByText(expectedTotalWithCod).first()).toBeVisible();

    // Switch back to Razorpay → total goes back
    await page.getByText('Pay Online (Razorpay)').first().click();
    await expect(page.getByText(expectedTotalNoCod).first()).toBeVisible();
  });

  // ── 4. Delivery Charge label is separate from Cash on Delivery Fee ───────
  test('shows "Delivery Charge" label separate from "Cash on Delivery Fee" label', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    await page.getByText('Cash on Delivery').first().click();

    // Both labels must be visible and distinct
    await expect(page.getByText('Delivery Charge')).toBeVisible();
    await expect(page.getByText('Cash on Delivery Fee', { exact: true })).toBeVisible();
  });

  // ── 5. COD disabled for orders above ₹50,000 ─────────────────────────────
  test('COD option is disabled and shows "Not available" badge for orders above ₹50,000', async ({ page }) => {
    await openCheckout(page, HIGH_SUBTOTAL);

    // The COD button should be disabled or have visual indicator
    const codButton = page.getByRole('button', { name: /cash on delivery/i });
    await expect(codButton).toBeDisabled();

    // "Not available" badge should appear inside the COD option (exact badge text)
    await expect(page.getByText('Not available', { exact: true })).toBeVisible();
  });

  // ── 6. Informational banner shown when COD unavailable ───────────────────
  test('shows informational banner "COD not available above ₹50,000" for high-value orders', async ({ page }) => {
    await openCheckout(page, HIGH_SUBTOTAL);

    await expect(
      page.getByText(/cash on delivery is not available for orders above/i)
    ).toBeVisible();
  });

  // ── 7. COD auto-deselects when order goes above ₹50k ────────────────────
  test('COD is not selected (Razorpay remains default) when order value exceeds ₹50,000', async ({ page }) => {
    await openCheckout(page, HIGH_SUBTOTAL);

    // COD button must NOT be selected (should not have primary border class)
    const codButton = page.getByRole('button', { name: /cash on delivery/i });
    await expect(codButton).not.toHaveClass(/border-primary-500/);
  });

  // ── 8. COD message does NOT contain old misleading text ──────────────────
  test('COD info note does NOT contain misleading "may apply on orders below ₹999" text', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    await page.getByText('Cash on Delivery').first().click();

    // Old misleading copy must be gone
    await expect(page.getByText(/may apply on orders below/i)).not.toBeVisible();
    await expect(page.getByText(/below ₹999/i)).not.toBeVisible();
  });

  // ── 9. Inline field validation — phone error ─────────────────────────────
  test('shows inline phone validation error without generic checkout failure message', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);

    // Select COD
    await page.getByText('Cash on Delivery').first().click();

    // Fill address except leave phone blank / invalid
    await page.fill('input[name="fullName"]',    'Test User');
    await page.fill('input[name="phone"]',       '12345'); // invalid
    await page.fill('input[name="addressLine1"]','123 Main St');
    await page.fill('input[name="city"]',        'Mumbai');
    await page.fill('input[name="state"]',       'Maharashtra');
    await page.fill('input[name="pincode"]',     '400001');

    // Click Place Order
    await page.getByRole('button', { name: /place order/i }).click();

    // Inline phone error must appear
    await expect(page.getByText(/valid.*10-digit.*mobile/i)).toBeVisible();

    // Generic failure toast must NOT appear
    await expect(page.getByText(/failed to place order/i)).not.toBeVisible();
  });

  // ── 10. Inline field validation — pincode error ──────────────────────────
  test('shows inline pincode validation error for invalid pincode', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    await page.getByText('Cash on Delivery').first().click();

    await page.fill('input[name="fullName"]',    'Test User');
    await page.fill('input[name="phone"]',       '9876543210');
    await page.fill('input[name="addressLine1"]','123 Main St');
    await page.fill('input[name="city"]',        'Mumbai');
    await page.fill('input[name="state"]',       'Maharashtra');
    await page.fill('input[name="pincode"]',     '00000'); // invalid: leading zero

    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByText(/valid.*6-digit pincode/i)).toBeVisible();
    await expect(page.getByText(/failed to place order/i)).not.toBeVisible();
  });

  // ── 11. Order-success page shows human-readable order number ─────────────
  test('order-success page shows human-readable order number (not raw UUID)', async ({ page }) => {
    const orderNum = 'ORD-20260428-001';
    const orderId  = 'a1b2c3d4-0000-0000-0000-000000000000';

    await page.goto(`${FRONTEND_URL}/order-success?id=${orderId}&num=${orderNum}`);

    // Should show the order number, not the raw UUID
    await expect(page.getByText(`#${orderNum}`)).toBeVisible();
    // The raw UUID should NOT be shown as the primary identifier
    await expect(page.getByText(orderId)).not.toBeVisible();
  });

  // ── 12. Order-success page heading says "Order Number" not "Order ID" ────
  test('order-success page uses "Order Number" label not "Order ID"', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/order-success?id=some-uuid&num=ORD-12345`);
    await expect(page.getByText('Order Number:')).toBeVisible();
    await expect(page.getByText('Order ID:')).not.toBeVisible();
  });

  // ── 13. COD note clearly states ₹49 fee applies on ALL COD orders ────────
  test('COD info note clearly states ₹49 fee on all COD orders', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    await page.getByText('Cash on Delivery').first().click();

    // Should mention the ₹49 fee clearly
    await expect(page.getByText(/cash on delivery fee of ₹49/i)).toBeVisible();
  });

  // ── 14. Button label includes COD fee in total ──────────────────────────
  test('Place Order button shows total including COD fee when COD is selected', async ({ page }) => {
    await openCheckout(page, NORMAL_SUBTOTAL);
    await page.getByText('Cash on Delivery').first().click();

    const expectedTotal = formatINR(NORMAL_SUBTOTAL + COD_FEE);
    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toContainText(expectedTotal);
  });

});
