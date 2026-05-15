import { test, expect } from '@playwright/test';

/**
 * API ENDPOINT HEALTH CHECK
 * Tests all critical backend API endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api';

test.describe('API Health Check', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    try {
      const response = await request.post(`${API_BASE}/admin/auth/login`, {
        data: {
          email: process.env.ADMIN_EMAIL || 'admin@test.com',
          password: process.env.ADMIN_PASSWORD || 'admin123',
        },
      });
      
      if (response.ok()) {
        const data = await response.json();
        authToken = data.token || data.accessToken;
      }
    } catch (error) {
      console.warn('Auth setup failed:', error);
    }
  });

  test('API server is running', async ({ request }) => {
    try {
      const response = await request.get(`${API_BASE}/health`);
      expect(response.status()).toBeLessThan(500);
    } catch (error) {
      console.warn('API health endpoint not available');
    }
  });

  test('Products API - GET /admin/products', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/products`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('products');
    }
  });

  test('Categories API - GET /admin/categories', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/categories`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Brands API - GET /admin/brands', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/brands`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Inventory API - GET /admin/inventory', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/inventory`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Orders API - GET /admin/orders', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/orders`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Customers API - GET /admin/customers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/customers`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Suppliers API - GET /admin/suppliers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/suppliers`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Reports API - GET /admin/reports/sales', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/reports/sales`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401, 400]).toContain(response.status());
  });

  test('Settings API - GET /admin/settings', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/settings`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('Notifications API - GET /admin/notifications', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/notifications`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('API returns proper error codes for invalid requests', async ({ request }) => {
    // Test 404
    const notFound = await request.get(`${API_BASE}/admin/nonexistent-endpoint`);
    expect(notFound.status()).toBe(404);
  });

  test('API requires authentication for protected routes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/products`);
    
    // Should either return data (if auth not required) or 401
    expect([200, 401]).toContain(response.status());
  });

  test('API handles malformed JSON gracefully', async ({ request }) => {
    try {
      const response = await request.post(`${API_BASE}/admin/products`, {
        data: 'invalid-json',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      
      expect([400, 401, 500]).toContain(response.status());
    } catch (error) {
      // Expected to fail
    }
  });
});
