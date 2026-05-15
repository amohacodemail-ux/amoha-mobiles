import { test, expect } from '@playwright/test';

/**
 * RBAC Tests - Admin Role
 * Verifies that admin users have full access to all modules
 */

test.use({ storageState: '.auth/admin-state.json' });

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

test.describe('RBAC - Admin Role', () => {
  test('admin can access dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('admin can access all sales modules', async ({ page }) => {
    const salesModules = ['/orders', '/billing', '/barcode', '/returns', '/wallets'];
    for (const module of salesModules) {
      await page.goto(`${ADMIN_URL}${module}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('admin can access all purchase modules', async ({ page }) => {
    const purchaseModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq', '/purchase-requests'];
    for (const module of purchaseModules) {
      await page.goto(`${ADMIN_URL}${module}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('admin can access all marketing modules', async ({ page }) => {
    const marketingModules = ['/coupons', '/banners', '/reviews', '/crm', '/contact-messages'];
    for (const module of marketingModules) {
      await page.goto(`${ADMIN_URL}${module}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('admin can access admin-only modules', async ({ page }) => {
    const adminModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
    for (const module of adminModules) {
      await page.goto(`${ADMIN_URL}${module}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('admin sees all navigation items', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for Sales section
    await expect(page.locator('text=Sales')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Billing')).toBeVisible();

    // Check for Purchase section
    await expect(page.locator('text=Purchase')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();

    // Check for Marketing section
    await expect(page.locator('text=Marketing')).toBeVisible();
    await expect(page.locator('text=Coupons')).toBeVisible();

    // Check for Admin section
    await expect(page.locator('text=Admin')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('admin role badge is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Administrator')).toBeVisible();
  });
});
