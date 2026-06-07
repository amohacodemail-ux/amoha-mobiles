# Enterprise Delete System Audit & Strategy

## Module Deletion Status

| Module | Current Status | Delete Type | Dependencies | Notes |
|--------|---------------|-------------|--------------|-------|
| **Products** | ⚠️ Basic delete | HARD (with check) | Orders, Inventory | Needs dependency verification |
| **Categories** | ✅ Has dependency check | HARD | Products | Already protected |
| **Brands** | ✅ Has dependency check | HARD | Products | Already protected |
| **Users** | ⚠️ Hard delete | SOFT (block) | Orders, Reviews, Cart | Should block instead |
| **Suppliers** | ⚠️ Basic delete | HARD (with check) | Supplier entries, Products | Needs dependency check |
| **Inventory** | ⚠️ Warehouse only | RESTRICTED | Stock movements | Only warehouse delete allowed |
| **Orders** | ❌ No delete | PROHIBITED | Financial records | Cancel only, never delete |
| **Coupons** | ✅ Basic delete | HARD | None | Safe to delete |
| **Banners** | ✅ Basic delete | HARD | None | Safe to delete |
| **Reviews** | ✅ Basic delete | HARD | None | Safe to delete |
| **Contact Messages** | ✅ Basic delete | HARD | None | Safe to delete |
| **Service Requests** | ✅ Basic delete | HARD | None | Safe to delete |
| **Activity Logs** | ❌ No delete | PROHIBITED | Audit trail | Never delete audit records |
| **Admin Users** | ❌ No delete | HARD (admin only) | None | Add delete functionality |
| **Billing** | ❌ No delete | PROHIBITED | Financial records | Never delete |
| **Returns** | ❌ No delete | PROHIBITED | Financial records | Update status only |
| **Purchase Requests** | ⚠️ Needs check | HARD (with check) | RFQ links | Add dependency check |
| **RFQ** | ⚠️ Needs check | HARD (with check) | Supplier responses | Add dependency check |

## Role-Based Delete Permissions

| Role | Delete Permissions |
|------|-------------------|
| **Admin** | Full delete access to all modules |
| **Purchase** | Products, Inventory, Suppliers, Categories, Brands |
| **Sales** | NO delete access (read-only for financial data) |
| **Marketing** | Coupons, Banners, Reviews, Contact Messages |
| **Logistics** | NO delete access (read-only orders) |
| **Supplier** | NO delete access |

## Delete Safety Requirements

### 1. Dependency Checks Required
- **Products**: Check if linked to any orders (even cancelled)
- **Suppliers**: Check if linked to supplier entries or products
- **Categories/Brands**: Check if products exist (already implemented)
- **Users**: Check if linked to orders, reviews, or has cart items

### 2. Audit Logging (All Deletes)
- User ID who performed delete
- Timestamp
- Entity type and ID
- Entity name/summary
- Delete type (soft/hard)
- Reason (if provided)
- IP address

### 3. Error Handling
- Clear user-friendly messages
- No raw backend errors exposed
- Toast notifications for all outcomes
- Loading states during delete operation

### 4. UI Requirements
- Trash icon button (only shown if has delete permission)
- Confirmation modal with entity details
- Display dependency warnings before delete
- Immediate UI update after successful delete
- Error state if delete fails

## Implementation Checklist

- [x] Audit existing delete implementations
- [ ] Create enhanced delete service with audit logging
- [ ] Add dependency checks to product delete
- [ ] Add dependency checks to supplier delete
- [ ] Implement soft delete for users (block instead)
- [ ] Add delete to admin-users page
- [ ] Update all delete operations to log to activity_logs
- [ ] Create Playwright tests for delete flows
- [ ] Verify database integrity after deletes
- [ ] Test role-based permissions
