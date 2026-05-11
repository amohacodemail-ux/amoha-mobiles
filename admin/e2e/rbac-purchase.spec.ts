import { test, expect } from '@playwright/test';

/**
 * RBAC Tests - Purchase Role
 * Verifies that purchase users only have access to purchase-related modules
 */

test.describe('RBAC - Purchase Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as purchase user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'purchase@amoha.com');
    await page.fill('input[type="password"]', 'purchase123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('purchase can access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
  });

  test('purchase can access purchase modules', async ({ page }) => {
    const allowedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq', '/purchase-requests'];
    for (const module of allowedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('purchase cannot access sales modules', async ({ page }) => {
    const restrictedModules = ['/orders', '/billing', '/returns', '/wallets'];
    for (const module of restrictedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('purchase cannot access marketing modules', async ({ page }) => {
    const restrictedModules = ['/coupons', '/banners', '/reviews', '/crm'];
    for (const module of restrictedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('purchase cannot access admin-only modules', async ({ page }) => {
    const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
    for (const module of adminOnlyModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('purchase sees only allowed navigation items', async ({ page }) => {
    await page.goto('/dashboard');

    // Purchase section should be visible
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('text=Suppliers')).toBeVisible();

    // Sales section should NOT be visible
    await expect(page.locator('text=Sales')).not.toBeVisible();
    await expect(page.locator('text=Orders').first()).not.toBeVisible();

    // Marketing section should NOT be visible
    await expect(page.locator('text=Marketing')).not.toBeVisible();
    await expect(page.locator('text=Coupons')).not.toBeVisible();

    // Admin section should NOT be visible
    await expect(page.locator('text=Admin')).not.toBeVisible();
    await expect(page.locator('text=Users')).not.toBeVisible();
  });

  test('purchase role badge is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Purchase')).toBeVisible();
  });
});
