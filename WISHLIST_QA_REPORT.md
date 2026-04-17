# Wishlist Feature - QA Audit Report

**Date:** 2026-04-13  
**Scope:** Full-stack wishlist feature (Frontend + Backend + API)  
**Status:** 6 bugs found, 3 medium severity, 2 low, 1 informational

---

## 1. Add to Wishlist

### 1.1 PASS - Add from Product Card
- `ProductCard.tsx` calls `addToWishlist(product._id, product)` passing full product data
- Optimistic update creates a temp item instantly → heart fills immediately
- On API success, temp item replaced with real server data
- On API failure, temp item rolled back and error thrown

### 1.2 PASS - Add from Product Detail Page
- `ProductDetailClient.tsx` calls `addToWishlist(product._id, product)` with full product data
- Same optimistic update flow as ProductCard
- Heart icon toggles between `HiOutlineHeart` and `HiHeart`

### 1.3 PASS - Duplicate Prevention (Backend)
- Backend `addItem()` checks for existing item: `select('id').eq('wishlist_id', ...).eq('product_id', ...)`
- Throws `BadRequestError('Product already in wishlist')` if duplicate
- Frontend catches error and shows toast

### 1.4 PASS - Auth Guard
- Unauthenticated users are redirected to `/login?redirect=...` before any API call
- Both ProductCard and ProductDetail check `isAuthenticated` first

---

## 2. Remove from Wishlist

### 2.1 PASS - Remove from Product Card (Toggle)
- Clicking filled heart calls `removeFromWishlist(product._id)`
- Optimistic removal: item filtered from store immediately
- On API failure, full re-fetch from server to restore state

### 2.2 PASS - Remove from Wishlist Page
- Trash button calls `removeFromWishlist(item.product?._id || '')`
- Same optimistic removal flow

### 2.3 BUG #1 - Remove with empty productId (Low)
**File:** `frontend/src/app/wishlist/page.tsx` line 111  
**Code:** `handleRemove(item.product?._id || '')`  
**Issue:** If `item.product` is somehow null/undefined (e.g., corrupted persisted state), this passes an empty string `''` to the API: `DELETE /api/wishlist/` which would hit the `GET /` route instead (Express route matching).  
**Expected:** Should guard against empty productId  
**Actual:** Sends `DELETE /api/wishlist/` → could match wrong route  
**Severity:** Low (unlikely due to `items.filter((i) => i.product)` guard in render, but the filter uses truthy check while product could be `{}`)

---

## 3. Persistence & State Management

### 3.1 PASS - LocalStorage Persistence
- Zustand persist with `name: 'amoha-wishlist'`, `version: 2`
- `partialize` only stores `{ items }` (no loading/error state)
- `merge` and `migrate` both use `normalizeWishlistItems` to sanitize persisted data

### 3.2 PASS - Login/Logout Sync
- **Login:** `auth.store.ts` calls `fetchWishlist()` after successful login → syncs from server
- **Register:** Calls `clearWishlist()` → fresh start for new user
- **Logout:** Calls `clearWishlist()` → prevents next user seeing previous user's data

### 3.3 PASS - Page Load Sync
- `page.tsx` (homepage) calls `fetchWishlist()` on mount when authenticated
- `wishlist/page.tsx` calls `fetchWishlist()` on mount when authenticated
- Both guard with `if (isAuthenticated)` check

### 3.4 BUG #2 - Stale Persisted Data After Server Rollback (Medium)
**Issue:** If the user adds an item optimistically, closes the browser before the API response, and the API actually failed, the temp item with `_id: 'temp-${productId}'` persists in localStorage. On next visit, `fetchWishlist()` replaces it, but until then, the UI shows a phantom item.  
**Steps to reproduce:**
1. Add product to wishlist
2. Immediately kill browser tab (before API response)
3. Reopen site
4. Wishlist may briefly show phantom item until `fetchWishlist()` completes  
**Expected:** Temp items should be filtered on hydration  
**Actual:** `normalizeWishlistItems` only checks for `product` object existence, not for temp IDs  
**Severity:** Medium (causes brief UI inconsistency)

---

## 4. Edge Cases

### 4.1 BUG #3 - No productId Validation on Backend POST (Medium)
**File:** `backend/src/controllers/wishlist.controller.ts` line 18  
**File:** `backend/src/routes/wishlist.routes.ts` line 10  
**Issue:** The `POST /api/wishlist` route has NO input validation middleware. Other routes (cart, auth, user) use `validate()` middleware with Zod schemas, but wishlist routes don't. The `productId` from `req.body` is passed directly to Supabase without validation.  
**Steps to reproduce:**
1. Send `POST /api/wishlist` with `{ "productId": "" }` or `{ "productId": null }` or missing productId
2. Backend passes `undefined`/`null`/`""` to `supabase.from('wishlist_items').insert({ product_id: productId })`
3. Supabase may throw a DB constraint error (foreign key), but the error message would be an unhandled Supabase internal error, not a clean validation error  
**Expected:** 400 Bad Request with "Product ID is required"  
**Actual:** Unhandled DB error (500) or unexpected behavior  
**Severity:** Medium (no data corruption due to FK constraint, but bad UX and unhelpful error messages)

### 4.2 PASS - Out of Stock Products
- No restriction on wishlisting out-of-stock products (correct behavior - "save for later")
- ProductCard and ProductDetail both allow adding regardless of stock

### 4.3 BUG #4 - Backend `removeItem` Returns Unused Data (Low)
**File:** `backend/src/services/wishlist.service.ts` line 70  
**Issue:** `removeItem()` calls `this.getWishlist(userId)` after deletion and returns the full wishlist. But the controller (`wishlistController.remove`) ignores this return value and only sends `sendMessage(res, 'Removed from wishlist')`. This wastes a full DB round-trip (fetching wishlist + all items + product joins) on every remove.  
**Expected:** `removeItem` should just delete and return void  
**Actual:** Unnecessary `SELECT` query with product joins after every delete  
**Severity:** Low (performance waste, ~50-100ms extra per remove)

### 4.4 PASS - Rapid Add/Remove (Race Conditions)
- Optimistic updates are applied synchronously via `set()` before async API calls
- Each operation filters by `productId` or `tempId`, not by index
- Zustand's `set()` is synchronous and atomic within each call
- Worst case: a failed remove re-fetches the full list, which self-corrects

---

## 5. UI/UX

### 5.1 PASS - Heart Icon State
- ProductCard: `wishlisted` computed via `useWishlistStore((s) => s.isInWishlist(product._id))`
- ProductDetail: Same pattern with `product?._id ?? ''`
- Both subscribe to a boolean that changes when items array changes → correct re-renders

### 5.2 PASS - Loading States
- Wishlist page shows shimmer skeleton while `isLoading` is true
- Empty state shows friendly message with "Browse Mobiles" CTA
- Unauthenticated state shows "Login Required" with sign-in link

### 5.3 PASS - Toast Notifications
- Add: "Added to wishlist" / "Added to wishlist!"
- Remove: "Removed from wishlist"
- Error: "Failed to update wishlist" / "Failed to remove"
- Move to cart: "Moved to cart!"

### 5.4 PASS - Wishlist Count Display
- Shows `{items.length} item(s) saved` with proper pluralization

### 5.5 PASS - Move to Cart
- Wishlist page has "Move to Cart" button per item
- Calls `addToCart(productId, 1)` then `removeFromWishlist(productId)` sequentially
- If cart add fails, wishlist item is NOT removed (correct behavior due to sequential await)

---

## 6. Backend / API

### 6.1 PASS - Auth Enforcement
- All wishlist routes behind `router.use(authenticate)` middleware
- Tested: `GET /api/wishlist` returns 401 without token
- JWT validation with proper error messages for expired/invalid tokens

### 6.2 PASS - Response Format Consistency
- `getAll` returns `{ success: true, data: { _id, items: [...] }, message: "Wishlist fetched" }`
- `add` returns `{ success: true, data: { _id, product: {...}, addedAt }, message: "Added to wishlist" }` with status 201
- `remove` returns `{ success: true, message: "Removed from wishlist" }`
- `check` returns `{ success: true, data: { isInWishlist: boolean } }`

### 6.3 PASS - Frontend Service Normalization
- `wishlistService.getAll()` normalizes: handles both array and `{ items: [] }` response shapes
- `wishlistService.add()` validates response has `product` property before returning

### 6.4 BUG #5 - `getAll` Response Shape Mismatch (Medium)
**File:** `backend/src/services/wishlist.service.ts` `getWishlist()` method  
**File:** `frontend/src/services/wishlist.service.ts` `getAll()` method  
**Issue:** Backend `getWishlist()` returns the full wishlist object: `{ _id, userId, items: [...], createdAt }`. The controller wraps this in `sendSuccess(res, items)`, so the API response is `{ success: true, data: { _id, userId, items: [...] } }`. The frontend service expects `data.data` to be either an array or an object with `.items`. It handles the object case correctly via `normalizeWishlistItems`, BUT the frontend `fetchWishlist` in the store passes `data` (already normalized to array by the service) to `normalizeWishlistItems` again — this double normalization works but is fragile.

More critically: the response includes `userId` in the data payload, which is an information leak (though minor since the user already knows their own ID).

**Severity:** Medium (works today but fragile; the response shape contract is implicit, not enforced)

---

## 7. Performance

### 7.1 PASS - Optimistic Updates
- Add: instant heart fill, no waiting for API
- Remove: instant heart unfill, no waiting for API
- Rollback on failure with re-fetch

### 7.2 PASS - Selective Re-renders
- Both ProductCard and ProductDetail use `useWishlistStore((s) => s.isInWishlist(id))` which returns a primitive boolean
- Zustand only re-renders when the selector output changes (shallow equality)
- ProductCard is wrapped in `memo()` for additional protection

### 7.3 OBSERVATION - Multiple Fetches on Login
- `auth.store.ts` login calls `fetchWishlist()`
- Homepage `page.tsx` also calls `fetchWishlist()` when `isAuthenticated` changes
- This causes 2 concurrent `GET /api/wishlist` requests on login from homepage
- Not a bug (second response overwrites first), but wastes a network request

---

## 8. Cross-Platform / Browser

### 8.1 PASS - LocalStorage Availability
- Zustand persist handles localStorage unavailability gracefully (falls back to in-memory)

### 8.2 PASS - SSR Safety
- Wishlist page is `'use client'` component
- Store access only happens client-side
- No hydration mismatches (persist rehydrates after mount)

---

## 9. Security

### 9.1 PASS - Authentication
- All routes protected by `authenticate` middleware
- JWT verification with proper error types (expired, invalid, missing)

### 9.2 PASS - Authorization (User Isolation)
- All DB queries scoped by `userId` from JWT payload
- User A cannot access User B's wishlist (no userId in URL params)

### 9.3 PASS - SQL Injection
- Supabase client uses parameterized queries internally
- No raw SQL in wishlist service

### 9.4 BUG #6 - No Rate Limiting on Wishlist Routes (Informational)
**File:** `backend/src/routes/wishlist.routes.ts`  
**Issue:** Unlike auth routes which have dedicated rate limiters, wishlist routes only have the global rate limiter (1500 req/15min). A malicious user could spam `POST /api/wishlist` with random productIds to create many wishlist items (though limited by FK constraint to valid products).  
**Expected:** Per-user rate limit on write operations  
**Actual:** Only global IP-based rate limit  
**Severity:** Informational (global rate limit provides basic protection)

### 9.5 PASS - CSRF/XSS
- API uses Bearer token auth (not cookies for API calls), immune to CSRF
- No user-controlled HTML rendered in wishlist items

---

## 10. Summary of Bugs

| # | Title | Severity | File(s) |
|---|-------|----------|---------|
| 1 | Remove with empty productId fallback | Low | `wishlist/page.tsx` |
| 2 | Temp items persist in localStorage on browser crash | Medium | `wishlist.store.ts` |
| 3 | No input validation on POST /api/wishlist | Medium | `wishlist.routes.ts`, controller |
| 4 | removeItem() wastes a DB query on unused return | Low | Backend `wishlist.service.ts` |
| 5 | getAll response shape mismatch / userId leak | Medium | Both services |
| 6 | No per-route rate limiting on wishlist writes | Info | `wishlist.routes.ts` |

---

## Recommended Fixes (Priority Order)

1. **Bug #3** — Add Zod validation schema for `POST /api/wishlist` requiring `productId` as non-empty string (matches pattern used by cart and QA validators)
2. **Bug #2** — Filter out items with `_id` starting with `temp-` or `confirmed-` during persist `merge()`/`migrate()` 
3. **Bug #5** — Change backend `getWishlist()` to return only the items array, or strip internal fields
4. **Bug #4** — Change `removeItem()` to not call `getWishlist()` after delete
5. **Bug #1** — Add `if (!productId) return;` guard before calling remove/moveToCart
6. **Bug #6** — Consider adding per-user write rate limit (optional)
