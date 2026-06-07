# AMOHA Mobiles - Full-Stack Production Audit Report v2

**Date:** March 31, 2026  
**Stack:** MongoDB / Express.js / Next.js 14 / Node.js  
**Scope:** Security, Performance, UI/UX, Code Quality, Database

---

## EXECUTIVE SUMMARY

The application is well-structured with a solid MERN foundation, proper authentication flow, and comprehensive feature set. However, the audit identified **4 critical security issues, 12 high-priority issues, and 20+ medium/low improvements** needed for production readiness. Critical fixes have been applied; remaining items are documented below for future implementation.

---

## 1. ISSUES FOUND & FIXES APPLIED

### CRITICAL (Fixed)

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| C1 | **No rate limiting on auth endpoints** - brute force attacks on login/register/forgot-password possible | `auth.routes.ts` | Added `express-rate-limit` with 10 login/15min, 5 register/1hr, 5 reset/15min limits |
| C2 | **Public order tracking exposes sensitive data** - items, addresses, coupon data returned without auth | `order.controller.ts`, `order.routes.ts` | Added rate limiter (10/15min), phone validation, limited response fields (no items/addresses/coupons) |
| C3 | **SKU/barcode collision risk** - `Math.random()` and `Date.now()` used for unique IDs | `product.model.ts` | Replaced with `crypto.randomBytes()` and `crypto.randomInt()` for cryptographically secure generation |
| C4 | **getTopReviews N+1 memory bomb** - loads ALL products with reviews into RAM, sorts in memory | `product.controller.ts` | Replaced with MongoDB aggregation pipeline: `$unwind` -> `$match` -> `$sort` -> `$limit` |
| C5 | **No global rate limiting** - API vulnerable to DDoS/resource exhaustion | `app.ts` | Added global rate limiter (500 req/15min per IP) |
| C6 | **Image config allows any hostname** - `hostname: '**'` in Next.js accepts images from any domain | `frontend/next.config.js`, `admin/next.config.js` | Restricted to Cloudinary domains, added AVIF/WebP formats |
| C7 | **Compression & ETags disabled** - `compress: false`, `generateEtags: false` in production | Both `next.config.js` | Enabled compression, ETags, disabled `poweredByHeader` |
| C8 | **Body size limit too large** - 10MB limit allows memory exhaustion | `app.ts` | Reduced to 5MB |

### HIGH (Fixed)

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| H1 | **Weak password requirement** - minlength: 6 is insufficient | `user.model.ts` | Increased to minlength: 8 |
| H2 | **Email failures silently swallowed** - `.catch(() => {})` hides delivery failures | `auth.controller.ts`, `order.controller.ts` | Added proper error logging via `logger.error()` |
| H3 | **Error middleware leaks field names** - duplicate key errors expose DB schema | `error.middleware.ts` | Added safe field name mapping (email -> "Email", etc.) |
| H4 | **Cart clear without confirmation** - one-click destroys shopping session | `cart/page.tsx` | Added `window.confirm()` dialog before clearing |
| H5 | **Checkout validation weak** - no phone format validation | `checkout/page.tsx` | Added phone number digit length validation (10-12) and regex pincode check |
| H6 | **Race condition in order status update** - status and tracking updated in separate queries | `order.controller.ts` | Consolidated tracking fields into `$set` operation |
| H7 | **Helmet CSP missing** - no Content Security Policy headers | `app.ts` | Added CSP with restrictive directives |
| H8 | **Unhandled rejection doesn't shutdown** - server stays in unstable state | `server.ts` | Wired unhandledRejection to graceful shutdown |
| H9 | **MongoDB pool too small** - maxPoolSize: 10 insufficient for production | `db.ts` | Increased to 20, serverSelectionTimeout to 10s |
| H10 | **XSS in review comments** - no HTML stripping on user input | `product.service.ts` | Added `stripHtml()` to review title/comment before save |

---

## 2. REMAINING ISSUES (Not Fixed - Recommendations)

### HIGH PRIORITY (Recommend fixing before production)

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| R1 | **All pages are `'use client'`** - no SSR/SSG/ISR anywhere | HIGH | Convert home, product listing, product detail pages to Server Components. Implement `generateMetadata()` and `generateStaticParams()` for SEO |
| R2 | **No CSRF protection** | HIGH | Add CSRF tokens for state-changing operations (especially checkout/payment) |
| R3 | **Token stored in JS-accessible cookie** | HIGH | Use `httpOnly` cookies set by backend, not `js-cookie` on frontend |
| R4 | **No token refresh mechanism on frontend** | HIGH | Implement automatic token refresh using the existing `/auth/refresh-token` endpoint |
| R5 | **MongoDB transactions missing** - order creation (cart clear + stock decrement + order create) not atomic | HIGH | Wrap order creation in `mongoose.startSession()` + `session.withTransaction()` |
| R6 | **No database indexes on phone field** | MEDIUM | Add index on `user.phone` for order tracking queries |
| R7 | **Reviews embedded in Product document** - risks hitting 16MB limit | MEDIUM | Consider migrating to separate Review collection when products get 1000+ reviews |
| R8 | **Razorpay keys default to empty string** | MEDIUM | Make required in production env with `.refine()` check |

### MEDIUM PRIORITY

| # | Category | Issue | Recommendation |
|---|----------|-------|----------------|
| M1 | **Performance** | Home page makes 10+ parallel API calls on mount | Consolidate into single `/api/homepage` endpoint returning featured, trending, banners, categories in one response |
| M2 | **Performance** | No API response caching | Add `Cache-Control` headers for static data (categories, brands, featured products). Use Redis for frequently accessed data |
| M3 | **Performance** | ProductCard not memoized | Wrap ProductCard in `React.memo()`. Use `useMemo` for computed filter arrays on product listing |
| M4 | **Performance** | No code splitting | Use `dynamic()` imports for Compare page, modals, and heavy components |
| M5 | **Performance** | Zustand store subscriptions too broad | Use `useShallow()` or selectors: `useCartStore(state => state.items)` instead of destructuring |
| M6 | **UX** | No loading indicators during filter changes | Show skeleton or spinner while products re-fetch on filter change |
| M7 | **UX** | API errors silently caught everywhere | Add error boundary components and retry buttons for failed data fetches |
| M8 | **UX** | Hardcoded delivery charge (Rs.49 / free above Rs.500) | Move to Settings model for admin configurability |
| M9 | **UX** | No confirmation for address delete, order cancel | Add confirmation dialogs for destructive actions |
| M10 | **UX** | Form validation only on submit | Add inline validation as user types (email format, password strength) |
| M11 | **Accessibility** | Touch targets below 44px | Increase button `py` values on mobile: min `py-2.5` for all interactive elements |
| M12 | **Accessibility** | Missing `aria-label` on 15+ icon buttons | Add descriptive aria-labels (e.g., "Remove from cart", "Previous image") |
| M13 | **Accessibility** | Status shown only by color | Add text labels or icons alongside color-coded status badges |
| M14 | **Accessibility** | Missing `aria-invalid` on form errors | Associate error messages with inputs using `aria-describedby` |
| M15 | **Accessibility** | No `<main>` landmark in pages | Wrap page content in `<main>` for screen reader navigation |

### LOW PRIORITY

| # | Category | Issue | Recommendation |
|---|----------|-------|----------------|
| L1 | **Code** | Multiple `any` type casts in controllers | Replace with proper TypeScript interfaces |
| L2 | **Code** | Dynamic imports in controllers (`await import(...)`) | Use static imports at file top |
| L3 | **Code** | Duplicate cart state `setCartFromResponse` logic | Extract into shared helper function |
| L4 | **Monitoring** | No request correlation IDs | Add `uuid` middleware for request tracing |
| L5 | **Monitoring** | No APM/health monitoring | Implement detailed `/health` with DB, memory, uptime checks |
| L6 | **SEO** | Missing `robots.txt`, `sitemap.xml` | Generate sitemap from product/category slugs |
| L7 | **SEO** | OpenGraph missing images | Add OG image from product thumbnail for product pages |
| L8 | **Config** | No API versioning | Add `/api/v1/` prefix for future backward compatibility |
| L9 | **Config** | CORS maxAge 24h too aggressive | Reduce to 3600 (1 hour) |
| L10 | **Security** | Coupon can be applied to multiple carts simultaneously | Add per-user coupon usage tracking |

---

## 3. UI/UX REVIEW SUMMARY

### What Works Well
- Clean, modern design with consistent glass-card styling
- Good empty states on cart, wishlist, orders
- Proper dark mode support with CSS variables
- Mobile-first layout with responsive grids
- Smooth banner auto-rotation with manual controls
- Clear order summary in cart/checkout

### What Needs Improvement

| Screen | Issue | Recommendation |
|--------|-------|----------------|
| **Home** | 10+ API calls create slow initial load | Single endpoint, skeleton loading for each section independently |
| **Product Listing** | Filter changes show stale content | Add loading overlay or skeleton during re-fetch |
| **Product Detail** | All images marked `priority` | Only first image should be `priority`, rest should lazy-load |
| **Cart** | No max quantity enforcement on frontend | Show "max X available" when quantity approaches stock limit |
| **Checkout** | No address book selection | Allow choosing from saved addresses instead of always typing |
| **Checkout** | No order summary editing | Add link back to cart for quantity changes |
| **Login/Register** | Validation only on submit | Add inline validation as user types (email format, password strength) |
| **Orders** | No search/filter | Add status filter and date range for order history |
| **All Pages** | No error boundaries | Add React Error Boundaries with retry functionality |

---

## 4. PERFORMANCE AUDIT

### Current State
- **Bundle**: No code splitting, all client-rendered
- **Images**: No format optimization (AVIF/WebP) -> **FIXED**
- **Compression**: Disabled -> **FIXED**
- **Caching**: No ETags, no Cache-Control -> ETags **FIXED**, no Cache-Control
- **Database**: Small pool, no query caching -> Pool **FIXED**
- **API**: N+1 in getTopReviews -> **FIXED** with aggregation pipeline

### Recommended Performance Targets
| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| LCP (Largest Contentful Paint) | 3-5s (client-render) | <2.5s (with SSR) |
| FID (First Input Delay) | ~200ms | <100ms |
| CLS (Cumulative Layout Shift) | 0.15+ (loading jumps) | <0.1 |
| TTFB (Time to First Byte) | ~500ms | <200ms (with caching) |
| Bundle Size | Unknown (no splitting) | <200KB first load |

---

## 5. SECURITY AUDIT SUMMARY

### Fixed
- [x] Rate limiting on all auth endpoints
- [x] Rate limiting on public order tracking
- [x] Global API rate limiting
- [x] Cryptographic ID generation (SKU/barcode)
- [x] Input sanitization for reviews (HTML stripping)
- [x] Reduced body parser limit
- [x] Helmet CSP headers configured
- [x] Error messages don't leak DB schema
- [x] Stronger password requirements
- [x] Image domain restrictions
- [x] `poweredByHeader: false`

### Remaining
- [ ] CSRF token implementation
- [ ] HttpOnly JWT cookies (instead of JS-accessible)
- [ ] Automatic token refresh on frontend
- [ ] MongoDB transactions for orders
- [ ] Per-user coupon usage tracking
- [ ] Admin action audit logging

---

## 6. DATABASE AUDIT

### Schema Design - Good
- Proper use of embedded documents (addresses, reviews)
- Appropriate indexes on frequently queried fields
- Compound indexes for common filter combinations

### Recommendations
- Add `phone` index to User model for order tracking queries
- Add TTL index on Cart model for abandoned cart cleanup: `cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 })` (30 days)
- Consider moving reviews to separate collection at scale (>1000 reviews/product)
- Add `{ read: 'secondaryPreferred' }` for read-heavy queries (analytics, listings) if using replica set

---

## 7. FILES MODIFIED IN THIS AUDIT

| File | Changes |
|------|---------|
| `backend/src/app.ts` | Added global rate limiter, Helmet CSP, reduced body limit to 5MB |
| `backend/src/server.ts` | Wired unhandledRejection to graceful shutdown |
| `backend/src/config/db.ts` | Increased pool size to 20, server selection timeout to 10s |
| `backend/src/middleware/error.middleware.ts` | Safe field name mapping for duplicate key errors |
| `backend/src/routes/auth.routes.ts` | Added rate limiters for login, register, password reset |
| `backend/src/routes/order.routes.ts` | Added rate limiter for public order tracking |
| `backend/src/controllers/auth.controller.ts` | Added logger import, logged email failures instead of swallowing |
| `backend/src/controllers/order.controller.ts` | Phone validation, limited public tracking fields, logged email failures, atomic tracking update |
| `backend/src/controllers/product.controller.ts` | Replaced getTopReviews with aggregation pipeline, added limit cap |
| `backend/src/models/product.model.ts` | Crypto-based SKU/barcode generation |
| `backend/src/models/user.model.ts` | Password minlength 6 -> 8 |
| `backend/src/services/product.service.ts` | HTML stripping on review text input |
| `frontend/next.config.js` | Enabled compression/ETags, image domain restriction, AVIF/WebP, poweredByHeader off |
| `admin/next.config.js` | Same as frontend config |
| `frontend/src/app/cart/page.tsx` | Added confirmation dialog before cart clear |
| `frontend/src/app/checkout/page.tsx` | Improved phone/pincode validation |

---

## 8. PRODUCTION READINESS CHECKLIST

### Must-Have (Before Launch)
- [x] Rate limiting on all auth endpoints
- [x] Global API rate limiting
- [x] Secure ID generation
- [x] Input sanitization
- [x] Image optimization enabled
- [x] Response compression enabled
- [x] Security headers (Helmet + CSP)
- [ ] CSRF protection
- [ ] HttpOnly JWT cookies
- [ ] MongoDB transactions for orders
- [ ] Token refresh mechanism
- [ ] Error boundaries on frontend
- [ ] SSL/TLS enforcement
- [ ] Environment variable validation for Razorpay in production

### Should-Have (Post-Launch Sprint)
- [ ] SSR for SEO-critical pages (home, products, product detail)
- [ ] API response caching (Redis)
- [ ] CDN for static assets
- [ ] Monitoring & alerts (uptime, error rate, response time)
- [ ] Automated testing (unit + integration)
- [ ] Database backups & disaster recovery
- [ ] Admin audit logging
- [ ] sitemap.xml & robots.txt

### Nice-to-Have (Future Iterations)
- [ ] API versioning (v1/v2)
- [ ] Full-text search with Elasticsearch
- [ ] Real-time notifications (WebSocket)
- [ ] A/B testing framework
- [ ] Progressive Web App (PWA) features
