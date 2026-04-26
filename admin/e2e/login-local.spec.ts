/**
 * Local admin login test — verifies the login flow works against localhost.
 *
 * Run:
 *   cd admin
 *   npx playwright test e2e/login-local.spec.ts --config=playwright.local.config.ts --headed
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'e2etest@amoha.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

test('Admin login succeeds and redirects to dashboard', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/login`);

  // Fill credentials
  await page.getByPlaceholder('admin@amoha.com').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Should redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  await expect(page.locator('body')).not.toContainText('Login failed', { timeout: 5000 });
  await expect(page.locator('body')).not.toContainText('Internal Server Error', { timeout: 5000 });
});
