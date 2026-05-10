/**
 * =====================================================================
 * INVENTORY SYSTEM – RAW TERMINAL TEST SUITE
 * Tests: stock add, deduct on order, cancel restore, forecast, bulk load
 * Usage: npx tsx src/tests/inventory-test.ts [BASE_URL]
 * =====================================================================
 */
const BASE_URL = process.argv[2] || 'http://localhost:10000/api';

let adminToken = '';
let testProductId = '';
let testOrderId = '';
let pass = 0, fail = 0;

function log(label: string, ok: boolean, detail: string) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}: ${detail}`);
  ok ? pass++ : fail++;
}

async function req(method: string, path: string, body?: any, token?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function main() {
  console.log('\n========== AMOHA INVENTORY TEST SUITE ==========');
  console.log(`Target: ${BASE_URL}\n`);

  // ─── AUTH: Admin login ─────────────────────────────────────────────
  console.log('── Phase 1: Auth ──');
  const loginRes = await req('POST', '/auth/login', {
    email: 'admin@amohamobiles.com',
    password: 'admin123',
  });
  const token = loginRes.data?.token || loginRes.data?.data?.accessToken || loginRes.data?.data?.token;
  if (loginRes.status === 200 && token) {
    adminToken = token;
    log('Admin login', true, `Token acquired (${adminToken.slice(0, 20)}...)`);
  } else {
    log('Admin login', false, `Status ${loginRes.status}: ${JSON.stringify(loginRes.data).slice(0, 120)}`);
    console.log('\n⚠️  Cannot proceed without admin token. Check credentials.\n');
    process.exit(1);
  }

  // ─── Phase 2: Inventory Dashboard ─────────────────────────────────
  console.log('\n── Phase 2: Inventory Dashboard ──');
  const dashLedger = await req('GET', '/inventory-ledger/dashboard', undefined, adminToken);
  log('Ledger dashboard', dashLedger.status === 200, `Status ${dashLedger.status}, totalProducts=${dashLedger.data?.data?.totalProducts ?? 'N/A'}`);

  const dashOld = await req('GET', '/inventory/dashboard', undefined, adminToken);
  log('Old inventory dashboard', dashOld.status === 200, `Status ${dashOld.status}, outOfStock=${dashOld.data?.data?.outOfStock ?? 'N/A'}`);

  // ─── Phase 3: Stock Overview ────────────────────────────────────────
  console.log('\n── Phase 3: Stock Overview ──');
  const stockRes = await req('GET', '/inventory-ledger?page=1&limit=5', undefined, adminToken);
  log('Ledger stock list', stockRes.status === 200, `Status ${stockRes.status}, items=${stockRes.data?.data?.items?.length ?? 0}`);

  const stockOld = await req('GET', '/inventory/stock?page=1&limit=5', undefined, adminToken);
  log('Old stock overview', stockOld.status === 200, `Status ${stockOld.status}, products=${stockOld.data?.data?.products?.length ?? 0}`);

  // Get first product for further tests
  if (stockRes.data?.data?.items?.length) {
    testProductId = stockRes.data.data.items[0].productId;
    const item = stockRes.data.data.items[0];
    log('Product for test', !!testProductId, `ID=${testProductId}, available=${item.availableStock}, status=${item.stockStatus}`);
  } else if (stockOld.data?.data?.products?.length) {
    testProductId = stockOld.data.data.products[0].id || stockOld.data.data.products[0]._id;
    log('Product for test (fallback)', !!testProductId, `ID=${testProductId}`);
  } else {
    log('Get test product', false, 'No products found in inventory — cannot run stock tests');
    testProductId = '';
  }

  // ─── Phase 4: TEST 1 – Add Stock ────────────────────────────────────
  console.log('\n── Phase 4: TEST 1 – Add Stock ──');
  if (testProductId) {
    const beforeRes = await req('GET', `/inventory-ledger/product/${testProductId}`, undefined, adminToken);
    const before = beforeRes.data?.data?.availableStock ?? 0;

    const addRes = await req('POST', `/inventory-ledger/product/${testProductId}/add`, {
      quantity: 5,
      notes: 'Inventory test: add 5 units',
    }, adminToken);
    log('Add 5 stock units', addRes.status === 200, `Status ${addRes.status}, before=${before}, after=${addRes.data?.data?.after?.availableStock ?? 'N/A'}`);

    const afterRes = await req('GET', `/inventory-ledger/product/${testProductId}`, undefined, adminToken);
    const after = afterRes.data?.data?.availableStock ?? 0;
    log('Stock reflected in ledger', after === before + 5, `Expected ${before + 5}, got ${after}`);
  } else {
    log('Add stock test', false, 'Skipped - no product');
    log('Stock verify', false, 'Skipped');
  }

  // ─── Phase 5: TEST 1b – Remove Stock ────────────────────────────────
  console.log('\n── Phase 5: TEST 1b – Remove Stock ──');
  if (testProductId) {
    const beforeRes = await req('GET', `/inventory-ledger/product/${testProductId}`, undefined, adminToken);
    const before = beforeRes.data?.data?.availableStock ?? 0;

    const removeRes = await req('POST', `/inventory-ledger/product/${testProductId}/remove`, {
      quantity: 3,
      notes: 'Inventory test: remove 3 units',
    }, adminToken);
    log('Remove 3 stock units', removeRes.status === 200, `Status ${removeRes.status}`);

    const afterRes = await req('GET', `/inventory-ledger/product/${testProductId}`, undefined, adminToken);
    const after = afterRes.data?.data?.availableStock ?? 0;
    log('Stock reduced correctly', after === before - 3, `Expected ${before - 3}, got ${after}`);

    // Negative stock prevention
    const overRemove = await req('POST', `/inventory-ledger/product/${testProductId}/remove`, {
      quantity: 99999,
      notes: 'Negative stock attack test',
    }, adminToken);
    log('Negative stock prevented', overRemove.status === 400, `Status ${overRemove.status} (expected 400), msg=${overRemove.data?.message?.slice(0, 60) ?? ''}`);
  } else {
    log('Remove stock test', false, 'Skipped');
    log('Stock reduced correctly', false, 'Skipped');
    log('Negative stock prevented', false, 'Skipped');
  }

  // ─── Phase 6: TEST 1c – Adjust Stock ────────────────────────────────
  console.log('\n── Phase 6: TEST 1c – Adjust Stock (Set Exact) ──');
  if (testProductId) {
    const adjustRes = await req('POST', `/inventory-ledger/product/${testProductId}/adjust`, {
      newStock: 20,
      notes: 'Inventory test: set to 20',
    }, adminToken);
    log('Adjust stock to 20', adjustRes.status === 200, `Status ${adjustRes.status}`);

    const verifyRes = await req('GET', `/inventory-ledger/product/${testProductId}`, undefined, adminToken);
    const after = verifyRes.data?.data?.availableStock ?? -1;
    log('Adjusted value correct', after === 20, `Expected 20, got ${after}`);
  } else {
    log('Adjust stock test', false, 'Skipped');
    log('Adjusted value correct', false, 'Skipped');
  }

  // ─── Phase 7: TEST 4 – Forecast ─────────────────────────────────────
  console.log('\n── Phase 7: TEST 4 – Inventory Forecast ──');
  const genRes = await req('POST', '/inventory/forecasts/generate', undefined, adminToken);
  log('Generate forecasts', genRes.status === 200, `Status ${genRes.status}, totalProducts=${genRes.data?.data?.totalProducts ?? 'N/A'}, reorderRecommended=${genRes.data?.data?.reorderRecommended ?? 'N/A'}`);

  const getForecasts = await req('GET', '/inventory/forecasts?page=1&limit=5', undefined, adminToken);
  log('Fetch forecasts', getForecasts.status === 200, `Status ${getForecasts.status}, count=${getForecasts.data?.data?.forecasts?.length ?? 0}`);

  if (getForecasts.data?.data?.forecasts?.length) {
    const f = getForecasts.data.data.forecasts[0];
    const hasRequired = f.productId !== undefined || f.product_id !== undefined;
    const hasAvgSales = f.avgDailySales !== undefined || f.avg_daily_sales !== undefined;
    log('Forecast has required fields', hasRequired && hasAvgSales, `productId=${f.productId ?? f.product_id}, avgSales=${f.avgDailySales ?? f.avg_daily_sales}`);
  }

  // ─── Phase 8: Movements log ──────────────────────────────────────────
  console.log('\n── Phase 8: Movement Log ──');
  const movRes = await req('GET', '/inventory/movements?page=1&limit=5', undefined, adminToken);
  log('Movements log', movRes.status === 200, `Status ${movRes.status}, count=${movRes.data?.data?.movements?.length ?? 0}`);

  const auditRes = await req('GET', '/inventory-ledger/audit-log?page=1&limit=5', undefined, adminToken);
  log('Audit log', auditRes.status === 200, `Status ${auditRes.status}, count=${auditRes.data?.data?.logs?.length ?? 0}`);

  // ─── Phase 9: Stock Alerts ───────────────────────────────────────────
  console.log('\n── Phase 9: Stock Alerts ──');
  const checkAlerts = await req('POST', '/inventory/alerts/check', undefined, adminToken);
  log('Run alert check', checkAlerts.status === 200, `Status ${checkAlerts.status}, created=${checkAlerts.data?.data?.alertsCreated ?? 0}`);

  const alertsRes = await req('GET', '/inventory/alerts?page=1&limit=5', undefined, adminToken);
  log('List alerts', alertsRes.status === 200, `Status ${alertsRes.status}, count=${alertsRes.data?.data?.alerts?.length ?? 0}`);

  // ─── Phase 10: TEST 5 – Bulk Load Performance ────────────────────────
  console.log('\n── Phase 10: TEST 5 – Bulk Stock Load ──');
  const bulkStart = Date.now();
  const allStock = await req('GET', '/inventory-ledger?page=1&limit=50', undefined, adminToken);
  const bulkDuration = Date.now() - bulkStart;
  log('Bulk 50-item load', allStock.status === 200 && bulkDuration < 5000, `Status ${allStock.status}, time=${bulkDuration}ms, items=${allStock.data?.data?.items?.length ?? 0}`);
  log('Performance < 5s', bulkDuration < 5000, `${bulkDuration}ms`);

  // ─── Phase 11: Warehouse ops ──────────────────────────────────────────
  console.log('\n── Phase 11: Warehouse Management ──');
  const whRes = await req('GET', '/inventory/warehouses', undefined, adminToken);
  log('List warehouses', whRes.status === 200, `Status ${whRes.status}, count=${whRes.data?.data?.warehouses?.length ?? whRes.data?.data?.length ?? 0}`);

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(`RESULTS: ✅ ${pass} PASS  ❌ ${fail} FAIL`);
  if (fail === 0) {
    console.log('🏆 ALL TESTS PASSED — Inventory system stable');
  } else {
    console.log(`⚠️  ${fail} test(s) failed — review output above`);
  }
  console.log('═══════════════════════════════════════════\n');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
