# RBAC Implementation Plan - AMOHA Mobiles

## System Analysis Summary

### Existing Modules Discovered: 29

#### Sales Modules (9)
- Dashboard (read-only view)
- Orders (full management)
- Billing & Invoices
- Reports (Sales, Orders, GST)
- Barcode/POS Counter Billing
- Returns
- Wallets

#### Purchase Modules (8)
- Products (CRUD)
- Categories (CRUD)
- Brands (CRUD)
- Inventory (Stock management)
- Suppliers (Management)
- Supplier Entries
- RFQ (Request for Quotation)
- Purchase Requests

#### Marketing Modules (6)
- Coupons (CRUD)
- Banners (CRUD)
- Reviews (Management)
- Contact Messages
- Product Views / User Activity
- Abandoned Carts
- CRM (Customer Management)

#### Admin Modules (6)
- Users (Management)
- Service Requests
- Notifications
- Activity Logs
- Policies
- Settings

---

## Role Design Matrix

### Role 1: ADMIN (Full Access)
**Access**: All 29 modules with full CRUD permissions

### Role 2: SALES
**Modules**: Dashboard, Orders, Billing, Reports, Barcode/POS, Returns, Wallets

| Module | Read | Create | Edit | Delete |
|--------|------|--------|------|--------|
| Dashboard | ✅ | - | - | - |
| Orders | ✅ | ✅ | ✅ | ❌ |
| Billing | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | - | - | - |
| Barcode/POS | ✅ | ✅ | ❌ | ❌ |
| Returns | ✅ | ✅ | ✅ | ❌ |
| Wallets | ✅ | ✅ | ❌ | ❌ |

### Role 3: PURCHASE
**Modules**: Products, Categories, Brands, Inventory, Suppliers, Supplier Entries, RFQ, Purchase Requests

| Module | Read | Create | Edit | Delete |
|--------|------|--------|------|--------|
| Products | ✅ | ✅ | ✅ | ❌ |
| Categories | ✅ | ✅ | ✅ | ❌ |
| Brands | ✅ | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ✅ | ❌ |
| Supplier Entries | ✅ | ✅ | ✅ | ❌ |
| RFQ | ✅ | ✅ | ✅ | ❌ |
| Purchase Requests | ✅ | ✅ | ✅ | ❌ |

### Role 4: MARKETING
**Modules**: Dashboard (limited), Coupons, Banners, Reviews, Contact Messages, Product Views, Abandoned Carts, CRM

| Module | Read | Create | Edit | Delete |
|--------|------|--------|------|--------|
| Dashboard | ✅ | - | - | - |
| Coupons | ✅ | ✅ | ✅ | ✅ |
| Banners | ✅ | ✅ | ✅ | ✅ |
| Reviews | ✅ | ❌ | ✅ | ✅ |
| Contact Messages | ✅ | ❌ | ✅ | ❌ |
| Product Views | ✅ | - | - | - |
| Abandoned Carts | ✅ | - | - | - |
| CRM | ✅ | ✅ | ✅ | ❌ |

---

## Permission Matrix (Module → Roles)

```
Module                | ADMIN | SALES | PURCHASE | MARKETING
----------------------|-------|-------|----------|----------
dashboard             |  R    |  R    |    -     |    R
dashboard_analytics   |  R    |  -    |    -     |    -
products              |  CRUD |  R    |   CRUD   |    R
categories            |  CRUD |  R    |   CRUD   |    -
brands                |  CRUD |  R    |   CRUD   |    -
orders                |  CRUD |  CRU   |    R     |    -
billing               |  CRUD |  CRU   |    -     |    -
reports               |  R    |  R    |    R     |    -
users                 |  CRUD |  -    |    -     |    -
coupons               |  CRUD |  -    |    -     |   CRUD
banners               |  CRUD |  -    |    -     |   CRUD
reviews               |  CRUD |  -    |    -     |   RUD
service_requests      |  CRUD |  R    |    -     |    -
contact_messages      |  CRUD |  -    |    -     |   RU
notifications         |  CRUD |  R    |    R     |    R
product_views         |  R    |  -    |    -     |    R
abandoned_carts       |  R    |  -    |    -     |    R
crm                   |  CRUD |  R    |    -     |   CRU
barcode_pos           |  CRUD |  CR   |    R     |    -
returns               |  CRUD |  CRU  |    -     |    -
wallets               |  CRUD |  RU   |    -     |    -
activity_logs         |  R    |  -    |    -     |    -
suppliers             |  CRUD |  -    |   CRUD   |    -
supplier_entries      |  CRUD |  -    |   CRUD   |    -
rfq                   |  CRUD |  -    |   CRUD   |    -
purchase_requests     |  CRUD |  -    |   CRUD   |    -
inventory             |  CRUD |  R    |   CRUD   |    R
policies              |  CRUD |  R    |    R     |    R
settings              |  CRUD |  -    |    -     |    -
```

R = Read, C = Create, U = Update, D = Delete

---

## Implementation Steps

### Phase 1: Backend Type Updates
1. Update UserRole type to include new standardized roles
2. Create permission checking utilities
3. Update middleware to support new roles

### Phase 2: Backend Route Protection
1. Group routes by module category
2. Apply role middleware to each route group
3. Add action-level permission checks where needed

### Phase 3: Frontend RBAC Hooks
1. Create usePermissions hook
2. Create useRBAC hook for role checking
3. Create permission constants

### Phase 4: Frontend Navigation
1. Update sidebar with role-based filtering
2. Create navigation permission map
3. Implement dynamic menu rendering

### Phase 5: Frontend Route Protection
1. Create withAuth HOC
2. Update layout to check permissions
3. Create AccessDenied component

### Phase 6: UI Enhancements
1. Add role badge to header
2. Create permission-based UI element hiding
3. Update action buttons based on permissions

### Phase 7: Testing
1. Create Playwright tests for each role
2. Test API access restrictions
3. Test UI element visibility
