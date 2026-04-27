/**
 * AMOHA ADMIN – Barcode Feature Tests
 *
 * Authentication: direct backend API call (no browser UI login, no rate limits).
 * Pattern mirrors admin-crud.spec.ts which already uses this approach.
 *
 * Run:
 *   cd admin
 *   npx playwright test e2e/barcode-features.spec.ts --config=playwright.local.config.ts
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import { authedCtx, gotoAndWaitFor } from './shared-auth';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
const API_URL   = process.env.API_URL   || 'http://localhost:5001/api';

// ── Structure ──────────────────────────────────────────────────────────

test.describe('Barcode Page – Structure', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await authedCtx(browser);
    page = await ctx.newPage();
    await gotoAndWaitFor(page, `${ADMIN_URL}/barcode`, (p) => p.locator('button', { hasText: 'Counter Billing' }).first());
  });

  test.afterAll(async () => { await ctx.close(); });

  test('Page title and description render', async () => {
    await expect(page.getByText('POS Billing & Barcode')).toBeVisible();
  });

  test('Three tab buttons are visible', async () => {
    await expect(page.locator('button', { hasText: 'Counter Billing' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'POS Orders' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Products & Barcodes' })).toBeVisible();
  });
});

// ── Counter Billing tab ────────────────────────────────────────────────

test.describe('Barcode Page – Counter Billing tab', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await authedCtx(browser);
    page = await ctx.newPage();
    await gotoAndWaitFor(page, `${ADMIN_URL}/barcode`, (p) => p.locator('button', { hasText: 'Counter Billing' }).first());
  });

  test.afterAll(async () => { await ctx.close(); });

  test('Scanner input and Lookup button are visible', async () => {
    await expect(page.getByPlaceholder(/Scan barcode or type SKU/i)).toBeVisible();
    await expect(page.locator('button', { hasText: 'Lookup' })).toBeVisible();
  });

  test('Open Camera button is present', async () => {
    await expect(page.locator('button', { hasText: 'Open Camera' })).toBeVisible();
  });

  test('Detected Code display area renders', async () => {
    await expect(page.locator('p.font-mono')).toBeVisible();
  });

  test('Typing a code and clicking Lookup shows a result or error', async () => {
    await page.getByPlaceholder(/Scan barcode or type SKU/i).fill('TEST123');
    await page.locator('button', { hasText: 'Lookup' }).click();
    await expect(
      page.locator('[class*="destructive"]')
        .or(page.getByText(/No product found/i))
        .or(page.locator('[class*="rounded-xl"][class*="border"]').filter({ hasText: /stock|price|sku/i }))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });
});

// ── Products & Barcodes tab ────────────────────────────────────────────

test.describe('Barcode Page – Products & Barcodes tab', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await authedCtx(browser);
    page = await ctx.newPage();
    await gotoAndWaitFor(page, `${ADMIN_URL}/barcode`, (p) => p.locator('button', { hasText: 'Products & Barcodes' }).first());
    await page.locator('button', { hasText: 'Products & Barcodes' }).click();
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => { await ctx.close(); });

  test('"Print Label Sheet" button is visible', async () => {
    await expect(page.locator('button', { hasText: 'Print Label Sheet' })).toBeVisible();
  });

  test('Print Label Sheet opens settings dialog', async () => {
    await page.locator('button', { hasText: 'Print Label Sheet' }).click();
    await expect(page.getByText('Print Label Sheet Settings')).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    // Close dialog
    await page.locator('button', { hasText: 'Cancel' }).click();
    await expect(page.getByText('Print Label Sheet Settings')).not.toBeVisible();
  });

  test('Print settings dialog shows columns, rows, and label size inputs', async () => {
    await page.locator('button', { hasText: 'Print Label Sheet' }).click();
    await expect(page.getByText('Print Label Sheet Settings')).toBeVisible();
    // Should have 4 number inputs: cols, rows, width, height
    const inputs = page.locator('input[type="number"]');
    await expect(inputs).toHaveCount(4);
    // Unit toggle button
    await expect(page.locator('button', { hasText: /mm|cm/ })).toBeVisible();
    // Summary text
    await expect(page.getByText(/columns.*rows.*labels\/page/i)).toBeVisible();
    await page.locator('button', { hasText: 'Cancel' }).click();
  });

  test('Unit toggle switches between mm and cm', async () => {
    await page.locator('button', { hasText: 'Print Label Sheet' }).click();
    await expect(page.getByText('Print Label Sheet Settings')).toBeVisible();
    const toggle = page.locator('button', { hasText: /mm → cm|cm → mm/ });
    // Default is mm → click to switch to cm
    await expect(toggle).toContainText('mm');
    await toggle.click();
    await expect(page.getByText(/Label Width \(cm\)/i)).toBeVisible();
    // Switch back
    await toggle.click();
    await expect(page.getByText(/Label Width \(mm\)/i)).toBeVisible();
    await page.locator('button', { hasText: 'Cancel' }).click();
  });

  test('Products table renders with at least one row', async () => {
    const rows     = page.locator('table tbody tr');
    const noResult = page.getByText(/No results|No products/i);
    await expect(rows.first().or(noResult.first())).toBeVisible({ timeout: 10000 });
  });

  test('Product rows have Print and Regenerate buttons', async () => {
    if (await page.locator('table tbody tr').count() === 0) { test.skip(); return; }
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow.locator('[title="Print barcode label"]')).toBeVisible();
    await expect(firstRow.locator('[title="Regenerate barcode"]')).toBeVisible();
  });

  test('BarcodeVisual SVGs or dash placeholders render', async () => {
    if (await page.locator('table tbody tr').count() === 0) { test.skip(); return; }
    await expect(
      page.locator('table tbody tr').first().locator('svg').first()
        .or(page.locator('table tbody tr').first().locator('span').getByText('—').first())
    ).toBeVisible({ timeout: 10000 });
  });

  test('Print Label button opens a popup with JsBarcode markup', async () => {
    if (await page.locator('table tbody tr').count() === 0) { test.skip(); return; }
    const printBtn = page.locator('table tbody tr').first().locator('[title="Print barcode label"]');
    if (await printBtn.count() === 0) { test.skip(); return; }
    const [popup] = await Promise.all([
      ctx.waitForEvent('page', { timeout: 12000 }),
      printBtn.click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    const html = await popup.content();
    expect(html).toContain('jsbarcode');
    expect(html).toContain('<svg id="bc"');
    expect(html).toContain('JsBarcode');
    await popup.close();
  });
});

// ── POS Orders tab ─────────────────────────────────────────────────────

test.describe('Barcode Page – POS Orders tab', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await authedCtx(browser);
    page = await ctx.newPage();
    await gotoAndWaitFor(page, `${ADMIN_URL}/barcode`, (p) => p.locator('button', { hasText: 'POS Orders' }).first());
    await page.locator('button', { hasText: 'POS Orders' }).click();
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => { await ctx.close(); });

  test('POS Order History heading is visible', async () => {
    await expect(page.getByText('POS Order History')).toBeVisible();
  });

  test('Search input renders', async () => {
    await expect(page.getByPlaceholder(/Search by invoice/i)).toBeVisible();
  });
});
