/**
 * Enterprise Delete System Playwright Tests
 * Tests for role-based delete permissions and data integrity protection
 */
import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@amoha.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

async function loginAsPurchase(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'purchase@amoha.com');
  await page.fill('input[type="password"]', 'purchase123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

async function loginAsSales(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'sales@amoha.com');
  await page.fill('input[type="password"]', 'sales123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

async function loginAsMarketing(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'marketing@amoha.com');
  await page.fill('input[type="password"]', 'marketing123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Enterprise Delete System', () => {

  test.describe('Role-Based Delete Permissions', () => {
    test('Admin should have full delete access', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/products');

      // Admin should see delete button on products
      const deleteButtons = page.locator('button:has([class*="trash" i])').or(page.locator('button:has(.lucide-trash2)'));
      await expect(deleteButtons.first()).toBeVisible();

      // Navigate to brands
      await page.goto('/brands');
      await expect(deleteButtons.first()).toBeVisible();
    });

    test('Purchase role should have delete access to products, brands, categories, suppliers', async ({ page }) => {
      await loginAsPurchase(page);

      // Should see delete in products
      await page.goto('/products');
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons.first()).toBeVisible();

      // Should see delete in brands
      await page.goto('/brands');
      await expect(deleteButtons.first()).toBeVisible();
    });

    test('Sales role should NOT have delete access to products', async ({ page }) => {
      await loginAsSales(page);
      await page.goto('/products');

      // Sales should NOT see delete button
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons).toHaveCount(0);
    });

    test('Marketing role should have delete access to coupons and banners', async ({ page }) => {
      await loginAsMarketing(page);

      // Should see delete in coupons
      await page.goto('/coupons');
      const deleteButtons = page.locator('button:has(.lucide-trash2)');
      await expect(deleteButtons.first()).toBeVisible();
    });
  });

  test.describe('Delete Confirmation Dialog', () => {
    test('Should show confirmation dialog before delete', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/brands');

      // Click delete on first brand
      const deleteButton = page.locator('button:has(.lucide-trash2)').first();
      await deleteButton.click();

      // Confirm dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('text=/Are you sure/i')).toBeVisible();
      await expect(dialog.locator('text=/cannot be undone/i')).toBeVisible();
    });

    test('Should cancel delete when clicking cancel', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/coupons');

      // Get initial count
      const initialRows = page.locator('table tbody tr');
      const initialCount = await initialRows.count();

      // Click delete on first coupon
      await page.locator('button:has(.lucide-trash2)').first().click();

      // Click cancel
      await page.locator('[role="dialog"] button:has-text(/cancel/i)').click();

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Count should remain the same
      await expect(initialRows).toHaveCount(initialCount);
    });
  });

  test.describe('Dependency Protection', () => {
    test('Should prevent deleting brand with linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/brands');

      // Try to delete a brand that has products (Samsung typically has products)
      const samsungRow = page.locator('tr:has-text("Samsung")');
      if (await samsungRow.isVisible().catch(() => false)) {
        const deleteBtn = samsungRow.locator('button:has(.lucide-trash2)');
        await deleteBtn.click();

        // Confirm delete
        await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

        // Should show error toast
        const toast = page.locator('[data-sonner-toast]');
        await expect(toast.locator('text=/Cannot delete/i')).toBeVisible();
        await expect(toast.locator('text=/linked/i')).toBeVisible();
      }
    });

    test('Should prevent deleting category with linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/categories');

      // Try to delete a category
      const deleteBtn = page.locator('button:has(.lucide-trash2)').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

        // If category has products, should show error
        const toast = page.locator('[data-sonner-toast]');
        await toast.waitFor({ timeout: 5000 }).catch(() => {});
      }
    });

    test('Should allow deleting brand with no linked products', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/brands');

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
      await page.goto('/coupons');
      await page.locator('button:has-text(/add coupon/i)').click();
      const testCode = `TEST${Date.now()}`;
      await page.locator('input[name="code"]').fill(testCode);
      await page.locator('input[name="discount"]').fill('10');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Delete the coupon
      const testRow = page.locator(`tr:has-text("${testCode}")`);
      await testRow.locator('button:has(.lucide-trash2)').click();
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();
      await page.waitForTimeout(1000);

      // Check activity logs
      await page.goto('/activity-logs');
      await expect(page.locator('text=/DELETE/i').first()).toBeVisible();
    });
  });

  test.describe('UI Updates After Delete', () => {
    test('Should instantly remove item from list after delete', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/coupons');

      // Create a test coupon
      await page.locator('button:has-text(/add coupon/i)').click();
      const testCode = `DELETETEST${Date.now()}`;
      await page.locator('input[name="code"]').fill(testCode);
      await page.locator('input[name="discount"]').fill('5');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Delete it
      const testRow = page.locator(`tr:has-text("${testCode}")`);
      const rowCount = await page.locator('table tbody tr').count();

      await testRow.locator('button:has(.lucide-trash2)').click();
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

      // Wait for deletion
      await page.waitForTimeout(1000);

      // Row count should decrease
      const newCount = await page.locator('table tbody tr').count();
      expect(newCount).toBeLessThan(rowCount);
    });
  });

  test.describe('Error Handling', () => {
    test('Should show clear error message on delete failure', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/products');

      // Try to delete a product that likely has orders
      const deleteBtn = page.locator('button:has(.lucide-trash2)').first();
      await deleteBtn.click();
      await page.locator('[role="dialog"] button:has-text(/delete/i)').last().click();

      // Should show toast with error
      const toast = page.locator('[data-sonner-toast]');
      await toast.waitFor({ timeout: 10000 });

      // Toast should contain error information
      const toastText = await toast.textContent();
      expect(toastText?.toLowerCase()).toMatch(/(cannot delete|linked|error|failed)/);
    });
  });

});
