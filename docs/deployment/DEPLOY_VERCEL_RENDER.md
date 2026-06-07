# 🚀 Deploy to Vercel & Render
## Step-by-Step Deployment Guide

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- ✅ Database migration is ready (`backend/supabase-migration-supplier-fixes.sql`)
- ✅ Code is committed and pushed to GitHub
- ✅ Environment variables are configured
- ✅ All tests pass locally

---

## 1️⃣ Database Migration (CRITICAL - Do This First)

**Run this BEFORE deploying backend:**

### Option A: Using Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy contents of `backend/supabase-migration-supplier-fixes.sql`
5. Click **Run**
6. Verify no errors

### Option B: Using psql CLI
```bash
# Set your database URL
$env:SUPABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"

# Run migration
psql $env:SUPABASE_URL -f backend/supabase-migration-supplier-fixes.sql
```

**Verify migration worked:**
```sql
-- Check company_name column exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'company_name';

-- Check unique indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'suppliers' AND indexname LIKE '%unique%';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'suppliers';
```

---

## 2️⃣ Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New Web Service**

### Step 2: Configure Service
```yaml
# Settings:
Name: amoha-backend
Runtime: Node
Build Command: npm install --production=false && npm run build
Start Command: npm start
Root Directory: backend
```

### Step 3: Environment Variables
Add these in Render Dashboard → Environment:

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | - |
| `PORT` | `5001` | - |
| `SUPABASE_URL` | `https://[project-ref].supabase.co` | Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Settings → API (Service Role) |
| `SUPABASE_DB_PASSWORD` | `[your-password]` | Database Password |
| `JWT_ACCESS_SECRET` | `[random-string]` | Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `[random-string]` | Generate: `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRY` | `7d` | - |
| `JWT_REFRESH_EXPIRY` | `30d` | - |
| `CORS_ORIGIN` | `https://amoha-mobiles.vercel.app,https://amoha-admin.vercel.app` | Frontend URLs |
| `BCRYPT_SALT_ROUNDS` | `12` | - |
| `LOG_LEVEL` | `info` | - |
| `RAZORPAY_KEY_ID` | `[razorpay-key]` | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | `[razorpay-secret]` | Razorpay Dashboard |

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for build to complete (~2-3 minutes)
3. Copy the deployed URL: `https://amoha-backend.onrender.com`

---

## 3️⃣ Deploy Frontend to Vercel

### Option A: Using Vercel CLI (Recommended)

```powershell
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to frontend directory
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\frontend

# 4. Deploy
vercel --prod

# 5. Follow prompts:
#    - Set up and deploy? [Y/n] → Y
#    - Which scope? → Select your account
#    - Link to existing project? [y/N] → N
#    - Project name? → amoha-mobiles
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import from GitHub: `amohacodemail-ux/amoha-mobiles`
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://amoha-backend.onrender.com/api
   ```

6. Click **Deploy**

### Environment Variables for Frontend
Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://amoha-backend.onrender.com/api` |

---

## 4️⃣ Deploy Admin Panel to Vercel

### Option A: Using Vercel CLI

```powershell
# 1. Navigate to admin directory
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\admin

# 2. Deploy
vercel --prod

# 3. Follow prompts:
#    - Project name? → amoha-admin
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import from GitHub: `amohacodemail-ux/amoha-mobiles`
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `admin`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://amoha-backend.onrender.com/api
   ```

6. Click **Deploy**

---

## 5️⃣ Post-Deployment Verification

### Test Backend API
```bash
# Health check
curl https://amoha-backend.onrender.com/api/health

# Test supplier endpoint (should return 401 without auth)
curl https://amoha-backend.onrender.com/api/suppliers
```

### Test Frontend
1. Open `https://amoha-mobiles.vercel.app`
2. Verify page loads
3. Check network tab for API calls to Render backend

### Test Admin Panel
1. Open `https://amoha-admin.vercel.app`
2. Login with admin credentials
3. Navigate to Suppliers page
4. Verify all features work:
   - Add new supplier (with companyName field)
   - Duplicate detection works
   - Purchase order flow works

---

## 6️⃣ Run Playwright Tests (Post-Deploy)

```powershell
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\admin

# Install Playwright browsers (if not installed)
npx playwright install chromium

# Run tests against deployed admin panel
$env:PLAYWRIGHT_TEST_BASE_URL="https://amoha-admin.vercel.app"
npx playwright test supplier-crud.spec.ts --reporter=line

# Run purchase flow test
npx playwright test supplier-purchase-flow.spec.ts --reporter=line
```

---

## 🔧 Common Issues & Fixes

### Issue 1: Build Fails on Render
```
Error: Cannot find module 'dist/server.js'
```
**Fix:** Check build command is `npm install --production=false && npm run build`

### Issue 2: CORS Errors in Frontend
```
Access to fetch at 'https://amoha-backend...' has been blocked by CORS
```
**Fix:** Update `CORS_ORIGIN` in Render to include your Vercel URLs:
```
https://amoha-mobiles.vercel.app,https://amoha-admin.vercel.app,https://www.amoha-mobiles.vercel.app
```

### Issue 3: Database Migration Failed
```
ERROR: function min(uuid) does not exist
```
**Fix:** Use updated migration file with `ROW_NUMBER()` instead of `MIN()` - already fixed in `supabase-migration-supplier-fixes.sql`

### Issue 4: Environment Variables Not Loading
**Fix:** 
1. In Vercel/Render dashboard, verify variables are set
2. Redeploy after adding variables
3. For frontend, ensure variables start with `NEXT_PUBLIC_`

### Issue 5: Admin Panel Shows Old Code
**Fix:** 
1. Hard refresh: `Ctrl+Shift+R`
2. Clear Vercel cache and redeploy:
   ```bash
   vercel --prod --force
   ```

---

## 📝 Deployment Summary

| Component | Platform | URL Pattern | Status |
|-----------|----------|-------------|--------|
| **Backend API** | Render | `https://amoha-backend.onrender.com` | ⏳ Pending |
| **Frontend (Customer)** | Vercel | `https://amoha-mobiles.vercel.app` | ⏳ Pending |
| **Admin Panel** | Vercel | `https://amoha-admin.vercel.app` | ⏳ Pending |
| **Database** | Supabase | `https://[project-ref].supabase.co` | ✅ Ready |

---

## 🚀 Quick Deploy Commands

```powershell
# ONE-CLICK DEPLOY (run these in order)

# 1. Database Migration (MUST RUN FIRST)
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main
psql $env:SUPABASE_URL -f backend/supabase-migration-supplier-fixes.sql

# 2. Deploy Backend to Render
# (via Render dashboard - auto-deploys on push)
git push origin main

# 3. Deploy Frontend
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\frontend
vercel --prod

# 4. Deploy Admin
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\admin
vercel --prod

# 5. Run Tests
cd c:\Users\user\Documents\LogansArea\abc\amoha-mobiles-main\admin
npx playwright test supplier-crud.spec.ts --reporter=line
```

---

## ✅ Final Checklist

Before going live:
- [ ] Database migration executed successfully
- [ ] Backend deployed and responding on Render
- [ ] Frontend deployed on Vercel (customer site)
- [ ] Admin panel deployed on Vercel
- [ ] Environment variables set in all platforms
- [ ] CORS origins configured for all domains
- [ ] Playwright tests passing
- [ ] Supplier CRUD works end-to-end
- [ ] Purchase order flow works
- [ ] Error messages are user-friendly

---

**Ready to deploy! 🚀**
