# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-sales.spec.ts >> RBAC - Sales Role >> sales cannot access purchase modules
- Location: e2e\rbac-sales.spec.ts:31:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Amoha Admin" [level=1] [ref=e9]
      - paragraph [ref=e10]: Sign in to your admin account
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email Address
          - generic [ref=e15]:
            - img [ref=e17]
            - textbox "admin@amoha.com" [ref=e20]: sales@amoha.com
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - generic [ref=e23]:
            - img [ref=e25]
            - textbox "••••••••" [ref=e28]: sales123
            - button [ref=e29] [cursor=pointer]:
              - img [ref=e30]
        - button "Sign In to Admin Panel" [ref=e33] [cursor=pointer]
      - paragraph [ref=e35]: Protected route — Admin access only
  - alert [ref=e36]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * RBAC Tests - Sales Role
  5  |  * Verifies that sales users only have access to sales-related modules
  6  |  */
  7  | 
  8  | test.describe('RBAC - Sales Role', () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Login as sales user
  11 |     await page.goto('/login');
  12 |     await page.fill('input[type="email"]', 'sales@amoha.com');
  13 |     await page.fill('input[type="password"]', 'sales123');
  14 |     await page.click('button[type="submit"]');
> 15 |     await page.waitForURL('/dashboard');
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  16 |   });
  17 | 
  18 |   test('sales can access dashboard', async ({ page }) => {
  19 |     await page.goto('/dashboard');
  20 |     await expect(page.locator('text=Access Denied')).not.toBeVisible();
  21 |   });
  22 | 
  23 |   test('sales can access sales modules', async ({ page }) => {
  24 |     const allowedModules = ['/orders', '/billing', '/barcode', '/returns', '/wallets'];
  25 |     for (const module of allowedModules) {
  26 |       await page.goto(module);
  27 |       await expect(page.locator('text=Access Denied')).not.toBeVisible();
  28 |     }
  29 |   });
  30 | 
  31 |   test('sales cannot access purchase modules', async ({ page }) => {
  32 |     const restrictedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq', '/purchase-requests'];
  33 |     for (const module of restrictedModules) {
  34 |       await page.goto(module);
  35 |       // Should either show Access Denied or redirect
  36 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  37 |     }
  38 |   });
  39 | 
  40 |   test('sales cannot access marketing modules', async ({ page }) => {
  41 |     const restrictedModules = ['/coupons', '/banners', '/reviews', '/crm'];
  42 |     for (const module of restrictedModules) {
  43 |       await page.goto(module);
  44 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  45 |     }
  46 |   });
  47 | 
  48 |   test('sales cannot access admin-only modules', async ({ page }) => {
  49 |     const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
  50 |     for (const module of adminOnlyModules) {
  51 |       await page.goto(module);
  52 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  53 |     }
  54 |   });
  55 | 
  56 |   test('sales sees only allowed navigation items', async ({ page }) => {
  57 |     await page.goto('/dashboard');
  58 | 
  59 |     // Sales section should be visible
  60 |     await expect(page.locator('text=Orders')).toBeVisible();
  61 |     await expect(page.locator('text=Billing')).toBeVisible();
  62 | 
  63 |     // Purchase section should NOT be visible
  64 |     await expect(page.locator('text=Purchase')).not.toBeVisible();
  65 |     await expect(page.locator('text=Products').first()).not.toBeVisible();
  66 | 
  67 |     // Marketing section should NOT be visible
  68 |     await expect(page.locator('text=Marketing')).not.toBeVisible();
  69 |     await expect(page.locator('text=Coupons')).not.toBeVisible();
  70 | 
  71 |     // Admin section should NOT be visible
  72 |     await expect(page.locator('text=Admin')).not.toBeVisible();
  73 |     await expect(page.locator('text=Users')).not.toBeVisible();
  74 |   });
  75 | 
  76 |   test('sales role badge is displayed', async ({ page }) => {
  77 |     await page.goto('/dashboard');
  78 |     await expect(page.locator('text=Sales')).toBeVisible();
  79 |   });
  80 | });
  81 | 
```