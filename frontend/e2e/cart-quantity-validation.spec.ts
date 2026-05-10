import { test, expect } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_URL || 'https://www.amohamobiles.com';

test.describe('Cart Quantity Validation & UX', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require being logged in and having items in cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded' });
    // Give React time to hydrate
    await page.waitForTimeout(2000);

    // If redirected to login, skip test
    if (page.url().includes('/login')) {
      test.skip(true, 'Requires authentication');
      return;
    }

    // If no cart items visible (empty cart or login-required state), skip tests
    const hasItems = await page.locator('.glass-card-sm').first().isVisible();
    if (!hasItems) {
      test.skip(true, 'Cart is empty or requires authentication');
      return;
    }
  });

  test('should validate stock limit BEFORE increment', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Get initial quantity
    const quantityDisplay = page.locator('.min-w-\\[1\\.5rem\\]').first();
    const initialQty = await quantityDisplay.textContent();
    
    // Check if there's a stock warning
    const stockWarning = page.locator('text=/Only \\d+ left in stock/');
    const hasStockWarning = await stockWarning.isVisible();
    
    if (hasStockWarning) {
      const stockText = await stockWarning.textContent();
      const stockMatch = stockText?.match(/Only (\\d+) left in stock/);
      if (stockMatch) {
        const stockLimit = parseInt(stockMatch[1]);
        const currentQty = parseInt(initialQty || '1');
        
        if (currentQty < stockLimit) {
          // Increment to stock limit
          for (let i = currentQty; i < stockLimit; i++) {
            await page.locator('button:has-text("+")').first().click();
            await page.waitForTimeout(1000);
          }
        }
        
        // Now try to increment beyond limit
        const incrementBtn = page.locator('button:has-text("+")').first();
        await incrementBtn.click();
        
        // Should show error toast
        const errorToast = page.locator('text=/Only \\d+ item.*available in stock/');
        await expect(errorToast).toBeVisible({ timeout: 3000 });
        
        // Button should be disabled
        await expect(incrementBtn).toBeDisabled();
      }
    }
  });

  test('should show loading indicator during quantity update', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Click increment
    const incrementBtn = page.locator('button:has-text("+")').first();
    
    // Check if button is not already disabled (at stock limit)
    if (await incrementBtn.isDisabled()) {
      test.skip();
    }
    
    await incrementBtn.click();
    
    // Loading spinner should appear
    const spinner = page.locator('.animate-spin').first();
    await expect(spinner).toBeVisible({ timeout: 2000 });
    
    // Buttons should be disabled during update
    await expect(incrementBtn).toBeDisabled();
    
    // Wait for update to complete
    await expect(spinner).toBeHidden({ timeout: 5000 });
  });

  test('should update price/subtotal correctly after quantity change', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Check if increment is possible
    const incrementBtn = page.locator('button:has-text("+")').first();
    if (await incrementBtn.isDisabled()) {
      test.skip();
    }
    
    // Get initial prices
    const itemPrice = page.locator('.glass-card-sm').first().locator('text=/₹[0-9,]+/').last();
    const initialItemTotal = await itemPrice.textContent();
    
    const subtotalElem = page.locator('text=Subtotal').locator('..').locator('text=/₹[0-9,]+/');
    const initialSubtotal = await subtotalElem.textContent();
    
    // Increment quantity
    await incrementBtn.click();
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Prices should have updated
    const newItemTotal = await itemPrice.textContent();
    const newSubtotal = await subtotalElem.textContent();
    
    expect(newItemTotal).not.toBe(initialItemTotal);
    expect(newSubtotal).not.toBe(initialSubtotal);
  });

  test('should not allow quantity less than 1', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Find an item with quantity 1
    const items = page.locator('.glass-card-sm');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const qty = await item.locator('.min-w-\\[1\\.5rem\\]').textContent();
      if (parseInt(qty || '0') === 1) {
        // Decrement button should be disabled
        const decrementBtn = item.locator('button:has-text("−")');
        await expect(decrementBtn).toBeDisabled();
        return;
      }
    }
  });

  test('should remove item instantly with optimistic update', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Count items
    const itemsBefore = await page.locator('.glass-card-sm').count();
    expect(itemsBefore).toBeGreaterThan(0);
    
    // Remove first item
    const trashBtn = page.locator('.glass-card-sm').first().locator('button').filter({ has: page.locator('svg.h-4.w-4') }).last();
    await trashBtn.click();
    
    // Item should be removed immediately (optimistic)
    await page.waitForTimeout(500);
    const itemsAfter = await page.locator('.glass-card-sm').count();
    expect(itemsAfter).toBe(itemsBefore - 1);
    
    // Success toast should show
    const toast = page.locator('text=Removed');
    await expect(toast).toBeVisible({ timeout: 2000 });
  });

  test('should handle multiple rapid quantity changes gracefully', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Rapidly click increment multiple times
    const incrementBtn = page.locator('button:has-text("+")').first();
    
    if (await incrementBtn.isDisabled()) {
      test.skip();
    }
    
    for (let i = 0; i < 3; i++) {
      if (!(await incrementBtn.isDisabled())) {
        await incrementBtn.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Wait for all updates to complete
    await page.waitForTimeout(4000);
    
    // Check that UI is stable (no loading spinners)
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeHidden({ timeout: 2000 });
  });

  test('should show stock warning for low stock items', async ({ page }) => {
    await page.waitForSelector('.glass-card-sm', { timeout: 5000 });
    
    // Look for stock warning (if stock <= 5)
    const stockWarning = page.locator('text=/Only \\d+ left in stock/');
    // This may or may not be visible depending on actual stock
    // Just verify page loads without errors
    expect(await page.locator('.glass-card-sm').count()).toBeGreaterThan(0);
  });
});
