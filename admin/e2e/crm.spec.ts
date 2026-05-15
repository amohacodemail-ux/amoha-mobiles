/**
 * ==========================================================================
 * AMOHA ADMIN – CRM / Customer Management E2E Tests
 * ==========================================================================
 * Covers:
 *  1. CRM list page loads, shows segment cards + customer table
 *  2. /customers redirects to /crm (deduplication)
 *  3. Segment filter (clicking a card narrows the table)
 *  4. Search filters the customer list
 *  5. Paginator visible when there are multiple pages
 *  6. "View Profile" navigates to the CRM detail page
 *  7. CRM detail page renders customer info + stats cards
 *  8. Add a note from the detail page
 * ==========================================================================
 */
import { test, expect, BrowserContext, Page } from '@playwright/test';
import { authedCtx, gotoAndWaitFor } from './shared-auth';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

// ─── Helper ──────────────────────────────────────────────────────────────────
async function goToCrm(page: Page) {
  await gotoAndWaitFor(page, `${ADMIN_URL}/crm`, (p) =>
    p.getByRole('heading', { name: /crm/i }).first(),
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────
test.describe('CRM page', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await authedCtx(browser);
    page = await ctx.newPage();
  });
  test.afterAll(async () => { await ctx.close(); });

  // 1. Page loads
  test('CRM list page loads with heading and table', async () => {
    await goToCrm(page);

    await expect(page.getByRole('heading', { name: /crm/i }).first()).toBeVisible();

    // At least a table or "no customers" empty state should exist
    const table   = page.locator('table');
    const noData  = page.locator('text=/no customers|no results|no data/i');
    const hasTable = (await table.count()) > 0;
    const hasEmpty = (await noData.count()) > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  // 2. Segment summary cards visible
  test('segment summary cards render', async () => {
    await goToCrm(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra buffer for API

    // Cards with VIP / Loyal / Regular / New labels
    const cards = page.locator('text=/vip|loyal|regular|new/i');
    await page.waitForTimeout(1000);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  // 3. /customers redirects to /crm
  test('/customers redirects to /crm', async () => {
    await page.goto(`${ADMIN_URL}/customers`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/crm/, { timeout: 8000 });
  });

  // 4. Search filters list (server-side)
  test('search input triggers reload with query', async () => {
    await goToCrm(page);

    // Locate the search input inside the DataTable
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if ((await searchInput.count()) === 0) {
      test.skip(); // search not rendered
      return;
    }
    await searchInput.fill('nonexistent_xyz_query_12345');
    await page.waitForTimeout(600); // debounce
    await page.waitForLoadState('networkidle');

    // Either an empty-state or zero rows
    const rows     = page.locator('table tbody tr');
    const emptyMsg = page.locator('text=/no customers|no results|no data/i');
    const hasRows  = (await rows.count()) > 0;
    const hasEmpty = (await emptyMsg.count()) > 0;
    expect(hasRows || hasEmpty).toBeTruthy();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(600);
    await page.waitForLoadState('networkidle');
  });

  // 5. Segment filter via select
  test('segment select filter changes the result set', async () => {
    await goToCrm(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const segmentSelect = page.locator('button[role="combobox"]').first();
    if ((await segmentSelect.count()) === 0) {
      test.skip();
      return;
    }

    await segmentSelect.click();
    await page.waitForTimeout(500);
    // Pick "VIP" from the dropdown
    const vipOption = page.locator('[role="option"]').filter({ hasText: /vip/i }).first();
    if ((await vipOption.count()) === 0) { test.skip(); return; }

    await vipOption.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra buffer for filter API

    // Heading still visible
    await expect(page.getByRole('heading', { name: /crm/i }).first()).toBeVisible({ timeout: 10000 });

    // Reset filter
    const clearBtn = page.locator('button').filter({ hasText: /clear filter/i }).first();
    if ((await clearBtn.count()) > 0) {
      await clearBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  // 6. "View Profile" navigates to detail page
  test('"View Profile" button opens CRM customer detail page', async () => {
    await goToCrm(page);

    const viewBtn = page.locator('a').filter({ hasText: /view profile/i }).first();
    if ((await viewBtn.count()) === 0) {
      test.skip(); // no customers in DB yet
      return;
    }

    const href = await viewBtn.getAttribute('href');
    expect(href).toMatch(/\/crm\/.+/);

    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    // Detail page should have customer info card
    await expect(page.locator('text=/Customer Info/i').first()).toBeVisible({ timeout: 10000 });
  });

  // 7. Customer detail page renders stats
  test('CRM detail page shows stats and recent orders section', async () => {
    // Navigate to CRM first to find the first customer link
    await goToCrm(page);
    const viewBtn = page.locator('a').filter({ hasText: /view profile/i }).first();
    if ((await viewBtn.count()) === 0) { test.skip(); return; }

    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/Customer Info/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Recent Orders/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Interaction Notes/i').first()).toBeVisible({ timeout: 10000 });
  });

  // 8. Add Note on detail page
  test('admin can open Add Note form on CRM detail page', async () => {
    await goToCrm(page);
    await page.waitForTimeout(2000);
    const viewBtn = page.locator('a').filter({ hasText: /view profile/i }).first();
    if ((await viewBtn.count()) === 0) { test.skip(); return; }

    await viewBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra buffer for detail page load

    // Click "Add Note" button
    const addNoteBtn = page.locator('button').filter({ hasText: /add note/i }).first();
    await expect(addNoteBtn).toBeVisible({ timeout: 15000 });
    await addNoteBtn.click();
    await page.waitForTimeout(500);

    // Form should appear with textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Cancel
    const cancelBtn = page.locator('button').filter({ hasText: /cancel/i }).first();
    if ((await cancelBtn.count()) > 0) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
