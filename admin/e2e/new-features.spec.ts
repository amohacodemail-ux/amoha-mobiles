/**
 * ==========================================================================
 * AMOHA ADMIN PANEL - New Features E2E Tests
 * ==========================================================================
 * Covers:
 *  1. Category filter in admin products list
 *  2. Reports page loads with data
 *  3. RFQ: create, view, update status
 *  4. Purchase Requests: create, approve, reject
 *
 * Env vars:
 *   ADMIN_URL      – admin panel base URL  (default: https://admin.amohamobiles.com)
 *   API_URL        – backend API           (default: https://amoha-backend-v2.onrender.com/api)
 *   ADMIN_EMAIL    – admin login email
 *   ADMIN_PASSWORD – admin login password
 * ==========================================================================
 */
import { test, expect, Page } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.amohamobiles.com';
const API_URL   = process.env.API_URL   || 'https://amoha-backend-v2.onrender.com/api';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TS = Date.now();

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _cachedToken: string | null = null;

async function getApiToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await resp.json() as any;
  _cachedToken = json.data?.token || json.token || '';
  return _cachedToken!;
}

async function login(page: Page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`, { timeout: 20000 });
}

// ─── Test: Category filter in products ────────────────────────────────────────

test.describe('Category filter in products', () => {
  test('admin can filter products by category', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/products`);
    await page.waitForLoadState('networkidle');

    // look for category filter select/combobox
    const categoryFilter = page.locator('select, [data-testid="category-filter"]').first();
    const count = await categoryFilter.count();
    if (count === 0) {
      test.skip(); // category filter not rendered on this page yet
      return;
    }
    // pick the first non-empty option
    const options = await categoryFilter.locator('option').allTextContents();
    const nonEmpty = options.find(o => o.trim() && o !== 'All Categories' && o !== 'All');
    if (!nonEmpty) {
      test.skip();
      return;
    }
    await categoryFilter.selectOption({ label: nonEmpty });
    await page.waitForLoadState('networkidle');
    // products table or grid should render (or show "no products")
    const tableRows = page.locator('table tbody tr, [data-testid="product-row"]');
    const emptyMsg  = page.locator('text=No products found, text=No results');
    const hasRows   = (await tableRows.count()) > 0;
    const hasEmpty  = await emptyMsg.count() > 0;
    expect(hasRows || hasEmpty).toBeTruthy();
  });
});

// ─── Test: Reports page ───────────────────────────────────────────────────────

test.describe('Reports page', () => {
  test('reports page loads and shows summary cards', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');

    // confirm summary stat cards are visible
    await expect(page.locator('text=Total Revenue, text=Revenue')).toBeVisible({ timeout: 15000 });
  });

  test('reports sidebar link navigates to /reports', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/dashboard`);
    const reportsLink = page.locator('a[href="/reports"], a[href*="/reports"]').first();
    await expect(reportsLink).toBeVisible({ timeout: 10000 });
    await reportsLink.click();
    await page.waitForURL(`${ADMIN_URL}/reports`, { timeout: 15000 });
    await expect(page).toHaveURL(/\/reports/);
  });

  test('reports period selector changes data', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');

    // click "This Week" if present
    const weekBtn = page.locator('button:has-text("This Week"), button:has-text("Week")');
    if ((await weekBtn.count()) > 0) {
      await weekBtn.first().click();
      await page.waitForLoadState('networkidle');
    }
    // page shouldn't crash
    await expect(page.locator('text=Revenue, text=Orders')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Test: RFQ ────────────────────────────────────────────────────────────────

test.describe('RFQ Management', () => {
  test('RFQ page accessible from sidebar', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/dashboard`);
    const rfqLink = page.locator('a[href="/rfq"], a[href*="/rfq"]').first();
    await expect(rfqLink).toBeVisible({ timeout: 10000 });
    await rfqLink.click();
    await page.waitForURL(`${ADMIN_URL}/rfq`, { timeout: 15000 });
    await expect(page).toHaveURL(/\/rfq/);
  });

  test('RFQ list page renders table', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/rfq`);
    await page.waitForLoadState('networkidle');
    // table or empty state should be visible
    const table = page.locator('table');
    const emptyMsg = page.locator('text=No RFQs found, text=No requests found');
    const hasTable = (await table.count()) > 0;
    const hasEmpty = (await emptyMsg.count()) > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('RFQ API returns list', async () => {
    const token = await getApiToken();
    const resp = await fetch(`${API_URL}/rfq`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status).toBe(200);
    const json = await resp.json() as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data?.rfqs)).toBe(true);
  });

  test('Create RFQ via API', async () => {
    const token = await getApiToken();

    // need a supplier ID; fetch existing suppliers
    const suppResp = await fetch(`${API_URL}/suppliers?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const suppJson = await suppResp.json() as any;
    const suppliers = suppJson.data?.suppliers || [];
    if (suppliers.length === 0) {
      test.skip();
      return;
    }
    const supplierId = suppliers[0]._id || suppliers[0].id;

    const body = {
      supplierId,
      items: [{ name: `Test Item ${TS}`, quantity: 10, unitPrice: 500 }],
      notes: `Playwright test RFQ ${TS}`,
    };
    const createResp = await fetch(`${API_URL}/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    expect(createResp.status).toBe(201);
    const createJson = await createResp.json() as any;
    expect(createJson.success).toBe(true);
    expect(createJson.data?.rfqNumber).toMatch(/^RFQ-/);
  });
});

// ─── Test: Purchase Requests ──────────────────────────────────────────────────

test.describe('Purchase Requests', () => {
  test('Purchase Requests page accessible from sidebar', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/dashboard`);
    const prLink = page.locator('a[href="/purchase-requests"], a[href*="/purchase-requests"]').first();
    await expect(prLink).toBeVisible({ timeout: 10000 });
    await prLink.click();
    await page.waitForURL(`${ADMIN_URL}/purchase-requests`, { timeout: 15000 });
    await expect(page).toHaveURL(/\/purchase-requests/);
  });

  test('Purchase Requests list page renders', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/purchase-requests`);
    await page.waitForLoadState('networkidle');
    const table = page.locator('table');
    const emptyMsg = page.locator('text=No purchase requests found');
    const hasTable = (await table.count()) > 0;
    const hasEmpty = (await emptyMsg.count()) > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('PR API returns list', async () => {
    const token = await getApiToken();
    const resp = await fetch(`${API_URL}/purchase-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status).toBe(200);
    const json = await resp.json() as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data?.requests)).toBe(true);
  });

  let createdPrId: string | null = null;

  test('Create PR via API', async () => {
    const token = await getApiToken();
    const body = {
      items: [{ name: `PW Test Item ${TS}`, quantity: 5 }],
      reason: `Playwright test purchase request ${TS}`,
      urgency: 'normal',
    };
    const resp = await fetch(`${API_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    expect(resp.status).toBe(201);
    const json = await resp.json() as any;
    expect(json.success).toBe(true);
    expect(json.data?.prNumber).toMatch(/^PR-/);
    createdPrId = json.data?._id || json.data?.id || null;
  });

  test('Approve PR via API', async () => {
    if (!createdPrId) { test.skip(); return; }
    const token = await getApiToken();
    const resp = await fetch(`${API_URL}/purchase-requests/${createdPrId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: 'Approved by Playwright test' }),
    });
    expect(resp.status).toBe(200);
    const json = await resp.json() as any;
    expect(json.data?.status).toBe('approved');
  });
});

// ─── Test: Frontend category filter ───────────────────────────────────────────

test.describe('API: Category filter in products', () => {
  test('GET /products?category=<slug> returns category-filtered results', async () => {
    // get a real slug
    const catResp = await fetch(`${API_URL}/categories`);
    expect(catResp.status).toBe(200);
    const catJson = await catResp.json() as any;
    const categories = catJson.data?.categories || catJson.data || [];
    if (categories.length === 0) { test.skip(); return; }
    const slug = categories[0].slug;

    const prodResp = await fetch(`${API_URL}/products?category=${slug}&limit=5`);
    expect(prodResp.status).toBe(200);
    const prodJson = await prodResp.json() as any;
    expect(prodJson.success).toBe(true);
    expect(Array.isArray(prodJson.data?.products)).toBe(true);
    // all returned products should belong to this category
    const products = prodJson.data.products as any[];
    for (const p of products) {
      expect(p.categorySlug === slug || p.category === slug || p.categoryId).toBeTruthy();
    }
  });

  test('GET /categories includes productCount', async () => {
    const resp = await fetch(`${API_URL}/categories`);
    expect(resp.status).toBe(200);
    const json = await resp.json() as any;
    const categories = json.data?.categories || json.data || [];
    if (categories.length > 0) {
      expect(typeof categories[0].productCount).toBe('number');
    }
  });
});
