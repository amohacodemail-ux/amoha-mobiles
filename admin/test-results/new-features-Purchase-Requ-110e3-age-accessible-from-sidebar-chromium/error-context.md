# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new-features.spec.ts >> Purchase Requests >> Purchase Requests page accessible from sidebar
- Location: e2e\new-features.spec.ts:198:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/dashboard
Call log:
  - navigating to "http://localhost:3003/dashboard", waiting until "load"

```

# Test source

```ts
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
  122 |     await page.goto(`${ADMIN_URL}/dashboard`);
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
> 199 |     await page.goto(`${ADMIN_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/dashboard
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
  223 |     expect(resp.status).toBe(200);
  224 |     const json = await resp.json() as any;
  225 |     expect(json.success).toBe(true);
  226 |     expect(Array.isArray(json.data?.requests)).toBe(true);
  227 |   });
  228 | 
  229 |   let createdPrId: string | null = null;
  230 | 
  231 |   test('Create PR via API', async () => {
  232 |     const token = getToken();
  233 |     const body = {
  234 |       items: [{ name: `PW Test Item ${TS}`, quantity: 5 }],
  235 |       reason: `Playwright test purchase request ${TS}`,
  236 |       urgency: 'normal',
  237 |     };
  238 |     const resp = await fetchWithRetry(`${API_URL}/purchase-requests`, {
  239 |       method: 'POST',
  240 |       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  241 |       body: JSON.stringify(body),
  242 |     });
  243 |     expect(resp.status).toBe(201);
  244 |     const json = await resp.json() as any;
  245 |     expect(json.success).toBe(true);
  246 |     expect(json.data?.prNumber).toMatch(/^PR-/);
  247 |     createdPrId = json.data?._id || json.data?.id || null;
  248 |   });
  249 | 
  250 |   test('Approve PR via API', async () => {
  251 |     if (!createdPrId) { test.skip(); return; }
  252 |     const token = getToken();
  253 |     const resp = await fetchWithRetry(`${API_URL}/purchase-requests/${createdPrId}/approve`, {
  254 |       method: 'PATCH',
  255 |       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  256 |       body: JSON.stringify({ notes: 'Approved by Playwright test' }),
  257 |     });
  258 |     expect(resp.status).toBe(200);
  259 |     const json = await resp.json() as any;
  260 |     expect(json.data?.status).toBe('approved');
  261 |   });
  262 | });
  263 | 
  264 | // ─── Test: Frontend category filter ───────────────────────────────────────────
  265 | 
  266 | test.describe('API: Category filter in products', () => {
  267 |   test('GET /products?category=<slug> returns category-filtered results', async () => {
  268 |     // get a real slug
  269 |     const catResp = await fetchWithRetry(`${API_URL}/categories`);
  270 |     expect(catResp.status).toBe(200);
  271 |     const catJson = await catResp.json() as any;
  272 |     const categories = catJson.data?.categories || catJson.data || [];
  273 |     if (categories.length === 0) { test.skip(); return; }
  274 |     const slug = categories[0].slug;
  275 | 
  276 |     const prodResp = await fetchWithRetry(`${API_URL}/products?category=${slug}&limit=5`);
  277 |     expect(prodResp.status).toBe(200);
  278 |     const prodJson = await prodResp.json() as any;
  279 |     expect(prodJson.success).toBe(true);
  280 |     expect(Array.isArray(prodJson.data?.products)).toBe(true);
  281 |     // all returned products should belong to this category
  282 |     const products = prodJson.data.products as any[];
  283 |     for (const p of products) {
  284 |       expect(p.categorySlug === slug || p.category === slug || p.categoryId).toBeTruthy();
  285 |     }
  286 |   });
  287 | 
  288 |   test('GET /categories includes productCount', async () => {
  289 |     const resp = await fetchWithRetry(`${API_URL}/categories`);
  290 |     expect(resp.status).toBe(200);
  291 |     const json = await resp.json() as any;
  292 |     const categories = json.data?.categories || json.data || [];
  293 |     if (categories.length > 0) {
  294 |       expect(typeof categories[0].productCount).toBe('number');
  295 |     }
  296 |   });
  297 | });
  298 | 
```