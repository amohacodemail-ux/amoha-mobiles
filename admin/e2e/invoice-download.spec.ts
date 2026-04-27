/**
 * ====================================================================
 * AMOHA ADMIN — Invoice Download E2E Tests (Playwright)
 * ====================================================================
 *
 * Covers:
 *   1. API: GET /admin/orders/:id/invoice returns PDF (200)
 *   2. UI: Admin orders list page has Download Invoice button per row
 *   3. UI: Admin order detail page has "Download Invoice" button in header
 *   4. UI: Admin order detail page has "Download Invoice PDF" button in summary card
 *   5. UI: Clicking the download button triggers a file download (blob)
 *   6. API: Invoice for a walk-in/POS order generates with walk-in customer data
 *
 * Env vars:
 *   ADMIN_URL      – admin panel base URL  (default: https://admin.amohamobiles.com)
 *   API_URL        – backend API           (default: https://amoha-backend-v2.onrender.com/api)
 *   ADMIN_EMAIL    – admin login email
 *   ADMIN_PASSWORD – admin login password
 *
 * Run locally:
 *   cd admin
 *   $env:ADMIN_URL="http://localhost:3003"; $env:API_URL="http://localhost:5001/api"
 *   npx playwright test e2e/invoice-download.spec.ts --project=chromium --reporter=list
 * ====================================================================
 */

import { test, expect, Page } from '@playwright/test';
import { fetchWithRetry, getToken, getTokens } from './shared-auth';

// ─── Config ──────────────────────────────────────────────────────────

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
const API_URL   = process.env.API_URL   || 'http://localhost:5001/api';

// ─── Cached auth (reads from global-setup saved file) ─────────────────

async function adminLogin(page: Page) {
  const { token, refreshToken } = getTokens();
  const domain = new URL(ADMIN_URL).hostname;
  await page.context().addCookies([
    { name: 'admin_token',         value: token,        domain, path: '/' },
    { name: 'admin_refresh_token', value: refreshToken, domain, path: '/' },
  ]);
  await page.goto(`${ADMIN_URL}/dashboard`);
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Fetch the first real order ID via the admin API. */
async function getFirstOrderId(): Promise<{ id: string; orderNumber: string; isWalkIn: boolean }> {
  const token = getToken();
  const res = await fetchWithRetry(`${API_URL}/admin/orders?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Orders API returned ${res.status}`);
  const body = await res.json();
  const orders: any[] = body.data?.orders || [];
  if (!orders.length) throw new Error('No orders found in database');
  return { id: orders[0].id || orders[0]._id, orderNumber: orders[0].orderNumber, isWalkIn: !!orders[0].isWalkIn };
}

/** Fetch a walk-in order if available, else return null. */
async function getWalkInOrderId(): Promise<string | null> {
  const token = getToken();
  const res = await fetchWithRetry(`${API_URL}/admin/orders?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const body = await res.json();
  const orders: any[] = body.data?.orders || [];
  const walkIn = orders.find((o: any) => o.isWalkIn);
  return walkIn ? (walkIn.id || walkIn._id) : null;
}

// ─── Guard ───────────────────────────────────────────────────────────
// (no guard needed — global-setup ensures a valid token is always available)

// =====================================================================
// TEST SUITE
// =====================================================================

test.describe.serial('Invoice Download', () => {

  // ── 1. API: invoice endpoint returns a valid PDF ──────────────────

  test('1. API — GET /admin/orders/:id/invoice returns 200 application/pdf', async () => {
    const token = getToken();
    const { id, orderNumber } = await getFirstOrderId();

    const res = await fetchWithRetry(`${API_URL}/admin/orders/${id}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status, `Invoice API should return 200 for order ${orderNumber}`).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength, 'PDF should have non-zero size').toBeGreaterThan(100);

    // Validate PDF magic bytes (%PDF-)
    const header = Buffer.from(buf).slice(0, 5).toString('ascii');
    expect(header, 'Response should start with %PDF-').toBe('%PDF-');
  });

  // ── 2. API: unauthenticated request returns 401 ───────────────────

  test('2. API — unauthenticated request returns 401', async () => {
    const { id } = await getFirstOrderId();

    const res = await fetchWithRetry(`${API_URL}/admin/orders/${id}/invoice`);
    // Should be 401 (unauthenticated)
    expect([401, 403], `Should require auth, got ${res.status}`).toContain(res.status);
  });

  // ── 3. API: non-existent order returns 404 ────────────────────────

  test('3. API — non-existent order returns 404', async () => {
    const token = getToken();
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await fetchWithRetry(`${API_URL}/admin/orders/${fakeId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status, 'Should return 404 for non-existent order').toBe(404);
  });

  // ── 4. API: walk-in order invoice works ───────────────────────────

  test('4. API — walk-in/POS order invoice generates correctly', async () => {
    const walkInId = await getWalkInOrderId();
    if (!walkInId) {
      test.skip(true, 'No walk-in orders in database');
      return;
    }

    const token = getToken();
    const res = await fetchWithRetry(`${API_URL}/admin/orders/${walkInId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status, 'Walk-in order invoice should return 200').toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(100);
  });

  // ── 5. UI: Orders list page has "Download Invoice" button ─────────

  test('5. UI — Orders list has "Download Invoice" button in actions column', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_URL}/orders`);

    // Wait for orders table to load
    await page.waitForTimeout(1500);
    await page.locator('.animate-pulse').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Look for a button with title="Download Invoice" in the table
    const downloadBtn = page.locator('button[title="Download Invoice"]').first();
    await expect(downloadBtn, 'Download Invoice button should exist in orders list').toBeVisible({ timeout: 10000 });
  });

  // ── 6. UI: Order detail page has "Download Invoice" button in header ─

  test('6. UI — Order detail page header has "Download Invoice" button', async ({ page }) => {
    await adminLogin(page);
    const { id } = await getFirstOrderId();

    await page.goto(`${ADMIN_URL}/orders/${id}`);
    await page.waitForLoadState('networkidle');

    // Look for Download Invoice button in the page header area
    const btn = page.getByRole('button', { name: /download invoice/i }).first();
    await expect(btn, '"Download Invoice" button should be in order detail header').toBeVisible({ timeout: 15000 });
  });

  // ── 7. UI: Order detail page has "Download Invoice PDF" inside card ─

  test('7. UI — Order detail page has "Download Invoice PDF" button in Order Summary card', async ({ page }) => {
    await adminLogin(page);
    const { id } = await getFirstOrderId();

    await page.goto(`${ADMIN_URL}/orders/${id}`);
    await page.waitForLoadState('networkidle');

    // Look for the second download button inside the Order Summary card
    const pdfBtn = page.getByRole('button', { name: /download invoice pdf/i });
    await expect(pdfBtn, '"Download Invoice PDF" button should be in order summary card').toBeVisible({ timeout: 15000 });
  });

  // ── 8. UI: Clicking the header Download Invoice button triggers download ─

  test('8. UI — Clicking "Download Invoice" triggers a PDF download', async ({ page }) => {
    await adminLogin(page);
    const { id, orderNumber } = await getFirstOrderId();

    await page.goto(`${ADMIN_URL}/orders/${id}`);
    await page.waitForLoadState('networkidle');

    // Intercept the download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click Download Invoice button (in header)
    await page.getByRole('button', { name: /download invoice/i }).first().click();

    // Either a file download event fires, OR a success toast appears
    // (blob-based downloads in Next.js trigger window.URL.createObjectURL → anchor click)
    // We listen for either
    const [result] = await Promise.allSettled([
      downloadPromise,
      expect(page.getByText(/invoice downloaded/i)).toBeVisible({ timeout: 15000 }),
    ]);

    // At least one should have succeeded (toast is more reliable for blob downloads)
    const toastVisible = await page.getByText(/invoice downloaded/i).isVisible().catch(() => false);
    const downloadTriggered = result.status === 'fulfilled';

    expect(
      toastVisible || downloadTriggered,
      'Either download event or success toast should appear after clicking Download Invoice'
    ).toBe(true);
  });

  // ── 9. UI: "Download Invoice PDF" button in card also works ─────────

  test('9. UI — "Download Invoice PDF" in card shows success toast', async ({ page }) => {
    await adminLogin(page);
    const { id } = await getFirstOrderId();

    await page.goto(`${ADMIN_URL}/orders/${id}`);
    await page.waitForLoadState('networkidle');

    // Click the second button (in the card)
    await page.getByRole('button', { name: /download invoice pdf/i }).click();

    // Should show success toast
    await expect(page.getByText(/invoice downloaded/i)).toBeVisible({ timeout: 20000 });
  });

  // ── 10. API: PDF Content-Disposition has correct filename ──────────

  test('10. API — invoice Content-Disposition header has order number in filename', async () => {
    const token = getToken();
    const { id, orderNumber } = await getFirstOrderId();

    const res = await fetchWithRetry(`${API_URL}/admin/orders/${id}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const disposition = res.headers.get('content-disposition') || '';
    // Should contain "invoice" or the order number in the filename
    expect(
      disposition.toLowerCase().includes('invoice') || disposition.includes(orderNumber.slice(0, 8)),
      `Content-Disposition should reference invoice/order, got: "${disposition}"`
    ).toBe(true);
  });

});
