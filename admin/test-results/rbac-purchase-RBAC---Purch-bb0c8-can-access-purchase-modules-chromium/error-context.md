# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-purchase.spec.ts >> RBAC - Purchase Role >> purchase can access purchase modules
- Location: e2e\rbac-purchase.spec.ts:23:7

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
            - textbox "admin@amoha.com" [ref=e20]: purchase@amoha.com
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - generic [ref=e23]:
            - img [ref=e25]
            - textbox "••••••••" [ref=e28]: purchase123
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
  4  |  * RBAC Tests - Purchase Role
  5  |  * Verifies that purchase users only have access to purchase-related modules
  6  |  */
  7  | 
  8  | test.describe('RBAC - Purchase Role', () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Login as purchase user
  11 |     await page.goto('/login');
  12 |     await page.fill('input[type="email"]', 'purchase@amoha.com');
  13 |     await page.fill('input[type="password"]', 'purchase123');
  14 |     await page.click('button[type="submit"]');
> 15 |     await page.waitForURL('/dashboard');
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  16 |   });
  17 | 
  18 |   test('purchase can access dashboard', async ({ page }) => {
  19 |     await page.goto('/dashboard');
  20 |     await expect(page.locator('text=Access Denied')).not.toBeVisible();
  21 |   });
  22 | 
  23 |   test('purchase can access purchase modules', async ({ page }) => {
  24 |     const allowedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq', '/purchase-requests'];
  25 |     for (const module of allowedModules) {
  26 |       await page.goto(module);
  27 |       await expect(page.locator('text=Access Denied')).not.toBeVisible();
  28 |     }
  29 |   });
  30 | 
  31 |   test('purchase cannot access sales modules', async ({ page }) => {
  32 |     const restrictedModules = ['/orders', '/billing', '/returns', '/wallets'];
  33 |     for (const module of restrictedModules) {
  34 |       await page.goto(module);
  35 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  36 |     }
  37 |   });
  38 | 
  39 |   test('purchase cannot access marketing modules', async ({ page }) => {
  40 |     const restrictedModules = ['/coupons', '/banners', '/reviews', '/crm'];
  41 |     for (const module of restrictedModules) {
  42 |       await page.goto(module);
  43 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  44 |     }
  45 |   });
  46 | 
  47 |   test('purchase cannot access admin-only modules', async ({ page }) => {
  48 |     const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
  49 |     for (const module of adminOnlyModules) {
  50 |       await page.goto(module);
  51 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  52 |     }
  53 |   });
  54 | 
  55 |   test('purchase sees only allowed navigation items', async ({ page }) => {
  56 |     await page.goto('/dashboard');
  57 | 
  58 |     // Purchase section should be visible
  59 |     await expect(page.locator('text=Products')).toBeVisible();
  60 |     await expect(page.locator('text=Inventory')).toBeVisible();
  61 |     await expect(page.locator('text=Suppliers')).toBeVisible();
  62 | 
  63 |     // Sales section should NOT be visible
  64 |     await expect(page.locator('text=Sales')).not.toBeVisible();
  65 |     await expect(page.locator('text=Orders').first()).not.toBeVisible();
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
  76 |   test('purchase role badge is displayed', async ({ page }) => {
  77 |     await page.goto('/dashboard');
  78 |     await expect(page.locator('text=Purchase')).toBeVisible();
  79 |   });
  80 | });
  81 | 
```