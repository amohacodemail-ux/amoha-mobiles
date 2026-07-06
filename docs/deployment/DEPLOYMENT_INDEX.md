# Deployment Documentation Index

**Last updated:** July 6, 2026

Central index for deploying AMOHA Mobiles (admin, frontend, backend).

---

## Production URLs

| Service | URL |
|---------|-----|
| Store | https://www.amohamobiles.com |
| Admin | https://admin.amohamobiles.com |
| API | https://amoha-backend-v2.onrender.com/api |
| GitHub | `amohacodemail-ux/amoha-mobiles` |

---

## Architecture

```
GitHub main
    ├── Render  → backend/     → amoha-backend-v2.onrender.com  (auto on push)
    └── Vercel  → admin/       → admin.amohamobiles.com
              → frontend/    → www.amohamobiles.com
```

---

## Documents in this folder

| Document | Purpose |
|----------|---------|
| [FAST_DEPLOY_RUNBOOK.md](./FAST_DEPLOY_RUNBOOK.md) | **Start here** — cheat sheet, CLI commands, troubleshooting |
| [BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md](./BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md) | Full Jul 5–6 incident: what broke, why deploy took hours |
| [DEPLOY_VERCEL_RENDER.md](./DEPLOY_VERCEL_RENDER.md) | General Vercel + Render setup |
| [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) | Step-by-step deploy instructions |
| [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) | Pre-release checklist |
| [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md) | Historical deployment notes |

---

## Quick deploy (full stack)

```powershell
$git = "C:\Program Files\Git\bin\git.exe"
$push = "c:\Users\srik2\Desktop\amoha-mobiles-push"

# 1. Push code (Render backend auto-deploys)
& $git -C $push add .
& $git -C $push commit -m "Your message"
& $git -C $push push origin main

# 2. Vercel admin (Git push usually triggers build automatically)
#    If UI not updated after 3 min, run:
cd c:\Users\srik2\Desktop\amoha-mobiles-push\admin
vercel deploy --prod --yes --archive=tgz --force

# 3. Verify
vercel inspect admin.amohamobiles.com
Invoke-RestMethod https://amoha-backend-v2.onrender.com/health
```

---

## Working folders

| Folder | Purpose |
|--------|---------|
| `amoha-mobiles-main` | Local working copy (edit here) |
| `amoha-mobiles-push` | Git clone — **push to GitHub from here** |

Sync changed files from `main` → `push` before commit.

---

## Latest production deploys (barcode work)

| Date | Commit | Deployment |
|------|--------|------------|
| Jul 6, 2026 | `8cf1e87` | EAN/UPC normalization — `dpl_*` (Git deploy) |
| Jul 6, 2026 | `98bbada` | Vercel config + Node 24 |
| Jul 5, 2026 | `24827e9` | Barcode type persistence fix |
| Jul 5, 2026 | `d3c259b` | CODE128 length / SKU default |

---

## Common issues

| Problem | Doc section |
|---------|-------------|
| Vercel `UNKNOWN` stuck build | [FAST_DEPLOY_RUNBOOK.md §2](./FAST_DEPLOY_RUNBOOK.md) |
| Missing Vercel secret error | [FAST_DEPLOY_RUNBOOK.md §1](./FAST_DEPLOY_RUNBOOK.md) |
| Backend not updated after push | Check Render dashboard; wait 5–15 min |
| Admin UI old after “deploy” | `vercel inspect` — check `created` date |
| Barcode save not working | [BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md](./BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md) |

---

## Related

- [../features/BARCODE_USER_GUIDE.md](../features/BARCODE_USER_GUIDE.md)
- [../features/BARCODE_FIXES_CHANGELOG.md](../features/BARCODE_FIXES_CHANGELOG.md)
- `scripts/DEPLOY-SETUP.md` (repo root scripts folder)
