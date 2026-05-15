# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: delete-system.spec.ts >> Enterprise Delete System >> Dependency Protection >> Should prevent deleting brand with linked products
- Location: e2e\delete-system.spec.ts:152:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/login
Call log:
  - navigating to "http://localhost:3003/login", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * Enterprise Delete System Playwright Tests
  3   |  * Tests for role-based delete permissions and data integrity protection
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | 
  7   | const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
  8   | 
  9   | async function loginAsAdmin(page: any) {
> 10  |   await page.goto(`${ADMIN_URL}/login`);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/login
  11  |   await page.fill('input[type="email"]', 'admin@amoha.com');
  12  |   await page.fill('input[type="password"]', 'admin123');
  13  |   await page.click('button[type="submit"]');
  14  |   await page.waitForURL(`${ADMIN_URL}/dashboard`);
  15  | }
  16  | 
  17  | async function loginAsPurchase(page: any) {
  18  |   await page.goto(`${ADMIN_URL}/login`);
  19  |   await page.fill('input[type="email"]', 'purchase@amoha.com');
  20  |   await page.fill('input[type="password"]', 'purchase123');
  21  |   await page.click('button[type="submit"]');
  22  |   await page.waitForURL(`${ADMIN_URL}/dashboard`);
  23  | }
  24  | 
  25  | async function loginAsSales(page: any) {
  26  |   await page.goto(`${ADMIN_URL}/login`);
  27  |   await page.fill('input[type="email"]', 'sales@amoha.com');
  28  |   await page.fill('input[type="password"]', 'sales123');
  29  |   await page.click('button[type="submit"]');
  30  |   await page.waitForURL(`${ADMIN_URL}/dashboard`);
  31  | }
  32  | 
  33  | async function loginAsMarketing(page: any) {
  34  |   await page.goto(`${ADMIN_URL}/login`);
  35  |   await page.fill('input[type="email"]', 'marketing@amoha.com');
  36  |   await page.fill('input[type="password"]', 'marketing123');
  37  |   await page.click('button[type="submit"]');
  38  |   await page.waitForURL(`${ADMIN_URL}/dashboard`);
  39  | }
  40  | 
  41  | test.describe('Enterprise Delete System', () => {
  42  | 
  43  |   test.describe('Role-Based Delete Permissions', () => {
  44  |     test('Admin should have full delete access', async ({ page }) => {
  45  |       await loginAsAdmin(page);
  46  |       await page.goto(`${ADMIN_URL}/products`);
  47  |       await page.waitForLoadState('networkidle');
  48  |       await page.waitForTimeout(3000);
  49  | 
  50  |       // Admin should see delete button on products
  51  |       const deleteButtons = page.locator('button:has(.lucide-trash2)');
  52  |       await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
  53  | 
  54  |       // Navigate to brands
  55  |       await page.goto(`${ADMIN_URL}/brands`);
  56  |       await page.waitForLoadState('networkidle');
  57  |       await page.waitForTimeout(3000);
  58  |       await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
  59  |     });
  60  | 
  61  |     test('Purchase role should have delete access to products, brands, categories, suppliers', async ({ page }) => {
  62  |       await loginAsPurchase(page);
  63  | 
  64  |       // Should see delete in products
  65  |       await page.goto(`${ADMIN_URL}/products`);
  66  |       await page.waitForLoadState('networkidle');
  67  |       await page.waitForTimeout(3000);
  68  |       const deleteButtons = page.locator('button:has(.lucide-trash2)');
  69  |       await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
  70  | 
  71  |       // Should see delete in brands
  72  |       await page.goto(`${ADMIN_URL}/brands`);
  73  |       await page.waitForLoadState('networkidle');
  74  |       await page.waitForTimeout(3000);
  75  |       await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
  76  |     });
  77  | 
  78  |     test('Sales role should NOT have delete access to products', async ({ page }) => {
  79  |       await loginAsSales(page);
  80  |       await page.goto(`${ADMIN_URL}/products`);
  81  |       await page.waitForLoadState('networkidle');
  82  |       await page.waitForTimeout(3000); // Wait for page to fully render
  83  | 
  84  |       // Sales should NOT see delete button
  85  |       const deleteButtons = page.locator('button:has(.lucide-trash2)');
  86  |       await page.waitForTimeout(2000);
  87  |       const count = await deleteButtons.count();
  88  |       expect(count).toBe(0);
  89  |     });
  90  | 
  91  |     test('Marketing role should have delete access to coupons and banners', async ({ page }) => {
  92  |       await loginAsMarketing(page);
  93  | 
  94  |       // Should see delete in coupons
  95  |       await page.goto(`${ADMIN_URL}/coupons`);
  96  |       await page.waitForLoadState('networkidle');
  97  |       await page.waitForTimeout(3000);
  98  |       const deleteButtons = page.locator('button:has(.lucide-trash2)');
  99  |       await expect(deleteButtons.first()).toBeVisible({ timeout: 20000 });
  100 |     });
  101 |   });
  102 | 
  103 |   test.describe('Delete Confirmation Dialog', () => {
  104 |     test('Should show confirmation dialog before delete', async ({ page }) => {
  105 |       await loginAsAdmin(page);
  106 |       await page.goto(`${ADMIN_URL}/brands`);
  107 |       await page.waitForLoadState('networkidle');
  108 |       await page.waitForTimeout(3000);
  109 | 
  110 |       // Click delete on first brand
```