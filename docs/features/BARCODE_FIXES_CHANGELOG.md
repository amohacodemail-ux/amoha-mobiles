# Barcode System — Fixes Changelog (July 2026)

**Production status:** Live as of July 6, 2026  
**Latest commit:** `8cf1e87`

This document records every barcode-related fix shipped in July 2026, in order.

---

## Commit timeline

| Commit | Date | Summary |
|--------|------|---------|
| `d3c259b` | Jul 5 | CODE128 length limit (20 chars), SKU default, regenerate 500 fix |
| `24827e9` | Jul 5 | Barcode type not persisting on product save (validator strip) |
| `98bbada` | Jul 6 | Node 24 + Vercel config for reliable Git deploys |
| `8cf1e87` | Jul 6 | EAN/UPC preview fix, check-digit normalization on save |

---

## Fix 1 — CODE128 regenerate 500 error (`d3c259b`)

### Problem
`POST /admin/barcode/regenerate/:id` returned 500 for CODE128 products.

### Cause
- DB column `products.barcode` is `VARCHAR(20)`
- Old generator produced ~21 characters (`AMH-{timestamp}-{8hex}`)

### Solution
- `MAX_BARCODE_LENGTH = 20` in `barcode.util.ts`
- CODE128 regenerate prefers product **SKU** first
- New products default to SKU + CODE128

### Files
- `backend/src/utils/barcode.util.ts`
- `backend/src/services/barcode.service.ts`
- `backend/src/services/product.service.ts`
- `admin/src/components/shared/product-form.tsx`

---

## Fix 2 — Barcode type change not saving (`24827e9`)

### Problem
User sets EAN, later changes to Code 128 → preview wrong, save does not persist type.

### Causes
1. **Zod validator** — `product.validator.ts` omitted `barcode` and `barcodeType` → middleware stripped them from `PUT /admin/products/:id`
2. **Preview** — stale SVG/error when type changed
3. **Form** — Select defaulted to `EAN13` instead of `CODE128`

### Solution
- Add `barcode` and `barcodeType` to create/update Zod schemas
- `BarcodeVisual`: clear SVG, remount on type change (`key={code-type}`)
- Form always sends `barcodeType`; Select default `CODE128`

### Files
- `backend/src/validators/product.validator.ts`
- `admin/src/components/shared/barcode-visual.tsx`
- `admin/src/components/shared/product-form.tsx`

---

## Fix 3 — Deploy reliability (`98bbada`)

### Problem
Vercel CLI deploys stuck at `UNKNOWN`; dashboard deploy failed on missing secret.

### Solution
- Remove broken `@next_public_api_url` from root `vercel.json`
- Set `engines.node` to `24.x` in `admin/package.json`
- Prefer **Git push → Vercel build** over flaky CLI uploads

### Files
- `vercel.json`
- `admin/package.json`

---

## Fix 4 — EAN/UPC preview and save normalization (`8cf1e87`)

### Problems
| Symptom | Root cause |
|---------|------------|
| UPC-A: “needs 12 digits” with 12 digits entered | JsBarcode format is `UPC`, app sent `UPCA` |
| EAN-13: preview adds digit, save fails | Backend required 13 digits; user entered 12 (base only) |
| Misleading “Invalid format” | Generic error messages |

### Solution

**New shared module:** `admin/src/lib/barcode-utils.ts`
- `toJsBarcodeFormat()` — maps `UPCA` → `UPC`
- `normalizeBarcodeValue()` — appends check digit for EAN-13 (12→13), EAN-8 (7→8), UPC-A (11→12)
- `getBarcodePreviewError()` — specific error messages per type
- `barcodeTypeHint()` — helper text in product form
- `resolvePrintFormat()` — correct format for print popups

**Backend:** `normalizeBarcodeValue()` in `barcode.util.ts`
- `validateBarcode()` returns `{ valid, error?, normalized? }`
- `product.service.ts` saves `validation.normalized` value

**Admin:**
- `barcode-visual.tsx` — uses `toJsBarcodeFormat` and better errors
- `product-form.tsx` — normalizes before save; updated hints
- `barcode/page.tsx` — print uses `barcodeType` from product

### Verified on production
```
EAN13  123456789012  → saved 1234567890128
UPCA   123456789012  → saved 123456789012
CODE128 AMH-MOCO65KG-8AFDCD → restored OK
```

---

## File reference (all barcode-related)

### Backend
| File | Role |
|------|------|
| `backend/src/utils/barcode.util.ts` | Validation, checksum, normalization, generation |
| `backend/src/services/barcode.service.ts` | Regenerate, validate API, bulk generate |
| `backend/src/services/product.service.ts` | Create/update barcode logic |
| `backend/src/validators/product.validator.ts` | Allows `barcode` + `barcodeType` in API body |
| `backend/src/controllers/barcode.controller.ts` | HTTP handlers |
| `backend/src/routes/admin.routes.ts` | Route wiring |

### Admin
| File | Role |
|------|------|
| `admin/src/lib/barcode-utils.ts` | Client checksum, JsBarcode format mapping, hints |
| `admin/src/components/shared/barcode-visual.tsx` | SVG preview component |
| `admin/src/components/shared/product-form.tsx` | Product edit UI |
| `admin/src/app/(admin)/barcode/page.tsx` | POS billing, labels, print |
| `admin/src/services/barcode.service.ts` | API client |

---

## JsBarcode format mapping

| App type (`barcodeType`) | JsBarcode `format` |
|--------------------------|-------------------|
| `EAN13` | `EAN13` |
| `EAN8` | `EAN8` |
| `UPCA` | **`UPC`** ← must map |
| `CODE128` | `CODE128` |
| `CODE39` | `CODE39` |

---

## API behaviour (after fixes)

### Create / update product
```
PUT /api/admin/products/:id
{
  "barcodeType": "EAN13",
  "barcode": "123456789012"    // 12 digits OK — check digit added
}
```

### Regenerate
```
POST /api/admin/barcode/regenerate/:productId
{ "type": "CODE128" }         // Uses SKU when possible
```

### Validate
```
POST /api/admin/barcode/validate
{ "value": "123456789012", "type": "EAN13" }
```

---

## Related docs

- [BARCODE_USER_GUIDE.md](./BARCODE_USER_GUIDE.md) — Test values and daily usage
- [BARCODE_SYSTEM_IMPLEMENTATION.md](./BARCODE_SYSTEM_IMPLEMENTATION.md) — Original system design
- [../deployment/BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md](../deployment/BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md) — Deploy incident report
- [../deployment/FAST_DEPLOY_RUNBOOK.md](../deployment/FAST_DEPLOY_RUNBOOK.md) — How to deploy
