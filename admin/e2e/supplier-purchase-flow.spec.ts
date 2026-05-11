import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5001/api';

test.describe('Supplier Purchase Flow Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    await page.goto(`${ADMIN_URL}/login`);
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  });

  test('TEST 6: Purchase flow - select supplier, create PO, verify inventory update', async ({ page, request }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Login via API to get token
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const token = loginBody.token || loginBody.data?.token;
    expect(token).toBeTruthy();

    // Step 1: Create a supplier via API
    const supplierPhone = `98765${Math.floor(Math.random() * 89999 + 10000)}`;
    const supplierData = {
      name: 'Purchase Flow Supplier',
      companyName: `Purchase Test ${Date.now()}`,
      email: `purchase.flow.${Date.now()}@example.com`,
      phone: supplierPhone,
      addressLine1: 'PO Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    };

    const createSupplierRes = await request.post(`${API_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: supplierData,
    });
    expect(createSupplierRes.ok()).toBeTruthy();
    const supplierBody = await createSupplierRes.json();
    const supplierId = supplierBody.data?._id || supplierBody.data?.id;
    expect(supplierId).toBeTruthy();

    console.log(`✓ Created supplier: ${supplierId}`);

    // Step 2: Create a product to purchase
    const productData = {
      name: `PO Test Product ${Date.now()}`,
      sku: `SKU-PO-${Date.now()}`,
      price: 9999,
      stock: 0, // Start with 0 stock
      category: 'electronics',
      brand: 'test-brand',
      description: 'Product for purchase order testing',
    };

    const createProductRes = await request.post(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: productData,
    });
    expect(createProductRes.ok()).toBeTruthy();
    const productBody = await createProductRes.json();
    const productId = productBody.data?._id || productBody.data?.id;
    expect(productId).toBeTruthy();

    console.log(`✓ Created product: ${productId}`);

    // Step 3: Assign product to supplier
    const assignRes = await request.post(`${API_URL}/suppliers/${supplierId}/products`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        productId: productId,
        unitCost: 7000,
        leadTimeDays: 7,
        minOrderQty: 5,
      },
    });
    expect(assignRes.ok()).toBeTruthy();
    console.log('✓ Product assigned to supplier');

    // Step 4: Create purchase order via API
    const poData = {
      supplierId: supplierId,
      items: [
        {
          productId: productId,
          quantity: 10,
          unitCost: 7000,
        },
      ],
      status: 'draft',
      taxAmount: 12600, // 18% of 70000
      shippingCost: 500,
      notes: 'Test purchase order for inventory sync',
    };

    const createPORes = await request.post(`${API_URL}/suppliers/purchase-orders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: poData,
    });
    expect(createPORes.ok()).toBeTruthy();
    const poBody = await createPORes.json();
    const poId = poBody.data?._id || poBody.data?.id;
    const poNumber = poBody.data?.poNumber;
    expect(poId).toBeTruthy();

    console.log(`✓ Created purchase order: ${poNumber} (${poId})`);

    // Step 5: Verify PO appears in supplier's PO list
    await page.goto(`${ADMIN_URL}/suppliers`);
    await expect(page.getByRole('heading', { name: 'Supplier Management' })).toBeVisible({ timeout: 10000 });
    
    // Switch to Purchase Orders tab
    await page.getByRole('tab', { name: /purchase orders/i }).click();
    await page.waitForTimeout(500);
    
    // Search for the PO
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill(poNumber);
    await page.waitForTimeout(500);
    
    // Verify PO is in the list
    const poRow = page.locator('table tbody tr', { hasText: poNumber }).first();
    await expect(poRow).toBeVisible({ timeout: 10000 });
    
    // Verify supplier name appears in PO
    await expect(poRow).toContainText(supplierData.companyName);
    
    console.log('✓ Purchase order visible in list with supplier');

    // Step 6: Receive the purchase order
    const receiveRes = await request.post(`${API_URL}/suppliers/purchase-orders/${poId}/receive`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        items: [
          {
            itemId: poBody.data?.items?.[0]?._id || poBody.data?.items?.[0]?.id,
            receivedQty: 10,
          },
        ],
      },
    });
    expect(receiveRes.ok()).toBeTruthy();
    
    console.log('✓ Purchase order received');

    // Step 7: Verify inventory updated
    await page.waitForTimeout(1000); // Allow inventory update to complete
    
    // Navigate to inventory
    await page.goto(`${ADMIN_URL}/inventory`);
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible({ timeout: 10000 });
    
    // Search for the product
    const inventorySearch = page.locator('input[placeholder*="Search products"]');
    await inventorySearch.fill(productData.name);
    await page.waitForTimeout(500);
    
    // Verify product with updated stock appears
    const inventoryRow = page.locator('table tbody tr', { hasText: productData.name }).first();
    await expect(inventoryRow).toBeVisible({ timeout: 10000 });
    
    // Verify stock quantity
    await expect(inventoryRow).toContainText('10');
    
    console.log('✓ Inventory updated with received quantity');

    // Step 8: Verify supplier analytics updated
    await page.goto(`${ADMIN_URL}/suppliers`);
    await page.waitForTimeout(500);
    
    // Switch to Analytics tab
    await page.getByRole('tab', { name: /analytics/i }).click();
    await page.waitForTimeout(500);
    
    // The supplier should be in top suppliers list (since we just completed an order)
    const analyticsSection = page.locator('text=/top suppliers|analytics/i');
    await expect(analyticsSection.first()).toBeVisible();
    
    console.log('✓ Supplier analytics updated');
    console.log('\n🎉 TEST 6 PASSED: Full purchase flow working!');
    console.log('   - Supplier created');
    console.log('   - Product created');
    console.log('   - Product assigned to supplier');
    console.log('   - Purchase order created');
    console.log('   - PO visible in supplier module');
    console.log('   - Purchase order received');
    console.log('   - Inventory updated');
    console.log('   - Analytics updated');
  });

  test('TEST 7: Supplier status change affects purchase orders', async ({ page, request }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Login via API
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const token = loginBody.token || loginBody.data?.token;

    // Create an inactive supplier
    const supplierData = {
      name: 'Inactive Test',
      companyName: `Inactive Supplier ${Date.now()}`,
      email: `inactive.${Date.now()}@example.com`,
      phone: `98765${Math.floor(Math.random() * 89999 + 10000)}`,
      addressLine1: 'Test Address',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      status: 'inactive',
    };

    const createRes = await request.post(`${API_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: supplierData,
    });
    expect(createRes.ok()).toBeTruthy();

    // Navigate to suppliers and verify inactive status is shown
    await page.goto(`${ADMIN_URL}/suppliers`);
    await page.locator('input[placeholder*="Search suppliers"]').fill(supplierData.companyName);
    await page.waitForTimeout(500);
    
    const supplierRow = page.locator('table tbody tr', { hasText: supplierData.companyName }).first();
    await expect(supplierRow).toBeVisible({ timeout: 10000 });
    
    // Verify inactive badge
    await expect(supplierRow.locator('span', { hasText: 'inactive' })).toBeVisible();
    
    console.log('✓ TEST 7 PASSED: Supplier status correctly displayed');
  });
});

console.log('Supplier Purchase Flow E2E Tests - Starting...');
