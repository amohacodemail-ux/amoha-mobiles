/**
 * AMOHA Mobiles - Comprehensive API Smoke Test Suite
 * 
 * Usage: npx ts-node src/tests/api-smoke-test.ts [BASE_URL]
 * Default: http://localhost:5001/api
 * 
 * Tests all public + authenticated endpoints for:
 * - HTTP status codes
 * - Response structure
 * - Error handling
 * - Auth enforcement
 */

const BASE_URL = process.argv[2] || 'http://localhost:5001/api';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  duration: number;
}

const results: TestResult[] = [];
let authToken = '';
let refreshToken = '';

async function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any; duration: number }> {
  const start = Date.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, duration: Date.now() - start };
  } catch (error: any) {
    return { status: 0, data: { error: error.message }, duration: Date.now() - start };
  }
}

function test(name: string, status: 'PASS' | 'FAIL' | 'WARN', details: string, duration: number) {
  results.push({ name, status, details, duration });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name} (${duration}ms) - ${details}`);
}

// ============= TEST SUITES =============

async function testHealth() {
  console.log('\n━━━ HEALTH CHECK ━━━');
  const { status, duration } = await request('GET', '/../health');
  if (status === 200) test('Health Check', 'PASS', 'Server is running', duration);
  else if (status === 0) test('Health Check', 'FAIL', 'Server unreachable', duration);
  else test('Health Check', 'WARN', `Status: ${status}`, duration);
}

async function testPublicEndpoints() {
  console.log('\n━━━ PUBLIC ENDPOINTS ━━━');

  // Products
  const { status: s1, data: d1, duration: t1 } = await request('GET', '/products?page=1&limit=5');
  if (s1 === 200 && d1.success) test('GET /products', 'PASS', `${d1.data?.products?.length || 0} products`, t1);
  else test('GET /products', 'FAIL', `Status: ${s1}`, t1);

  const { status: s2, data: d2, duration: t2 } = await request('GET', '/products/featured');
  if (s2 === 200 && d2.success) test('GET /products/featured', 'PASS', `${d2.data?.length || 0} featured`, t2);
  else test('GET /products/featured', 'FAIL', `Status: ${s2}`, t2);

  const { status: s3, data: d3, duration: t3 } = await request('GET', '/products/trending');
  if (s3 === 200 && d3.success) test('GET /products/trending', 'PASS', `${d3.data?.length || 0} trending`, t3);
  else test('GET /products/trending', 'FAIL', `Status: ${s3}`, t3);

  const { status: s4, duration: t4 } = await request('GET', '/products/search/suggestions?q=samsung');
  test('GET /products/search/suggestions', s4 === 200 ? 'PASS' : 'FAIL', `Status: ${s4}`, t4);

  // Categories
  const { status: s5, data: d5, duration: t5 } = await request('GET', '/categories');
  if (s5 === 200 && d5.success) test('GET /categories', 'PASS', `${d5.data?.length || 0} categories`, t5);
  else test('GET /categories', 'FAIL', `Status: ${s5}`, t5);

  // Brands
  const { status: s6, duration: t6 } = await request('GET', '/brands');
  test('GET /brands', s6 === 200 ? 'PASS' : 'FAIL', `Status: ${s6}`, t6);

  // Banners
  const { status: s7, duration: t7 } = await request('GET', '/banners');
  test('GET /banners', s7 === 200 ? 'PASS' : 'FAIL', `Status: ${s7}`, t7);

  // Settings
  const { status: s8, duration: t8 } = await request('GET', '/settings');
  test('GET /settings', s8 === 200 ? 'PASS' : 'FAIL', `Status: ${s8}`, t8);
}

async function testAuthEndpoints() {
  console.log('\n━━━ AUTH ENDPOINTS ━━━');

  // Test registration with invalid data
  const { status: s1, duration: t1 } = await request('POST', '/auth/register', {});
  test('POST /auth/register (empty)', s1 === 400 ? 'PASS' : 'FAIL', `Expected 400, got ${s1}`, t1);

  // Test login with invalid credentials
  const { status: s2, duration: t2 } = await request('POST', '/auth/login', {
    email: 'nonexistent@test.com',
    password: 'wrongpassword123',
  });
  test('POST /auth/login (invalid)', s2 === 401 || s2 === 400 ? 'PASS' : 'FAIL', `Expected 401/400, got ${s2}`, t2);

  // Test refresh with invalid token
  const { status: s3, duration: t3 } = await request('POST', '/auth/refresh-token', { refreshToken: 'invalid' });
  test('POST /auth/refresh-token (invalid)', s3 === 401 || s3 === 400 ? 'PASS' : 'FAIL', `Expected 401/400, got ${s3}`, t3);

  // Test forgot-password with invalid email (should still return 200 to prevent enumeration)
  const { status: s4, duration: t4 } = await request('POST', '/auth/forgot-password', { email: 'nonexistent@test.com' });
  test('POST /auth/forgot-password', s4 === 200 ? 'PASS' : 'WARN', `Status: ${s4}`, t4);
}

async function testAuthProtection() {
  console.log('\n━━━ AUTH PROTECTION (Unauthenticated Access) ━━━');

  const protectedEndpoints = [
    { method: 'GET', path: '/auth/profile' },
    { method: 'GET', path: '/cart' },
    { method: 'GET', path: '/wishlist' },
    { method: 'GET', path: '/orders' },
    { method: 'GET', path: '/returns' },
    { method: 'GET', path: '/wallet/balance' },
    { method: 'POST', path: '/cart/add' },
    { method: 'POST', path: '/orders' },
    { method: 'POST', path: '/returns' },
  ];

  for (const ep of protectedEndpoints) {
    const { status, duration } = await request(ep.method, ep.path, ep.method === 'POST' ? {} : undefined);
    if (status === 401) {
      test(`${ep.method} ${ep.path} (no auth)`, 'PASS', 'Correctly rejected', duration);
    } else {
      test(`${ep.method} ${ep.path} (no auth)`, 'FAIL', `Expected 401, got ${status}`, duration);
    }
  }
}

async function testAdminProtection() {
  console.log('\n━━━ ADMIN PROTECTION (Unauthenticated Access) ━━━');

  const adminEndpoints = [
    { method: 'GET', path: '/admin/dashboard/stats' },
    { method: 'GET', path: '/admin/dashboard/revenue' },
    { method: 'GET', path: '/admin/pos/orders' },
    { method: 'GET', path: '/admin/pos/today-stats' },
    { method: 'GET', path: '/admin/users' },
  ];

  for (const ep of adminEndpoints) {
    const { status, duration } = await request(ep.method, ep.path);
    if (status === 401) {
      test(`${ep.method} ${ep.path} (no auth)`, 'PASS', 'Correctly rejected', duration);
    } else {
      test(`${ep.method} ${ep.path} (no auth)`, 'FAIL', `Expected 401, got ${status}`, duration);
    }
  }
}

async function testInputValidation() {
  console.log('\n━━━ INPUT VALIDATION ━━━');

  // XSS in search query
  const { status: s1, duration: t1 } = await request('GET', '/products/search/suggestions?q=<script>alert(1)</script>');
  test('XSS in search query', s1 === 200 ? 'PASS' : 'WARN', `Status: ${s1}`, t1);

  // SQL injection attempt (MongoDB injection)
  const { status: s2, duration: t2 } = await request('GET', '/products?search[$gt]=');
  test('NoSQL injection in search', s2 !== 500 ? 'PASS' : 'FAIL', `Status: ${s2}`, t2);

  // Oversized body
  const { status: s3, duration: t3 } = await request('POST', '/auth/login', { email: 'a'.repeat(50000), password: 'x' });
  test('Oversized email field', s3 === 400 || s3 === 413 ? 'PASS' : 'WARN', `Status: ${s3}`, t3);

  // Invalid product ID
  const { status: s4, duration: t4 } = await request('GET', '/products/nonexistent-slug-12345');
  test('GET /products/:slug (invalid)', s4 === 404 ? 'PASS' : 'WARN', `Status: ${s4}`, t4);
}

async function testRateLimiting() {
  console.log('\n━━━ RATE LIMITING ━━━');
  // Send 5 rapid requests to check rate limiter headers
  const promises = Array.from({ length: 5 }, () => request('GET', '/products?limit=1'));
  const responses = await Promise.all(promises);
  const allOk = responses.every(r => r.status === 200);
  test('Rapid fire requests (5x)', allOk ? 'PASS' : 'WARN', `All returned status 200: ${allOk}`, responses[0].duration);
}

async function testPerformance() {
  console.log('\n━━━ PERFORMANCE ━━━');

  const endpoints = [
    { name: 'Products List', path: '/products?page=1&limit=20' },
    { name: 'Featured Products', path: '/products/featured' },
    { name: 'Categories', path: '/categories' },
    { name: 'Banners', path: '/banners' },
    { name: 'Search Suggestions', path: '/products/search/suggestions?q=mobile' },
  ];

  for (const ep of endpoints) {
    const { status, duration } = await request('GET', ep.path);
    if (status !== 200) {
      test(`Performance: ${ep.name}`, 'FAIL', `Status: ${status}`, duration);
    } else if (duration > 2000) {
      test(`Performance: ${ep.name}`, 'FAIL', `SLOW: ${duration}ms (>2s)`, duration);
    } else if (duration > 1000) {
      test(`Performance: ${ep.name}`, 'WARN', `Moderate: ${duration}ms (>1s)`, duration);
    } else {
      test(`Performance: ${ep.name}`, 'PASS', `Fast: ${duration}ms`, duration);
    }
  }
}

// ============= MAIN =============

async function main() {
  console.log(`\n🧪 AMOHA Mobiles API Smoke Test Suite`);
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  await testHealth();
  await testPublicEndpoints();
  await testAuthEndpoints();
  await testAuthProtection();
  await testAdminProtection();
  await testInputValidation();
  await testRateLimiting();
  await testPerformance();

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`📊 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.name}: ${r.details}`);
    });
  }

  console.log(`\n🕐 Completed: ${new Date().toISOString()}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
