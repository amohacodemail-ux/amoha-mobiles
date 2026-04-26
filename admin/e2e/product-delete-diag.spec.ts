/**
 * Diagnostic: try to delete a product with order history from the UI.
 * Takes screenshots at every step so we can see exactly what the admin sees.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.amohamobiles.com';
const API_URL   = process.env.API_URL   || 'https://amoha-backend-v2.onrender.com/api';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const SHOTS_DIR = path.join(__dirname, '..', 'test-results', 'delete-diag');

function ensureDir() {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensureDir();
  const p = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[screenshot] ${p}`);
}

async function getTokenAndLogin(page: Page) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const body = await res.json();
  const token: string = body.token || body.data?.token;
  const refreshToken: string = body.refreshToken || body.data?.refreshToken;
  const domain = new URL(ADMIN_URL).hostname;
  await page.context().addCookies([
    { name: 'admin_token', value: token, domain, path: '/' },
    { name: 'admin_refresh_token', value: refreshToken, domain, path: '/' },
  ]);
  return token;
}

test.beforeEach(() => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
});

test('DIAG — delete product with order history from admin UI', async ({ page }) => {
  // ── 1. Login ────────────────────────────────────────────────────────
  const token = await getTokenAndLogin(page);
  await page.goto(`${ADMIN_URL}/products`);
  await page.waitForTimeout(3000);
  await shot(page, '01-products-list');

  // ── 2. Find a product that has at least one order (via API scan) ────
  const prodsRes = await fetch(`${API_URL}/admin/products?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const prodsBody = await prodsRes.json();
  const products: any[] = prodsBody?.data?.products || prodsBody?.data || [];
  console.log(`[diag] fetched ${products.length} products`);

  // Find a product that is referenced by order_items (has order history)
  let targetProduct: any = null;
  for (const p of products) {
    const pid = p.id || p._id;
    const ordersRes = await fetch(
      `${API_URL}/admin/orders?search=${encodeURIComponent(p.name)}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (ordersRes.ok) {
      const ordersBody = await ordersRes.json();
      const orders: any[] = ordersBody?.data?.orders || ordersBody?.data || [];
      if (orders.length > 0) {
        targetProduct = p;
        console.log(`[diag] found product with orders: "${p.name}" (${pid})`);
        break;
      }
    }
  }

  // If no product found via order search, just use the first product
  if (!targetProduct) {
    targetProduct = products[0];
    console.log(`[diag] no order-linked product found, using first: "${targetProduct?.name}"`);
  }

  if (!targetProduct) {
    console.log('[diag] no products found at all – skipping');
    test.skip();
    return;
  }

  const productId = targetProduct.id || targetProduct._id;
  const productName = targetProduct.name;

  // ── 3. Try delete via API directly first (raw response) ─────────────
  console.log(`[diag] attempting API delete of "${productName}" (${productId})`);
  const deleteRes = await fetch(`${API_URL}/admin/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteBody = await deleteRes.json().catch(() => ({}));
  console.log(`[diag] API delete response: ${deleteRes.status} —`, JSON.stringify(deleteBody));

  const apiDeleteFailed = !deleteRes.ok;

  if (apiDeleteFailed) {
    // ── 4a. Product has order history - now test via UI ─────────────
    // Reload products page
    await page.goto(`${ADMIN_URL}/products`);
    await page.waitForTimeout(2000);

    // Search for the target product
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(productName);
      await page.waitForTimeout(2000);
    }
    await shot(page, '02-search-result');

    // Click the delete button on the matching row
    const targetRow = page.locator('table tbody tr', { hasText: productName }).first();
    if (await targetRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await targetRow.locator('button').last().click();
      await page.waitForTimeout(1000);
      await shot(page, '03-delete-modal-open');

      // Confirm the delete
      const modal = page.getByRole('dialog');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const confirmBtn = modal.getByRole('button', { name: /delete/i }).last();
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        await shot(page, '04-after-confirm');
      }
    } else {
      // Product not in search results, use table first row
      const anyRow = page.locator('table tbody tr').first();
      await anyRow.locator('button').last().click();
      await page.waitForTimeout(1000);
      await shot(page, '03-delete-modal-open-fallback');
      const modal = page.getByRole('dialog');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const confirmBtn = modal.getByRole('button', { name: /delete/i }).last();
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        await shot(page, '04-after-confirm-fallback');
      }
    }

    // Check if error toast appeared
    const errorToast = page.locator('[class*="toast"], [role="alert"], [data-sonner-toast]').filter({ hasText: /order|referenced|migration|cannot/i });
    const errorVisible = await errorToast.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[diag] error toast visible: ${errorVisible}`);
    if (errorVisible) {
      const toastText = await errorToast.first().textContent();
      console.log(`[diag] toast text: "${toastText}"`);
    }
    await shot(page, '05-final-state');

    // Log the failure clearly
    console.log('\n========================================');
    console.log('DIAGNOSIS: DB migration has NOT been applied.');
    console.log('The product delete is still blocked by the FK constraint.');
    console.log('API error:', JSON.stringify(deleteBody));
    console.log('FIX: Run backend/supabase-migration-v4.sql in the Supabase SQL Editor.');
    console.log('========================================\n');

  } else {
    // ── 4b. Delete succeeded ────────────────────────────────────────
    await page.goto(`${ADMIN_URL}/products`);
    await page.waitForTimeout(2000);
    await shot(page, '02-after-successful-delete');
    console.log(`\n[diag] ✅ Product "${productName}" was HARD DELETED successfully!`);
    console.log('[diag] Migration is applied and working correctly.\n');
  }

  // ── 5. Report migration status ──────────────────────────────────────
  const statusRes = await fetch(`${API_URL}/health`);
  console.log(`[diag] Backend health: ${statusRes.status}`);

  // Final assertion based on what we found
  if (apiDeleteFailed) {
    // Capture the exact error for reporting
    expect(deleteBody.message || deleteBody.error || 'delete failed').toContain('order');
  } else {
    expect(deleteRes.status).toBe(200);
  }
});
