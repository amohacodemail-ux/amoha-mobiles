import { test, expect } from '@playwright/test';

/**
 * RBAC API Security Tests
 * Verifies that backend API endpoints properly enforce role-based access control
 */

const API_BASE = '/api';

test.describe('RBAC - API Security', () => {
  test.describe('Sales Role API Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'sales@amoha.com');
      await page.fill('input[type="password"]', 'sales123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('sales cannot access product creation API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Product', price: 100 }),
        });
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('sales cannot access supplier API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/suppliers');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('sales cannot access user management API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/users');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });
  });

  test.describe('Purchase Role API Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'purchase@amoha.com');
      await page.fill('input[type="password"]', 'purchase123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('purchase cannot access order status update API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/orders/123/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' }),
        });
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('purchase cannot access billing API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/billing');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('purchase cannot access coupon creation API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'TEST10', discount: 10 }),
        });
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });
  });

  test.describe('Marketing Role API Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'marketing@amoha.com');
      await page.fill('input[type="password"]', 'marketing123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('marketing cannot access orders API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/orders');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('marketing cannot access inventory API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/inventory');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });

    test('marketing cannot access user management API', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/admin/users');
        return { status: res.status, ok: res.ok };
      });
      expect(response.status).toBe(403);
    });
  });

  test.describe('Admin Role - Full API Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@amoha.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('admin can access all APIs', async ({ page }) => {
      const apis = [
        '/api/admin/orders',
        '/api/admin/products',
        '/api/admin/coupons',
        '/api/admin/users',
        '/api/inventory',
        '/api/suppliers',
      ];

      for (const api of apis) {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(url);
          return { status: res.status, ok: res.ok, url };
        }, api);

        // Should not be 403 (forbidden) - might be 200, 404 (not found), etc.
        expect(response.status).not.toBe(403);
      }
    });
  });
});
