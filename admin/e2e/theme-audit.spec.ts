/**
 * Admin Panel Theme Audit & Dark/Light Mode Validation Tests
 */

import { test, expect, Page } from '@playwright/test';

// Admin pages to test
const ADMIN_PAGES = [
  { name: 'Login', path: '/login' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Products', path: '/products' },
  { name: 'Orders', path: '/orders' },
  { name: 'Users', path: '/users' },
  { name: 'Categories', path: '/categories' },
  { name: 'Settings', path: '/settings' },
  { name: 'Reports', path: '/reports' },
  { name: 'Barcode POS', path: '/barcode' },
  { name: 'Inventory', path: '/inventory' },
  { name: 'CRM', path: '/crm' },
  { name: 'Reviews', path: '/reviews' },
  { name: 'Banners', path: '/banners' },
  { name: 'Coupons', path: '/coupons' },
  { name: 'Activity Logs', path: '/activity-logs' },
];

/**
 * Helper to toggle theme via classList manipulation (avoids localStorage security issues in tests)
 */
async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(t);
    html.style.colorScheme = t;
  }, theme);
  await page.waitForTimeout(150);
}

test.describe('Admin Theme System Validation', () => {
  
  test.describe('TEST 1: Light → Dark Theme Switch', () => {
    for (const page of ADMIN_PAGES) {
      test(`${page.name} page - Light to Dark switch`, async ({ page: pwPage }) => {
        await setTheme(pwPage, 'light');
        await pwPage.goto(page.path);
        await pwPage.waitForLoadState('networkidle');
        
        // Handle login redirect if needed
        if (pwPage.url().includes('/login')) {
          // Fill in test credentials if on login page
          const emailInput = pwPage.locator('input[type="email"]').first();
          if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('admin@amoha.com');
            await pwPage.locator('input[type="password"]').first().fill('password');
            await pwPage.locator('button[type="submit"]').first().click();
            await pwPage.waitForLoadState('networkidle');
            await pwPage.goto(page.path);
          }
        }
        
        // Verify light theme
        const hasLightClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('light')
        );
        expect(hasLightClass).toBe(true);
        
        // Switch to dark
        await setTheme(pwPage, 'dark');
        
        // Verify dark theme
        const hasDarkClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('dark')
        );
        expect(hasDarkClass).toBe(true);
        
        // Screenshot for validation
        await pwPage.screenshot({ 
          path: `test-results/admin-theme-dark-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        // Verify content
        const mainContent = pwPage.locator('main, [role="main"], .flex-1').first();
        await expect(mainContent).toBeVisible();
      });
    }
  });

  test.describe('TEST 2: Dark → Light Theme Switch', () => {
    for (const page of ADMIN_PAGES) {
      test(`${page.name} page - Dark to Light switch`, async ({ page: pwPage }) => {
        await setTheme(pwPage, 'dark');
        await pwPage.goto(page.path);
        await pwPage.waitForLoadState('networkidle');
        
        // Handle login redirect
        if (pwPage.url().includes('/login')) {
          const emailInput = pwPage.locator('input[type="email"]').first();
          if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('admin@amoha.com');
            await pwPage.locator('input[type="password"]').first().fill('password');
            await pwPage.locator('button[type="submit"]').first().click();
            await pwPage.waitForLoadState('networkidle');
            await pwPage.goto(page.path);
          }
        }
        
        // Switch to light
        await setTheme(pwPage, 'light');
        
        // Verify light theme
        const hasLightClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('light')
        );
        expect(hasLightClass).toBe(true);
        
        // Screenshot
        await pwPage.screenshot({ 
          path: `test-results/admin-theme-light-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        // Verify content
        const mainContent = pwPage.locator('main, [role="main"], .flex-1').first();
        await expect(mainContent).toBeVisible();
      });
    }
  });

  test.describe('TEST 3: Theme Persistence on Refresh', () => {
    test('Dark theme persists after page refresh', async ({ page }) => {
      await setTheme(page, 'dark');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      // Verify dark
      let hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
      
      // Refresh
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify persisted
      hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
    });
  });

  test.describe('TEST 4: Admin Sidebar Theme', () => {
    test('Sidebar renders correctly in both themes', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        // Find sidebar
        const sidebar = page.locator('aside, [class*="sidebar"], nav').first();
        await expect(sidebar).toBeVisible();
        
        // Verify sidebar has background
        const bgColor = await sidebar.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(bgColor).not.toBe('transparent');
        
        // Verify nav items are visible
        const navItems = sidebar.locator('a, button').first();
        await expect(navItems).toBeVisible();
      }
    });
  });

  test.describe('TEST 5: Admin Header Theme', () => {
    test('Header renders correctly in both themes', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        // Find header
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        
        // Verify header content
        const headerText = header.locator('text=/./').first();
        await expect(headerText).toBeVisible();
      }
    });
  });

  test.describe('TEST 6: Data Table Theme', () => {
    test('Data tables render correctly in both themes', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/products');
        }
      }
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        // Find table
        const table = page.locator('table').first();
        if (await table.isVisible().catch(() => false)) {
          await expect(table).toBeVisible();
          
          // Verify table has proper background
          const bgColor = await table.evaluate((el) => 
            window.getComputedStyle(el).backgroundColor
          );
          expect(bgColor).not.toBe('transparent');
        }
      }
    });
  });

  test.describe('TEST 7: Card Components Theme', () => {
    test('Cards render correctly in both themes', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        // Find cards
        const cards = page.locator('[class*="card"]').first();
        if (await cards.isVisible().catch(() => false)) {
          await expect(cards).toBeVisible();
          
          // Verify card has background
          const bgColor = await cards.evaluate((el) => 
            window.getComputedStyle(el).backgroundColor
          );
          expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    });
  });

  test.describe('TEST 8: No Console Theme Errors', () => {
    test('No theme-related errors in console', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      // Switch themes
      await setTheme(page, 'dark');
      await page.waitForTimeout(500);
      
      await setTheme(page, 'light');
      await page.waitForTimeout(500);
      
      // Filter for theme-related errors
      const themeErrors = errors.filter(e => 
        e.toLowerCase().includes('theme') || 
        e.toLowerCase().includes('dark') || 
        e.toLowerCase().includes('light') ||
        e.toLowerCase().includes('color') ||
        e.toLowerCase().includes('hsl') ||
        e.toLowerCase().includes('css')
      );
      
      expect(themeErrors).toHaveLength(0);
    });
  });

  test.describe('TEST 9: Mobile Responsive Theme', () => {
    test('Theme works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await setTheme(page, 'dark');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      // Verify dark theme on mobile
      const hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/admin-theme-mobile-dark-dashboard.png',
        fullPage: true 
      });
      
      // Verify mobile menu button is visible
      const menuButton = page.locator('button[class*="menu"], button[aria-label*="menu"]').first();
      await expect(menuButton).toBeVisible();
    });
  });

  test.describe('TEST 10: Theme Toggle UI', () => {
    test('Theme toggle is present in header', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Handle login
      if (page.url().includes('/login')) {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill('admin@amoha.com');
          await page.locator('input[type="password"]').first().fill('password');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.goto('/dashboard');
        }
      }
      
      // Look for theme toggle
      const themeToggle = page.locator('[aria-label*="theme" i], button[class*="theme"]').first();
      await expect(themeToggle).toBeVisible();
    });
  });
});
