# Barcode System — User Guide

**Last updated:** July 6, 2026  
**Admin:** https://admin.amohamobiles.com  
**Where to edit:** Products → Add/Edit → **Barcode Information**

---

## Quick rules

| Product type | Use this barcode type | Example value |
|--------------|----------------------|---------------|
| AMOHA SKU (letters + numbers) | **Code 128** | `AMH-MOCO65KG-8AFDCD` |
| Retail product (13-digit standard) | **EAN-13** | `123456789012` → saves as `1234567890128` |
| Small retail item | **EAN-8** | `1234567` → saves as `12345670` |
| North America retail | **UPC-A** | `123456789012` |
| Industrial / legacy labels | **Code 39** | `ABC123` |

**Default for new products:** Code 128 (uses SKU when left empty).

---

## Barcode types explained

### Code 128 (recommended for AMOHA)
- **Use for:** SKUs, internal codes, mixed letters and numbers
- **Length:** 1–20 characters (DB limit)
- **Characters:** Printable ASCII (A–Z, 0–9, `-`, etc.)
- **Button:** **Use SKU** copies the product SKU into the barcode field

### EAN-13 (retail standard)
- **Use for:** Standard retail products sold in stores worldwide
- **Digits only:** No letters
- **Length:** 12 digits (check digit added automatically) **or** 13 full digits
- **Check digit:** Last digit is calculated by the system — you do **not** pick it randomly

### EAN-8 (small retail)
- **Use for:** Small packages where EAN-13 is too long
- **Digits only**
- **Length:** 7 digits (check digit added) **or** 8 full digits

### UPC-A (North America)
- **Use for:** US/Canada retail barcodes (12 digits)
- **Digits only**
- **Length:** 11 digits (check digit added) **or** 12 full digits
- **Note:** UPC-A is compatible with EAN-13 (EAN-13 = `0` + UPC-A for many codes)

### Code 39
- **Use for:** Industrial / warehouse labels
- **Characters:** `0-9`, `A-Z`, space, `-. $/+%`

---

## Check digit (why a digit is “added” at the end)

For **EAN-13**, **EAN-8**, and **UPC-A**, the **last digit is a check digit**:

- It is **not a mistake** and **not your fault**
- The preview library (JsBarcode) calculates it when you enter the base digits
- On **save**, the backend also adds it if you only entered the base digits

**Example (EAN-8):**
```
You type:     1234567
Preview/show: 12345670   ← 0 is the check digit
```

**Example (EAN-13):**
```
You type:     123456789012
Preview/show: 1234567890128   ← 8 is the check digit
```

---

## Test values (copy-paste)

### Code 128
```
AMH-MOCO65KG-8AFDCD
TEST-001
ABC123
```

### EAN-13
| Type in form | Saved value |
|--------------|-------------|
| `123456789012` | `1234567890128` |
| `890123456789` | `8901234567890` |
| `590123412345` | `5901234123457` |

Full 13-digit (type directly):
```
1234567890128
8901234567890
5901234123457
```

### EAN-8
| Type in form | Saved value |
|--------------|-------------|
| `1234567` | `12345670` |
| `9638507` | `96385074` |
| `4012345` | `40123455` |

### UPC-A
| Type in form | Saved value |
|--------------|-------------|
| `12345678901` | `123456789012` |
| `03600029145` | `036000291452` |
| `01234567890` | `012345678905` |

Full 12-digit:
```
123456789012
036000291452
012345678905
```

### Code 39
```
ABC123
TEST-001
PRODUCT 99
AMH-001
```

---

## Values that should fail (validation test)

| Type | Bad value | Expected error |
|------|-----------|----------------|
| EAN-13 | `AMH-MOCO65KG` | Digits only |
| EAN-13 | `12345` | Wrong length |
| EAN-8 | `123456789` | Wrong length |
| UPC-A | `123456789011` | Invalid check digit |
| Code 128 | (empty with no SKU on create) | Auto-generated from SKU on create |
| Any EAN/UPC | SKU with letters | Use Code 128 instead |

---

## Product form workflow

1. Open **Products** → **Edit** (or Add)
2. Scroll to **Barcode Information**
3. Select **Barcode Type**
4. Enter value **or** click **Use SKU** (Code 128) **or** leave empty to auto-generate
5. Check **Preview** — barcode image should render (no red error)
6. **Save** → reload page → type and value should match what you saved

---

## POS / Barcode page

- **Counter Billing:** Scan or type barcode/SKU → **Lookup**
- **Products & Barcodes:** View all products, print labels, regenerate
- Print uses the product’s stored `barcodeType` (UPC-A maps correctly to `UPC` for printing)

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| SKU in EAN-13 field | Switch to **Code 128** |
| “Invalid format” after changing type | Hard refresh (Ctrl+Shift+R); ensure type matches value |
| Preview shows extra digit | Normal — check digit; save will store full number |
| UPC-A error with 12 digits | Fixed in July 2026 deploy — update admin if still broken |
| Barcode longer than 20 chars | Max 20 chars in DB; use shorter SKU or Code 128 |

---

## Related docs

- [BARCODE_SYSTEM_IMPLEMENTATION.md](./BARCODE_SYSTEM_IMPLEMENTATION.md) — Technical architecture
- [BARCODE_FIXES_CHANGELOG.md](./BARCODE_FIXES_CHANGELOG.md) — All fixes (July 2026)
- [../deployment/BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md](../deployment/BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md) — Deploy history
