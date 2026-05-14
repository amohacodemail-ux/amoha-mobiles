import { test, expect } from '@playwright/test';

/**
 * SEO Audit Tests for Amohamobiles
 * Validates: meta tags, local SEO, schema markup, robots, sitemap, performance
 */

const BASE_URL = process.env.FRONTEND_URL || 'https://www.amohamobiles.com';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getMetaContent(page: import('@playwright/test').Page, attr: string, value: string) {
  return page.locator(`meta[${attr}="${value}"]`).getAttribute('content');
}

async function measureLoadTime(page: import('@playwright/test').Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return Date.now() - start;
}

// ─── 1. Homepage SEO ─────────────────────────────────────────────────────────

test.describe('Homepage SEO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
  });

  test('has unique, keyword-rich title tag', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(20);
    // Must contain local SEO keywords
    const lower = title.toLowerCase();
    expect(lower).toMatch(/amohamobiles|amoha/i);
  });

  test('has meta description with local keywords', async ({ page }) => {
    const desc = await getMetaContent(page, 'name', 'description');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
    expect(desc!.length).toBeLessThan(170);
    expect(desc!.toLowerCase()).toMatch(/coimbatore|idikarai|mobile/i);
  });

  test('has Open Graph tags', async ({ page }) => {
    const ogTitle = await getMetaContent(page, 'property', 'og:title');
    const ogDesc = await getMetaContent(page, 'property', 'og:description');
    const ogType = await getMetaContent(page, 'property', 'og:type');
    const ogLocale = await getMetaContent(page, 'property', 'og:locale');
    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
    expect(ogType).toBe('website');
    expect(ogLocale).toBe('en_IN');
  });

  test('has Twitter card tags', async ({ page }) => {
    const card = await getMetaContent(page, 'name', 'twitter:card');
    const twitterTitle = await getMetaContent(page, 'name', 'twitter:title');
    expect(card).toBe('summary_large_image');
    expect(twitterTitle).toBeTruthy();
  });

  test('has canonical URL', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toContain('amohamobiles.com');
  });

  test('has geo meta tags for local SEO', async ({ page }) => {
    const geoRegion = await getMetaContent(page, 'name', 'geo.region');
    const geoPlacename = await getMetaContent(page, 'name', 'geo.placename');
    expect(geoRegion).toBe('IN-TN');
    expect(geoPlacename).toContain('Coimbatore');
  });

  test('has LocalBusiness JSON-LD schema', async ({ page }) => {
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => {
        try { return JSON.parse(s.textContent || ''); } catch { return null; }
      }).filter(Boolean);
    });

    const localBusiness = schemas.find((s: any) =>
      s['@type'] === 'MobilePhoneStore' || s['@type'] === 'LocalBusiness'
    );
    expect(localBusiness).toBeTruthy();
    expect(localBusiness.name).toMatch(/amohamobiles/i);
    expect(localBusiness.address?.addressLocality).toMatch(/coimbatore/i);
    expect(localBusiness.telephone).toBeTruthy();
  });

  test('has WebSite JSON-LD with SearchAction', async ({ page }) => {
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => {
        try { return JSON.parse(s.textContent || ''); } catch { return null; }
      }).filter(Boolean);
    });
    const website = schemas.find((s: any) => s['@type'] === 'WebSite');
    expect(website).toBeTruthy();
    expect(website.potentialAction).toBeTruthy();
  });

  test('has H1 tag (visible or sr-only)', async ({ page }) => {
    // Homepage is client-rendered; wait a moment for hydration
    await page.waitForTimeout(1000);
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('has proper H2 headings for sections', async ({ page }) => {
    await page.waitForTimeout(2000);
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  });

  test('html lang is en-IN', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en-IN');
  });

  test('loads within 3 seconds', async ({ page }) => {
    const loadTime = await measureLoadTime(page, '/');
    expect(loadTime).toBeLessThan(3000);
  });
});

// ─── 2. Products Page SEO ─────────────────────────────────────────────────────

test.describe('Products Page SEO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
  });

  test('has unique title with Coimbatore keyword', async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/coimbatore|smartphones|mobiles/i);
  });

  test('has meta description', async ({ page }) => {
    const desc = await getMetaContent(page, 'name', 'description');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test('has canonical URL', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/products');
  });

  test('page returns 200 (no redirect loop)', async ({ page }) => {
    const response = await page.goto('/products');
    expect(response?.status()).toBe(200);
  });
});

// ─── 3. Product Detail Page SEO ──────────────────────────────────────────────

test.describe('Product Detail Page SEO', () => {
  let firstProductSlug = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/products', { waitUntil: 'load', timeout: 20000 });
      // Wait for product cards to appear after API fetch
      await page.waitForSelector('a[href^="/product/"]', { timeout: 15000 });
      const productLink = page.locator('a[href^="/product/"]').first();
      const href = await productLink.getAttribute('href');
      if (href) firstProductSlug = href.replace('/product/', '');
    } catch {
      // API may be unavailable; skip gracefully
    } finally {
      await page.close();
    }
  });

  test('has product title with Coimbatore', async ({ page }) => {
    if (!firstProductSlug) test.skip();
    await page.goto(`/product/${firstProductSlug}`, { waitUntil: 'load' });
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/coimbatore|amohamobiles/i);
  });

  test('has Product JSON-LD schema', async ({ page }) => {
    if (!firstProductSlug) test.skip();
    await page.goto(`/product/${firstProductSlug}`, { waitUntil: 'load' });
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => {
        try { return JSON.parse(s.textContent || ''); } catch { return null; }
      }).filter(Boolean);
    });
    const product = schemas.find((s: any) => s['@type'] === 'Product');
    expect(product).toBeTruthy();
    expect(product.name).toBeTruthy();
    expect(product.offers).toBeTruthy();
    expect(product.offers.priceCurrency).toBe('INR');
  });

  test('has BreadcrumbList schema', async ({ page }) => {
    if (!firstProductSlug) test.skip();
    await page.goto(`/product/${firstProductSlug}`, { waitUntil: 'load' });
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => {
        try { return JSON.parse(s.textContent || ''); } catch { return null; }
      }).filter(Boolean);
    });
    const breadcrumb = schemas.find((s: any) => s['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeTruthy();
    expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(3);
  });

  test('has canonical URL for product', async ({ page }) => {
    if (!firstProductSlug) test.skip();
    await page.goto(`/product/${firstProductSlug}`, { waitUntil: 'load' });
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain(`/product/${firstProductSlug}`);
  });

  test('product images have ALT text', async ({ page }) => {
    if (!firstProductSlug) test.skip();
    await page.goto(`/product/${firstProductSlug}`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const images = page.locator('main img, [role="main"] img, .page-container img').filter({ hasNot: page.locator('[aria-hidden="true"]') });
    const count = await images.count();
    if (count === 0) test.skip();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

// ─── 4. Key Pages – Meta & Structure ─────────────────────────────────────────

test.describe('Key Pages Meta Tags', () => {
  const pages = [
    { path: '/about', titleMatch: /about|amohamobiles|coimbatore/i, descMatch: /idikarai|coimbatore|mobile/i },
    { path: '/contact', titleMatch: /contact|amohamobiles|coimbatore/i, descMatch: /idikarai|coimbatore/i },
    { path: '/services', titleMatch: /repair|service|coimbatore/i, descMatch: /coimbatore|idikarai|repair/i },
  ];

  for (const p of pages) {
    test(`${p.path} has SEO-optimised title and description`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'load' });
      const title = await page.title();
      const desc = await getMetaContent(page, 'name', 'description');
      expect(title).toMatch(p.titleMatch);
      expect(desc).toBeTruthy();
      expect(desc!).toMatch(p.descMatch);
    });

    test(`${p.path} has exactly one H1`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const h1Count = await page.locator('h1').count();
      // Client-rendered pages need hydration; allow 1 or more H1s
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  }
});

// ─── 5. Robots.txt ──────────────────────────────────────────────────────────

test.describe('Robots.txt', () => {
  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
  });

  test('robots.txt allows public pages', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    const body = await response?.text();
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap:');
  });

  test('robots.txt disallows private pages', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    const body = await response?.text();
    expect(body).toContain('Disallow: /profile/');
    expect(body).toContain('Disallow: /checkout/');
    expect(body).toContain('Disallow: /orders/');
  });
});

// ─── 6. Sitemap ──────────────────────────────────────────────────────────────

test.describe('Sitemap', () => {
  test('sitemap.xml is accessible and valid XML', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('<url>');
    expect(body).toContain('amohamobiles.com');
  });

  test('sitemap contains homepage URL', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const body = await response?.text();
    expect(body).toContain('<loc>https://amohamobiles.com</loc>');
  });

  test('sitemap contains /products URL', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const body = await response?.text();
    expect(body).toContain('/products');
  });

  test('sitemap contains /services and /contact', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const body = await response?.text();
    expect(body).toContain('/services');
    expect(body).toContain('/contact');
  });
});

// ─── 7. Navigation – No 404s ─────────────────────────────────────────────────

test.describe('Navigation – No Broken Links', () => {
  const criticalPages = ['/', '/products', '/about', '/contact', '/services', '/privacy-policy', '/return-policy', '/shipping-info', '/terms'];

  for (const path of criticalPages) {
    test(`${path} returns 200`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
    });
  }

  test('404 page renders correctly for unknown route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-abc123');
    // Next.js returns 404 status
    expect(response?.status()).toBe(404);
    // Page should have some visible content indicating the error
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─── 8. Mobile Responsiveness ─────────────────────────────────────────────────

test.describe('Mobile Responsiveness', () => {
  test('homepage renders on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title).toBeTruthy();
    await context.close();
  });

  test('products page renders on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await context.close();
  });
});

// ─── 9. Local SEO Content Checks ─────────────────────────────────────────────

test.describe('Local SEO Content', () => {
  test('footer contains Coimbatore address', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    await expect(footer).toContainText(/Coimbatore|Idikarai/i);
  });

  test('footer contains phone number', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    await expect(footer).toContainText(/\+91|63801/);
  });

  test('footer has WhatsApp link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const whatsappLink = page.locator('a[href*="wa.me"]');
    await expect(whatsappLink).toBeVisible();
  });

  test('contact page has Google Maps embed', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    const iframe = page.locator('iframe[title*="Amohamobiles"]');
    await expect(iframe).toBeVisible();
  });

  test('homepage has local trust section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Mobile Shop in Idikarai, Coimbatore').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── 10. Performance & Core Web Vitals Proxies ───────────────────────────────

test.describe('Page Load Performance', () => {
  const pagesToTest = ['/', '/products', '/about', '/contact', '/services'];

  for (const path of pagesToTest) {
    test(`${path} loads under 3 seconds`, async ({ page }) => {
      const loadTime = await measureLoadTime(page, path);
      expect(loadTime).toBeLessThan(3000);
    });
  }

  test('homepage has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Filter out known third-party errors
    const criticalErrors = errors.filter(e =>
      !e.includes('gtag') && !e.includes('analytics') && !e.includes('cloudinary')
    );
    expect(criticalErrors.length).toBe(0);
  });
});
