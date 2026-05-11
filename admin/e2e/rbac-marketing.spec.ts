import { test, expect } from '@playwright/test';

/**
 * RBAC Tests - Marketing Role
 * Verifies that marketing users only have access to marketing-related modules
 */

test.describe('RBAC - Marketing Role', () => {
  test.beforeEach(async ({ page }) => {
    // Login as marketing user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'marketing@amoha.com');
    await page.fill('input[type="password"]', 'marketing123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('marketing can access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
  });

  test('marketing can access marketing modules', async ({ page }) => {
    const allowedModules = ['/coupons', '/banners', '/reviews', '/crm', '/contact-messages', '/product-views', '/abandoned-carts'];
    for (const module of allowedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied')).not.toBeVisible();
    }
  });

  test('marketing cannot access sales modules', async ({ page }) => {
    const restrictedModules = ['/orders', '/billing', '/barcode', '/returns', '/wallets'];
    for (const module of restrictedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('marketing cannot access purchase modules', async ({ page }) => {
    const restrictedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq'];
    for (const module of restrictedModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('marketing cannot access admin-only modules', async ({ page }) => {
    const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
    for (const module of adminOnlyModules) {
      await page.goto(module);
      await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
    }
  });

  test('marketing sees only allowed navigation items', async ({ page }) => {
    await page.goto('/dashboard');

    // Marketing section should be visible
    await expect(page.locator('text=Coupons')).toBeVisible();
    await expect(page.locator('text=Banners')).toBeVisible();
    await expect(page.locator('text=CRM')).toBeVisible();

    // Sales section should NOT be visible
    await expect(page.locator('text=Sales')).not.toBeVisible();

    // Purchase section should NOT be visible
    await expect(page.locator('text=Purchase')).not.toBeVisible();
    await expect(page.locator('text=Products').first()).not.toBeVisible();

    // Admin section should NOT be visible
    await expect(page.locator('text=Admin')).not.toBeVisible();
    await expect(page.locator('text=Users')).not.toBeVisible();
  });

  test('marketing role badge is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Marketing')).toBeVisible();
  });
});
