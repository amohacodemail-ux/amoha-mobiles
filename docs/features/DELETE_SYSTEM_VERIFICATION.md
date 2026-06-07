# Enterprise Delete System - End-to-End Verification Guide

## 🔧 Fixes Applied

### 1. Frontend Role Permissions (admin/src/lib/permissions.ts)
- **Purchase Role**: Added DELETE permission to:
  - MODULES.PRODUCTS
  - MODULES.CATEGORIES  
  - MODULES.BRANDS
  - MODULES.INVENTORY
  - MODULES.SUPPLIERS
  - MODULES.SUPPLIER_ENTRIES
  - MODULES.RFQ
  - MODULES.PURCHASE_REQUESTS

### 2. Backend Route Permissions Fixed

| Route | Before | After |
|-------|--------|-------|
| `DELETE /admin/products/:id` | `canAccessAdminOnly` | `canAccessPurchase` ✅ |
| `DELETE /admin/categories/:id` | `canAccessAdminOnly` | `canAccessPurchase` ✅ |
| `DELETE /admin/brands/:id` | `canAccessAdminOnly` | `canAccessPurchase` ✅ |
| `DELETE /suppliers/:id` | `canAccessAdminOnly` | `canAccessPurchase` ✅ |
| `DELETE /suppliers/:id/products/:productId` | `canAccessAdminOnly` | `canAccessPurchase` ✅ |
| `DELETE /admin/banners/:id` | `canAccessAdminOnly` | `canAccessMarketing` ✅ |
| Coupon Routes (all) | `isAdmin` | `canAccessMarketing` ✅ |

### 3. Audit Logging Implemented
All delete services now log to activity_logs with:
- Admin/Marketing user ID
- IP address
- Timestamp
- Entity details (name, code, etc.)
- Related record counts

---

## 🧪 End-to-End Testing Steps

### Test 1: Purchase Role Delete Permissions

```bash
# Login as purchase user
Email: purchase@amoha.com
Password: purchase123

# Test: Should SEE delete buttons on:
1. Products page (/products)
2. Brands page (/brands)
3. Categories page (/categories)
4. Suppliers page (/suppliers)

# Test: Should NOT see delete buttons on:
1. Orders page (/orders) - should be read-only or no access
2. Coupons page (/coupons) - should be no access
```

### Test 2: Sales Role Delete Permissions

```bash
# Login as sales user
Email: sales@amoha.com
Password: sales123

# Test: Should NOT see delete buttons on:
1. Products page (/products) - read-only, no delete
2. Brands page (/brands) - no access
3. Categories page (/categories) - no access
4. Suppliers page (/suppliers) - no access

# Test: Can access but not delete:
1. Orders page (/orders) - can edit but not delete
2. Billing page (/billing) - can edit but not delete
```

### Test 3: Marketing Role Delete Permissions

```bash
# Login as marketing user
Email: marketing@amoha.com
Password: marketing123

# Test: Should SEE delete buttons on:
1. Coupons page (/coupons)
2. Banners page (/banners)
3. Reviews page (/reviews)

# Test: Should NOT see delete buttons on:
1. Products page (/products) - read-only only
2. Orders page (/orders) - no access
```

### Test 4: Admin Full Access

```bash
# Login as admin
Email: admin@amoha.com
Password: admin123

# Test: Should SEE delete buttons on ALL modules:
1. Products, Brands, Categories
2. Suppliers, Inventory
3. Coupons, Banners, Reviews
4. Users (if user deletion is enabled)
```

---

## 🔒 Dependency Protection Testing

### Test 5: Cannot Delete Product with Orders

```bash
# 1. Create a product (or use existing)
# 2. Create an order with that product
# 3. Try to delete the product
# Expected: Error toast - "Cannot delete product: Linked to N orders"
```

### Test 6: Cannot Delete Brand with Products

```bash
# 1. Go to Brands page
# 2. Try to delete a brand that has products (e.g., Samsung)
# Expected: Error toast - "Cannot delete brand: N products linked"
```

### Test 7: Can Delete Brand with No Products

```bash
# 1. Create a new test brand
# 2. Ensure it has 0 products
# 3. Delete it
# Expected: Success toast + instant UI update
```

---

## 📝 Audit Log Verification

### Test 8: Verify Audit Logs

```bash
# 1. Perform a delete action (as any role)
# 2. Navigate to Activity Logs (/activity-logs)
# 3. Verify the delete action is logged with:
   - User ID
   - Action type (DELETE_*)
   - Entity name
   - Timestamp
   - IP address
```

---

## 🎭 Playwright Test Execution

```bash
# Run all delete system tests
cd admin
npx playwright test delete-system.spec.ts --headed

# Run specific test groups
npx playwright test delete-system.spec.ts -g "Role-Based"
npx playwright test delete-system.spec.ts -g "Dependency Protection"
npx playwright test delete-system.spec.ts -g "Audit Logging"
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Access Denied" when trying to delete
**Cause**: Role middleware not updated
**Fix**: Applied - Changed from `canAccessAdminOnly` to `canAccessPurchase`/`canAccessMarketing`

### Issue 2: Delete button not showing for Purchase role
**Cause**: Frontend permissions didn't include DELETE for purchase
**Fix**: Applied - Added DELETE to purchase role permissions in `permissions.ts`

### Issue 3: Marketing can't access coupons
**Cause**: Coupon routes restricted to `isAdmin` only
**Fix**: Applied - Changed to `canAccessMarketing`

---

## ✅ Production Verification Checklist

Before deploying to production:

- [ ] Run full Playwright test suite
- [ ] Verify all delete routes have proper role protection
- [ ] Test dependency checks (brand with products, etc.)
- [ ] Verify audit logs are being created
- [ ] Test with all roles (admin, purchase, sales, marketing)
- [ ] Verify error messages are user-friendly
- [ ] Ensure no sensitive data in error messages
- [ ] Test UI updates immediately after delete
- [ ] Verify loading states during delete operation

---

## 📊 Permission Matrix Summary

| Module | Admin | Purchase | Sales | Marketing |
|--------|-------|----------|-------|-----------|
| **Products** | CRUD | CRUD | R | - |
| **Brands** | CRUD | CRUD | R | - |
| **Categories** | CRUD | CRUD | R | - |
| **Suppliers** | CRUD | CRUD | - | - |
| **Inventory** | CRUD | CRUD | R | - |
| **Coupons** | CRUD | - | - | CRUD |
| **Banners** | CRUD | - | - | CRUD |
| **Reviews** | CRUD | - | - | RUD |
| **Orders** | CRUD | - | CRU | - |
| **Users** | CRUD | - | - | - |

Legend: C=Create, R=Read, U=Update, D=Delete

---

## 🚀 Backend Build Verification

```bash
# Verify TypeScript compilation succeeds
cd backend
npm run build

# Expected output:
# > amoha-mobiles-backend@1.0.0 build
# > tsc
# (no errors, exit code 0)
```

---

## 📞 Support

If issues persist after these fixes:

1. Check browser console for API errors
2. Verify user role in JWT token (check localStorage/sessionStorage)
3. Review backend logs for permission denials
4. Run Playwright tests to isolate the issue
