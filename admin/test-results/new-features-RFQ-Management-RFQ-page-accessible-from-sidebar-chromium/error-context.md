# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new-features.spec.ts >> RFQ Management >> RFQ page accessible from sidebar
- Location: e2e\new-features.spec.ts:121:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/dashboard
Call log:
  - navigating to "http://localhost:3003/dashboard", waiting until "load"

```

# Test source

```ts
  22  | import { authedCtx, fetchWithRetry, getToken, gotoAndWaitFor } from './shared-auth';
  23  | 
  24  | const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
  25  | const API_URL   = process.env.API_URL   || 'http://localhost:10000/api';
  26  | const TS = Date.now();
  27  | 
  28  | // ─── Test: Category filter in products ────────────────────────────────────────
  29  | 
  30  | test.describe('Category filter in products', () => {
  31  |   test('admin can filter products by category', async ({ browser }) => {
  32  |     const ctx = await authedCtx(browser);
  33  |     const page = await ctx.newPage();
  34  |     await gotoAndWaitFor(page, `${ADMIN_URL}/products`, (p) => p.getByRole('heading', { name: /products/i }).first());
  35  |     await page.waitForLoadState('networkidle');
  36  |     await page.waitForTimeout(2000);
  37  | 
  38  |     // look for category filter select/combobox
  39  |     const categoryFilter = page.locator('select, [data-testid="category-filter"]').first();
  40  |     const count = await categoryFilter.count();
  41  |     if (count === 0) {
  42  |       test.skip(); // category filter not rendered on this page yet
  43  |       return;
  44  |     }
  45  |     // pick the first non-empty option
  46  |     const options = await categoryFilter.locator('option').allTextContents();
  47  |     const nonEmpty = options.find(o => o.trim() && o !== 'All Categories' && o !== 'All');
  48  |     if (!nonEmpty) {
  49  |       test.skip();
  50  |       return;
  51  |     }
  52  |     await categoryFilter.selectOption({ label: nonEmpty });
  53  |     await page.waitForTimeout(1000);
  54  |     await page.waitForLoadState('networkidle');
  55  |     await page.waitForTimeout(2000); // Extra buffer for filter API
  56  |     // products table or grid should render (or show "no products")
  57  |     const tableRows = page.locator('table tbody tr, [data-testid="product-row"]');
  58  |     const emptyMsg  = page.locator('text=No products found, text=No results');
  59  |     const hasRows   = (await tableRows.count()) > 0;
  60  |     const hasEmpty  = await emptyMsg.count() > 0;
  61  |     expect(hasRows || hasEmpty).toBeTruthy();
  62  |   });
  63  | });
  64  | 
  65  | // ─── Test: Reports page ───────────────────────────────────────────────────────
  66  | 
  67  | test.describe('Reports page', () => {
  68  |   let ctx: BrowserContext;
  69  |   let page: Page;
  70  | 
  71  |   test.beforeAll(async ({ browser }) => {
  72  |     ctx  = await authedCtx(browser);
  73  |     page = await ctx.newPage();
  74  |   });
  75  |   test.afterAll(async () => { await ctx.close(); });
  76  | 
  77  |   test('reports page loads and shows summary cards', async () => {
  78  |     await gotoAndWaitFor(page, `${ADMIN_URL}/reports`, (p) => p.getByRole('heading', { name: /reports/i }).first());
  79  |     // Reports may show different card labels depending on seed data.
  80  |     const hasRevenue = (await page.locator('text=Total Revenue').count()) > 0;
  81  |     const hasOrders = (await page.locator('text=Total Orders').count()) > 0;
  82  |     const hasHeading = (await page.getByRole('heading', { name: /reports/i }).count()) > 0;
  83  |     expect(hasRevenue || hasOrders || hasHeading).toBeTruthy();
  84  |   });
  85  | 
  86  |   test('reports sidebar link navigates to /reports', async () => {
  87  |     await page.goto(`${ADMIN_URL}/dashboard`);
  88  |     // Sidebar uses <button> elements (Next.js router.push), not <a href>
  89  |     const reportsBtn = page.locator('button:has-text("Reports")').first();
  90  |     await expect(reportsBtn).toBeVisible({ timeout: 10000 });
  91  |     await reportsBtn.click();
  92  |     await page.waitForURL(`${ADMIN_URL}/reports`, { timeout: 15000 });
  93  |     await expect(page).toHaveURL(/\/reports/);
  94  |   });
  95  | 
  96  |   test('reports period selector changes data', async () => {
  97  |     await gotoAndWaitFor(page, `${ADMIN_URL}/reports`, (p) => p.getByRole('heading', { name: /reports/i }).first());
  98  |     // click "This Week" if present
  99  |     const weekBtn = page.locator('button:has-text("This Week"), button:has-text("Week")');
  100 |     if ((await weekBtn.count()) > 0) {
  101 |       await weekBtn.first().click();
  102 |       await page.waitForLoadState('networkidle');
  103 |     }
  104 |     // Page shouldn't crash after period change.
  105 |     await expect(page.getByRole('heading', { name: /reports/i }).first()).toBeVisible({ timeout: 10000 });
  106 |   });
  107 | });
  108 | 
  109 | // ─── Test: RFQ ────────────────────────────────────────────────────────────────
  110 | 
  111 | test.describe('RFQ Management', () => {
  112 |   let ctx: BrowserContext;
  113 |   let page: Page;
  114 | 
  115 |   test.beforeAll(async ({ browser }) => {
  116 |     ctx  = await authedCtx(browser);
  117 |     page = await ctx.newPage();
  118 |   });
  119 |   test.afterAll(async () => { await ctx.close(); });
  120 | 
  121 |   test('RFQ page accessible from sidebar', async () => {
> 122 |     await page.goto(`${ADMIN_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/dashboard
  123 |     await page.waitForLoadState('networkidle');
  124 |     await page.waitForTimeout(2000);
  125 |     // Sidebar uses <button> elements, not <a href>
  126 |     const rfqBtn = page.locator('button:has-text("RFQ")').first();
  127 |     await expect(rfqBtn).toBeVisible({ timeout: 15000 });
  128 |     await rfqBtn.click();
  129 |     await page.waitForTimeout(1000);
  130 |     await page.waitForURL(`${ADMIN_URL}/rfq`, { timeout: 20000 });
  131 |     await expect(page).toHaveURL(/\/rfq/);
  132 |   });
  133 | 
  134 |   test('RFQ list page renders table', async () => {
  135 |     await gotoAndWaitFor(page, `${ADMIN_URL}/rfq`, (p) => p.getByRole('heading', { name: /rfq/i }).first());
  136 |     // table or empty state should be visible
  137 |     const table = page.locator('table');
  138 |     const emptyMsg = page.locator('text=No RFQs found, text=No requests found');
  139 |     const hasTable = (await table.count()) > 0;
  140 |     const hasEmpty = (await emptyMsg.count()) > 0;
  141 |     const hasHeading = (await page.getByRole('heading', { name: /rfq/i }).count()) > 0;
  142 |     expect(hasTable || hasEmpty || hasHeading).toBeTruthy();
  143 |   });
  144 | 
  145 |   test('RFQ API returns list', async () => {
  146 |     const token = getToken();
  147 |     const resp = await fetchWithRetry(`${API_URL}/rfq`, {
  148 |       headers: { Authorization: `Bearer ${token}` },
  149 |     });
  150 |     expect(resp.status).toBe(200);
  151 |     const json = await resp.json() as any;
  152 |     expect(json.success).toBe(true);
  153 |     expect(Array.isArray(json.data?.rfqs)).toBe(true);
  154 |   });
  155 | 
  156 |   test('Create RFQ via API', async () => {
  157 |     const token = getToken();
  158 |     // need a supplier ID; fetch existing suppliers
  159 |     const suppResp = await fetchWithRetry(`${API_URL}/suppliers?limit=1`, {
  160 |       headers: { Authorization: `Bearer ${token}` },
  161 |     });
  162 |     const suppJson = await suppResp.json() as any;
  163 |     const suppliers = suppJson.data?.suppliers || [];
  164 |     if (suppliers.length === 0) {
  165 |       test.skip();
  166 |       return;
  167 |     }
  168 |     const supplierId = suppliers[0]._id || suppliers[0].id;
  169 |     const body = {
  170 |       supplierId,
  171 |       items: [{ name: `Test Item ${TS}`, quantity: 10, unitPrice: 500 }],
  172 |       notes: `Playwright test RFQ ${TS}`,
  173 |     };
  174 |     const createResp = await fetchWithRetry(`${API_URL}/rfq`, {
  175 |       method: 'POST',
  176 |       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  177 |       body: JSON.stringify(body),
  178 |     });
  179 |     expect(createResp.status).toBe(201);
  180 |     const createJson = await createResp.json() as any;
  181 |     expect(createJson.success).toBe(true);
  182 |     expect(createJson.data?.rfqNumber).toMatch(/^RFQ-/);
  183 |   });
  184 | });
  185 | 
  186 | // ─── Test: Purchase Requests ──────────────────────────────────────────────────
  187 | 
  188 | test.describe('Purchase Requests', () => {
  189 |   let ctx: BrowserContext;
  190 |   let page: Page;
  191 | 
  192 |   test.beforeAll(async ({ browser }) => {
  193 |     ctx  = await authedCtx(browser);
  194 |     page = await ctx.newPage();
  195 |   });
  196 |   test.afterAll(async () => { await ctx.close(); });
  197 | 
  198 |   test('Purchase Requests page accessible from sidebar', async () => {
  199 |     await page.goto(`${ADMIN_URL}/dashboard`);
  200 |     // Sidebar uses <button> elements, not <a href>
  201 |     const prBtn = page.locator('button:has-text("Purchase Requests")').first();
  202 |     await expect(prBtn).toBeVisible({ timeout: 10000 });
  203 |     await prBtn.click();
  204 |     await page.waitForURL(`${ADMIN_URL}/purchase-requests`, { timeout: 15000 });
  205 |     await expect(page).toHaveURL(/\/purchase-requests/);
  206 |   });
  207 | 
  208 |   test('Purchase Requests list page renders', async () => {
  209 |     await gotoAndWaitFor(page, `${ADMIN_URL}/purchase-requests`, (p) => p.getByRole('heading', { name: /purchase requests/i }).first());
  210 |     const table = page.locator('table');
  211 |     const emptyMsg = page.locator('text=No purchase requests found');
  212 |     const hasTable = (await table.count()) > 0;
  213 |     const hasEmpty = (await emptyMsg.count()) > 0;
  214 |     const hasHeading = (await page.getByRole('heading', { name: /purchase requests/i }).count()) > 0;
  215 |     expect(hasTable || hasEmpty || hasHeading).toBeTruthy();
  216 |   });
  217 | 
  218 |   test('PR API returns list', async () => {
  219 |     const token = getToken();
  220 |     const resp = await fetchWithRetry(`${API_URL}/purchase-requests`, {
  221 |       headers: { Authorization: `Bearer ${token}` },
  222 |     });
```