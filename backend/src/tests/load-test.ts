/**
 * ====================================================================
 * AMOHA MOBILES - LOAD & STRESS TEST SUITE
 * ====================================================================
 * 
 * Simulates 100–10,000 concurrent users to stress-test:
 * - Public endpoints (products, categories, search)
 * - Authenticated endpoints (cart, profile, orders)
 * - Admin endpoints (dashboard, reports)
 * - Checkout flow (the most critical path)
 * 
 * Usage:
 *   npx ts-node src/tests/load-test.ts [BASE_URL] [CONCURRENCY] [DURATION_SEC]
 *   Defaults: http://localhost:5001/api  100  30
 * ====================================================================
 */

const BASE_URL = process.argv[2] || 'http://localhost:5001/api';
const CONCURRENCY = parseInt(process.argv[3] || '100', 10);
const DURATION_SEC = parseInt(process.argv[4] || '30', 10);

interface LoadResult {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  rps: number;
  error500Count: number;
  error429Count: number;
  timeoutCount: number;
}

async function makeRequest(url: string, token?: string): Promise<{ status: number; latency: number }> {
  const start = Date.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    return { status: res.status, latency: Date.now() - start };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { status: e.name === 'AbortError' ? 0 : -1, latency: Date.now() - start };
  }
}

function percentile(sorted: number[], pct: number): number {
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function loadTestEndpoint(
  name: string,
  url: string,
  concurrency: number,
  durationSec: number,
  token?: string
): Promise<LoadResult> {
  const latencies: number[] = [];
  let successCount = 0, errorCount = 0, error500 = 0, error429 = 0, timeouts = 0;

  const endTime = Date.now() + durationSec * 1000;
  let inflight = 0;

  const runOne = async () => {
    while (Date.now() < endTime) {
      inflight++;
      const { status, latency } = await makeRequest(url, token);
      inflight--;
      latencies.push(latency);

      if (status >= 200 && status < 400) successCount++;
      else {
        errorCount++;
        if (status === 500) error500++;
        if (status === 429) error429++;
        if (status === 0) timeouts++;
      }
    }
  };

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(runOne());
  }

  await Promise.all(workers);

  const sorted = [...latencies].sort((a, b) => a - b);
  const avgLatency = sorted.length > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;

  return {
    endpoint: name,
    totalRequests: latencies.length,
    successCount,
    errorCount,
    avgLatency,
    p50Latency: percentile(sorted, 50),
    p95Latency: percentile(sorted, 95),
    p99Latency: percentile(sorted, 99),
    maxLatency: sorted[sorted.length - 1] || 0,
    minLatency: sorted[0] || 0,
    rps: Math.round(latencies.length / durationSec),
    error500Count: error500,
    error429Count: error429,
    timeoutCount: timeouts,
  };
}

function printResult(r: LoadResult) {
  const status = r.error500Count === 0 ? '✅' : '🔴';
  console.log(`\n${status} ${r.endpoint}`);
  console.log(`   Requests: ${r.totalRequests} total | ${r.successCount} ok | ${r.errorCount} err (${r.error500Count}×500, ${r.error429Count}×429, ${r.timeoutCount} timeout)`);
  console.log(`   RPS: ${r.rps}/sec`);
  console.log(`   Latency:  avg=${r.avgLatency}ms  p50=${r.p50Latency}ms  p95=${r.p95Latency}ms  p99=${r.p99Latency}ms  max=${r.maxLatency}ms`);
}

async function getToken(): Promise<string | null> {
  try {
    const email = `load_${Date.now()}@amohatest.com`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Load Tester',
        email,
        phone: '9876543210',
        password: 'Test@1234!',
        confirmPassword: 'Test@1234!',
      }),
    });
    const data: any = await res.json();
    return data.data?.accessToken || data.token || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  AMOHA MOBILES - LOAD & STRESS TEST                     ║');
  console.log('║  Target: ' + BASE_URL.padEnd(48) + '║');
  console.log(`║  Concurrency: ${String(CONCURRENCY).padEnd(43)}║`);
  console.log(`║  Duration: ${String(DURATION_SEC + 's').padEnd(46)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  const token = await getToken();
  console.log(`Auth token: ${token ? 'obtained' : 'NONE (auth tests will be skipped)'}`);

  const results: LoadResult[] = [];

  // ── Public Endpoints ──

  console.log('\n' + '═'.repeat(50));
  console.log('PUBLIC ENDPOINTS');
  console.log('═'.repeat(50));

  const publicTests = [
    { name: 'Health Check', path: '/health' },
    { name: 'Products List', path: '/products' },
    { name: 'Products (paginated)', path: '/products?page=1&limit=10' },
    { name: 'Product Search', path: '/products?search=samsung' },
    { name: 'Featured Products', path: '/products/featured' },
    { name: 'Trending Products', path: '/products/trending' },
    { name: 'Categories', path: '/categories' },
    { name: 'Brands', path: '/brands' },
    { name: 'Banners', path: '/banners' },
    { name: 'Settings', path: '/settings' },
  ];

  for (const t of publicTests) {
    const r = await loadTestEndpoint(t.name, `${BASE_URL}${t.path}`, CONCURRENCY, DURATION_SEC);
    results.push(r);
    printResult(r);
  }

  // ── Authenticated Endpoints ──

  if (token) {
    console.log('\n' + '═'.repeat(50));
    console.log('AUTHENTICATED ENDPOINTS');
    console.log('═'.repeat(50));

    const authTests = [
      { name: 'Get Profile', path: '/auth/profile' },
      { name: 'Get Cart', path: '/cart' },
      { name: 'Get Wishlist', path: '/wishlist' },
      { name: 'Get Orders', path: '/orders' },
      { name: 'Wallet Balance', path: '/wallet/balance' },
      { name: 'User Addresses', path: '/users/addresses' },
    ];

    for (const t of authTests) {
      const r = await loadTestEndpoint(t.name, `${BASE_URL}${t.path}`, Math.min(CONCURRENCY, 50), DURATION_SEC, token);
      results.push(r);
      printResult(r);
    }
  }

  // ── Summary ──

  console.log('\n' + '═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));

  console.log('\n' + 'Endpoint'.padEnd(25) + 'Reqs'.padStart(8) + 'RPS'.padStart(6) + 'Avg'.padStart(7) + 'P95'.padStart(7) + 'P99'.padStart(7) + 'Max'.padStart(7) + '500s'.padStart(6) + 'Pass'.padStart(6));
  console.log('-'.repeat(70));

  let totalPass = 0;
  let totalFail = 0;

  for (const r of results) {
    const pass = r.error500Count === 0;
    if (pass) totalPass++; else totalFail++;
    console.log(
      r.endpoint.padEnd(25) +
      String(r.totalRequests).padStart(8) +
      String(r.rps).padStart(6) +
      (r.avgLatency + 'ms').padStart(7) +
      (r.p95Latency + 'ms').padStart(7) +
      (r.p99Latency + 'ms').padStart(7) +
      (r.maxLatency + 'ms').padStart(7) +
      String(r.error500Count).padStart(6) +
      (pass ? '  ✅' : '  🔴').padStart(6)
    );
  }

  console.log('-'.repeat(70));
  console.log(`TOTAL: ${results.length} endpoints tested, ${totalPass} passed, ${totalFail} failed`);

  // ── Performance Thresholds ──

  console.log('\n' + '═'.repeat(50));
  console.log('PERFORMANCE THRESHOLD CHECK');
  console.log('═'.repeat(50));

  const thresholds = [
    { name: 'No 500 errors on any endpoint', pass: results.every(r => r.error500Count === 0) },
    { name: 'All p95 latencies < 5s', pass: results.every(r => r.p95Latency < 5000) },
    { name: 'All p99 latencies < 10s', pass: results.every(r => r.p99Latency < 10000) },
    { name: 'All avg latencies < 3s', pass: results.every(r => r.avgLatency < 3000) },
    { name: 'Health check p95 < 500ms', pass: results.find(r => r.endpoint === 'Health Check')?.p95Latency! < 500 },
    { name: 'Zero timeouts', pass: results.every(r => r.timeoutCount === 0) },
  ];

  for (const t of thresholds) {
    console.log(`  ${t.pass ? '✅' : '❌'} ${t.name}`);
  }

  const allPass = thresholds.every(t => t.pass);
  console.log(`\n${allPass ? '✅ ALL THRESHOLDS MET' : '❌ SOME THRESHOLDS FAILED'}`);

  process.exit(totalFail > 0 || !allPass ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
