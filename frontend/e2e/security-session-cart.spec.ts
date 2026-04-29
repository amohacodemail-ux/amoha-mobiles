import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.amohamobiles.com';

function buildAuthCartInitScript() {
  const auth = {
    state: {
      user: { _id: 'sec-user-1', name: 'Security User', email: 'security@example.com', role: 'customer', phone: '9876543210' },
      token: 'mock-security-token',
      isAuthenticated: true,
    },
    version: 0,
  };

  const cart = {
    state: {
      items: [
        {
          _id: 'mock-item-1',
          product: {
            _id: 'mock-product-1',
            name: 'Mock Phone',
            slug: 'lava-a1-josh',
            brand: 'Mock',
            price: 9999,
            originalPrice: 10999,
            stock: 9,
            inStock: true,
            thumbnail: '/images/no-product.svg',
          },
          quantity: 1,
          price: 9999,
          totalPrice: 9999,
        },
      ],
      savedForLater: [],
      totalItems: 1,
      subtotal: 9999,
      discount: 0,
      deliveryCharge: 0,
      totalAmount: 9999,
      coupon: null,
    },
    version: 0,
  };

  const wishlist = {
    state: {
      items: [
        {
          _id: 'wish-1',
          product: {
            _id: 'mock-product-1',
            name: 'Mock Phone',
            slug: 'mock-phone',
            brand: 'Mock',
            price: 9999,
            originalPrice: 10999,
            stock: 9,
            inStock: true,
            thumbnail: '/images/no-product.svg',
          },
          addedAt: new Date().toISOString(),
        },
      ],
    },
    version: 2,
  };

  return `
    try {
      localStorage.setItem('amoha-auth', ${JSON.stringify(JSON.stringify(auth))});
      localStorage.setItem('amoha-cart', ${JSON.stringify(JSON.stringify(cart))});
      localStorage.setItem('amoha-wishlist', ${JSON.stringify(JSON.stringify(wishlist))});
    } catch (e) {}
  `;
}

function createMockCartResponse(quantity: number) {
  return {
    success: true,
    data: {
      _id: 'mock-cart-1',
      items: [
        {
          _id: 'mock-item-1',
          product: {
            _id: 'mock-product-1',
            name: 'Mock Phone',
            slug: 'lava-a1-josh',
            brand: 'Mock',
            price: 9999,
            originalPrice: 10999,
            stock: 9,
            inStock: true,
            thumbnail: '/images/no-product.svg',
          },
          quantity,
          price: 9999,
          totalPrice: 9999 * quantity,
        },
      ],
      savedForLater: [],
      totalItems: quantity,
      subtotal: 9999 * quantity,
      discount: 0,
      deliveryCharge: 0,
      totalAmount: 9999 * quantity,
      coupon: null,
    },
  };
}

test.describe('Security + Cart Race', () => {
  test('session security: back button after logout cannot show checkout', async ({ page }) => {
    await page.addInitScript(buildAuthCartInitScript());
    await page.context().addCookies([
      { name: 'token', value: 'mock-security-token', url: FRONTEND_URL },
      { name: 'refresh_token', value: 'mock-refresh-token', url: FRONTEND_URL },
    ]);

    await page.route(`${FRONTEND_URL}/api/auth/profile`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'sec-user-1', name: 'Security User', email: 'security@example.com' } }),
      });
    });

    await page.route(`${FRONTEND_URL}/api/cart`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockCartResponse(1)),
      });
    });

    await page.goto(`${FRONTEND_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/checkout/);

    // Simulate logout by clearing persisted auth + cookies, then move to login.
    await page.evaluate(() => {
      localStorage.removeItem('amoha-auth');
    });
    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });

    await page.goBack();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1:has-text("Checkout"), h2:has-text("Checkout")')).toHaveCount(0);
  });

  test('cart race: rapid add-to-cart clicks trigger one request only', async ({ page }) => {
    await page.addInitScript(buildAuthCartInitScript());
    await page.context().addCookies([
      { name: 'token', value: 'mock-security-token', url: FRONTEND_URL },
      { name: 'refresh_token', value: 'mock-refresh-token', url: FRONTEND_URL },
    ]);

    let addRequestCount = 0;

    await page.route(`${FRONTEND_URL}/api/auth/profile`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'sec-user-1', name: 'Security User', email: 'security@example.com' } }),
      });
    });

    await page.route(`${FRONTEND_URL}/api/cart/add`, async (route) => {
      addRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockCartResponse(2)),
      });
    });

    await page.route(`${FRONTEND_URL}/api/wishlist`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              _id: 'wish-1',
              product: {
                _id: 'mock-product-1',
                name: 'Mock Phone',
                slug: 'mock-phone',
                brand: 'Mock',
                price: 9999,
                originalPrice: 10999,
                stock: 9,
                inStock: true,
                thumbnail: '/images/no-product.svg',
              },
            },
          ],
        }),
      });
    });

    await page.route(`${FRONTEND_URL}/api/wishlist/*`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto(`${FRONTEND_URL}/wishlist`, { waitUntil: 'domcontentloaded' });

    const addButton = page.locator('button:has-text("Move to Cart")').first();
    await expect(addButton).toBeVisible();

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => /move to cart/i.test(b.textContent || '')) as HTMLButtonElement | undefined;
      if (!btn) return;
      for (let i = 0; i < 10; i += 1) btn.click();
    });

    await page.waitForTimeout(700);
    expect(addRequestCount).toBe(1);
  });
});
