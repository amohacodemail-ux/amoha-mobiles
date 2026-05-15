# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crm.spec.ts >> CRM page >> /customers redirects to /crm
- Location: e2e\crm.spec.ts:66:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/customers
Call log:
  - navigating to "http://localhost:3003/customers", waiting until "networkidle"

```

# Test source

```ts
  1   | /**
  2   |  * ==========================================================================
  3   |  * AMOHA ADMIN – CRM / Customer Management E2E Tests
  4   |  * ==========================================================================
  5   |  * Covers:
  6   |  *  1. CRM list page loads, shows segment cards + customer table
  7   |  *  2. /customers redirects to /crm (deduplication)
  8   |  *  3. Segment filter (clicking a card narrows the table)
  9   |  *  4. Search filters the customer list
  10  |  *  5. Paginator visible when there are multiple pages
  11  |  *  6. "View Profile" navigates to the CRM detail page
  12  |  *  7. CRM detail page renders customer info + stats cards
  13  |  *  8. Add a note from the detail page
  14  |  * ==========================================================================
  15  |  */
  16  | import { test, expect, BrowserContext, Page } from '@playwright/test';
  17  | import { authedCtx, gotoAndWaitFor } from './shared-auth';
  18  | 
  19  | const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
  20  | 
  21  | // ─── Helper ──────────────────────────────────────────────────────────────────
  22  | async function goToCrm(page: Page) {
  23  |   await gotoAndWaitFor(page, `${ADMIN_URL}/crm`, (p) =>
  24  |     p.getByRole('heading', { name: /crm/i }).first(),
  25  |   );
  26  | }
  27  | 
  28  | // ─── Suite ───────────────────────────────────────────────────────────────────
  29  | test.describe('CRM page', () => {
  30  |   let ctx: BrowserContext;
  31  |   let page: Page;
  32  | 
  33  |   test.beforeAll(async ({ browser }) => {
  34  |     ctx  = await authedCtx(browser);
  35  |     page = await ctx.newPage();
  36  |   });
  37  |   test.afterAll(async () => { await ctx.close(); });
  38  | 
  39  |   // 1. Page loads
  40  |   test('CRM list page loads with heading and table', async () => {
  41  |     await goToCrm(page);
  42  | 
  43  |     await expect(page.getByRole('heading', { name: /crm/i }).first()).toBeVisible();
  44  | 
  45  |     // At least a table or "no customers" empty state should exist
  46  |     const table   = page.locator('table');
  47  |     const noData  = page.locator('text=/no customers|no results|no data/i');
  48  |     const hasTable = (await table.count()) > 0;
  49  |     const hasEmpty = (await noData.count()) > 0;
  50  |     expect(hasTable || hasEmpty).toBeTruthy();
  51  |   });
  52  | 
  53  |   // 2. Segment summary cards visible
  54  |   test('segment summary cards render', async () => {
  55  |     await goToCrm(page);
  56  |     await page.waitForLoadState('networkidle');
  57  |     await page.waitForTimeout(2000); // Extra buffer for API
  58  | 
  59  |     // Cards with VIP / Loyal / Regular / New labels
  60  |     const cards = page.locator('text=/vip|loyal|regular|new/i');
  61  |     await page.waitForTimeout(1000);
  62  |     expect(await cards.count()).toBeGreaterThan(0);
  63  |   });
  64  | 
  65  |   // 3. /customers redirects to /crm
  66  |   test('/customers redirects to /crm', async () => {
> 67  |     await page.goto(`${ADMIN_URL}/customers`, { waitUntil: 'networkidle' });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/customers
  68  |     await expect(page).toHaveURL(/\/crm/, { timeout: 8000 });
  69  |   });
  70  | 
  71  |   // 4. Search filters list (server-side)
  72  |   test('search input triggers reload with query', async () => {
  73  |     await goToCrm(page);
  74  | 
  75  |     // Locate the search input inside the DataTable
  76  |     const searchInput = page.locator('input[placeholder*="Search"]').first();
  77  |     if ((await searchInput.count()) === 0) {
  78  |       test.skip(); // search not rendered
  79  |       return;
  80  |     }
  81  |     await searchInput.fill('nonexistent_xyz_query_12345');
  82  |     await page.waitForTimeout(600); // debounce
  83  |     await page.waitForLoadState('networkidle');
  84  | 
  85  |     // Either an empty-state or zero rows
  86  |     const rows     = page.locator('table tbody tr');
  87  |     const emptyMsg = page.locator('text=/no customers|no results|no data/i');
  88  |     const hasRows  = (await rows.count()) > 0;
  89  |     const hasEmpty = (await emptyMsg.count()) > 0;
  90  |     expect(hasRows || hasEmpty).toBeTruthy();
  91  | 
  92  |     // Clear search
  93  |     await searchInput.fill('');
  94  |     await page.waitForTimeout(600);
  95  |     await page.waitForLoadState('networkidle');
  96  |   });
  97  | 
  98  |   // 5. Segment filter via select
  99  |   test('segment select filter changes the result set', async () => {
  100 |     await goToCrm(page);
  101 |     await page.waitForLoadState('networkidle');
  102 |     await page.waitForTimeout(2000);
  103 | 
  104 |     const segmentSelect = page.locator('button[role="combobox"]').first();
  105 |     if ((await segmentSelect.count()) === 0) {
  106 |       test.skip();
  107 |       return;
  108 |     }
  109 | 
  110 |     await segmentSelect.click();
  111 |     await page.waitForTimeout(500);
  112 |     // Pick "VIP" from the dropdown
  113 |     const vipOption = page.locator('[role="option"]').filter({ hasText: /vip/i }).first();
  114 |     if ((await vipOption.count()) === 0) { test.skip(); return; }
  115 | 
  116 |     await vipOption.click();
  117 |     await page.waitForTimeout(1000);
  118 |     await page.waitForLoadState('networkidle');
  119 |     await page.waitForTimeout(2000); // Extra buffer for filter API
  120 | 
  121 |     // Heading still visible
  122 |     await expect(page.getByRole('heading', { name: /crm/i }).first()).toBeVisible({ timeout: 10000 });
  123 | 
  124 |     // Reset filter
  125 |     const clearBtn = page.locator('button').filter({ hasText: /clear filter/i }).first();
  126 |     if ((await clearBtn.count()) > 0) {
  127 |       await clearBtn.click();
  128 |       await page.waitForTimeout(1000);
  129 |     }
  130 |   });
  131 | 
  132 |   // 6. "View Profile" navigates to detail page
  133 |   test('"View Profile" button opens CRM customer detail page', async () => {
  134 |     await goToCrm(page);
  135 | 
  136 |     const viewBtn = page.locator('a').filter({ hasText: /view profile/i }).first();
  137 |     if ((await viewBtn.count()) === 0) {
  138 |       test.skip(); // no customers in DB yet
  139 |       return;
  140 |     }
  141 | 
  142 |     const href = await viewBtn.getAttribute('href');
  143 |     expect(href).toMatch(/\/crm\/.+/);
  144 | 
  145 |     await viewBtn.click();
  146 |     await page.waitForLoadState('networkidle');
  147 | 
  148 |     // Detail page should have customer info card
  149 |     await expect(page.locator('text=/Customer Info/i').first()).toBeVisible({ timeout: 10000 });
  150 |   });
  151 | 
  152 |   // 7. Customer detail page renders stats
  153 |   test('CRM detail page shows stats and recent orders section', async () => {
  154 |     // Navigate to CRM first to find the first customer link
  155 |     await goToCrm(page);
  156 |     const viewBtn = page.locator('a').filter({ hasText: /view profile/i }).first();
  157 |     if ((await viewBtn.count()) === 0) { test.skip(); return; }
  158 | 
  159 |     await viewBtn.click();
  160 |     await page.waitForLoadState('networkidle');
  161 | 
  162 |     await expect(page.locator('text=/Customer Info/i').first()).toBeVisible({ timeout: 10000 });
  163 |     await expect(page.locator('text=/Recent Orders/i').first()).toBeVisible({ timeout: 10000 });
  164 |     await expect(page.locator('text=/Interaction Notes/i').first()).toBeVisible({ timeout: 10000 });
  165 |   });
  166 | 
  167 |   // 8. Add Note on detail page
```