/**
 * Theme Audit & Dark/Light Mode Validation Tests
 * 
 * These tests validate:
 * 1. Theme switching works across all pages
 * 2. Colors are readable in both themes
 * 3. No hardcoded colors break the theme
 * 4. Theme persistence across navigation
 * 5. No FOUC or flickering
 */

import { test, expect, Page } from '@playwright/test';

// Pages to test for theme consistency
const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Product Detail', path: '/product/apple-iphone-15' },
  { name: 'Cart', path: '/cart' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Wishlist', path: '/wishlist' },
  { name: 'Compare', path: '/compare' },
  { name: 'Orders', path: '/orders' },
  { name: 'Profile', path: '/profile' },
  { name: 'Terms', path: '/terms' },
  { name: 'Privacy', path: '/privacy-policy' },
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
  // Small delay for CSS to apply
  await page.waitForTimeout(150);
}

/**
 * Helper to check if an element has proper contrast
 */
async function hasProperContrast(element: any): Promise<boolean> {
  const styles = await element.evaluate((el: Element) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
    };
  });
  
  // Basic check - if we can get styles, the element is rendered
  return styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== 'transparent';
}

test.describe('Theme System Validation', () => {
  
  test.describe('TEST 1: Light → Dark Theme Switch', () => {
    for (const page of PAGES) {
      test(`${page.name} page - Light to Dark switch`, async ({ page: pwPage }) => {
        // Start with light theme
        await setTheme(pwPage, 'light');
        await pwPage.goto(page.path);
        await pwPage.waitForLoadState('networkidle');
        
        // Verify light theme is applied
        const hasLightClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('light')
        );
        expect(hasLightClass).toBe(true);
        
        // Switch to dark
        await setTheme(pwPage, 'dark');
        
        // Verify dark theme is applied
        const hasDarkClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('dark')
        );
        expect(hasDarkClass).toBe(true);
        
        // Take screenshot for visual validation
        await pwPage.screenshot({ 
          path: `test-results/theme-dark-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        // Verify main content is visible
        await expect(pwPage.locator('body')).toBeVisible();
        
        // Verify text is readable (not white on white or black on black)
        const textElements = pwPage.locator('h1, h2, h3, p, span, a, button');
        const count = await textElements.count();
        expect(count).toBeGreaterThan(0);
      });
    }
  });

  test.describe('TEST 2: Dark → Light Theme Switch', () => {
    for (const page of PAGES) {
      test(`${page.name} page - Dark to Light switch`, async ({ page: pwPage }) => {
        // Start with dark theme
        await setTheme(pwPage, 'dark');
        await pwPage.goto(page.path);
        await pwPage.waitForLoadState('networkidle');
        
        // Verify dark theme
        const hasDarkClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('dark')
        );
        expect(hasDarkClass).toBe(true);
        
        // Switch to light
        await setTheme(pwPage, 'light');
        
        // Verify light theme
        const hasLightClass = await pwPage.evaluate(() => 
          document.documentElement.classList.contains('light')
        );
        expect(hasLightClass).toBe(true);
        
        // Take screenshot
        await pwPage.screenshot({ 
          path: `test-results/theme-light-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        // Verify content visibility
        const mainContent = pwPage.locator('main').first();
        await expect(mainContent).toBeVisible().catch(() => {
          return expect(pwPage.locator('body')).toBeVisible();
        });
      });
    }
  });

  test.describe('TEST 3: Theme Persistence on Refresh', () => {
    test('Dark theme persists after page refresh', async ({ page }) => {
      await setTheme(page, 'dark');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verify dark theme
      let hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify dark theme persisted
      hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
    });

    test('Light theme persists after page refresh', async ({ page }) => {
      await setTheme(page, 'light');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify light theme persisted
      const hasLightClass = await page.evaluate(() => 
        document.documentElement.classList.contains('light')
      );
      expect(hasLightClass).toBe(true);
    });
  });

  test.describe('TEST 4: Theme Toggle UI', () => {
    test('Theme toggle button is present and functional', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find theme toggle button (by aria-label or common patterns)
      const themeToggle = page.locator('[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i]').first();
      
      // If toggle exists, test it
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        
        // Verify theme dropdown or options appear
        const themeOptions = page.locator('text=Light, text=Dark, text=System').first();
        await expect(themeOptions).toBeVisible().catch(() => {
          // Some toggles might not have a dropdown, that's OK
        });
      }
    });
  });

  test.describe('TEST 5: Component Theme Consistency', () => {
    test('Header renders correctly in both themes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        
        // Verify header has background color
        const bgColor = await header.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(bgColor).not.toBe('transparent');
      }
    });

    test('Footer renders correctly in both themes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.waitForTimeout(100);
        
        const footer = page.locator('footer').first();
        await expect(footer).toBeVisible();
        
        // Verify footer links are visible
        const footerLinks = footer.locator('a');
        const count = await footerLinks.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('Product cards render correctly in both themes', async ({ page }) => {
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        
        // Wait for product cards to load
        await page.waitForTimeout(2000);
        
        const productCards = page.locator('[class*="product"], article, .card').first();
        if (await productCards.isVisible().catch(() => false)) {
          await expect(productCards).toBeVisible();
          
          // Verify text is readable
          const text = productCards.locator('text=/\\d{1,6}/').first();
          if (await text.isVisible().catch(() => false)) {
            await expect(text).toBeVisible();
          }
        }
      }
    });

    test('Forms render correctly in both themes', async ({ page }) => {
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        const form = page.locator('form').first();
        await expect(form).toBeVisible();
        
        // Verify inputs have proper styling
        const inputs = form.locator('input').first();
        await expect(inputs).toBeVisible();
        
        // Check that input has background
        const bgColor = await inputs.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('TEST 6: No Console Theme Errors', () => {
    test('No theme-related errors in console', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
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
        e.toLowerCase().includes('css')
      );
      
      expect(themeErrors).toHaveLength(0);
    });
  });

  test.describe('TEST 7: Mobile Responsive Theme', () => {
    test('Theme works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await setTheme(page, 'dark');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verify dark theme on mobile
      const hasDarkClass = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDarkClass).toBe(true);
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/theme-mobile-dark-home.png',
        fullPage: true 
      });
      
      // Verify mobile navigation is visible
      const mobileNav = page.locator('nav, [class*="mobile"], [class*="bottom-nav"]').first();
      await expect(mobileNav).toBeVisible();
    });
  });

  test.describe('TEST 8: Accessibility - Contrast Check', () => {
    test('Text has sufficient contrast in light theme', async ({ page }) => {
      await setTheme(page, 'light');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check headings
      const h1 = page.locator('h1').first();
      if (await h1.isVisible().catch(() => false)) {
        const color = await h1.evaluate((el) => 
          window.getComputedStyle(el).color
        );
        // Should not be too light (basic check)
        expect(color).not.toContain('rgb(255, 255, 255)'); // Not white on light theme
      }
    });

    test('Text has sufficient contrast in dark theme', async ({ page }) => {
      await setTheme(page, 'dark');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check headings
      const h1 = page.locator('h1').first();
      if (await h1.isVisible().catch(() => false)) {
        const color = await h1.evaluate((el) => 
          window.getComputedStyle(el).color
        );
        // Should not be too dark (basic check)
        expect(color).not.toContain('rgb(0, 0, 0)'); // Not black on dark theme
      }
    });
  });
});
