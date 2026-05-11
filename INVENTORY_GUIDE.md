# 📦 Amoha Mobiles — Inventory Management Guide

---

## 🏠 Overview

The Inventory system helps you track **every phone in your shop** — how many you have, how many are sold, damaged, reserved for online orders, and how much stock is running low. Everything updates automatically when sales happen.

---

## 🗂️ The 6 Tabs Explained

### 1. 📊 Stock Tab
> Your **main stock register** — the most important tab.

**What you see:**

| Column | Meaning |
|--------|---------|
| Product Name | Name of the phone |
| SKU | Your unique product code |
| Available | Units you can sell right now |
| Reserved | Locked for pending online orders |
| Sold | Total units sold (online + POS counter) |
| Damaged | Units that are broken / unusable |
| Selling Price | Current price |
| Status | In Stock / Low / Critical / Out of Stock |

**Buttons:**

| Button | What it does |
|--------|-------------|
| ✏️ Update Stock | Add new stock, remove stock, or set exact count |
| 🛡️ Mark Damaged | Move broken units out of available stock |
| 📥 Export CSV | Download full stock report to Excel |
| 🔄 Refresh | Reload latest numbers |

---

### 2. 🏪 Warehouses Tab
Manage your storage locations. You can add multiple warehouses (e.g. Main Store, Back Godown). Each warehouse tracks its own stock independently.

---

### 3. 📋 Movements Tab
A log of every stock movement — stock in, stock out, transfers. Useful when you want to trace where a batch of phones went.

---

### 4. 🔔 Alerts Tab
> Automatically tells you which products need attention.

**Two types of alerts:**
- 🔴 **Out of Stock** — 0 units left, cannot sell
- 🟡 **Low Stock** — 10 or fewer units left, reorder soon

**Buttons:**

| Button | What it does |
|--------|-------------|
| ✅ Acknowledge | Mark one alert as seen/handled |
| ✅ Acknowledge All | Mark all alerts as read in one click |
| 🔄 Run Alert Check | Manually scan all products for new alerts |

> **Note:** Acknowledging does NOT restock anything. It only clears the notification so new alerts stand out.

---

### 5. 🗒️ Audit Log Tab
A permanent record of **every stock change** — who did it, when, how much, and why. You can filter by action type (stock added, damaged, order delivered, etc.).

Use this if:
- A discrepancy is found during physical count
- You want to know who added/removed stock
- Your accountant needs a history report

---

### 6. 📈 Forecast Tab
Based on your sales history, it predicts:
- Average daily sales per product
- How many units you'll need in the next 30 days
- Recommended reorder quantity
- How many days of stock you have left

Use this **before placing a supplier order** so you buy the right quantities.

---

## ⚙️ How Stock Changes Automatically

You don't need to do anything for these — they happen on their own:

| Event | What Happens Automatically |
|-------|--------------------------|
| Online order placed | Stock is **reserved** (subtracted from available) |
| Online order delivered | Reserved stock moves to **sold** |
| Online order cancelled | Reserved stock is **released back** to available |
| POS counter sale | Stock is immediately marked as **sold** |
| Return received back | Stock is **restored** to available |
| Stock drops below 10 | **Alert is created** automatically |

---

## 📅 Daily / Weekly / Monthly Routine

### ✅ Every Morning (2 minutes)
1. Open **Alerts tab** → check for out-of-stock or low-stock products
2. Note which products need reordering
3. Click **Acknowledge All** to clear the list
4. Check **Stock tab Dashboard** numbers (top cards)

### ✅ When Stock Arrives from Supplier
1. Go to **Stock tab** → find the product → click **Update**
2. Select **Add Stock**
3. Enter quantity received
4. Add a note like `"Stock received from Samsung distributor"`
5. Click Save — available stock updates instantly

### ✅ When a Phone Gets Damaged
1. Go to **Stock tab** → find the product → click the 🛡️ **Mark Damaged** button
2. Enter how many units are damaged
3. Enter reason (e.g. `"Screen cracked"`, `"Water damage"`, `"Dead on arrival"`)
4. Click Confirm — units move out of available into damaged count

### ✅ When Doing a Physical Stock Count (Weekly/Monthly)
1. Physically count all phones on your shelf
2. For each product → click **Update** → select **Set Exact Amount**
3. Enter the real count you physically counted
4. Add note `"Monthly physical audit - May 2026"`
5. After all products updated → click **Export CSV** and save the file

### ✅ Before Placing a Supplier Order (Weekly)
1. Go to **Forecast tab** → click **Generate Forecasts**
2. Review which products are recommended for reorder
3. Use the **Recommended Qty** column to decide how much to buy
4. Place your order with the supplier accordingly

---

## 🔢 Understanding Stock Status Colors

| Color | Status | Meaning | Action Needed |
|-------|--------|---------|--------------|
| 🟢 Green | In Stock | 11+ units available | None |
| 🟡 Yellow | Low Stock | 6–10 units left | Plan reorder soon |
| 🔴 Red | Critical | 1–5 units left | Reorder urgently |
| ⚫ Grey | Out of Stock | 0 units | Cannot sell — reorder immediately |

---

## 📤 Exporting Stock Report (for Accountant/Boss)

1. Go to **Stock tab**
2. Click **Export CSV** button (top right)
3. A file downloads automatically
4. Open it in Excel — it contains:
   - Product name, SKU, brand, category
   - Available, Reserved, Sold, Damaged counts
   - Cost price, Selling price
   - Last restocked date

---

## ❓ Quick Troubleshooting

| Problem | Solution |
|---------|---------|
| Stock number looks wrong | Click **Refresh** button, then check Audit Log for recent changes |
| Alert won't go away after restocking | Click **Run Alert Check** to refresh |
| Product shows 0 stock but you have units | Use **Update → Set Exact Amount** to correct it, add note explaining reason |
| Want to know who changed stock | Go to **Audit Log** tab, search the product name |
| Forecast showing no data | You need at least a few days of sales history first |

---

*Last updated: May 2026 | Amoha Mobiles Internal Guide*
