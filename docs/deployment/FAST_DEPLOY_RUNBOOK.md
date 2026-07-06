# Fast Deploy Runbook — Vercel + Render

Practical guide based on the **Jul 5, 2026** barcode fix deployment. Use this when GitHub push succeeded but production still shows old UI, or when Vercel dashboard deploy fails.

---

## Architecture (what deploys where)

```
GitHub main (amohacodemail-ux/amoha-mobiles)
    │
    ├── Render  →  amoha-backend-v2  →  https://amoha-backend-v2.onrender.com
    │              (auto-deploy on push to main, backend/ folder)
    │
    └── Vercel    →  admin project    →  https://admin.amohamobiles.com
                   →  frontend project →  https://www.amohamobiles.com
```

| App | Host | Trigger | Working folder |
|-----|------|---------|----------------|
| Backend API | Render | Push to `main` (webhook) | `backend/` |
| Admin panel | Vercel | **Manual CLI** (recommended) | `admin/` |
| Store frontend | Vercel | Manual CLI or Git | `frontend/` |

**Important:** Pushing to GitHub updates Render automatically. It does **not** reliably update Vercel admin — use the CLI steps below.

---

## What we did (barcode fix — Jul 5, 2026)

1. Fixed barcode logic in code (`d3c259b` — CODE128 length limit, SKU default, product form).
2. Pushed to GitHub from `amoha-mobiles-push` clone (owner account `amohacodemail-ux`).
3. Render picked up the push → backend live within ~15–30 minutes.
4. Vercel admin stayed on an **8-day-old** deploy until CLI deploy succeeded.
5. Final working command (from `admin/` folder):

```powershell
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin
vercel pull --yes --environment=production
vercel deploy --prod --yes --archive=tgz --force
```

6. Verified on live site:
   - Product edit: **Use SKU**, Code 128 default, regenerate works
   - `/barcode` POS: lookup by `AMH-MOCO65KG-8AFDCD` finds product
   - API: `POST /admin/barcode/regenerate/{id}` with `CODE128` → 200

---

## What went wrong (and why)

### 1. Vercel dashboard “Deploy to Production” failed

**Error:**
```
Environment Variable "NEXT_PUBLIC_API_URL" references Secret "next_public_api_url", which does not exist.
```

**Cause:** Root `vercel.json` had:

```json
"env": { "NEXT_PUBLIC_API_URL": "@next_public_api_url" }
```

That secret was never created in the Vercel project. The **admin** project already has `NEXT_PUBLIC_API_URL=/api` set in the dashboard — the root file override broke GitHub/dashboard deploys.

**Fix applied:** Removed the broken `env` block from root `vercel.json` and pointed API rewrites at `amoha-backend-v2.onrender.com`.

---

### 2. Vercel CLI deploys stuck at `UNKNOWN` (build never started)

**Symptoms:**
- CLI showed `Building…` for 10+ minutes
- `vercel inspect` → `status: UNKNOWN`, builds `[0ms]`
- `admin.amohamobiles.com` still served the old deployment

**Cause:** Partial uploads. Without `--archive=tgz`, the CLI sometimes uploaded only changed files (~29 KB) instead of the full app. Vercel created a deployment record but never queued a real build.

**Fix:** Always use full archive upload:

```powershell
vercel deploy --prod --yes --archive=tgz --force
```

After this, build logs showed: *Running build in Washington, D.C.* → npm install → next build → **Ready** → aliased to `admin.amohamobiles.com`.

---

### 3. Node.js version warning

**Warning:**
```
Node.js version 20.x is deprecated … set "engines": { "node": "24.x" }
```

**Cause:** `admin/package.json` had `"node": "20.x"` while the Vercel project prefers 24.x.

**Fix:** Set `"engines": { "node": "24.x" }` in `admin/package.json`.

---

### 4. Git push failed with wrong GitHub account

**Error:** `Permission denied to srikrishnadeveloper`

**Cause:** Windows cached credentials for a different GitHub user.

**Fix:**
```powershell
cd c:\Users\srik2\Desktop\amoha-mobiles-push
& "C:\Program Files\Git\bin\git.exe" credential reject
# Then push again — sign in as amohacodemail-ux in the browser popup
& "C:\Program Files\Git\bin\git.exe" push origin main
```

Always push from **`amoha-mobiles-push`** (the git clone), not `amoha-mobiles-main` (working copy, not a repo).

---

### 5. `git` not found in PowerShell

**Error:** `git : The term 'git' is not recognized`

**Fix:** Use full path or prepend to PATH:

```powershell
$env:Path = "C:\Program Files\Git\bin;" + $env:Path
```

---

### 6. Render vs Vercel confusion

| Question | Answer |
|----------|--------|
| Is backend live after `git push`? | Usually **yes** — Render auto-deploys |
| Is admin UI live after `git push`? | **Not always** — use Vercel CLI |
| How to confirm backend? | `POST /admin/barcode/regenerate/...` or `/health` |
| How to confirm admin UI? | Open product edit → look for **Use SKU** button |

---

## Fast deploy checklist (use every time)

### Step 1 — Code on GitHub

```powershell
$git = "C:\Program Files\Git\bin\git.exe"
$push = "c:\Users\srik2\Desktop\amoha-mobiles-push"

# Copy changed files from main working copy → push clone if needed
# Then commit + push as amohacodemail-ux
& $git -C $push status
& $git -C $push add .
& $git -C $push commit -m "Your message"
& $git -C $push push origin main
```

Render will redeploy backend automatically (watch Render dashboard or wait ~5–10 min).

### Step 2 — Vercel admin (required for UI changes)

```powershell
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin

# One-time / if settings drift
vercel pull --yes --environment=production

# Production deploy (always use archive)
vercel deploy --prod --yes --archive=tgz --force
```

Wait for: `Aliased https://admin.amohamobiles.com` and `"readyState": "READY"`.

### Step 3 — Vercel frontend (only if store UI changed)

```powershell
cd c:\Users\srik2\Desktop\amoha-mobiles-push\frontend
vercel deploy --prod --yes --archive=tgz --force
```

Or use the script:

```powershell
.\scripts\deploy-prod.ps1 -Target admin    # admin only
.\scripts\deploy-prod.ps1 -Target both     # admin + frontend
```

### Step 4 — Verify (2 minutes)

**Backend:**
```powershell
Invoke-RestMethod https://amoha-backend-v2.onrender.com/health
```

**Admin UI (after login):**
- `/products/{id}/edit` → **Use SKU**, Code 128, “Max 20 characters”
- `/barcode` → scan/type barcode → product name appears

**CLI inspect:**
```powershell
vercel inspect admin.amohamobiles.com
# status should be Ready, created = today
```

---

## Rules to avoid repeat issues

1. **Never rely on Vercel GitHub deploy** until root `vercel.json` is clean (no missing `@secret` references).
2. **Always deploy admin with `--archive=tgz`** — avoids UNKNOWN/stuck builds.
3. **Push from `amoha-mobiles-push`** with the **owner** GitHub account.
4. **Backend = push to GitHub.** **Admin UI = Vercel CLI.** Do both for full-stack changes.
5. **Check production age:** `vercel inspect admin.amohamobiles.com` — if `created` is days old, UI is not updated.
6. **Do not commit** `.env`, `scripts/.deploy.env`, or API keys.
7. **Keep `engines.node` on 24.x** in admin/frontend `package.json` to match Vercel.

---

## One-page cheat sheet

```powershell
# === FULL STACK RELEASE ===

# 1. Push code (backend auto-deploys on Render)
$git = "C:\Program Files\Git\bin\git.exe"
& $git -C c:\Users\srik2\Desktop\amoha-mobiles-push push origin main

# 2. Deploy admin UI
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin
vercel deploy --prod --yes --archive=tgz --force

# 3. Confirm
vercel inspect admin.amohamobiles.com
start https://admin.amohamobiles.com/products
```

---

## Troubleshooting

| Problem | Action |
|---------|--------|
| Vercel `UNKNOWN` forever | Cancel deploy; rerun with `--archive=tgz --force` |
| Dashboard deploy red error about `next_public_api_url` | Remove secret ref from root `vercel.json`; use dashboard env `NEXT_PUBLIC_API_URL=/api` |
| `vercel: command not found` | `npm install -g vercel` then `vercel login` |
| Wrong GitHub user on push | Clear credentials; push again; login as `amohacodemail-ux` |
| Admin works but API 502 | Render cold start — wait 30s, retry; check Render logs |
| Barcode regenerate 500 | Backend not deployed — check Render deploy for latest commit |
| Old UI after “successful” deploy | Hard refresh (Ctrl+Shift+R) or check `vercel inspect` created date |

---

## Related files

| File | Purpose |
|------|---------|
| `scripts/deploy-prod.ps1` | Vercel deploy wrapper |
| `scripts/DEPLOY-SETUP.md` | Tooling + account reference (no secrets) |
| `scripts/render-env.ps1` | Sync backend env to Render (rare) |
| `admin/vercel.json` | Admin project build settings |
| `vercel.json` (repo root) | Monorepo config — keep free of broken secrets |

---

## Summary

- **Render:** push to GitHub → automatic → good for **backend/API** changes.
- **Vercel admin:** `vercel deploy --prod --yes --archive=tgz --force` from **`admin/`** → required for **UI** changes.
- Main failure modes were a **missing Vercel secret** in root config and **partial CLI uploads** causing stuck builds. Full archive deploy + fixed `vercel.json` resolved both.

*Last updated: Jul 6, 2026 — after barcode normalization deploy (`8cf1e87`).*

**Full incident write-up:** [BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md](./BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md)  
**Deployment index:** [DEPLOYMENT_INDEX.md](./DEPLOYMENT_INDEX.md)  
**Barcode user guide:** [../features/BARCODE_USER_GUIDE.md](../features/BARCODE_USER_GUIDE.md)
