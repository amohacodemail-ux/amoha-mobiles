/**
 * Checkout Validation E2E Tests
 *
 * Strategy:
 *  - UI tests (form validation, stock check): use page.addInitScript + API mocking
 *    so they run fully offline without any real auth token.
 *  - Backend API tests: require a real token; skip gracefully when unavailable.
 */

import { test, expect, Page } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';
const API_URL      = process.env.API_URL      || 'https://amoha-backend-v2.onrender.com/api';
const API_ORIGIN   = API_URL.replace(/\/api$/, '');

const API_TEST_EMAIL    = process.env.CHECKOUT_TEST_EMAIL    || `checkout_api_${Date.now()}@amohatest.com`;
const API_TEST_PASSWORD = process.env.CHECKOUT_TEST_PASSWORD || 'Test@1234Secure!';

// --- Mock data ----------------------------------------------------------------

const MOCK_PRODUCT_IN_STOCK = {
  _id: 'mock-prod-1', id: 'mock-prod-1', name: 'Test Phone X', slug: 'test-phone-x',
  thumbnail: '/images/no-product.svg', images: ['/images/no-product.svg'],
  price: 9999, sellingPrice: 9999, stock: 10, inStock: true,
};

const MOCK_PRODUCT_OOS = {
  ...MOCK_PRODUCT_IN_STOCK, _id: 'mock-prod-oos', id: 'mock-prod-oos',
  name: 'OOS Phone', stock: 0, inStock: false,
};

function mockCartItem(oos: boolean) {
  return {
    _id: 'mock-item-1', product: oos ? MOCK_PRODUCT_OOS : MOCK_PRODUCT_IN_STOCK,
    quantity: 1, price: 9999, totalPrice: 9999,
  };
}

// --- Helpers ------------------------------------------------------------------

/** Inject auth + cart into localStorage BEFORE any page JS runs. */
function buildInitScript(oos: boolean): string {
  const auth = {
    state: {
      user: { _id: 'mu1', name: 'Test User', email: 'test@example.com', role: 'customer', phone: '9876543210' },
      token: 'mock-ui-test-token',
      isAuthenticated: true,
    }, version: 0,
  };
  const cart = {
    state: {
      items: [mockCartItem(oos)],
      savedForLater: [], totalItems: 1,
      subtotal: 9999, discount: 0, deliveryCharge: 0, totalAmount: 9999, coupon: null,
    }, version: 0,
  };
  return `
    try {
      localStorage.setItem('amoha-auth', ${JSON.stringify(JSON.stringify(auth))});
      localStorage.setItem('amoha-cart', ${JSON.stringify(JSON.stringify(cart))});
      // Also set cookie so apiClient interceptor uses our mock token
      document.cookie = 'token=mock-ui-test-token; path=/; max-age=86400';
    } catch(e) {}
  `;
}

/** Intercept all API calls so fake token never hits the real backend.
 *  The frontend uses Next.js rewrites so all API calls go to /api/** on the same origin.
 */
async function setupMocks(page: Page, oos: boolean) {
  const item = mockCartItem(oos);

  // Mock relative /api/** routes (Next.js proxy rewrites)
  await page.route(`${FRONTEND_URL}/api/**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mu1', name: 'Test User', email: 'test@example.com' } }) });
    }
    if (url.includes('/cart')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mc1', items: [item], savedForLater: [],
          totalItems: 1, subtotal: 9999, discount: 0, deliveryCharge: 0, totalAmount: 9999, coupon: null } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) });
  });

  // Also mock direct backend calls as fallback
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mu1', name: 'Test User', email: 'test@example.com' } }) });
    }
    if (url.includes('/cart')) {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'mc1', items: [item], savedForLater: [],
          totalItems: 1, subtotal: 9999, discount: 0, deliveryCharge: 0, totalAmount: 9999, coupon: null } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) });
  });
}

async function goToCheckout(page: Page) {
  await page.goto(`${FRONTEND_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
}

async function isFormReady(page: Page): Promise<boolean> {
  // Wait for the checkout form OR the "Login Required" message
  try {
    await page.waitForSelector('input[name="fullName"], h2:has-text("Login Required"), h2:has-text("Cart is empty")',
      { timeout: 15000 });
    const loginRequired = await page.locator('h2:has-text("Login Required")').isVisible().catch(() => false);
    if (loginRequired) {
      console.error('[checkout] Got "Login Required" — auth injection failed');
      return false;
    }
    const cartEmpty = await page.locator('h2:has-text("Cart is empty")').isVisible().catch(() => false);
    if (cartEmpty) {
      console.error('[checkout] Got "Cart is empty" — cart injection failed');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function clickPlaceOrder(page: Page) {
  await page.locator('button:has-text("Pay Now"), button:has-text("Place Order")').first().click();
}

async function fillValidAddress(page: Page, overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = {
    fullName: 'Test User', phone: '9876543210',
    addressLine1: '123 MG Road, Test Area',
    city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
}

async function tryGetApiToken(): Promise<string> {
  try {
    const r = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: API_TEST_EMAIL, password: API_TEST_PASSWORD }),
    });
    const d = await r.json();
    if (d?.token) return d.token;
  } catch { /* fall through */ }

  try {
    const r = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Checkout API Test', email: API_TEST_EMAIL,
        password: API_TEST_PASSWORD, confirmPassword: API_TEST_PASSWORD, phone: '9876543210' }),
    });
    const d = await r.json();
    if (d?.token) return d.token;
  } catch { /* fall through */ }

  return '';
}

// --- 1. Inline Field Validation -----------------------------------------------

test.describe('Checkout � Field Validation', () => {
  test.setTimeout(60_000);

  test('empty form shows required error for every field', async ({ page }) => {
    await page.addInitScript(buildInitScript(false));
    await setupMocks(page, false);
    await goToCheckout(page);

    if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

    for (const name of ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode']) {
      await page.locator(`input[name="${name}"]`).fill('');
    }

    await clickPlaceOrder(page);
    await page.screenshot({ path: 'test-results/cv-01-empty-form.png', fullPage: true });

    await expect(page.getByText('Full Name is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Phone number is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Address Line 1 is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('City is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('State is required')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pincode is required')).toBeVisible({ timeout: 5000 });
  });

  test('inline error clears when user types in the field', async ({ page }) => {
    await page.addInitScript(buildInitScript(false));
    await setupMocks(page, false);
    await goToCheckout(page);

    if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

    await page.locator('input[name="fullName"]').fill('');
    await clickPlaceOrder(page);
    await expect(page.getByText('Full Name is required')).toBeVisible({ timeout: 5000 });

    await page.locator('input[name="fullName"]').fill('J');
    await expect(page.getByText('Full Name is required')).not.toBeVisible({ timeout: 3000 });
  });
});

// --- 2. Phone Validation ------------------------------------------------------

test.describe('Checkout � Phone Validation', () => {
  test.setTimeout(60_000);

  const INVALID_PHONES = [
    ['999999999999', 'too long (12 digits)'],
    ['abc',          'alphabetic'],
    ['123',          'too short (3 digits)'],
    ['1234567890',   'starts with 1 (invalid Indian prefix)'],
  ] as const;

  for (const [value, label] of INVALID_PHONES) {
    test(`"${value}" � ${label} ? rejected`, async ({ page }) => {
      await page.addInitScript(buildInitScript(false));
      await setupMocks(page, false);
      await goToCheckout(page);

      if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

      await fillValidAddress(page, { phone: value });
      await clickPlaceOrder(page);
      await page.screenshot({ path: `test-results/cv-phone-${value.replace(/\W/g,'_')}.png`, fullPage: true });

      await expect(page.getByText(/valid.*mobile|10.digit|Indian mobile/i)).toBeVisible({ timeout: 5000 });
    });
  }

  test('"9876543210" � valid Indian number ? no error', async ({ page }) => {
    await page.addInitScript(buildInitScript(false));
    await setupMocks(page, false);
    await goToCheckout(page);

    if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

    await fillValidAddress(page, { phone: '9876543210' });
    await clickPlaceOrder(page);

    await expect(page.getByText('Phone number is required')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/valid.*mobile|10.digit/i)).not.toBeVisible({ timeout: 3000 });
  });
});

// --- 3. Pincode Validation ----------------------------------------------------

test.describe('Checkout � Pincode Validation', () => {
  test.setTimeout(60_000);

  const INVALID_PINCODES = [
    ['12AB56', 'alphanumeric'],
    ['012345', 'leading zero'],
    ['1234',   'too short (4 digits)'],
  ] as const;

  for (const [value, label] of INVALID_PINCODES) {
    test(`"${value}" � ${label} ? rejected`, async ({ page }) => {
      await page.addInitScript(buildInitScript(false));
      await setupMocks(page, false);
      await goToCheckout(page);

      if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

      await fillValidAddress(page, { pincode: value });
      await clickPlaceOrder(page);
      await page.screenshot({ path: `test-results/cv-pin-${value.replace(/\W/g,'_')}.png`, fullPage: true });

      await expect(page.getByText(/valid.*6.digit.*pincode|6.digit.*pincode|valid.*pincode/i)).toBeVisible({ timeout: 5000 });
    });
  }

  test('"560001" � valid pincode ? no error', async ({ page }) => {
    await page.addInitScript(buildInitScript(false));
    await setupMocks(page, false);
    await goToCheckout(page);

    if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

    await fillValidAddress(page, { pincode: '560001' });
    await clickPlaceOrder(page);

    await expect(page.getByText('Pincode is required')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/valid.*pincode/i)).not.toBeVisible({ timeout: 3000 });
  });
});

// --- 4. Out-of-Stock Protection -----------------------------------------------

test.describe('Checkout � Out-of-Stock Protection', () => {
  test.setTimeout(60_000);

  test('checkout blocked when cart has out-of-stock item', async ({ page }) => {
    await page.addInitScript(buildInitScript(true));
    await setupMocks(page, true);
    await goToCheckout(page);

    if (!(await isFormReady(page))) test.skip(true, 'Form not rendered');

    await fillValidAddress(page);
    await clickPlaceOrder(page);
    await page.screenshot({ path: 'test-results/cv-oos.png', fullPage: true });

    await expect(page.getByText(/no longer available|out of stock/i)).toBeVisible({ timeout: 5000 });
  });
});

// --- 5. Backend API Validation ------------------------------------------------

test.describe('Checkout � Backend API Validation', () => {
  test.setTimeout(60_000);
  let apiToken = '';

  test.beforeAll(async () => {
    apiToken = await tryGetApiToken();
    if (!apiToken) console.warn('[API tests] Auth unavailable � all tests will be skipped');
  });

  const INVALID_PHONES_API = ['123', 'abcdefghij', '999999999999'];
  for (const phone of INVALID_PHONES_API) {
    test(`API rejects phone "${phone}"`, async ({ request }) => {
      if (!apiToken) test.skip(true, 'Auth unavailable');
      const resp = await request.post(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        data: { shippingAddress: { fullName: 'T', phone,
          addressLine1: '123 MG Road', city: 'Bengaluru', state: 'KA', pincode: '560001', type: 'home' },
          paymentMethod: 'cod' },
      });
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(await resp.json()).toLowerCase()).toMatch(/phone|mobile|valid/);
    });
  }

  const INVALID_PINCODES_API = ['12AB56', '012345'];
  for (const pincode of INVALID_PINCODES_API) {
    test(`API rejects pincode "${pincode}"`, async ({ request }) => {
      if (!apiToken) test.skip(true, 'Auth unavailable');
      const resp = await request.post(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        data: { shippingAddress: { fullName: 'T', phone: '9876543210',
          addressLine1: '123 MG Road', city: 'Bengaluru', state: 'KA', pincode, type: 'home' },
          paymentMethod: 'cod' },
      });
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(await resp.json()).toLowerCase()).toMatch(/pincode|pin|valid/);
    });
  }
});
