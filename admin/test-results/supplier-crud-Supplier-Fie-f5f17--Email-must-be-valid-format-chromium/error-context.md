# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier-crud.spec.ts >> Supplier Field Validation >> Email must be valid format
- Location: e2e\supplier-crud.spec.ts:359:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  234 |     // Find the supplier
  235 |     await page.locator('input[placeholder*="Search suppliers"]').fill(deleteTestCompany);
  236 |     const supplierRow = page.locator('table tbody tr', { hasText: deleteTestCompany }).first();
  237 |     await expect(supplierRow).toBeVisible({ timeout: 10000 });
  238 |     
  239 |     // Create a purchase order for this supplier via API
  240 |     // First get the supplier ID
  241 |     const suppliersRes = await request.get(`${API_URL}/suppliers?search=${encodeURIComponent(deleteTestCompany)}`, {
  242 |       headers: { Authorization: `Bearer ${token}` },
  243 |     });
  244 |     expect(suppliersRes.ok()).toBeTruthy();
  245 |     const suppliersBody = await suppliersRes.json();
  246 |     const supplierId = suppliersBody.data?.suppliers?.[0]?._id || suppliersBody.data?.suppliers?.[0]?.id;
  247 |     
  248 |     if (supplierId) {
  249 |       // Try to delete supplier that has linked records (if we created any)
  250 |       // For this test, we'll try to delete a supplier without linked records first
  251 |       // Then show that the system properly prevents deletion of suppliers with linked data
  252 |     }
  253 |     
  254 |     // Delete the supplier (without linked records)
  255 |     await supplierRow.locator('button[class*="text-destructive"]').click();
  256 |     
  257 |     // Confirm deletion dialog
  258 |     const confirmDialog = page.locator('[role="dialog"]', { hasText: /delete supplier/i });
  259 |     await expect(confirmDialog).toBeVisible({ timeout: 5000 });
  260 |     
  261 |     // Click confirm delete
  262 |     await confirmDialog.getByRole('button', { name: /delete/i }).click();
  263 |     
  264 |     // Wait for success
  265 |     await expect(page.getByText(/supplier deleted/i).first()).toBeVisible({ timeout: 10000 });
  266 |     
  267 |     // Verify supplier no longer in list
  268 |     await page.locator('input[placeholder*="Search suppliers"]').clear();
  269 |     await page.locator('input[placeholder*="Search suppliers"]').fill(deleteTestCompany);
  270 |     await expect(page.locator('table tbody tr', { hasText: deleteTestCompany })).toHaveCount(0);
  271 |     
  272 |     console.log('✓ TEST 4 PASSED: Supplier deleted safely');
  273 |   });
  274 | 
  275 |   test('TEST 5: Search and filter suppliers', async ({ page }) => {
  276 |     // Navigate to suppliers page
  277 |     await page.goto(`${ADMIN_URL}/suppliers`);
  278 |     await expect(page.getByRole('heading', { name: 'Supplier Management' })).toBeVisible({ timeout: 10000 });
  279 |     
  280 |     // Create multiple suppliers with different status
  281 |     for (let i = 0; i < 3; i++) {
  282 |       await page.getByRole('button', { name: /add supplier/i }).click();
  283 |       const dialog = page.getByRole('dialog');
  284 |       
  285 |       const companyName = `Filter Test ${Date.now()} ${i}`;
  286 |       await dialog.locator('input[placeholder*="Company/Business Name"]').fill(companyName);
  287 |       await dialog.locator('input[placeholder*="Primary contact name"]').fill(`Contact ${i}`);
  288 |       await dialog.locator('input[placeholder*="10-digit mobile number"]').fill(`98765${Math.floor(Math.random() * 89999 + 10000)}`);
  289 |       await dialog.locator('input[placeholder*="Address Line 1"]').fill(`Address ${i}`);
  290 |       await dialog.locator('input[placeholder*="City"]').fill('Kolkata');
  291 |       await dialog.locator('input[placeholder*="State"]').fill('West Bengal');
  292 |       await dialog.locator('input[placeholder*="Pincode"]').fill('700001');
  293 |       
  294 |       // Set status to inactive for one supplier
  295 |       if (i === 2) {
  296 |         await dialog.locator('select').filter({ hasText: 'Active' }).selectOption('inactive');
  297 |       }
  298 |       
  299 |       await dialog.getByRole('button', { name: /create/i }).click();
  300 |       await expect(page.getByText(/supplier created/i).first()).toBeVisible({ timeout: 10000 });
  301 |     }
  302 |     
  303 |     // Test search by name
  304 |     const searchTerm = 'Filter Test';
  305 |     await page.locator('input[placeholder*="Search suppliers"]').fill(searchTerm);
  306 |     await page.waitForTimeout(500); // Debounce
  307 |     
  308 |     // Verify search results
  309 |     const rows = page.locator('table tbody tr');
  310 |     const count = await rows.count();
  311 |     expect(count).toBeGreaterThan(0);
  312 |     
  313 |     // Test status filter
  314 |     await page.locator('select').filter({ hasText: /all statuses/i }).selectOption('inactive');
  315 |     await page.waitForTimeout(500);
  316 |     
  317 |     // Should only show inactive suppliers
  318 |     const inactiveRows = page.locator('table tbody tr');
  319 |     const inactiveCount = await inactiveRows.count();
  320 |     
  321 |     // Verify at least one inactive supplier is shown
  322 |     expect(inactiveCount).toBeGreaterThanOrEqual(1);
  323 |     
  324 |     console.log('✓ TEST 5 PASSED: Search and filter working');
  325 |   });
  326 | });
  327 | 
  328 | test.describe('Supplier Field Validation', () => {
  329 |   
  330 |   test.beforeEach(async ({ page }) => {
  331 |     const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  332 |     const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  333 |     
> 334 |     await page.goto(`${ADMIN_URL}/login`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  335 |     await page.locator('input[type="email"]').fill(adminEmail);
  336 |     await page.locator('input[type="password"]').fill(adminPassword);
  337 |     await page.getByRole('button', { name: /sign in/i }).click();
  338 |     await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  339 |   });
  340 | 
  341 |   test('Phone number must be 10-15 digits', async ({ page }) => {
  342 |     await page.goto(`${ADMIN_URL}/suppliers`);
  343 |     await page.getByRole('button', { name: /add supplier/i }).click();
  344 |     
  345 |     const dialog = page.getByRole('dialog');
  346 |     await dialog.locator('input[placeholder*="Company/Business Name"]').fill('Phone Test Company');
  347 |     await dialog.locator('input[placeholder*="10-digit mobile number"]').fill('12345'); // Too short
  348 |     await dialog.locator('input[placeholder*="Address Line 1"]').fill('Test Address');
  349 |     await dialog.locator('input[placeholder*="City"]').fill('Ahmedabad');
  350 |     await dialog.locator('input[placeholder*="State"]').fill('Gujarat');
  351 |     await dialog.locator('input[placeholder*="Pincode"]').fill('380001');
  352 |     
  353 |     await dialog.getByRole('button', { name: /create/i }).click();
  354 |     
  355 |     // Should show validation error
  356 |     await expect(page.getByText(/10 digits|phone/i).first()).toBeVisible({ timeout: 5000 });
  357 |   });
  358 | 
  359 |   test('Email must be valid format', async ({ page }) => {
  360 |     await page.goto(`${ADMIN_URL}/suppliers`);
  361 |     await page.getByRole('button', { name: /add supplier/i }).click();
  362 |     
  363 |     const dialog = page.getByRole('dialog');
  364 |     await dialog.locator('input[placeholder*="Company/Business Name"]').fill('Email Test Company');
  365 |     await dialog.locator('input[type="email"]').fill('invalid-email');
  366 |     await dialog.locator('input[placeholder*="10-digit mobile number"]').fill(`98765${Math.floor(Math.random() * 89999 + 10000)}`);
  367 |     await dialog.locator('input[placeholder*="Address Line 1"]').fill('Test Address');
  368 |     await dialog.locator('input[placeholder*="City"]').fill('Jaipur');
  369 |     await dialog.locator('input[placeholder*="State"]').fill('Rajasthan');
  370 |     await dialog.locator('input[placeholder*="Pincode"]').fill('302001');
  371 |     
  372 |     await dialog.getByRole('button', { name: /create/i }).click();
  373 |     
  374 |     // Should show validation error
  375 |     await expect(page.getByText(/invalid email|email/i).first()).toBeVisible({ timeout: 5000 });
  376 |   });
  377 | 
  378 |   test('Company name is required', async ({ page }) => {
  379 |     await page.goto(`${ADMIN_URL}/suppliers`);
  380 |     await page.getByRole('button', { name: /add supplier/i }).click();
  381 |     
  382 |     const dialog = page.getByRole('dialog');
  383 |     // Leave company name empty
  384 |     await dialog.locator('input[placeholder*="Primary contact name"]').fill('Test Contact');
  385 |     await dialog.locator('input[placeholder*="10-digit mobile number"]').fill(`98765${Math.floor(Math.random() * 89999 + 10000)}`);
  386 |     await dialog.locator('input[placeholder*="Address Line 1"]').fill('Test Address');
  387 |     await dialog.locator('input[placeholder*="City"]').fill('Lucknow');
  388 |     await dialog.locator('input[placeholder*="State"]').fill('Uttar Pradesh');
  389 |     await dialog.locator('input[placeholder*="Pincode"]').fill('226001');
  390 |     
  391 |     await dialog.getByRole('button', { name: /create/i }).click();
  392 |     
  393 |     // Form should either show error or company name should be auto-filled
  394 |     // The system allows name to be used as fallback
  395 |   });
  396 | });
  397 | 
  398 | console.log('Supplier Management E2E Tests - Starting...');
  399 | 
```