/**
 * AMOHA Mobiles - V2 Admin Module Smoke Tests
 * Tests: Suppliers, Customer Management, Inventory
 *
 * Usage: npx ts-node src/tests/admin-modules-test.ts [BASE_URL]
 * Default: http://localhost:5001/api
 *
 * Requires an admin user to exist. Uses admin@amoha.com / admin123 by default.
 */

const BASE_URL = process.argv[2] || 'http://localhost:5001/api';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details: string;
  duration: number;
}

const results: TestResult[] = [];
let token = '';

async function request(method: string, path: string, body?: any): Promise<{ status: number; data: any; duration: number }> {
  const start = Date.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, duration: Date.now() - start };
  } catch (error: any) {
    return { status: 0, data: { error: error.message }, duration: Date.now() - start };
  }
}

function test(name: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string, duration: number) {
  results.push({ name, status, details, duration });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name} (${duration}ms) - ${details}`);
}

async function login() {
  console.log('\n━━━ AUTH ━━━');
  const { status, data, duration } = await request('POST', '/auth/login', { email: 'admin@amoha.com', password: 'admin123' });
  if (status === 200 && data.data?.accessToken) {
    token = data.data.accessToken;
    test('Admin Login', 'PASS', 'Token obtained', duration);
  } else {
    test('Admin Login', 'FAIL', `Status: ${status} - ${data.message || 'No token'}`, duration);
    console.log('\nCannot proceed without admin token. Exiting.');
    process.exit(1);
  }
}

// ========== SUPPLIER TESTS ==========

async function testSuppliers() {
  console.log('\n━━━ SUPPLIERS ━━━');
  let supplierId = '';

  // Auth enforcement
  const noAuth = await fetch(`${BASE_URL}/suppliers`, { headers: { 'Content-Type': 'application/json' } });
  test('Suppliers - Auth Required', noAuth.status === 401 ? 'PASS' : 'FAIL', `Status: ${noAuth.status}`, 0);

  // Create supplier
  const { status: s1, data: d1, duration: t1 } = await request('POST', '/suppliers', {
    name: 'Test Supplier',
    email: 'test-supplier@test.com',
    phone: '9000000001',
    company: 'Test Corp',
    paymentTerms: 'net_30',
    leadTimeDays: 7,
  });
  if (s1 === 201 && d1.data?.id) {
    supplierId = d1.data.id;
    test('Create Supplier', 'PASS', `ID: ${supplierId}`, t1);
  } else {
    test('Create Supplier', 'FAIL', `Status: ${s1} - ${d1.message || ''}`, t1);
  }

  // List suppliers
  const { status: s2, data: d2, duration: t2 } = await request('GET', '/suppliers?page=1&limit=5');
  if (s2 === 200 && d2.data?.suppliers) {
    test('List Suppliers', 'PASS', `${d2.data.suppliers.length} suppliers`, t2);
    if (!supplierId && d2.data.suppliers.length) supplierId = d2.data.suppliers[0].id;
  } else {
    test('List Suppliers', 'FAIL', `Status: ${s2}`, t2);
  }

  if (!supplierId) { test('Supplier CRUD', 'SKIP', 'No supplier ID to test', 0); return; }

  // Get by ID
  const { status: s3, data: d3, duration: t3 } = await request('GET', `/suppliers/${supplierId}`);
  test('Get Supplier', s3 === 200 && d3.data ? 'PASS' : 'FAIL', `Status: ${s3}`, t3);

  // Update supplier
  const { status: s4, duration: t4 } = await request('PUT', `/suppliers/${supplierId}`, { name: 'Test Supplier Updated', rating: 4.5 });
  test('Update Supplier', s4 === 200 ? 'PASS' : 'FAIL', `Status: ${s4}`, t4);

  // Analytics
  const { status: s5, duration: t5 } = await request('GET', `/suppliers/${supplierId}/analytics`);
  test('Supplier Analytics', s5 === 200 ? 'PASS' : 'FAIL', `Status: ${s5}`, t5);

  // Dashboard stats
  const { status: s6, data: d6, duration: t6 } = await request('GET', '/suppliers/dashboard/stats');
  test('Supplier Dashboard', s6 === 200 && d6.data ? 'PASS' : 'FAIL', `Status: ${s6}`, t6);

  // Purchase orders
  const { status: s7, duration: t7 } = await request('GET', '/suppliers/purchase-orders/list?page=1&limit=5');
  test('List Purchase Orders', s7 === 200 ? 'PASS' : 'FAIL', `Status: ${s7}`, t7);

  // Validation - empty name
  const { status: s8, duration: t8 } = await request('POST', '/suppliers', { email: 'bad@test.com' });
  test('Validation - Missing Name', s8 === 400 ? 'PASS' : 'FAIL', `Status: ${s8}`, t8);

  // Delete supplier
  const { status: s9, duration: t9 } = await request('DELETE', `/suppliers/${supplierId}`);
  test('Delete Supplier', s9 === 200 ? 'PASS' : 'FAIL', `Status: ${s9}`, t9);

  // 404
  const { status: s10, duration: t10 } = await request('GET', '/suppliers/00000000-0000-0000-0000-000000000000');
  test('Supplier 404', s10 === 404 ? 'PASS' : 'FAIL', `Status: ${s10}`, t10);
}

// ========== CUSTOMER MANAGEMENT TESTS ==========

async function testCustomerManagement() {
  console.log('\n━━━ CUSTOMER MANAGEMENT ━━━');

  // List customers
  const { status: s1, data: d1, duration: t1 } = await request('GET', '/customer-management?page=1&limit=5');
  if (s1 === 200 && d1.data?.customers) {
    test('List Customers', 'PASS', `${d1.data.customers.length} customers`, t1);
  } else {
    test('List Customers', 'FAIL', `Status: ${s1}`, t1);
  }

  // Get a customer ID for further tests
  let userId = d1?.data?.customers?.[0]?.id || d1?.data?.customers?.[0]?._id;

  // Dashboard stats
  const { status: s2, data: d2, duration: t2 } = await request('GET', '/customer-management/dashboard/stats');
  test('Customer Dashboard Stats', s2 === 200 && d2.data ? 'PASS' : 'FAIL', `Status: ${s2}`, t2);

  if (!userId) { test('Customer Detail Tests', 'SKIP', 'No customer found', 0); return; }

  // Get detail
  const { status: s3, duration: t3 } = await request('GET', `/customer-management/${userId}`);
  test('Get Customer Detail', s3 === 200 ? 'PASS' : 'FAIL', `Status: ${s3}`, t3);

  // Add note
  const { status: s4, duration: t4 } = await request('POST', `/customer-management/${userId}/notes`, { note: 'Test note from smoke test', type: 'note' });
  test('Add Customer Note', s4 === 201 ? 'PASS' : 'FAIL', `Status: ${s4}`, t4);

  // Add tag
  const { status: s5, duration: t5 } = await request('POST', `/customer-management/${userId}/tags`, { tag: 'smoke-test-tag' });
  test('Add Customer Tag', s5 === 201 ? 'PASS' : 'FAIL', `Status: ${s5}`, t5);

  // Update segment
  const { status: s6, duration: t6 } = await request('PATCH', `/customer-management/${userId}/segment`, { segment: 'regular' });
  test('Update Segment', s6 === 200 ? 'PASS' : 'FAIL', `Status: ${s6}`, t6);

  // Auto-segment
  const { status: s7, duration: t7 } = await request('POST', '/customer-management/auto-segment');
  test('Auto-Segment', s7 === 200 ? 'PASS' : 'FAIL', `Status: ${s7}`, t7);

  // Fraud detection
  const { status: s8, duration: t8 } = await request('POST', '/customer-management/fraud-detection/run');
  test('Fraud Detection', s8 === 200 ? 'PASS' : 'FAIL', `Status: ${s8}`, t8);

  // Get fraud flags
  const { status: s9, duration: t9 } = await request('GET', '/customer-management/fraud-flags?page=1&limit=5');
  test('List Fraud Flags', s9 === 200 ? 'PASS' : 'FAIL', `Status: ${s9}`, t9);

  // Behavior analytics
  const { status: s10, duration: t10 } = await request('GET', `/customer-management/${userId}/analytics`);
  test('Behavior Analytics', s10 === 200 ? 'PASS' : 'FAIL', `Status: ${s10}`, t10);

  // Validation
  const { status: s11, duration: t11 } = await request('POST', `/customer-management/${userId}/notes`, {});
  test('Validation - Missing Note', s11 === 400 ? 'PASS' : 'FAIL', `Status: ${s11}`, t11);
}

// ========== INVENTORY TESTS ==========

async function testInventory() {
  console.log('\n━━━ INVENTORY ━━━');
  let warehouseId = '';

  // Create warehouse
  const { status: s1, data: d1, duration: t1 } = await request('POST', '/inventory/warehouses', {
    name: 'Test Warehouse',
    location: 'Test City',
    address: '123 Test St',
  });
  if (s1 === 201 && d1.data?.id) {
    warehouseId = d1.data.id;
    test('Create Warehouse', 'PASS', `ID: ${warehouseId}`, t1);
  } else {
    test('Create Warehouse', 'FAIL', `Status: ${s1} - ${d1.message || ''}`, t1);
  }

  // List warehouses
  const { status: s2, data: d2, duration: t2 } = await request('GET', '/inventory/warehouses');
  if (s2 === 200 && Array.isArray(d2.data)) {
    test('List Warehouses', 'PASS', `${d2.data.length} warehouses`, t2);
    if (!warehouseId && d2.data.length) warehouseId = d2.data[0].id;
  } else {
    test('List Warehouses', 'FAIL', `Status: ${s2}`, t2);
  }

  // Stock overview
  const { status: s3, data: d3, duration: t3 } = await request('GET', '/inventory/stock?page=1&limit=5');
  if (s3 === 200 && d3.data) {
    test('Stock Overview', 'PASS', `${d3.data.products?.length || 0} products`, t3);

    // Update stock if we have products
    const product = d3.data.products?.[0];
    if (product) {
      const { status: s4, duration: t4 } = await request('PUT', `/inventory/stock/${product.id || product._id}`, {
        quantity: 5,
        type: 'add',
        reason: 'Smoke test stock addition',
        warehouseId: warehouseId || undefined,
      });
      test('Update Stock', s4 === 200 ? 'PASS' : 'FAIL', `Status: ${s4}`, t4);
    }
  } else {
    test('Stock Overview', 'FAIL', `Status: ${s3}`, t3);
  }

  // Movement log
  const { status: s5, duration: t5 } = await request('GET', '/inventory/movements?page=1&limit=5');
  test('Movement Log', s5 === 200 ? 'PASS' : 'FAIL', `Status: ${s5}`, t5);

  // Alerts
  const { status: s6, duration: t6 } = await request('GET', '/inventory/alerts?page=1&limit=5');
  test('List Alerts', s6 === 200 ? 'PASS' : 'FAIL', `Status: ${s6}`, t6);

  // Dashboard stats
  const { status: s7, data: d7, duration: t7 } = await request('GET', '/inventory/dashboard/stats');
  test('Inventory Dashboard', s7 === 200 && d7.data ? 'PASS' : 'FAIL', `Status: ${s7}`, t7);

  // Forecasts
  const { status: s8, duration: t8 } = await request('POST', '/inventory/forecasts/generate');
  test('Generate Forecasts', s8 === 200 ? 'PASS' : 'FAIL', `Status: ${s8}`, t8);

  const { status: s9, duration: t9 } = await request('GET', '/inventory/forecasts');
  test('List Forecasts', s9 === 200 ? 'PASS' : 'FAIL', `Status: ${s9}`, t9);

  // Validation - missing name
  const { status: s10, duration: t10 } = await request('POST', '/inventory/warehouses', { location: 'NoName' });
  test('Validation - Missing Warehouse Name', s10 === 400 ? 'PASS' : 'FAIL', `Status: ${s10}`, t10);

  // Update warehouse
  if (warehouseId) {
    const { status: s11, duration: t11 } = await request('PUT', `/inventory/warehouses/${warehouseId}`, { name: 'Updated Test Warehouse' });
    test('Update Warehouse', s11 === 200 ? 'PASS' : 'FAIL', `Status: ${s11}`, t11);

    // Delete warehouse
    const { status: s12, duration: t12 } = await request('DELETE', `/inventory/warehouses/${warehouseId}`);
    test('Delete Warehouse', s12 === 200 ? 'PASS' : 'FAIL', `Status: ${s12}`, t12);
  }
}

// ========== MAIN ==========

async function main() {
  console.log('='.repeat(60));
  console.log('  AMOHA Mobiles - V2 Admin Module Smoke Tests');
  console.log(`  Target: ${BASE_URL}`);
  console.log('='.repeat(60));

  await login();
  await testSuppliers();
  await testCustomerManagement();
  await testInventory();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTS SUMMARY');
  console.log('='.repeat(60));
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const skip = results.filter(r => r.status === 'SKIP').length;
  console.log(`  PASS: ${pass}  |  FAIL: ${fail}  |  SKIP: ${skip}  |  TOTAL: ${results.length}`);
  console.log('='.repeat(60));

  if (fail > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.name}: ${r.details}`));
  }

  process.exit(fail > 0 ? 1 : 0);
}

main();
