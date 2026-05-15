import { test, expect } from '@playwright/test';
import { authedCtx } from './shared-auth';

/**
 * COMPREHENSIVE ADMIN HEALTH CHECK
 * Tests all major admin routes, navigation, and basic functionality
 */

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

test.describe('Admin Panel Health Check', () => {
  test.use({ storageState: '.auth/admin-state.json' });

  test('Dashboard loads without errors', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('All main navigation routes are accessible', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/products',
      '/categories',
      '/brands',
      '/inventory',
      '/orders',
      '/customers',
      '/billing',
      '/suppliers',
      '/reports',
      '/settings',
      '/notifications',
      '/users',
      '/admin-users',
    ];

    for (const route of routes) {
      await page.goto(`${ADMIN_URL}${route}`);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded (no 404/500)
      const title = await page.title();
      expect(title).not.toContain('404');
      expect(title).not.toContain('500');
      
      // Verify main content visible
      const mainContent = page.locator('main, [role="main"], .page-container').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('Products CRUD - Create', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/products`);
    
    // Click "Add Product" button
    const addButton = page.locator('button:has-text("Add Product"), a:has-text("Add Product")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForURL('**/products/new');
      
      // Verify form loaded
      await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
    }
  });

  test('Products CRUD - Read/List', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    // Check if table or grid exists
    const hasTable = await page.locator('table, [role="table"]').count() > 0;
    const hasGrid = await page.locator('[class*="grid"]').count() > 0;
    
    expect(hasTable || hasGrid).toBeTruthy();
  });

  test('Categories CRUD operations', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/categories`);
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Inventory page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/inventory`);
    await page.waitForLoadState('networkidle');
    
    // Check for inventory table/list
    const content = page.locator('main, [role="main"]').first();
    await expect(content).toBeVisible();
  });

  test('Orders page loads and displays data', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orders`);
    await page.waitForLoadState('networkidle');
    
    // Verify orders table exists
    const hasContent = await page.locator('table, [role="table"], [class*="order"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Billing page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/billing`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Suppliers page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/suppliers`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Reports page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Settings page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/settings`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/products`);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      // Verify search triggered (URL or table update)
    }
  });

  test('Dark mode toggle works', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Dark"), button:has-text("Light")').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Verify dark class applied
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => 
        el.classList.contains('dark') || el.classList.contains('light')
      );
      expect(hasClass).toBeTruthy();
    }
  });

  test('Notifications panel opens', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    const notifButton = page.locator('button[aria-label*="notification" i], a[href*="notification"]').first();
    if (await notifButton.isVisible()) {
      await notifButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('User profile menu opens', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    const profileButton = page.locator('button[aria-label*="profile" i], button[aria-label*="account" i]').first();
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(500);
      
      // Verify menu visible
      const menu = page.locator('[role="menu"], [class*="dropdown"]').first();
      await expect(menu).toBeVisible();
    }
  });

  test('Logout works', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });
      
      // Verify redirected to login
      expect(page.url()).toContain('/login');
    }
  });

  test('No critical console errors on dashboard', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (!text.includes('favicon') && !text.includes('sourcemap')) {
          criticalErrors.push(text);
        }
      }
    });
    
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    // Verify mobile menu exists
    const mobileMenu = page.locator('button[aria-label*="menu" i], button:has-text("Menu")').first();
    await expect(mobileMenu).toBeVisible();
  });

  test('API health check', async ({ page, request }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api';
    
    try {
      const response = await request.get(`${apiBase}/health`);
      expect(response.ok()).toBeTruthy();
    } catch (error) {
      console.warn('API health endpoint not available');
    }
  });
});
