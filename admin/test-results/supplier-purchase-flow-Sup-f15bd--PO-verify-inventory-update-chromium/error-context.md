# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier-purchase-flow.spec.ts >> Supplier Purchase Flow Integration >> TEST 6: Purchase flow - select supplier, create PO, verify inventory update
- Location: e2e\supplier-purchase-flow.spec.ts:19:7

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
  6   | test.describe('Supplier Purchase Flow Integration', () => {
  7   |   
  8   |   test.beforeEach(async ({ page }) => {
  9   |     const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  10  |     const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  11  |     
> 12  |     await page.goto(`${ADMIN_URL}/login`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  13  |     await page.locator('input[type="email"]').fill(adminEmail);
  14  |     await page.locator('input[type="password"]').fill(adminPassword);
  15  |     await page.getByRole('button', { name: /sign in/i }).click();
  16  |     await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  17  |   });
  18  | 
  19  |   test('TEST 6: Purchase flow - select supplier, create PO, verify inventory update', async ({ page, request }) => {
  20  |     const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  21  |     const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  22  |     
  23  |     // Login via API to get token
  24  |     const loginRes = await request.post(`${API_URL}/auth/login`, {
  25  |       data: { email: adminEmail, password: adminPassword },
  26  |     });
  27  |     expect(loginRes.ok()).toBeTruthy();
  28  |     const loginBody = await loginRes.json();
  29  |     const token = loginBody.token || loginBody.data?.token;
  30  |     expect(token).toBeTruthy();
  31  | 
  32  |     // Step 1: Create a supplier via API
  33  |     const supplierPhone = `98765${Math.floor(Math.random() * 89999 + 10000)}`;
  34  |     const supplierData = {
  35  |       name: 'Purchase Flow Supplier',
  36  |       companyName: `Purchase Test ${Date.now()}`,
  37  |       email: `purchase.flow.${Date.now()}@example.com`,
  38  |       phone: supplierPhone,
  39  |       addressLine1: 'PO Test Address',
  40  |       city: 'Mumbai',
  41  |       state: 'Maharashtra',
  42  |       pincode: '400001',
  43  |     };
  44  | 
  45  |     const createSupplierRes = await request.post(`${API_URL}/suppliers`, {
  46  |       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  47  |       data: supplierData,
  48  |     });
  49  |     expect(createSupplierRes.ok()).toBeTruthy();
  50  |     const supplierBody = await createSupplierRes.json();
  51  |     const supplierId = supplierBody.data?._id || supplierBody.data?.id;
  52  |     expect(supplierId).toBeTruthy();
  53  | 
  54  |     console.log(`✓ Created supplier: ${supplierId}`);
  55  | 
  56  |     // Step 2: Create a product to purchase
  57  |     const productData = {
  58  |       name: `PO Test Product ${Date.now()}`,
  59  |       sku: `SKU-PO-${Date.now()}`,
  60  |       price: 9999,
  61  |       stock: 0, // Start with 0 stock
  62  |       category: 'electronics',
  63  |       brand: 'test-brand',
  64  |       description: 'Product for purchase order testing',
  65  |     };
  66  | 
  67  |     const createProductRes = await request.post(`${API_URL}/products`, {
  68  |       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  69  |       data: productData,
  70  |     });
  71  |     expect(createProductRes.ok()).toBeTruthy();
  72  |     const productBody = await createProductRes.json();
  73  |     const productId = productBody.data?._id || productBody.data?.id;
  74  |     expect(productId).toBeTruthy();
  75  | 
  76  |     console.log(`✓ Created product: ${productId}`);
  77  | 
  78  |     // Step 3: Assign product to supplier
  79  |     const assignRes = await request.post(`${API_URL}/suppliers/${supplierId}/products`, {
  80  |       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  81  |       data: {
  82  |         productId: productId,
  83  |         unitCost: 7000,
  84  |         leadTimeDays: 7,
  85  |         minOrderQty: 5,
  86  |       },
  87  |     });
  88  |     expect(assignRes.ok()).toBeTruthy();
  89  |     console.log('✓ Product assigned to supplier');
  90  | 
  91  |     // Step 4: Create purchase order via API
  92  |     const poData = {
  93  |       supplierId: supplierId,
  94  |       items: [
  95  |         {
  96  |           productId: productId,
  97  |           quantity: 10,
  98  |           unitCost: 7000,
  99  |         },
  100 |       ],
  101 |       status: 'draft',
  102 |       taxAmount: 12600, // 18% of 70000
  103 |       shippingCost: 500,
  104 |       notes: 'Test purchase order for inventory sync',
  105 |     };
  106 | 
  107 |     const createPORes = await request.post(`${API_URL}/suppliers/purchase-orders`, {
  108 |       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  109 |       data: poData,
  110 |     });
  111 |     expect(createPORes.ok()).toBeTruthy();
  112 |     const poBody = await createPORes.json();
```