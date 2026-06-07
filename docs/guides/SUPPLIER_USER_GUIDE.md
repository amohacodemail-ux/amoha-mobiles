# 📘 Supplier Portal - User-Friendly Guide
## How Suppliers Use the System (Step-by-Step)

---

## 🎯 Quick Overview for Suppliers

**What is this?** A simple portal where suppliers can:
- ✅ Update their business details
- ✅ Submit product entries (items they want to sell)
- ✅ Track entry status (pending/converted/rejected)
- ✅ View their profile and performance

**Who can use it?** Only suppliers with login credentials created by the admin.

---

## 🚀 Getting Started (For New Suppliers)

### Step 1: Admin Creates Your Account
```
Admin creates supplier → Sets email & password → Shares credentials with you
                              ↓
                    You receive login details via email/WhatsApp
```

### Step 2: First Login
1. Go to: `https://yourdomain.com/supplier/login`
2. Enter your **Supplier ID / Email** (given by admin)
3. Enter your **Password** (given by admin)
4. Click **"Sign In as Supplier"**

**Login Page Screenshot Concept:**
```
┌─────────────────────────────────────┐
│              [S]                    │
│          Supplier Portal            │
│  Sign in with ID and password       │
│                                     │
│  📧 Supplier ID / Email             │
│  [____________________]             │
│                                     │
│  🔒 Password                        │
│  [____________________] 👁️          │
│                                     │
│  [ Sign In as Supplier ]            │
│                                     │
│  Your admin will create the         │
│  login for you.                     │
└─────────────────────────────────────┘
```

### Step 3: Complete Your Profile
Once logged in, you'll see two sections:

---

## 📋 Section 1: Complete Supplier Details

**Purpose:** Update your business information so the company knows who they're buying from.

### Form Fields Explained:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Login ID** | Auto-filled | supplier@acme.com (cannot change) |
| **Supplier Name** | Your business name | Acme Electronics |
| **Contact Person** | Your name or sales rep | John Doe |
| **Phone** | Your mobile number | 9876543210 |
| **Address Line 1** | Street address | 123 Main Street |
| **Address Line 2** | Area/Landmark | Near City Mall |
| **City** | City name | Mumbai |
| **State** | State name | Maharashtra |
| **Pincode** | 6-digit PIN | 400001 |
| **GST Number** | Your GSTIN (if registered) | 27AABCU9603R1ZM |
| **PAN Number** | Your PAN (for invoicing) | AABCU9603R |
| **Bank Name** | Your bank | State Bank of India |
| **IFSC** | Branch IFSC code | SBIN0001234 |
| **Bank Account** | Your account number | 12345678901 |
| **Notes** | Any special info | "We offer bulk discounts" |

**Visual Layout:**
```
┌────────────────────────────────────────────────┐
│ 🏢 Complete Supplier Details                    │
├────────────────────────────────────────────────┤
│ Login ID       [supplier@acme.com] (disabled)  │
│                                                │
│ Supplier Name  [Acme Electronics   ]          │
│                                                │
│ Contact Person [John Doe            ] Phone [9876543210] │
│                                                │
│ Address Line 1 [123 Main Street                  ] │
│ Address Line 2 [Near City Mall                 ] │
│                                                │
│ City [Mumbai    ] State [Maharashtra] Pincode [400001] │
│                                                │
│ GST [27AABCU9603R1ZM] PAN [AABCU9603R]          │
│                                                │
│ Bank [State Bank   ] IFSC [SBIN0001234]          │
│ Account Number [12345678901                      ] │
│                                                │
│ Notes                                          │
│ [We offer bulk discounts on orders above 100 units] │
│                                                │
│ [ Save Supplier Details ]                      │
└────────────────────────────────────────────────┘
```

### What Happens When You Save?
```
You Click "Save" → System validates data → Success message appears
                                         ↓
                              Admin can now see your details
                              when creating purchase orders
```

---

## 📝 Section 2: Submit New Entry

**What is an "Entry"?** 
It's your way of telling the company: *"I have these items available for sale."*

Think of it like submitting a quote or catalog item.

### How to Submit an Entry:

**Step 1: Fill the Simple Form**
```
┌─────────────────────────────────────┐
│ 📋 Submit New Entry                  │
├─────────────────────────────────────┤
│                                     │
│ Item name                           │
│ [iPhone 15 Pro Max 256GB      ]    │
│                                     │
│ Quantity    Price (₹)              │
│ [   50   ]  [  120000           ]   │
│                                     │
│ Note                                │
│ [Available in Black, Blue and      │
│ Natural Titanium colors.            │
│ Warranty: 1 year official Apple.    │
│ Bulk discount available.]           │
│                                     │
│ [ Submit Entry ]                    │
└─────────────────────────────────────┘
```

**Field Explanations:**

| Field | Required? | What to Write |
|-------|-----------|---------------|
| **Item name** | ✅ Yes | Product name + model + specs |
| **Quantity** | ✅ Yes | How many units you have available |
| **Price** | ❌ Optional | Your selling price per unit (₹) |
| **Note** | ❌ Optional | Warranty, colors, delivery time, etc. |

### What Happens After Submit?

```
┌─────────────────────────────────────────────────────┐
│ Your Entry Journey                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📝 You Submit Entry                                │
│     ↓                                               │
│  ⏳ Status: PENDING (Yellow badge)                  │
│     ↓                                               │
│  👀 Admin Reviews Your Entry                        │
│     ↓                                               │
│  ✅ CONVERTED → Admin creates product & PO           │
│     OR                                              │
│  ❌ REJECTED → Admin declines (with reason)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Section 3: My Recent Entries

**Purpose:** See all entries you've submitted and their current status.

**Visual Example:**
```
┌────────────────────────────────────────────────────┐
│ My Recent Entries                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌────────────────────────────────────────────┐    │
│ │ iPhone 15 Pro Max 256GB                   │    │
│ │ Qty: 50 • Price: ₹120,000                  │    │
│ │                             🟡 PENDING     │    │
│ │ Available colors: Black, Blue, Natural    │    │
│ └────────────────────────────────────────────┘    │
│                                                    │
│ ┌────────────────────────────────────────────┐    │
│ │ Samsung Galaxy S24 Ultra                   │    │
│ │ Qty: 100 • Price: ₹125,000                 │    │
│ │                             🟢 CONVERTED   │    │
│ │ 1 year Samsung warranty included          │    │
│ └────────────────────────────────────────────┘    │
│                                                    │
│ ┌────────────────────────────────────────────┐    │
│ │ OnePlus 12 5G                             │    │
│ │ Qty: 30 • Price: ₹64,999                   │    │
│ │                             🔴 REJECTED    │    │
│ │ Not stocking this model currently         │    │
│ └────────────────────────────────────────────┘    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Status Meanings:

| Status Badge | Color | Meaning | What You Should Do |
|--------------|-------|---------|-------------------|
| **PENDING** | 🟡 Yellow | Admin hasn't reviewed yet | Wait, or contact admin if urgent |
| **CONVERTED** | 🟢 Green | Admin approved & created product | Prepare for potential purchase order |
| **REJECTED** | 🔴 Red | Admin declined your entry | Check rejection reason, submit different item |

---

## 🔐 Security & Privacy

### Who Can See What?

| Information | You See | Admin Sees | Other Suppliers See |
|-------------|---------|------------|---------------------|
| Your profile details | ✅ | ✅ | ❌ |
| Your entries | ✅ | ✅ | ❌ |
| Other suppliers | ❌ | ✅ | ❌ |
| Purchase orders | ❌ | ✅ | ❌ |
| Your bank details | ✅ | ✅ | ❌ |

### Security Features:
- ✅ Password protected login
- ✅ Only your admin can see your entries
- ✅ Bank details encrypted in database
- ✅ Automatic logout after inactivity

---

## 📱 Mobile-Friendly Experience

The portal works perfectly on mobile phones:

```
┌─────────────────┐
│ Supplier Portal │
├─────────────────┤
│                 │
│ 🏢 Complete     │
│    Supplier     │
│    Details      │
│ [===========]   │
│                 │
│ 📋 Submit New   │
│    Entry        │
│ [===========]   │
│                 │
│ 📊 My Recent    │
│    Entries      │
│ [===========]   │
│                 │
│ [🚪 Sign Out]   │
└─────────────────┘
```

**Features:**
- Touch-friendly buttons
- Responsive forms
- Swipe-friendly interface
- Works on any smartphone

---

## ❓ FAQ - Frequently Asked Questions

### Q1: I forgot my password. What do I do?
**A:** Contact your admin. Only admins can reset supplier passwords.

### Q2: Can I change my login email?
**A:** No. The login email is set by admin. Contact them if you need it changed.

### Q3: My entry shows "REJECTED". Why?
**A:** Check the note on the entry. Common reasons:
- Product not needed currently
- Price too high
- Quality concerns
- Duplicate entry

### Q4: How long does "PENDING" status take?
**A:** Usually 1-2 business days. Contact admin if urgent.

### Q5: Can I edit my entry after submitting?
**A:** No, but you can submit a new entry with updated details.

### Q6: What happens when my entry is "CONVERTED"?
**A:** Admin created a product from your entry. You may receive a purchase order soon.

### Q7: Can I see purchase orders?
**A:** No. Only admins can create and manage purchase orders. You'll be notified separately.

### Q8: Is my bank information safe?
**A:** Yes. Bank details are encrypted and only visible to authorized admins.

---

## 💡 Pro Tips for Suppliers

### Tip 1: Complete Your Profile First
```
Before submitting entries:
✅ Fill all profile details
✅ Add GST number (if you have)
✅ Add bank details for faster payments
✅ Add notes about your specialties
```

### Tip 2: Write Clear Item Names
```
❌ Bad:  "Mobile phone"
✅ Good:  "iPhone 15 Pro Max 256GB - Natural Titanium"

❌ Bad:  "Charger"
✅ Good:  "Apple 20W USB-C Power Adapter (Original)"
```

### Tip 3: Add Helpful Notes
```
Include:
✅ Warranty information
✅ Available colors/variants
✅ Delivery time estimate
✅ Bulk discount offers
✅ Special features
```

### Tip 4: Check Entry Status Regularly
```
Best practice:
→ Submit entry
→ Check after 2 days
→ Follow up with admin if still pending
→ Submit new items weekly
```

### Tip 5: Keep Prices Competitive
```
Remember:
→ Admin compares multiple suppliers
→ Better price = higher chance of conversion
→ Quality matters as much as price
```

---

## 🎨 User Experience Highlights

### What Makes It User-Friendly?

| Feature | Benefit |
|---------|---------|
| **Single-page interface** | Everything visible at once, no clicking around |
| **Auto-save on submit** | No accidental data loss |
| **Clear status badges** | Know exactly what's happening with your entries |
| **Toast notifications** | Instant feedback (success/error messages) |
| **Mobile responsive** | Use on phone while on the move |
| **Simple forms** | Only essential fields, no clutter |
| **Validation messages** | Know exactly what's wrong if error occurs |
| **Secure by default** | No complicated security settings |

### Example User Journey:

**Monday 10:00 AM**
```
Supplier Rajesh logs in → Updates his phone number → Saves profile
```

**Monday 11:30 AM**
```
Rajesh submits entry: "Samsung Galaxy S24, 100 units, ₹85,000"
→ Sees: "Entry submitted successfully" toast
→ Entry appears with 🟡 PENDING status
```

**Wednesday 2:00 PM**
```
Rajesh checks portal → Entry status changed to 🟢 CONVERTED
→ Admin created product from his entry
```

**Friday 10:00 AM**
```
Rajesh receives WhatsApp from admin: "Send 50 units of Galaxy S24"
```

---

## 🆘 Troubleshooting

### Problem: Can't login
**Solution:**
1. Check email spelling
2. Check Caps Lock is off
3. Try resetting password (contact admin)
4. Clear browser cache

### Problem: Entry not submitting
**Solution:**
1. Check "Item name" and "Quantity" are filled
2. Quantity must be at least 1
3. Price should be a number (no ₹ symbol)
4. Check internet connection

### Problem: Profile not saving
**Solution:**
1. Phone must be 10-15 digits only
2. Pincode must be exactly 6 digits
3. GST format should be correct (if filled)
4. Try refreshing page and re-entering

### Problem: Page not loading
**Solution:**
1. Check internet connection
2. Try different browser
3. Clear cookies and cache
4. Contact admin if still not working

---

## 📞 Need Help?

**Contact your admin if:**
- ❓ You can't login
- ❓ Entry status hasn't changed in 1 week
- ❓ You need to change your login email
- ❓ You found a bug or error
- ❓ You have suggestions for improvement

---

## ✨ Summary

**Supplier Portal = Simple, Secure, Efficient**

```
┌─────────────────────────────────────────┐
│                                         │
│   🔐 Login with credentials from admin  │
│      ↓                                  │
│   🏢 Complete your business profile      │
│      ↓                                  │
│   📝 Submit product entries             │
│      ↓                                  │
│   📊 Track status (Pending → Converted)  │
│      ↓                                  │
│   💰 Get purchase orders from admin      │
│                                         │
└─────────────────────────────────────────┘
```

**That's it! Simple as 1-2-3.**

---

*User Guide Version 2.0*  
*For: Amoha Mobiles Supplier Portal*
