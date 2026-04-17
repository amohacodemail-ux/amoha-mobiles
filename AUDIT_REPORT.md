# AMOHA Mobiles - Full-Stack Production Audit Report (v2)

**Date:** March 31, 2026  
**Stack:** MongoDB / Express.js / Next.js 14 / Node.js  
**Scope:** Security, Performance, UI/UX, Code Quality, Database  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Bugs Fixed](#2-bugs-fixed)
3. [Security Vulnerabilities Fixed](#3-security-vulnerabilities-fixed)
4. [Code Quality Improvements](#4-code-quality-improvements)
5. [What Works Well](#5-what-works-well)
6. [Recommended Improvements](#6-recommended-improvements)
7. [Recommended Additions](#7-recommended-additions)
8. [Files Modified](#8-files-modified)

---

## 1. Executive Summary

A comprehensive line-by-line audit was performed across all three codebases (backend, frontend, admin). The application is **well-structured overall** with clean TypeScript, proper error handling, and solid architecture. However, **11 bugs were identified and fixed**, including **3 critical security vulnerabilities** and **4 data integrity issues**.

**TypeScript Compilation:** All 3 codebases compile cleanly with zero errors (before and after fixes).

| Category | Count |
|----------|-------|
| Critical Security Bugs | 3 |
| Data Integrity Bugs | 4 |
| Missing Functionality | 2 |
| Code Quality Issues | 2 |
| **Total Fixed** | **11** |

---

## 2. Bugs Fixed

### BUG #1 — CRITICAL: Blocked Users Can Login
- **File:** `backend/src/services/auth.service.ts` → `login()` method
- **Problem:** The login method did NOT check the `isBlocked` field on the user. A user blocked by an admin could still log in and use the application normally.
- **Fix:** Added `isBlocked` check immediately after finding the user, before password verification. Throws `UnauthorizedError('Your account has been blocked. Please contact support.')`.

### BUG #2 — CRITICAL: Blocked Users Can Refresh Tokens
- **File:** `backend/src/services/auth.service.ts` → `refreshToken()` method
- **Problem:** Even if a blocked user's access token expired, they could use their refresh token to get new tokens and continue using the app indefinitely.
- **Fix:** Added `isBlocked` check after validating the refresh token. If blocked, the refresh token is cleared and an `UnauthorizedError` is thrown.

### BUG #3 — Product Update Slug Collision
- **File:** `backend/src/services/product.service.ts` → `update()` method
- **Problem:** When a product name was changed, a new slug was generated but never checked for duplicates. The `create()` method had this check, but `update()` did not. This could cause two products to have the same slug, breaking product detail pages.
- **Fix:** Added duplicate slug check that excludes the current product ID. If a collision exists, appends a timestamp to make it unique.

### BUG #4 — Service Request Number Race Condition
- **File:** `backend/src/services/service-request.service.ts` → `generateRequestNumber()`
- **Problem:** Request numbers were generated using `countDocuments()` — e.g., `SRV-000001`. Under concurrent requests, two service requests could get the same number since the count doesn't change until after the document is created.
- **Fix:** Replaced with a timestamp + UUID-based approach (same pattern as order numbers): `SRV-{timestamp}-{random}`. This is guaranteed unique without database queries.

### BUG #5 — Regex Injection (ReDoS) in Service Request Search
- **File:** `backend/src/services/service-request.service.ts` → `getAll()` method
- **Problem:** User search input was passed directly as `$regex` to MongoDB without escaping. A malicious user could craft a regex pattern that causes catastrophic backtracking (ReDoS), hanging the database query.
- **Fix:** Added regex escaping (`search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) before using in `$regex`.

### BUG #6 — Forgot Password Email Never Sent
- **File:** `backend/src/services/auth.service.ts` → `forgotPassword()` method
- **Problem:** The method generated a reset token and saved it to the database, but had a `// TODO: Send email with reset token` comment and returned the raw token instead of emailing it. The password reset feature was completely non-functional.
- **Fix:** 
  - Created `sendPasswordResetEmail()` template in `backend/src/utils/email.util.ts` with a styled HTML email containing a reset link.
  - Wired it into `forgotPassword()` to send the email with a link to `{frontendUrl}/reset-password?token={token}`.

### BUG #7 — Dead Ternary in Order Creation
- **File:** `backend/src/services/order.service.ts` → `create()` method
- **Problem:** `paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'pending'` — a ternary that returns `'pending'` in both branches. Copy-paste error, functionally harmless but confusing.
- **Fix:** Simplified to `paymentStatus: 'pending'`.

### BUG #8 — Stock Deduction Bypasses inStock Flag (Order Service)
- **File:** `backend/src/services/order.service.ts` → stock reduction after order creation
- **Problem:** Stock was reduced using `findByIdAndUpdate` with `$inc`, which bypasses Mongoose pre-save hooks. The product model has a pre-save hook that sets `inStock = stock > 0`, but since `findByIdAndUpdate` skips middleware, `inStock` was never set to `false` when stock hit 0. This means out-of-stock products would still appear as available.
- **Fix:** After `$inc` update, check if `stock <= 0` and explicitly set `inStock = false` via `save()`. Same fix applied to stock restoration on order cancellation (sets `inStock = true` when stock becomes positive again).

### BUG #9 — Stock Deduction Bypasses inStock Flag (Payment Service)
- **File:** `backend/src/services/payment.service.ts` → stock reduction after Razorpay payment
- **Problem:** Same as Bug #8 but in the Razorpay payment flow.
- **Fix:** Same approach — after `$inc` update, check and update `inStock` flag via `save()`.

### BUG #10 — Admin Refund Doesn't Restore Stock
- **File:** `backend/src/routes/admin.routes.ts` → `POST /orders/:id/refund`
- **Problem:** When an admin processed a refund, the order status was set to `returned` and payment to `refunded`, but product stock was never restored. This caused permanent phantom stock loss.
- **Fix:** Added stock restoration loop after refund, same as the cancellation logic in order service.

### BUG #11 — @types Packages in Production Dependencies
- **File:** `backend/package.json`
- **Problem:** 8 `@types/*` packages were listed in `dependencies` instead of `devDependencies`. These are only needed at compile time and would be installed unnecessarily in production, increasing `node_modules` size.
- **Fix:** Moved all `@types/*` packages to `devDependencies`.

---

## 3. Security Vulnerabilities Fixed

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | **CRITICAL** | Authentication | Blocked users could still login (Bug #1) |
| 2 | **CRITICAL** | Authentication | Blocked users could refresh tokens (Bug #2) |
| 3 | **HIGH** | Injection (ReDoS) | Unescaped regex in service request search (Bug #5) |
| 4 | **MEDIUM** | CSV Injection | Sales/inventory CSV reports used unsanitized user data |

### CSV Injection Fix
- **Files:** `backend/src/routes/admin.routes.ts` (sales report + inventory report)
- **Problem:** CSV exports directly interpolated user-controlled data (names, emails, phone numbers) without sanitization. If a value started with `=`, `+`, `-`, or `@`, it could be interpreted as a formula by spreadsheet software (Excel, Google Sheets), enabling formula injection attacks.
- **Fix:** Added `sanitizeCsv()` helper that prefixes dangerous starting characters with a single quote `'`.

### Security Posture — Already Good

The following security measures were already in place and verified as correct:

- **JWT Authentication**: Dual-token system (access + refresh) with proper expiration
- **Password Hashing**: bcryptjs with proper salt rounds
- **CORS**: Properly configured with multi-origin support and credentials
- **Helmet**: HTTP headers hardened via helmet middleware
- **Rate Limiting**: Applied to payment routes to prevent brute-force
- **Input Validation**: Zod schemas on all critical endpoints (auth, products, orders, cart, payments)
- **Razorpay Payment Verification**: 3-layer verification (HMAC signature + API fetch + amount recalculation + replay detection via unique sparse index)
- **Role-Based Access Control**: Admin routes properly gated behind `authenticate + isAdmin` middleware
- **Error Handling**: Centralized error middleware that doesn't leak stack traces in production
- **Regex Escaping**: Product search already properly escaped user input (only service-request was missing it)
- **MongoDB Injection Prevention**: Using Mongoose ODM with schema validation throughout

---

## 4. Code Quality Improvements

| Improvement | Details |
|-------------|---------|
| Dead code removed | Meaningless ternary in order service (Bug #7) |
| Package hygiene | @types moved to devDependencies (Bug #11) |
| TODO resolved | Forgot password email TODO replaced with working implementation (Bug #6) |

---

## 5. What Works Well

The codebase demonstrates solid engineering practices:

- **Clean Architecture**: Proper separation of concerns (controllers → services → models)
- **TypeScript Strict Mode**: Enabled across all 3 codebases with zero compilation errors
- **Consistent Patterns**: All controllers follow the same try/catch/next(error) pattern
- **Comprehensive Email Templates**: Well-styled HTML emails for order confirmation, status updates, KYC, service requests
- **Payment Security**: Razorpay integration is extremely robust with 3-layer verification + replay attack protection
- **Responsive Admin Dashboard**: Full analytics with month-over-month growth calculations, status breakdowns, low stock alerts
- **Report Generation**: CSV export for sales and inventory reports
- **Notification System**: Real-time admin notifications for orders, contacts, KYC, reviews, low stock
- **State Management**: Zustand with persistence — clean and efficient
- **Frontend API Client**: Smart 401 handling with selective redirect (only from protected pages)
- **Graceful Shutdown**: Backend handles SIGTERM, SIGINT, unhandled rejections, and uncaught exceptions

---

## 6. Recommended Improvements

### High Priority

| # | Area | Recommendation | Effort |
|---|------|----------------|--------|
| 1 | **Delivery Charges** | The delivery charge logic (`subtotal > 500 ? 0 : 49`) is hardcoded in 3 places: cart model pre-save hook, order service, and payment service. The settings model already has `deliveryCharge` and `freeDeliveryAbove` fields — wire them up so these values are configurable from the admin panel. | Medium |
| 2 | **Admin SiteSettings Types** | The admin `types/index.ts` `SiteSettings` interface has fields (`razorpayKeyId`, `stripePublishableKey`, `gstPercentage`) that don't exist in the backend `settings.model.ts`. Align these types. | Low |
| 3 | **Welcome Email on Register** | The `sendWelcomeEmail` template exists in `email.util.ts` but is never called from `register()` in auth service. Wire it up. | Low |
| 4 | **Login Email Alert** | The `sendLoginEmail` template exists but is never called. Wire it up or remove it. | Low |
| 5 | **Order Confirmation Email** | The `sendOrderConfirmationEmail` template exists but verify it's being called in both COD and Razorpay order flows. | Low |
| 6 | **Review Approve/Status Endpoints** | Admin review status update and approve endpoints are no-ops (return static data without actually modifying anything). Either implement review moderation or remove these fake endpoints. | Medium |

### Medium Priority

| # | Area | Recommendation | Effort |
|---|------|----------------|--------|
| 7 | **Pagination for Admin Users** | The admin `getAllUsers` service doesn't support search/filter by name/email. Admin frontend may expect this. | Low |
| 8 | **Coupon Usage Per User** | Currently coupons track global `usedCount` vs `usageLimit`, but there's no per-user tracking. A user could use the same coupon multiple times. Add a `usedBy` array or separate collection. | Medium |
| 9 | **Product Stock Negative Guard** | When stock is decremented via `$inc`, there's no guard against going negative. Add `{ stock: { $gte: item.quantity } }` to the query condition. | Low |
| 10 | **Error Logging in Email** | Email failures are logged but silent. Consider adding admin notifications for email delivery failures. | Low |

### Low Priority

| # | Area | Recommendation | Effort |
|---|------|----------------|--------|
| 11 | **Image Optimization** | Frontend uses standard `<img>` tags in some places instead of Next.js `Image` component for automatic optimization. | Low |
| 12 | **API Response Caching** | Add caching for frequently accessed read-only data (categories, brands, featured products) using Redis or in-memory cache. | Medium |
| 13 | **Logging Correlation** | Add request IDs to all log entries for better debugging/tracing. | Low |

---

## 7. Recommended Additions

### Features to Add

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 1 | **Email Verification** | High | Require email verification on registration before allowing login. The reset password flow is already built — reuse the same pattern. |
| 2 | **Wishlist Notifications** | Medium | Notify users when wishlist items go on sale or come back in stock. |
| 3 | **Order Invoice PDF** | Medium | Generate downloadable PDF invoices for orders (jsPDF or Puppeteer). |
| 4 | **Search Analytics** | Low | Track what users search for to identify demand patterns. |
| 5 | **Bulk Product Import** | Medium | CSV import for products in admin panel. |
| 6 | **Product Variants** | High | Proper variant system (storage, RAM, color) with separate stock tracking per variant instead of a single stock count. |
| 7 | **SEO Meta Tags** | Medium | Dynamic meta tags, OpenGraph, and structured data for product pages. |
| 8 | **Admin Activity Log** | Medium | Track admin actions (who blocked a user, who changed an order status) for accountability. |
| 9 | **Two-Factor Authentication** | Medium | 2FA for admin accounts for extra security. |
| 10 | **Automated Tests** | High | No test suite exists. Add Jest/Vitest unit tests for services and Playwright/Cypress E2E tests. |

### Infrastructure

| # | Area | Recommendation |
|---|------|----------------|
| 1 | **Environment Variables** | Add separate `.env.example` files for all three apps documenting required variables. |
| 2 | **Docker** | Add Dockerfiles and docker-compose for consistent development environments. |
| 3 | **CI/CD** | Add GitHub Actions for automated linting, type checking, and deployment. |
| 4 | **Rate Limiting** | Extend rate limiting beyond payment routes to auth routes (login, register, forgot-password) to prevent brute force. |
| 5 | **Database Backups** | Set up automated MongoDB backups. |

---

## 8. Files Modified

| File | Changes |
|------|---------|
| `backend/src/services/auth.service.ts` | Added isBlocked check in login + refreshToken; wired password reset email |
| `backend/src/services/product.service.ts` | Added duplicate slug check in update() |
| `backend/src/services/service-request.service.ts` | Fixed race condition in request number generation; added regex escaping in search |
| `backend/src/services/order.service.ts` | Fixed inStock flag update on stock changes; fixed dead ternary |
| `backend/src/services/payment.service.ts` | Fixed inStock flag update on stock deduction |
| `backend/src/routes/admin.routes.ts` | Added stock restoration on refund; added CSV injection sanitization |
| `backend/src/utils/email.util.ts` | Added sendPasswordResetEmail template |
| `backend/package.json` | Moved @types to devDependencies |

**No files were modified in frontend/ or admin/ — all issues were in the backend.**

---

## Compilation Results

| Codebase | Before Fixes | After Fixes |
|----------|-------------|-------------|
| Backend | ✅ 0 errors | ✅ 0 errors |
| Frontend | ✅ 0 errors | ✅ 0 errors |
| Admin | ✅ 0 errors | ✅ 0 errors |

---

*End of Audit Report*
