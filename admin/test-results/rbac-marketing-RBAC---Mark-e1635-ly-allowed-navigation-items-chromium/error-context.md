# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-marketing.spec.ts >> RBAC - Marketing Role >> marketing sees only allowed navigation items
- Location: e2e\rbac-marketing.spec.ts:55:7

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
            - textbox "admin@amoha.com" [ref=e20]: marketing@amoha.com
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - generic [ref=e23]:
            - img [ref=e25]
            - textbox "••••••••" [ref=e28]: marketing123
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
  4  |  * RBAC Tests - Marketing Role
  5  |  * Verifies that marketing users only have access to marketing-related modules
  6  |  */
  7  | 
  8  | test.describe('RBAC - Marketing Role', () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Login as marketing user
  11 |     await page.goto('/login');
  12 |     await page.fill('input[type="email"]', 'marketing@amoha.com');
  13 |     await page.fill('input[type="password"]', 'marketing123');
  14 |     await page.click('button[type="submit"]');
> 15 |     await page.waitForURL('/dashboard');
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  16 |   });
  17 | 
  18 |   test('marketing can access dashboard', async ({ page }) => {
  19 |     await page.goto('/dashboard');
  20 |     await expect(page.locator('text=Access Denied')).not.toBeVisible();
  21 |   });
  22 | 
  23 |   test('marketing can access marketing modules', async ({ page }) => {
  24 |     const allowedModules = ['/coupons', '/banners', '/reviews', '/crm', '/contact-messages', '/product-views', '/abandoned-carts'];
  25 |     for (const module of allowedModules) {
  26 |       await page.goto(module);
  27 |       await expect(page.locator('text=Access Denied')).not.toBeVisible();
  28 |     }
  29 |   });
  30 | 
  31 |   test('marketing cannot access sales modules', async ({ page }) => {
  32 |     const restrictedModules = ['/orders', '/billing', '/barcode', '/returns', '/wallets'];
  33 |     for (const module of restrictedModules) {
  34 |       await page.goto(module);
  35 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  36 |     }
  37 |   });
  38 | 
  39 |   test('marketing cannot access purchase modules', async ({ page }) => {
  40 |     const restrictedModules = ['/products', '/categories', '/brands', '/inventory', '/suppliers', '/rfq'];
  41 |     for (const module of restrictedModules) {
  42 |       await page.goto(module);
  43 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  44 |     }
  45 |   });
  46 | 
  47 |   test('marketing cannot access admin-only modules', async ({ page }) => {
  48 |     const adminOnlyModules = ['/users', '/service-requests', '/activity-logs', '/settings'];
  49 |     for (const module of adminOnlyModules) {
  50 |       await page.goto(module);
  51 |       await expect(page.locator('text=Access Denied').or(page.locator('text=Dashboard'))).toBeVisible();
  52 |     }
  53 |   });
  54 | 
  55 |   test('marketing sees only allowed navigation items', async ({ page }) => {
  56 |     await page.goto('/dashboard');
  57 | 
  58 |     // Marketing section should be visible
  59 |     await expect(page.locator('text=Coupons')).toBeVisible();
  60 |     await expect(page.locator('text=Banners')).toBeVisible();
  61 |     await expect(page.locator('text=CRM')).toBeVisible();
  62 | 
  63 |     // Sales section should NOT be visible
  64 |     await expect(page.locator('text=Sales')).not.toBeVisible();
  65 | 
  66 |     // Purchase section should NOT be visible
  67 |     await expect(page.locator('text=Purchase')).not.toBeVisible();
  68 |     await expect(page.locator('text=Products').first()).not.toBeVisible();
  69 | 
  70 |     // Admin section should NOT be visible
  71 |     await expect(page.locator('text=Admin')).not.toBeVisible();
  72 |     await expect(page.locator('text=Users')).not.toBeVisible();
  73 |   });
  74 | 
  75 |   test('marketing role badge is displayed', async ({ page }) => {
  76 |     await page.goto('/dashboard');
  77 |     await expect(page.locator('text=Marketing')).toBeVisible();
  78 |   });
  79 | });
  80 | 
```