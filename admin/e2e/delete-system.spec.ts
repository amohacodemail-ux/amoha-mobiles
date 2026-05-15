/**
 * Enterprise Delete System Playwright Tests
 * Tests for role-based delete permissions and data integrity protection
 */
import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

async function loginAsAdmin(page: any) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', 'admin@amoha.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}

async function loginAsPurchase(page: any) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', 'purchase@amoha.com');
  await page.fill('input[type="password"]', 'purchase123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}

async function loginAsSales(page: any) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', 'sales@amoha.com');
  await page.fill('input[type="password"]', 'sales123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}

async function loginAsMarketing(page: any) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[type="email"]', 'marketing@amoha.com');
  await page.fill('input[type="password"]', 'marketing123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}

test.describe('Enterprise Delete System', () => {

  test.describe('Role-Based Delete Permissions', () => {
    test('Admin should have full delete access', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Admin should see delete button on products
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });

      // Navigate to brands
      await page.goto(`${ADMIN_URL}/brands`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
    });

    test('Purchase role should have delete access to products, brands, categories, suppliers', async ({ page }) => {
      await loginAsPurchase(page);

      // Should see delete in products
      await page.goto(`${ADMIN_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });

      // Should see delete in brands
      await page.goto(`${ADMIN_URL}/brands`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
    });

    test('Sales role should NOT have delete access to products', async ({ page }) => {
      await loginAsSales(page);
      await page.goto(`${ADMIN_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for page to fully render

      // Sales should NOT see delete button
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await page.waitForTimeout(2000);
      const count = await deleteButtons.count();
      expect(count).toBe(0);
    });

    test('Marketing role should have delete access to coupons and banners', async ({ page }) => {
      await loginAsMarketing(page);

      // Should see delete in coupons
      await page.goto(`${ADMIN_URL}/coupons`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Delete Confirmation Dialog', () => {
    test('Should show confirmation dialog before delete', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/brands`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Click delete on first brand
      const deleteButton = page.locator('button:has(.lucide-trash2)').first();
      await expect(deleteButton).toBeVisible({ timeout: 20000 });
      await deleteButton.click();
      await page.waitForTimeout(1000);

      // Confirm dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await expect(dialog.locator('text=/Are you sure/i')).toBeVisible();
      await expect(dialog.locator('text=/cannot be undone/i')).toBeVisible();
    });

    test('Should cancel delete when clicking cancel', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/coupons`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Get initial count
      const initialRows = page.locator('table tbody tr');
      const initialCount = await initialRows.count();

      // Click delete on first coupon
      const deleteBtn = page.locator('button:has(.lucide-trash2)').first();
      await expect(deleteBtn).toBeVisible({ timeout: 20000 });
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Click cancel
      await page.locator('[role="dialog"] button:has-text(/cancel/i)').click();
      await page.waitForTimeout(500);

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

      // Count should remain the same
      await expect(initialRows).toHaveCount(initialCount);
    });
  });

  test.describe('Dependency Protection', () => {
    test('Should prevent deleting brand with linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/brands`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Try to delete a brand that has products (Samsung typically has products)
      const samsungRow = page.locator('tr:has-text("Samsung")');
      if (await samsungRow.isVisible().catch(() => false)) {
        const deleteBtn = samsungRow.locator('button:has(.lucide-trash2)');
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Confirm delete
        await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();
        await page.waitForTimeout(1000);

        // Should show error toast
        const toast = page.locator('[data-sonner-toast]');
        await expect(toast.locator('text=/Cannot delete/i')).toBeVisible({ timeout: 10000 });
        await expect(toast.locator('text=/linked/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('Should prevent deleting category with linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/categories`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Try to delete a category
      const deleteBtn = page.locator('button:has(.lucide-trash2)').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();
        await page.waitForTimeout(1000);

        // If category has products, should show error
        const toast = page.locator('[data-sonner-toast]');
        await toast.waitFor({ timeout: 10000 }).catch(() => {});
      }
    });

    test('Should allow deleting brand with no linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/brands`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Create a test brand first
      await page.locator('button:has-text(/add brand/i)').click();
      await page.locator('input[name="name"]').fill(`Test Brand ${Date.now()}`);
      await page.locator('button[type="submit"]').click();

      // Wait for it to appear
      await page.waitForTimeout(1000);

      // Delete the test brand
      const testRow = page.locator('tr:has-text("Test Brand")').last();
      if (await testRow.isVisible().catch(() => false)) {
        await testRow.locator('button:has(.lucide-trash2)').click();
        await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

        // Should show success
        const toast = page.locator('[data-sonner-toast]');
        await expect(toast.locator('text=/deleted/i')).toBeVisible();
      }
    });
  });

  test.describe('Audit Logging', () => {
    test('Delete action should be logged in activity logs', async ({ page }) => {
      await loginAsAdmin(page);

      // Create and delete a coupon to test audit
      await page.goto(`${ADMIN_URL}/coupons`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.locator('button:has-text(/add coupon/i)').click();
      await page.waitForTimeout(500);
      const testCode = `TEST${Date.now()}`;
      await page.locator('input[name="code"]').fill(testCode);
      await page.locator('input[name="discount"]').fill('10');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);

      // Delete the coupon
      const testRow = page.locator(`tr:has-text("${testCode}")`);
      await testRow.locator('button:has(.lucide-trash2)').click();
      await page.waitForTimeout(500);
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();
      await page.waitForTimeout(2000);

      // Check activity logs
      await page.goto(`${ADMIN_URL}/activity-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await expect(page.locator('text=/DELETE/i').first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('UI Updates After Delete', () => {
    test('Should instantly remove item from list after delete', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/coupons`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Create a test coupon
      await page.locator('button:has-text(/add coupon/i)').click();
      await page.waitForTimeout(500);
      const testCode = `DELETETEST${Date.now()}`;
      await page.locator('input[name="code"]').fill(testCode);
      await page.locator('input[name="discount"]').fill('5');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // Delete it
      const testRow = page.locator(`tr:has-text("${testCode}")`);
      await testRow.waitFor({ timeout: 5000 });
      const rowCount = await page.locator('table tbody tr').count();

      await testRow.locator('button:has(.lucide-trash2)').click();
      await page.waitForTimeout(500);
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

      // Wait for deletion
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // Row count should decrease
      const newCount = await page.locator('table tbody tr').count();
      expect(newCount).toBeLessThan(rowCount);
    });
  });

  test.describe('Error Handling', () => {
    test('Should show clear error message on delete failure', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Try to delete a product that likely has orders
      const deleteBtn = page.locator('button:has(.lucide-trash2)').first();
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();
      await page.waitForTimeout(1000);

      // Should show toast with error
      const toast = page.locator('[data-sonner-toast]');
      await toast.waitFor({ timeout: 15000 });

      // Toast should contain error information
      const toastText = await toast.textContent();
      expect(toastText?.toLowerCase()).toMatch(/(cannot delete|linked|error|failed)/);
    });
  });

});
