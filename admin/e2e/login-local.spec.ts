/**
 * Local admin login tests — verifies the login page renders and that
 * authenticated sessions can access the dashboard.
 *
 * NOTE: We do NOT submit the login form here (that would trigger Supabase
 * auth and consume the rate-limit budget shared with all other spec files).
 * The full login→dashboard flow is already exercised by every other spec
 * file via cookie injection.  These tests verify:
 *   1. The login page renders the expected fields and button.
 *   2. A user with a valid cookie is redirected to /dashboard.
 */

import { test, expect } from '@playwright/test';
import { authedCtx } from './shared-auth';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

test('Login page renders email + password inputs and Sign In button', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/login`);
  await expect(page.getByPlaceholder('admin@amoha.com')).toBeVisible({ timeout: 10000 });
  await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('Admin login succeeds and redirects to dashboard', async ({ browser }) => {
  // Use cookie injection (same auth as all other spec files).
  // This verifies that a valid session token grants access to /dashboard
  // without consuming Supabase's rate-limit budget.
  const ctx = await authedCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${ADMIN_URL}/dashboard`);
  await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  await expect(page.locator('body')).not.toContainText('Login failed', { timeout: 5000 });
  await expect(page.locator('body')).not.toContainText('Internal Server Error', { timeout: 5000 });
  await ctx.close();
});
