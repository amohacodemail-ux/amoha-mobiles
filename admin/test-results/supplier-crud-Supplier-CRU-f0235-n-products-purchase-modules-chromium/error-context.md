# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier-crud.spec.ts >> Supplier CRUD Operations >> TEST 3: Update supplier → reflected in products/purchase modules
- Location: e2e\supplier-crud.spec.ts:140:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000';
  4   | const API_URL = process.env.API_URL || 'http://localhost:5001/api';
  5   | 
  6   | // Test data
  7   | const TEST_SUPPLIER = {
  8   |   companyName: `Test Supplier ${Date.now()}`,
  9   |   name: 'John Test',
  10  |   email: `test.supplier.${Date.now()}@example.com`,
  11  |   phone: `98765${Math.floor(Math.random() * 89999 + 10000)}`,
  12  |   addressLine1: '123 Test Street',
  13  |   city: 'Mumbai',
  14  |   state: 'Maharashtra',
  15  |   pincode: '400001',
  16  |   gstNumber: '27AABCU9603R1ZM',
  17  | };
  18  | 
  19  | // Helper: Admin Login
  20  | test.beforeEach(async ({ page }) => {
  21  |   const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  22  |   const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  23  |   
> 24  |   await page.goto(`${ADMIN_URL}/login`);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  25  |   await page.locator('input[type="email"]').fill(adminEmail);
  26  |   await page.locator('input[type="password"]').fill(adminPassword);
  27  |   await page.getByRole('button', { name: /sign in/i }).click();
  28  |   await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  29  | });
  30  | 
  31  | test.describe('Supplier CRUD Operations', () => {
  32  |   
  33  |   test('TEST 1: Add new supplier → appears in list', async ({ page }) => {
  34  |     // Navigate to suppliers page
  35  |     await page.goto(`${ADMIN_URL}/suppliers`);
  36  |     await expect(page.getByRole('heading', { name: 'Supplier Management' })).toBeVisible({ timeout: 10000 });
  37  |     
  38  |     // Click Add Supplier
  39  |     await page.getByRole('button', { name: /add supplier/i }).click();
  40  |     
  41  |     // Fill supplier form
  42  |     const dialog = page.getByRole('dialog');
  43  |     await expect(dialog.getByRole('heading', { name: /add supplier/i })).toBeVisible({ timeout: 5000 });
  44  |     
  45  |     // Fill required fields
  46  |     await dialog.locator('input[placeholder*="Company/Business Name"]').fill(TEST_SUPPLIER.companyName);
  47  |     await dialog.locator('input[placeholder*="Primary contact name"]').fill(TEST_SUPPLIER.name);
  48  |     await dialog.locator('input[type="email"]').fill(TEST_SUPPLIER.email);
  49  |     await dialog.locator('input[placeholder*="10-digit mobile number"]').fill(TEST_SUPPLIER.phone);
  50  |     await dialog.locator('input[placeholder*="Address Line 1"]').fill(TEST_SUPPLIER.addressLine1);
  51  |     await dialog.locator('input[placeholder*="City"]').fill(TEST_SUPPLIER.city);
  52  |     await dialog.locator('input[placeholder*="State"]').fill(TEST_SUPPLIER.state);
  53  |     await dialog.locator('input[placeholder*="Pincode"]').fill(TEST_SUPPLIER.pincode);
  54  |     await dialog.locator('input[placeholder*="GST Number"]').fill(TEST_SUPPLIER.gstNumber);
  55  |     
  56  |     // Submit form
  57  |     await dialog.getByRole('button', { name: /create/i }).click();
  58  |     
  59  |     // Wait for success toast
  60  |     await expect(page.getByText(/supplier created/i).first()).toBeVisible({ timeout: 10000 });
  61  |     
  62  |     // Verify supplier appears in list
  63  |     await page.locator('input[placeholder*="Search suppliers"]').fill(TEST_SUPPLIER.companyName);
  64  |     
  65  |     const supplierRow = page.locator('table tbody tr', { hasText: TEST_SUPPLIER.companyName }).first();
  66  |     await expect(supplierRow).toBeVisible({ timeout: 10000 });
  67  |     
  68  |     // Verify phone is displayed
  69  |     await expect(supplierRow).toContainText(TEST_SUPPLIER.phone);
  70  |     
  71  |     // Verify status is Active
  72  |     await expect(supplierRow.locator('span', { hasText: 'active' })).toBeVisible();
  73  |     
  74  |     console.log('✓ TEST 1 PASSED: New supplier added and appears in list');
  75  |   });
  76  | 
  77  |   test('TEST 2: Duplicate supplier → must block', async ({ page }) => {
  78  |     // Navigate to suppliers page
  79  |     await page.goto(`${ADMIN_URL}/suppliers`);
  80  |     await expect(page.getByRole('heading', { name: 'Supplier Management' })).toBeVisible({ timeout: 10000 });
  81  |     
  82  |     // First, create a supplier
  83  |     await page.getByRole('button', { name: /add supplier/i }).click();
  84  |     const dialog = page.getByRole('dialog');
  85  |     
  86  |     const uniquePhone = `98765${Math.floor(Math.random() * 89999 + 10000)}`;
  87  |     const uniqueEmail = `duplicate.test.${Date.now()}@example.com`;
  88  |     const companyName = `Duplicate Test ${Date.now()}`;
  89  |     
  90  |     await dialog.locator('input[placeholder*="Company/Business Name"]').fill(companyName);
  91  |     await dialog.locator('input[placeholder*="Primary contact name"]').fill('Test Contact');
  92  |     await dialog.locator('input[type="email"]').fill(uniqueEmail);
  93  |     await dialog.locator('input[placeholder*="10-digit mobile number"]').fill(uniquePhone);
  94  |     await dialog.locator('input[placeholder*="Address Line 1"]').fill('Test Address');
  95  |     await dialog.locator('input[placeholder*="City"]').fill('Delhi');
  96  |     await dialog.locator('input[placeholder*="State"]').fill('Delhi');
  97  |     await dialog.locator('input[placeholder*="Pincode"]').fill('110001');
  98  |     
  99  |     await dialog.getByRole('button', { name: /create/i }).click();
  100 |     await expect(page.getByText(/supplier created/i).first()).toBeVisible({ timeout: 10000 });
  101 |     
  102 |     // Try to create duplicate with same email
  103 |     await page.getByRole('button', { name: /add supplier/i }).click();
  104 |     const dialog2 = page.getByRole('dialog');
  105 |     
  106 |     await dialog2.locator('input[placeholder*="Company/Business Name"]').fill(`Different ${companyName}`);
  107 |     await dialog2.locator('input[type="email"]').fill(uniqueEmail); // Same email
  108 |     await dialog2.locator('input[placeholder*="10-digit mobile number"]').fill(`98765${Math.floor(Math.random() * 89999 + 10000)}`);
  109 |     await dialog2.locator('input[placeholder*="Address Line 1"]').fill('Different Address');
  110 |     await dialog2.locator('input[placeholder*="City"]').fill('Bangalore');
  111 |     await dialog2.locator('input[placeholder*="State"]').fill('Karnataka');
  112 |     await dialog2.locator('input[placeholder*="Pincode"]').fill('560001');
  113 |     
  114 |     await dialog2.getByRole('button', { name: /create/i }).click();
  115 |     
  116 |     // Should show error about duplicate email
  117 |     await expect(page.getByText(/already exists/i).first()).toBeVisible({ timeout: 10000 });
  118 |     
  119 |     // Close dialog and try duplicate phone
  120 |     await dialog2.getByRole('button', { name: /cancel/i }).click();
  121 |     await page.getByRole('button', { name: /add supplier/i }).click();
  122 |     const dialog3 = page.getByRole('dialog');
  123 |     
  124 |     await dialog3.locator('input[placeholder*="Company/Business Name"]').fill(`Another ${companyName}`);
```