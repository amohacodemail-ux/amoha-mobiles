# SAFE STARTUP GUIDE - Barcode System

## ⚠️ IMPORTANT - READ THIS FIRST

This guide will help you safely start the project and verify everything works.

---

## Step 1: Pre-Flight Checks (Before Starting)

### 1.1 Check Database Connection
```powershell
# Test Supabase connection
# Make sure your .env file has correct values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 1.2 Verify Node Versions
```powershell
# Check Node version (should be 18.x for backend, 20.x for admin)
node --version
```

---

## Step 2: Start Backend (CRITICAL - Start First)

### 2.1 Open Terminal 1 - Backend
```powershell
cd backend
```

### 2.2 Install Dependencies (if needed)
```powershell
npm install
```

### 2.3 Start Backend Server
```powershell
npm run dev
```

### 2.4 Verify Backend Started Successfully
You should see:
```
Server running on port 5000
Database connected
```

**If you see errors, STOP HERE and check:**
- Database credentials in .env
- Port 5000 is not in use
- Node version is 18.x

---

## Step 3: Test Backend API (Verify Barcode Endpoints)

### 3.1 Test Barcode Types Endpoint
Open browser or Postman:
```
GET http://localhost:5000/api/admin/barcode/types
```

Expected response:
```json
{
  "success": true,
  "data": [
    { "type": "EAN13", "name": "EAN-13 (Retail)", ... },
    { "type": "CODE128", "name": "Code 128 (Alphanumeric)", ... }
  ]
}
```

### 3.2 Test Barcode Validation
```
POST http://localhost:5000/api/admin/barcode/validate
Content-Type: application/json

{
  "barcode": "2001234567890",
  "type": "EAN13"
}
```

Expected response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "type": "EAN13"
  }
}
```

**If these work, your backend is ready!**

---

## Step 4: Start Frontend (Admin Panel)

### 4.1 Open Terminal 2 - Admin
```powershell
cd admin
```

### 4.2 Install Dependencies (if needed)
```powershell
npm install
```

### 4.3 Start Admin Panel
```powershell
npm run dev
```

### 4.4 Verify Admin Started
You should see:
```
Ready on http://localhost:3003
```

---

## Step 5: Critical Verification Tests

### Test 1: Login to Admin
1. Open http://localhost:3003
2. Login with your credentials
3. Verify dashboard loads without errors

### Test 2: Check Product List
1. Navigate to Products page
2. Verify existing products load
3. Check that barcode column shows (may be empty for old products)

### Test 3: Create Test Product (SAFE)
1. Click "Add Product"
2. Fill in:
   - Name: "TEST PRODUCT - DELETE ME"
   - Brand: Select any
   - Category: Select any
   - Price: 100
   - Original Price: 150
   - Stock: 10
   - Description: "Test description"
3. **Leave barcode field EMPTY** (will auto-generate)
4. **Select Barcode Type: "EAN-13 (Retail)"**
5. Click Create

### Expected Result:
- Product created successfully
- Barcode auto-generated (13 digits)
- No errors in console

### Test 4: Verify Barcode Display
1. Go to Barcode/POS page: http://localhost:3003/barcode
2. Look for your test product
3. Verify barcode displays visually

### Test 5: Regenerate Barcode (Existing Product)
1. Go to Products page
2. Click Edit on your test product
3. In Barcode section, click regenerate button
4. Verify new barcode is generated

---

## Step 6: Database Migration (Production)

### BEFORE applying to production:

#### 6.1 Check for Duplicate Barcodes
Run this SQL in Supabase SQL Editor:
```sql
SELECT * FROM find_duplicate_barcodes();
```

If results show duplicates:
```sql
-- Fix duplicates manually or:
UPDATE products 
SET barcode = NULL 
WHERE id IN (SELECT id FROM duplicates...);
```

#### 6.2 Apply Migration
Run file: `backend/supabase-migration-barcode.sql`

#### 6.3 Verify Migration
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'barcode_type';
```

Should return 1 row.

---

## Common Issues & Fixes

### Issue 1: "Cannot find module '../utils/barcode.util'"
**Fix**: File should exist at `backend/src/utils/barcode.util.ts`

### Issue 2: "generateBarcode is not a function"
**Fix**: Old import still present. Check `product.service.ts` imports.

### Issue 3: "Barcode column not found"
**Fix**: Run database migration first.

### Issue 4: "Unique constraint violation"
**Fix**: Check for duplicate barcodes in existing data.

### Issue 5: Barcode not displaying in UI
**Fix**: Check browser console for JsBarcode errors. Network may be blocking CDN.

---

## ROLLBACK PLAN (If Things Go Wrong)

### Backend Rollback:
```bash
cd backend
git checkout -- src/services/barcode.service.ts
git checkout -- src/controllers/barcode.controller.ts
git checkout -- src/routes/admin.routes.ts
git checkout -- src/services/product.service.ts
```

### Frontend Rollback:
```bash
cd admin
git checkout -- src/services/barcode.service.ts
git checkout -- src/components/shared/barcode-visual.tsx
git checkout -- src/components/shared/product-form.tsx
git checkout -- src/types/index.ts
```

### Database Rollback:
```sql
-- Remove barcode_type column (only if critical issues)
ALTER TABLE products DROP COLUMN IF EXISTS barcode_type;

-- Remove unique constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_barcode_unique;
```

---

## Verification Checklist

Before telling your company it's ready, verify:

- [ ] Backend starts without errors
- [ ] API endpoints respond correctly
- [ ] Admin login works
- [ ] Product list loads
- [ ] Can create product with auto-generated barcode
- [ ] Barcode displays in product table
- [ ] Can regenerate barcode on existing product
- [ ] Barcode renders in POS page
- [ ] No console errors in browser
- [ ] Database migration applied (if testing production)

---

## Support Contacts

If critical issues:
1. Check `BARCODE_SYSTEM_IMPLEMENTATION.md` for details
2. Review error logs in backend terminal
3. Check browser console for frontend errors

---

## Quick Commands Reference

```powershell
# Backend
cd backend
npm run dev

# Admin
cd admin
npm run dev

# Test API
curl http://localhost:5000/api/admin/barcode/types
```

---

**YOU ARE SAFE TO PROCEED** if:
1. All pre-flight checks pass
2. Backend starts without errors
3. API tests return expected results
4. Test product creates successfully

**STOP and contact me if:**
1. Backend crashes on start
2. API tests fail
3. Cannot create products
4. Database errors appear
