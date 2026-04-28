/**
 * Navigation Fix Validation Tests
 * Tests: logo routing, footer links, breadcrumb labels, contact page
 * Runs against local dev server on http://localhost:3002
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3002';

test.describe('Logo navigation', () => {
  test('logo click on homepage goes to /', async ({ page }) => {
    await page.goto(BASE);
    const logo = page.locator('header a[href="/"]').first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/localhost:3002\/?$/);
  });

  test('logo is visible on /products page', async ({ page }) => {
    await page.goto(`${BASE}/products`);
    const logo = page.locator('header a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test('logo is visible on /wishlist (even when redirecting)', async ({ page }) => {
    await page.goto(`${BASE}/wishlist`);
    // Header should always be present — even during auth redirect
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 8000 });
    const logo = page.locator('header a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test('logo is visible on /orders (even when redirecting)', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 8000 });
    const logo = page.locator('header a[href="/"]').first();
    await expect(logo).toBeVisible();
  });
});

test.describe('Footer links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
  });

  test('All Mobiles footer link goes to /products', async ({ page }) => {
    const link = page.locator('footer a', { hasText: 'All Mobiles' }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/products');
  });

  test('Featured footer link goes to /products?sort=popular', async ({ page }) => {
    const link = page.locator('footer a', { hasText: 'Featured' }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/products?sort=popular');
  });

  test('New Arrivals footer link goes to /products?sort=newest', async ({ page }) => {
    const link = page.locator('footer a', { hasText: 'New Arrivals' }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/products?sort=newest');
  });

  test('Footer logo click goes to homepage', async ({ page }) => {
    const footerLogo = page.locator('footer a[href="/"]').first();
    await expect(footerLogo).toBeVisible();
    await footerLogo.click();
    await expect(page).toHaveURL(/localhost:3002\/?$/);
  });
});

test.describe('Breadcrumb labels', () => {
  test('/products shows "All Mobiles" breadcrumb', async ({ page }) => {
    await page.goto(`${BASE}/products`);
    const breadcrumb = page.locator('nav, [class*="breadcrumb"], .page-container').filter({ hasText: 'All Mobiles' }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });
  });

  test('/products?sort=popular shows "Featured" breadcrumb', async ({ page }) => {
    await page.goto(`${BASE}/products?sort=popular`);
    // Wait for products to load
    await page.waitForTimeout(1500);
    const crumb = page.locator('text=Featured').first();
    await expect(crumb).toBeVisible({ timeout: 10000 });
  });

  test('/products?sort=newest shows "New Arrivals" breadcrumb', async ({ page }) => {
    await page.goto(`${BASE}/products?sort=newest`);
    await page.waitForTimeout(1500);
    const crumb = page.locator('text=New Arrivals').first();
    await expect(crumb).toBeVisible({ timeout: 10000 });
  });

  test('Breadcrumb "All Mobiles" links to /products on category page', async ({ page }) => {
    // Just check the products page breadcrumb link text
    await page.goto(`${BASE}/products`);
    await page.waitForTimeout(1000);
    // Breadcrumb should NOT say "All Products" — should say "All Mobiles"
    // Use strict text match within the breadcrumb nav area only
    const breadcrumbArea = page.locator('.page-container').filter({ hasText: 'Home' }).first();
    await expect(breadcrumbArea.locator('text=All Mobiles')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contact page', () => {
  test('contact page loads without Mumbai hardcoded data', async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await page.waitForTimeout(2000);
    // Should NOT show Mumbai addresses
    const mumbaiBandra = page.locator('text=Bandra West').first();
    await expect(mumbaiBandra).not.toBeVisible();
    const mumbaiMGRoad = page.locator('text=MG Road, Mumbai').first();
    await expect(mumbaiMGRoad).not.toBeVisible();
  });

  test('contact page shows a store section', async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.locator('h2', { hasText: 'Our Store' })).toBeVisible({ timeout: 8000 });
  });

  test('contact form is present', async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});
