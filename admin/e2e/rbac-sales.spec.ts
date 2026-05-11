import { test, expect } from '@playwright/test';

/**
 * RBAC Tests - Sales Role
 * Verifies that sales users only have access to sales-related modules
 */

test.describe('RBAC - Sales Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as sales user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sales@amoha.com');
    await page.fill('input[type="password"]', 'sales123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('sales can access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
  });

  test('sales can access sales modules', async ({ page }) => {
    const allowedModules = ['/orders', '/billing', '/barcode', '/returns', '/wallets'];
    for (const module of allowedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('sales cannot access purchase modules', async ({ page }) => {
    const restrictedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq', '/purchase-requests'];
    for (const module of restrictedModules) {
      await page.goto(module);
      // Should either show Access Denied or redirect
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('sales cannot access marketing modules', async ({ page }) => {
    const restrictedModules = ['/coupons', '/banners', '/reviews', '/crm'];
    for (const module of restrictedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('sales cannot access admin-only modules', async ({ page }) => {
    const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
    for (const module of adminOnlyModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('sales sees only allowed navigation items', async ({ page }) => {
    await page.goto('/dashboard');

    // Sales section should be visible
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Billing')).toBeVisible();

    // Purchase section should NOT be visible
    await expect(page.locator('text=Purchase')).not.toBeVisible();
    await expect(page.locator('text=Products').first()).not.toBeVisible();

    // Marketing section should NOT be visible
    await expect(page.locator('text=Marketing')).not.toBeVisible();
    await expect(page.locator('text=Coupons')).not.toBeVisible();

    // Admin section should NOT be visible
    await expect(page.locator('text=Admin')).not.toBeVisible();
    await expect(page.locator('text=Users')).not.toBeVisible();
  });

  test('sales role badge is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Sales')).toBeVisible();
  });
});
