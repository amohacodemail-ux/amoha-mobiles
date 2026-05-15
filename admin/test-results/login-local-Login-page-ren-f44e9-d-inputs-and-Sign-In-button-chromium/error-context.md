# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-local.spec.ts >> Login page renders email + password inputs and Sign In button
- Location: e2e\login-local.spec.ts:18:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/login
Call log:
  - navigating to "http://localhost:3003/login", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Local admin login tests — verifies the login page renders and that
  3  |  * authenticated sessions can access the dashboard.
  4  |  *
  5  |  * NOTE: We do NOT submit the login form here (that would trigger Supabase
  6  |  * auth and consume the rate-limit budget shared with all other spec files).
  7  |  * The full login→dashboard flow is already exercised by every other spec
  8  |  * file via cookie injection.  These tests verify:
  9  |  *   1. The login page renders the expected fields and button.
  10 |  *   2. A user with a valid cookie is redirected to /dashboard.
  11 |  */
  12 | 
  13 | import { test, expect } from '@playwright/test';
  14 | import { authedCtx } from './shared-auth';
  15 | 
  16 | const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
  17 | 
  18 | test('Login page renders email + password inputs and Sign In button', async ({ page }) => {
> 19 |   await page.goto(`${ADMIN_URL}/login`);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/login
  20 |   await expect(page.getByPlaceholder('admin@amoha.com')).toBeVisible({ timeout: 10000 });
  21 |   await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  22 |   await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  23 | });
  24 | 
  25 | test('Admin login succeeds and redirects to dashboard', async ({ browser }) => {
  26 |   // Use cookie injection (same auth as all other spec files).
  27 |   // This verifies that a valid session token grants access to /dashboard
  28 |   // without consuming Supabase's rate-limit budget.
  29 |   const ctx = await authedCtx(browser);
  30 |   const page = await ctx.newPage();
  31 |   await page.goto(`${ADMIN_URL}/dashboard`);
  32 |   await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  33 |   await expect(page.locator('body')).not.toContainText('Login failed', { timeout: 5000 });
  34 |   await expect(page.locator('body')).not.toContainText('Internal Server Error', { timeout: 5000 });
  35 |   await ctx.close();
  36 | });
  37 | 
```