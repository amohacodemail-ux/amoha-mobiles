# 📋 Supplier System - Quick Guide

## 1️⃣ How to Create a Supplier (Admin)

### Step 1: Go to Admin Panel
```
https://admin.amohamobiles.com/suppliers
```

### Step 2: Click "Add Supplier"
```
Fill the form:
┌─────────────────────────────────────┐
│ Company Name*   [Acme Electronics]  │
│ Contact Person  [John Doe]          │
│ Email*          [john@acme.com]     │
│ Phone*          [9876543210]        │
│ GST Number      [27AABCU9603R1ZM]   │
│ Address         [123 Main St, Mumbai]│
│ Bank Details    [For payments]      │
└─────────────────────────────────────┘
*Required fields
```

### Step 3: Create Login (Optional)
```
☑️ Create supplier login
Password: [Secure password]
→ Supplier can now log into portal
```

### Step 4: Save
```
✅ Supplier created
✅ Email/Phone duplicate check passed
✅ Login credentials sent to supplier
```

---

## 2️⃣ How Supplier Uses Portal

### Login
```
URL: https://www.amohamobiles.com/supplier/login
Email: [provided by admin]
Password: [provided by admin]
```

### Supplier Dashboard
```
┌─────────────────────────────────────┐
│ 🏢 1. My Profile                     │
│    Update business details          │
│    Add GST, Bank, Address           │
│                                     │
│ 📝 2. Submit Entry                   │
│    Tell us what you want to sell    │
│    Item: iPhone 15 Pro              │
│    Qty: 50 | Price: ₹120,000        │
│                                     │
│ 📊 3. Track Status                   │
│    🟡 Pending → Admin reviewing      │
│    🟢 Converted → Product created    │
│    🔴 Rejected → Not accepted      │
└─────────────────────────────────────┘
```

### What is an "Entry"?
```
You submit: "I have 50 iPhone 15 Pro available at ₹120,000"
              ↓
Admin reviews and either:
  ✅ CONVERTS to product → You get purchase order
  ❌ REJECTS → Try different item/price
```

---

## 3️⃣ How It Works on Admin Side

### Supplier Management
```
Admin can:
├── View all suppliers
├── Search by company/name/phone
├── Edit supplier details
├── Delete (only if no linked orders)
└── View performance metrics
```

### Purchase Orders
```
When supplier entry is converted:
  Entry "iPhone 15 Pro" → Product created
              ↓
  Admin creates Purchase Order
              ↓
  Supplier receives PO → Delivers items
              ↓
  Admin marks "Received" → Stock updated
              ↓
  Supplier paid via bank transfer
```

### Duplicate Prevention
```
System blocks if:
❌ Email already exists
❌ Phone already exists
❌ Delete attempted with linked POs
```

### Inventory Sync
```
When PO marked "Received":
  Product stock automatically increases
  Supplier reliability score updated
```

---

## ⚡ Quick Summary

| Action | Who | How |
|--------|-----|-----|
| **Create Supplier** | Admin | Add form → Save |
| **Submit Items** | Supplier | Portal → Submit entry |
| **Review Entries** | Admin | View → Convert/Reject |
| **Create PO** | Admin | PO form → Send to supplier |
| **Receive Stock** | Admin | Mark received → Auto inventory update |
| **Pay Supplier** | Admin | Via bank details in profile |

---

## 🔗 Links

- **Admin Panel:** https://admin.amohamobiles.com/suppliers
- **Supplier Login:** https://www.amohamobiles.com/supplier/login
- **User Guide:** See `SUPPLIER_USER_GUIDE.md` for detailed instructions
