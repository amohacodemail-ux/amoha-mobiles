import { test, expect } from '@playwright/test';

const UI_URL = process.env.FRONTEND_URL || 'http://localhost:3003';
const API_URL = process.env.API_URL || 'http://localhost:5001/api';

const pick = (body: any, ...paths: string[]) => {
  for (const path of paths) {
    const value = path.split('.').reduce((acc: any, key) => acc?.[key], body);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

test('real supplier entry can be converted by admin and appear in inventory', async ({ page, request }) => {
  const supplierEmail = process.env.SUPPLIER_EMAIL || '';
  const supplierPassword = process.env.SUPPLIER_PASSWORD || '';
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  test.skip(!supplierEmail || !supplierPassword || !adminEmail || !adminPassword, 'Missing supplier/admin credentials');

  const itemName = `PW Live Item ${Date.now()}`;
  const productName = `${itemName} Product`;
  const quantity = 7;
  const price = 12999;

  const supplierLoginRes = await request.post(`${API_URL}/auth/login`, {
    data: { email: supplierEmail, password: supplierPassword },
  });
  expect(supplierLoginRes.ok()).toBeTruthy();
  const supplierLoginBody = await supplierLoginRes.json();
  const supplierToken = pick(supplierLoginBody, 'token', 'data.token');
  expect(supplierToken).toBeTruthy();

  const createEntryRes = await request.post(`${API_URL}/supplier-entries`, {
    headers: { Authorization: `Bearer ${supplierToken}` },
    data: {
      itemName,
      quantity,
      price,
      note: 'Playwright live flow verification',
    },
  });
  expect(createEntryRes.ok()).toBeTruthy();

  await page.goto(`${UI_URL}/login`);
  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });

  await page.goto(`${UI_URL}/supplier-entries`);
  await expect(page.getByRole('heading', { name: 'Supplier Entries' })).toBeVisible({ timeout: 10000 });

  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill(itemName);

  const row = page.locator('table tbody tr', { hasText: itemName }).first();
  await expect(row).toBeVisible({ timeout: 20000 });
  await row.getByRole('button', { name: /convert/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Convert to Product' })).toBeVisible({ timeout: 10000 });
  await dialog.locator('input[placeholder="Product name"]').fill(productName);
  await dialog.locator('input[type="number"]').first().fill(String(price));
  await dialog.getByRole('button', { name: /convert to product/i }).click();

  await expect(page.getByText(/inventory created|converted/i).first()).toBeVisible({ timeout: 15000 });

  await page.goto(`${UI_URL}/inventory`);
  await expect(page.getByRole('heading', { name: 'Inventory Management' })).toBeVisible({ timeout: 10000 });
  await page.locator('input[placeholder*="Search products"]').fill(productName);

  const inventoryRow = page.locator('table tbody tr', { hasText: productName }).first();
  await expect(inventoryRow).toBeVisible({ timeout: 20000 });
  await expect(inventoryRow).toContainText(String(quantity));

  const adminLoginRes = await request.post(`${API_URL}/auth/login`, {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(adminLoginRes.ok()).toBeTruthy();
  const adminLoginBody = await adminLoginRes.json();
  const adminToken = pick(adminLoginBody, 'token', 'data.token');
  expect(adminToken).toBeTruthy();

  const stockRes = await request.get(`${API_URL}/inventory-ledger?search=${encodeURIComponent(productName)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(stockRes.ok()).toBeTruthy();
  const stockBody = await stockRes.json();
  const items = pick(stockBody, 'data.items', 'items') || [];
  const match = items.find((entry: any) => (entry.productName || entry.name || '').includes(productName));

  expect(match).toBeTruthy();
  expect(Number(match.availableStock ?? match.stock ?? 0)).toBe(quantity);
});
