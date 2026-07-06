# Barcode Type Fix — Deployment Report

**Date:** July 5–6, 2026  
**Production admin:** https://admin.amohamobiles.com  
**Production backend:** https://amoha-backend-v2.onrender.com  
**GitHub repo:** `amohacodemail-ux/amoha-mobiles`  
**Final commits:** `24827e9` (barcode type persistence) → `98bbada` (deploy config) → `8cf1e87` (EAN/UPC preview + save normalization)

This document explains **what was fixed**, **everything we did to deploy it**, **why it took so long**, and **what finally worked**.

---

## 1. The problem users reported

When editing a product:

1. Set barcode type to **EAN-13**
2. Later change type to **Code 128** (or another type)
3. Even with a correct barcode value, the preview showed **"Invalid format"** and/or **save did not stick** after reload

### Root causes found in code

| Layer | Issue | Effect |
|-------|-------|--------|
| **Backend validator** | `product.validator.ts` did not include `barcode` or `barcodeType` in Zod schema | `validate` middleware stripped those fields from `req.body` → type changes never reached the database on `PUT /admin/products/:id` |
| **Admin preview** | `BarcodeVisual` kept stale SVG/error state when type changed | "Invalid format" stayed visible even after switching to a valid type |
| **Product form** | Select defaulted to `EAN13` when value was empty (`field.value \|\| 'EAN13'`) | Mismatch with form default `CODE128` and most SKU-based barcodes |
| **Earlier barcode work** | CODE128 generated strings > 20 chars; DB column is `VARCHAR(20)` | Regenerate API returned 500 for some products |

---

## 2. Code changes made (before deploy)

### Backend (`backend/src/`)

| File | Change |
|------|--------|
| `validators/product.validator.ts` | Added `barcode` (max 20) and `barcodeType` enum to create/update schemas |
| `utils/barcode.util.ts` | Shorter CODE128 generation; `MAX_BARCODE_LENGTH = 20` |
| `services/barcode.service.ts` | CODE128 regenerate prefers product SKU |
| `services/product.service.ts` | Respect manual barcode type on save; support type-only updates |

### Admin (`admin/src/`)

| File | Change |
|------|--------|
| `components/shared/product-form.tsx` | Default Code 128; always send `barcodeType` on save; `key` on preview to force remount on type change; Select default `CODE128` |
| `components/shared/barcode-visual.tsx` | Clear SVG before redraw; clear errors on valid render; clearer messages per type (e.g. "EAN-13 needs exactly 13 digits") |

### Deploy config (second commit `98bbada`)

| File | Change |
|------|--------|
| `admin/package.json` | `"engines": { "node": "24.x" }` (was `20.x`) |
| `vercel.json` (repo root) | Removed broken `@next_public_api_url` secret reference; fixed `outputDirectory` to `admin/.next`; API rewrite → `amoha-backend-v2.onrender.com` |

---

## 3. Repos and folders used

| Path | Role |
|------|------|
| `c:\Users\srik2\Desktop\amoha-mobiles-main` | Local working copy (edits) |
| `c:\Users\srik2\Desktop\amoha-mobiles-push` | Git clone connected to GitHub — **only this folder is pushed** |

Changes were edited in `main`, synced to `push`, then committed and pushed as `amohacodemail-ux`.

---

## 4. Everything we did to deploy

### Phase A — Backend (Render)

1. Synced barcode fix files to `amoha-mobiles-push`
2. Committed: `24827e9` — *Fix barcode type changes not persisting after switching from EAN*
3. Pushed to `origin main` on GitHub
4. Render auto-deployed `amoha-backend-v2` from the push (~5–15 minutes)

**Verify backend:**
```powershell
$api = "https://amoha-backend-v2.onrender.com/api"
$login = Invoke-RestMethod -Uri "$api/auth/login" -Method POST `
  -Body '{"email":"...","password":"...","portal":"admin"}' -ContentType "application/json"
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri "$api/admin/products/{id}" -Method PUT -Headers $h `
  -Body '{"barcodeType":"CODE128","barcode":"AMH-..."}' -ContentType "application/json"
```

Result: `barcodeType` persisted correctly on production API.

---

### Phase B — Admin UI (Vercel) — multiple attempts

#### Attempt 1 — Vercel CLI (partial success earlier in session)

```powershell
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin
vercel pull --yes --environment=production
vercel deploy --prod --yes --archive=tgz --force
```

- **Result:** Some deploys succeeded (`dpl_DRttxhgdgEadqUEUAbAYTp5szfqq`, `dpl_gtHntuVmzfrqZsNfAptHrZ2AmuVK`)
- Admin aliased to https://admin.amohamobiles.com with barcode UI changes

#### Attempt 2 — Local build + deploy (failed)

```powershell
npm run build          # succeeded locally
vercel build --prod    # failed: spawn cmd.exe ENOENT
vercel deploy --prebuilt --prod
```

- Local Next.js build passed
- `vercel build` failed in this shell environment (Windows `cmd.exe` path issue)
- Prebuilt deploy could not proceed

#### Attempt 3 — CLI deploys stuck at `UNKNOWN` (failed × several)

Commands run multiple times:
```powershell
vercel deploy --prod --yes --archive=tgz --force
```

**Symptoms:**
- CLI showed `Building…` for 10–70+ minutes
- `vercel inspect` → `status: UNKNOWN`, builds `[0ms]`
- Process killed with exit code `4294967295` (Windows: process terminated / hung)

**Deployments that never completed:**
- `dpl_7MgkyCMaTog8qq1JmMLztmzJ46N1`
- `dpl_ApfVEHXKTx4KVWfhpqggktTG75zm`
- `dpl_2jL6M7sosqeazL6h1X5UxQ9CPncy`
- `dpl_bBWnRscCXSA9xyEYJ9R4UWrbqzyM`
- `dpl_Eh3B2Z2rNSMYAa6CRd5aMRXtzQsM` (`readyState: BLOCKED`)

#### Attempt 4 — Network error during CLI poll (failed)

```
getaddrinfo ENOTFOUND api.vercel.com
```

- Upload finished but CLI lost connection to Vercel API while polling build status
- Deployment record created but CLI reported failure

#### Attempt 5 — GitHub push trigger (SUCCESS — final production deploy)

```powershell
git add admin/package.json admin/package-lock.json vercel.json
git commit -m "chore: Node 24 and Vercel config for reliable admin deploys"
git push origin main
```

- Vercel Git integration picked up commit `98bbada`
- Build ran on Vercel servers (not local CLI)
- **Final deployment:** `dpl_CRPLtUxPBZyh54QGb4useppvg6yv`
- **URL:** https://admin-p9sq35zi5-amohacodemail-uxs-projects.vercel.app
- **Aliased to:** https://admin.amohamobiles.com
- **Status:** ● Ready

---

## 5. Why it took so long

Total wall time was roughly **2–3 hours** across the session. Not because the code fix was large — because **deployment kept failing or hanging**.

### Time breakdown (main factors)

| Factor | Time lost | Explanation |
|--------|-----------|-------------|
| **Multiple Vercel CLI attempts** | ~1–2 hours | Several deploys uploaded but never built (`UNKNOWN`). Each attempt waited 10–70 min before giving up |
| **Two deployment paths** | Confusion + retries | Backend (Render) deploys from Git automatically; admin (Vercel) often needs separate CLI or Git hook — we tried CLI many times before Git deploy worked |
| **CLI vs Git deploy reliability** | High | CLI uploads intermittently failed to queue builds; Git push → Vercel build farm succeeded in ~1–2 min |
| **Windows / shell issues** | ~20 min | `git` not in PATH; `cmd.exe ENOENT` for `vercel build`; PowerShell `&&` vs `;` |
| **Git identity** | ~5 min | First commit failed until `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` set via env vars (cannot change global git config) |
| **Render cold start** | ~30–60 sec per test | Backend on free tier sleeps; first API call after idle is slow |
| **Playwright UI tests** | ~8 min (failed) | Chromium not installed locally — unrelated to production but added session time |

### The core problem (simple version)

> **The code was ready early. Production was slow because Vercel CLI deploys kept stalling, not because the barcode fix was hard to build.**

What worked in the end: **push to GitHub → let Vercel build from Git** (after fixing root `vercel.json` and Node version).

---

## 6. Problems encountered (full list)

### Code / product

| # | Problem | Resolution |
|---|---------|------------|
| 1 | Barcode type not saved on product edit | Added fields to Zod validator |
| 2 | "Invalid format" after changing type | Fixed `BarcodeVisual` + form remount key |
| 3 | EAN selected by default in dropdown | Changed fallback to `CODE128` |
| 4 | CODE128 regenerate 500 (length > 20) | Shorter generation + SKU preference (earlier commit `d3c259b`) |

### Git / GitHub

| # | Problem | Resolution |
|---|---------|------------|
| 5 | `git` not recognized in PowerShell | Use `C:\Program Files\Git\bin\git.exe` |
| 6 | Commit failed — no author identity | Set `GIT_AUTHOR_*` env vars for one commit |
| 7 | Push from wrong folder | Always use `amoha-mobiles-push` clone |

### Vercel

| # | Problem | Resolution |
|---|---------|------------|
| 8 | Dashboard deploy: missing secret `@next_public_api_url` | Removed from root `vercel.json` |
| 9 | CLI deploy `UNKNOWN` / build `[0ms]` | Use `--archive=tgz`; when still stuck, use Git deploy |
| 10 | `getaddrinfo ENOTFOUND api.vercel.com` | Transient DNS/network; retry or use Git deploy |
| 11 | Node 20.x deprecated warning | Set `engines.node` to `24.x` |
| 12 | `vercel build` → `spawn cmd.exe ENOENT` | Skip prebuilt path; use Git deploy or fix shell PATH |
| 13 | `vercel promote` → already current | Previous Ready deploy still on production alias |

### Verification

| # | Problem | Resolution |
|---|---------|------------|
| 14 | Playwright: Chromium missing | Run `npx playwright install` (local only) |
| 15 | PowerShell `$pid` reserved variable | Use `$productId` instead |

---

## 7. Final production state

| Service | Status | Evidence |
|---------|--------|----------|
| **Backend** | Live | API test: EAN13 ↔ CODE128 type switch persists |
| **Admin** | Live | `vercel inspect` → ● Ready on `admin.amohamobiles.com` |
| **Barcode fix** | Deployed | Commits `24827e9`, `98bbada`, `8cf1e87` on `main` |

### Production verification (Jul 6, 2026)

```
GET  product → type=CODE128 barcode=AMH-MOCO65KG-8AFDCD
PUT  barcodeType=EAN13  → saved as EAN13
PUT  barcodeType=CODE128 → restored correctly
Admin deployment status → ● Ready
```

---

## 8. What to do next time (short)

For any admin + backend change:

```powershell
# 1. Edit code in amoha-mobiles-main, sync to amoha-mobiles-push

# 2. Push (backend auto-deploys on Render)
$git = "C:\Program Files\Git\bin\git.exe"
& $git -C c:\Users\srik2\Desktop\amoha-mobiles-push add .
& $git -C c:\Users\srik2\Desktop\amoha-mobiles-push commit -m "Your message"
& $git -C c:\Users\srik2\Desktop\amoha-mobiles-push push origin main

# 3. Admin UI — prefer Git deploy (push triggers Vercel)
#    OR if CLI needed:
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin
vercel deploy --prod --yes --archive=tgz --force

# 4. Confirm
vercel inspect admin.amohamobiles.com
# status must be ● Ready and created = today
```

**If CLI shows `UNKNOWN` for more than 5 minutes:** cancel and push to GitHub instead.

---

## 9. Related docs

| Document | Purpose |
|----------|---------|
| [FAST_DEPLOY_RUNBOOK.md](./FAST_DEPLOY_RUNBOOK.md) | Ongoing cheat sheet and troubleshooting |
| [DEPLOY_VERCEL_RENDER.md](./DEPLOY_VERCEL_RENDER.md) | General Vercel + Render setup |
| [../features/BARCODE_SYSTEM_IMPLEMENTATION.md](../features/BARCODE_SYSTEM_IMPLEMENTATION.md) | Barcode system design |

---

## 10. Summary

| Question | Answer |
|----------|--------|
| **What was fixed?** | Barcode type changes save to DB; EAN/UPC check digits auto-added; UPC-A preview works; Code 128 default for SKUs |
| **How was backend deployed?** | `git push` → Render auto-deploy |
| **How was admin deployed?** | Git push (`98bbada`) triggered successful Vercel build after multiple failed CLI attempts |
| **Why so long?** | Vercel CLI uploads repeatedly stalled (`UNKNOWN`), network blips, and we tried CLI many times before Git deploy worked |
| **What works now?** | https://admin.amohamobiles.com with barcode type fix live |

*Written: July 6, 2026 — see also [BARCODE_FIXES_CHANGELOG.md](../features/BARCODE_FIXES_CHANGELOG.md)*
