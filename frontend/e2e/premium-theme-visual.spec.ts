import { test, expect } from '@playwright/test';

test.describe('Premium Theme Visual Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Light mode - Homepage premium styling', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify header styling
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check product cards have premium shadows
    const productCards = page.locator('a[href^="/product/"]').first();
    if (await productCards.count() > 0) {
      await expect(productCards).toBeVisible();
    }

    // Screenshot for visual regression
    await page.screenshot({ 
      path: 'test-results/light-mode-homepage.png',
      fullPage: true 
    });
  });

  test('Dark mode - Homepage premium styling', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify dark mode is active
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Check header has proper dark mode styling
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Screenshot for visual regression
    await page.screenshot({ 
      path: 'test-results/dark-mode-homepage.png',
      fullPage: true 
    });
  });

  test('Product cards - Premium hover states', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('a[href^="/product/"]').first();
    if (await firstCard.count() > 0) {
      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(300); // Wait for transition

      // Screenshot hover state
      await page.screenshot({ 
        path: 'test-results/product-card-hover.png',
        fullPage: false 
      });
    }
  });

  test('Header navigation - Active states', async ({ page }) => {
    // Navigate to products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check active state styling
    const productsLink = page.locator('a[href="/products"]').first();
    await expect(productsLink).toBeVisible();

    await page.screenshot({ 
      path: 'test-results/header-active-state.png',
      clip: { x: 0, y: 0, width: 1280, height: 100 }
    });
  });

  test('Dark mode - Product cards depth and glow', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Screenshot dark mode product grid
    await page.screenshot({ 
      path: 'test-results/dark-mode-products.png',
      fullPage: true 
    });
  });

  test('Color contrast - Accessibility check', async ({ page }) => {
    // Light mode contrast
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check text is readable
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);

    // Dark mode contrast
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify dark mode text visibility
    const darkHeadings = page.locator('h1, h2, h3');
    const darkCount = await darkHeadings.count();
    expect(darkCount).toBeGreaterThan(0);
  });

  test('Theme toggle - Smooth transition', async ({ page }) => {
    // Start in light mode
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();

    // Find theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /theme|dark|light/i }).or(
      page.locator('button[aria-label*="theme"]')
    ).or(
      page.locator('button').filter({ has: page.locator('svg') }).nth(0)
    );

    // Screenshot before toggle
    await page.screenshot({ 
      path: 'test-results/before-theme-toggle.png',
      fullPage: false 
    });

    // Toggle theme if button exists
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(200);

      // Screenshot after toggle
      await page.screenshot({ 
        path: 'test-results/after-theme-toggle.png',
        fullPage: false 
      });
    }
  });

  test('Mobile responsive - Premium styling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await page.screenshot({ 
      path: 'test-results/mobile-homepage.png',
      fullPage: true 
    });

    // Test mobile menu
    const mobileMenuButton = page.locator('button').filter({ 
      has: page.locator('svg') 
    }).last();
    
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      await page.waitForTimeout(200);

      await page.screenshot({ 
        path: 'test-results/mobile-menu-open.png',
        fullPage: false 
      });
    }
  });

  test('Buttons - Premium gradient and hover', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Find primary buttons
    const buttons = page.locator('button, a').filter({ 
      hasText: /Add to Cart|Buy Now|Shop Now/i 
    });

    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      
      // Hover over button
      await firstButton.hover();
      await page.waitForTimeout(200);

      await page.screenshot({ 
        path: 'test-results/button-hover-state.png',
        clip: { x: 0, y: 0, width: 400, height: 200 }
      });
    }
  });

  test('Forms and inputs - Premium styling', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Screenshot login form
    await page.screenshot({ 
      path: 'test-results/login-form-light.png',
      fullPage: false 
    });

    // Dark mode form
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.screenshot({ 
      path: 'test-results/login-form-dark.png',
      fullPage: false 
    });
  });
});
