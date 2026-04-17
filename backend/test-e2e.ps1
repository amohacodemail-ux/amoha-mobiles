
# ============================================================
# AMOHA Mobiles - Full E2E API Test Suite
# Tests everything like a real-world user + admin
# ============================================================

$base = "http://localhost:5001/api"
$pass = 0; $fail = 0; $errors = @()
$adminToken = $null; $userToken = $null; $userId = $null; $adminId = $null
$brandId = $null; $categoryId = $null; $productId = $null; $productSlug = $null
$orderId = $null; $cartItemId = $null; $reviewId = $null; $couponId = $null
$contactId = $null; $serviceRequestId = $null; $bannerId = $null
$noteId = $null; $notificationId = $null

function Test-API {
  param([string]$Method, [string]$Url, [hashtable]$Headers = @{}, $Body = $null, [string]$Name, [int[]]$Expected = @(200,201))
  try {
    $params = @{ Uri = "$base$Url"; Method = $Method; UseBasicParsing = $true; TimeoutSec = 10; ContentType = "application/json" }
    if ($Headers.Count) { $params.Headers = $Headers }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
    $r = Invoke-WebRequest @params
    $json = $r.Content | ConvertFrom-Json
    if ($Expected -contains $r.StatusCode) {
      $script:pass++
      Write-Host "  PASS  $Name ($($r.StatusCode))" -ForegroundColor Green
      return $json
    } else {
      $script:fail++; $script:errors += "$Name : Expected $($Expected -join '/'), got $($r.StatusCode)"
      Write-Host "  FAIL  $Name - Expected $($Expected -join '/'), got $($r.StatusCode)" -ForegroundColor Red
      return $json
    }
  } catch {
    $code = 0; $msg = $_.Exception.Message
    try { $code = [int]$_.Exception.Response.StatusCode.value__ } catch {}
    if ($Expected -contains $code) {
      $script:pass++
      Write-Host "  PASS  $Name ($code)" -ForegroundColor Green
      try { return ($_.ErrorDetails.Message | ConvertFrom-Json) } catch { return $null }
    } else {
      $script:fail++
      $detail = ""
      try { $detail = $_.ErrorDetails.Message } catch {}
      $script:errors += "$Name : HTTP $code - $detail"
      Write-Host "  FAIL  $Name - HTTP $code $detail" -ForegroundColor Red
      return $null
    }
  }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AMOHA Mobiles E2E Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ---- 1. HEALTH CHECK ----
Write-Host "[1] Health Check" -ForegroundColor Yellow
Test-API -Method GET -Url "/../health" -Name "Health endpoint"

# ---- 2. AUTH: REGISTER ----
Write-Host "`n[2] Auth: Register Users" -ForegroundColor Yellow
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$adminEmail = "admin_$ts@test.com"
$userEmail = "user_$ts@test.com"

$res = Test-API -Method POST -Url "/auth/register" -Name "Register admin user" -Body @{
  name = "Test Admin"; email = $adminEmail; phone = "9876543210"; password = "Test@123"; confirmPassword = "Test@123"
} -Expected @(200,201)
if ($res -and $res.data) { $adminToken = $res.data.token; $adminId = $res.data.user._id }

$res = Test-API -Method POST -Url "/auth/register" -Name "Register normal user" -Body @{
  name = "Test User"; email = $userEmail; phone = "9876543211"; password = "Test@123"; confirmPassword = "Test@123"
} -Expected @(200,201)
if ($res -and $res.data) { $userToken = $res.data.token; $userId = $res.data.user._id }

# Duplicate register should fail
Test-API -Method POST -Url "/auth/register" -Name "Duplicate register (expect 409)" -Body @{
  name = "Test"; email = $adminEmail; phone = "1234567890"; password = "Test@123"; confirmPassword = "Test@123"
} -Expected @(409)

# ---- 3. AUTH: LOGIN ----
Write-Host "`n[3] Auth: Login" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/auth/login" -Name "Login admin" -Body @{
  email = $adminEmail; password = "Test@123"
} -Expected @(200)
if ($res -and $res.data) { $adminToken = $res.data.token }

$res = Test-API -Method POST -Url "/auth/login" -Name "Login user" -Body @{
  email = $userEmail; password = "Test@123"
} -Expected @(200)
if ($res -and $res.data) { $userToken = $res.data.token }

Test-API -Method POST -Url "/auth/login" -Name "Wrong password (expect 401)" -Body @{
  email = $adminEmail; password = "wrong"
} -Expected @(401)

# ---- PROMOTE TO ADMIN via direct DB ----
Write-Host "`n[3b] Promote user to admin role" -ForegroundColor Yellow
Push-Location "c:\Users\user\Documents\Logan's Area\abc\abc\abc\backend"
$nodeScript = "const{createClient}=require('@supabase/supabase-js');const e=require('./dist/config/env').default;const s=createClient(e.SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY);(async()=>{const{error}=await s.from('users').update({role:'admin'}).eq('id','" + $adminId + "');console.log(error?'FAIL:'+error.message:'OK');process.exit(0);})()"
$result = node -e $nodeScript 2>&1
Pop-Location
if ($result -match "OK") {
  $pass++; Write-Host "  PASS  Promoted $adminId to admin" -ForegroundColor Green
} else {
  $fail++; $errors += "Promote to admin: $result"; Write-Host "  FAIL  Promote to admin: $result" -ForegroundColor Red
}

# Re-login to get new token with admin role
$res = Test-API -Method POST -Url "/auth/login" -Name "Re-login as admin" -Body @{
  email = $adminEmail; password = "Test@123"
} -Expected @(200)
if ($res -and $res.data) { $adminToken = $res.data.token }

$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$userHeaders = @{ Authorization = "Bearer $userToken" }

# ---- 4. AUTH: PROFILE ----
Write-Host "`n[4] Auth: Profile" -ForegroundColor Yellow
Test-API -Method GET -Url "/auth/profile" -Headers $adminHeaders -Name "Get admin profile"
Test-API -Method GET -Url "/auth/profile" -Headers $userHeaders -Name "Get user profile"
Test-API -Method GET -Url "/auth/profile" -Name "Profile without token (expect 401)" -Expected @(401)

# ---- 5. ADMIN: CREATE BRAND ----
Write-Host "`n[5] Admin: Brands" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/admin/brands" -Headers $adminHeaders -Name "Create brand" -Body @{
  name = "Samsung"; slug = "samsung"; logo = "https://example.com/samsung.png"; description = "Samsung Electronics"
} -Expected @(200,201)
if ($res -and $res.data) { $brandId = $res.data._id }

Test-API -Method GET -Url "/brands" -Name "Public: List brands"
Test-API -Method GET -Url "/admin/brands" -Headers $adminHeaders -Name "Admin: List brands"
if ($brandId) { Test-API -Method GET -Url "/admin/brands/$brandId" -Headers $adminHeaders -Name "Admin: Get brand by ID" }

# ---- 6. ADMIN: CREATE CATEGORY ----
Write-Host "`n[6] Admin: Categories" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/admin/categories" -Headers $adminHeaders -Name "Create category" -Body @{
  name = "Smartphones"; slug = "smartphones"; image = "https://example.com/phones.png"; description = "Mobile phones"
} -Expected @(200,201)
if ($res -and $res.data) { $categoryId = $res.data._id }

Test-API -Method GET -Url "/categories" -Name "Public: List categories"
if ($categoryId) { Test-API -Method GET -Url "/admin/categories/$categoryId" -Headers $adminHeaders -Name "Admin: Get category by ID" }

# ---- 7. ADMIN: CREATE PRODUCT ----
Write-Host "`n[7] Admin: Products" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/admin/products" -Headers $adminHeaders -Name "Create product" -Body @{
  name = "Samsung Galaxy S24 Ultra"; brand = $brandId; category = $categoryId
  description = "The ultimate Galaxy experience with AI features and stunning display"
  price = 129999; originalPrice = 134999; discount = 4
  images = @("https://example.com/s24-1.jpg","https://example.com/s24-2.jpg")
  thumbnail = "https://example.com/s24-thumb.jpg"
  specifications = @{ display = "Dynamic AMOLED 2X"; displaySize = "6.8 inches"; processor = "Snapdragon 8 Gen 3"; ram = "12GB"; storage = "256GB"; battery = "5000mAh"; rearCamera = "200MP+12MP+50MP+10MP"; frontCamera = "12MP"; os = "Android 14"; network = "5G" }
  stock = 50; tags = @("flagship","5g","samsung"); isFeatured = $true; isTrending = $true
  colors = @("Titanium Black","Titanium Gray","Titanium Violet")
} -Expected @(200,201)
if ($res -and $res.data) { $productId = $res.data._id; $productSlug = $res.data.slug }

# Create a second product for variety
$res2 = Test-API -Method POST -Url "/admin/products" -Headers $adminHeaders -Name "Create 2nd product" -Body @{
  name = "Samsung Galaxy A15"; brand = $brandId; category = $categoryId
  description = "Budget-friendly Samsung phone with great battery life and display"
  price = 13999; originalPrice = 15999; discount = 12
  images = @("https://example.com/a15.jpg"); thumbnail = "https://example.com/a15-thumb.jpg"
  specifications = @{ display = "Super AMOLED"; ram = "6GB"; storage = "128GB"; battery = "5000mAh" }
  stock = 100; tags = @("budget","samsung"); colors = @("Blue","Black")
} -Expected @(200,201)
$product2Id = if ($res2 -and $res2.data) { $res2.data._id } else { $null }

# ---- 8. PUBLIC: BROWSE PRODUCTS ----
Write-Host "`n[8] Public: Browse Products" -ForegroundColor Yellow
Test-API -Method GET -Url "/products" -Name "List all products"
Test-API -Method GET -Url "/products/featured" -Name "Featured products"
Test-API -Method GET -Url "/products/trending" -Name "Trending products"
if ($productSlug) { Test-API -Method GET -Url "/products/$productSlug" -Name "Get product by slug" }
if ($productId) { Test-API -Method GET -Url "/products/$productId/related" -Name "Related products" }
Test-API -Method GET -Url "/products?search=Samsung" -Name "Search products"
Test-API -Method GET -Url "/products/search/suggestions?q=Sam" -Name "Search suggestions"
Test-API -Method GET -Url "/products/category/smartphones" -Name "Products by category slug"

# ---- 9. ADMIN: UPDATE PRODUCT ----
Write-Host "`n[9] Admin: Update Product" -ForegroundColor Yellow
if ($productId) {
  Test-API -Method PUT -Url "/admin/products/$productId" -Headers $adminHeaders -Name "Update product price" -Body @{
    price = 124999; originalPrice = 134999; discount = 7
  }
  Test-API -Method PATCH -Url "/admin/products/$productId/stock" -Headers $adminHeaders -Name "Update stock" -Body @{
    stock = 45
  }
}

# ---- 10. USER: WISHLIST ----
Write-Host "`n[10] User: Wishlist" -ForegroundColor Yellow
if ($productId) {
  Test-API -Method POST -Url "/wishlist" -Headers $userHeaders -Name "Add to wishlist" -Body @{ productId = $productId } -Expected @(200,201)
  Test-API -Method GET -Url "/wishlist" -Headers $userHeaders -Name "Get wishlist"
  Test-API -Method GET -Url "/wishlist/check/$productId" -Headers $userHeaders -Name "Check in wishlist"
}

# ---- 11. USER: CART ----
Write-Host "`n[11] User: Cart" -ForegroundColor Yellow
if ($productId) {
  $res = Test-API -Method POST -Url "/cart/add" -Headers $userHeaders -Name "Add to cart" -Body @{
    productId = $productId; quantity = 2
  } -Expected @(200,201)
  if ($res -and $res.data -and $res.data.items) { $cartItemId = $res.data.items[0]._id }

  Test-API -Method GET -Url "/cart" -Headers $userHeaders -Name "Get cart"
  Test-API -Method GET -Url "/cart/accessories" -Headers $userHeaders -Name "Get cart accessories"

  if ($cartItemId) {
    Test-API -Method PUT -Url "/cart/item/$cartItemId" -Headers $userHeaders -Name "Update cart quantity" -Body @{ quantity = 1 }
    Test-API -Method POST -Url "/cart/save-for-later/$cartItemId" -Headers $userHeaders -Name "Save for later"
    Test-API -Method POST -Url "/cart/move-to-cart/$cartItemId" -Headers $userHeaders -Name "Move back to cart"
  }
}

# ---- 12. ADMIN: COUPONS ----
Write-Host "`n[12] Admin: Coupons" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/admin/coupons" -Headers $adminHeaders -Name "Create coupon" -Body @{
  code = "TESTSAVE10"; discountType = "percentage"; discount = 10; minOrderAmount = 100; maxDiscount = 5000
  usageLimit = 100; expiresAt = "2027-12-31T23:59:59Z"; isActive = $true
} -Expected @(200,201)
if ($res -and $res.data) { $couponId = $res.data._id }

Test-API -Method GET -Url "/admin/coupons" -Headers $adminHeaders -Name "List coupons"

# Validate coupon (public)
Test-API -Method POST -Url "/coupons/validate" -Name "Validate coupon" -Body @{
  code = "TESTSAVE10"; cartTotal = 50000
} -Expected @(200)

# Apply coupon to cart
if ($userToken) {
  Test-API -Method POST -Url "/cart/coupon" -Headers $userHeaders -Name "Apply coupon to cart" -Body @{ couponCode = "TESTSAVE10" }
  Test-API -Method DELETE -Url "/cart/coupon" -Headers $userHeaders -Name "Remove coupon from cart"
}

# ---- 13. USER: CREATE ORDER (CHECKOUT) ----
Write-Host "`n[13] User: Checkout & Order" -ForegroundColor Yellow

# First add an address
$res = Test-API -Method POST -Url "/users/addresses" -Headers $userHeaders -Name "Add address" -Body @{
  fullName = "Test User"; phone = "9876543211"; addressLine1 = "123 Test Street"; city = "Mumbai"
  state = "Maharashtra"; pincode = "400001"; type = "home"
} -Expected @(200,201)

# Make sure cart has items
Test-API -Method POST -Url "/cart/add" -Headers $userHeaders -Name "Ensure cart has item" -Body @{
  productId = $productId; quantity = 1
} -Expected @(200,201)

# Create order
$res = Test-API -Method POST -Url "/orders" -Headers $userHeaders -Name "Create order (checkout)" -Body @{
  shippingAddress = @{
    fullName = "Test User"; phone = "9876543211"; addressLine1 = "123 Test Street"
    city = "Mumbai"; state = "Maharashtra"; pincode = "400001"
  }
  paymentMethod = "cod"
  items = @(@{ productId = $productId; productName = "Samsung Galaxy S24 Ultra"; price = 124999; quantity = 1; image = "https://example.com/s24-thumb.jpg" })
  subtotal = 124999; tax = 0; shippingFee = 49; discount = 0; total = 125048
} -Expected @(200,201)
if ($res -and $res.data) { $orderId = $res.data._id }

# ---- 14. USER: ORDER MANAGEMENT ----
Write-Host "`n[14] User: Order Management" -ForegroundColor Yellow
Test-API -Method GET -Url "/orders" -Headers $userHeaders -Name "Get my orders"
if ($orderId) {
  Test-API -Method GET -Url "/orders/$orderId" -Headers $userHeaders -Name "Get order by ID"
  Test-API -Method GET -Url "/orders/$orderId/track" -Headers $userHeaders -Name "Track order"
  Test-API -Method GET -Url "/orders/$orderId/invoice" -Headers $userHeaders -Name "Download invoice"
}

# ---- 15. USER: ADD REVIEW ----
Write-Host "`n[15] User: Reviews" -ForegroundColor Yellow
if ($productId) {
  $res = Test-API -Method POST -Url "/products/$productId/reviews" -Headers $userHeaders -Name "Add product review" -Body @{
    rating = 5; comment = "Incredible phone! The camera quality is outstanding and the S Pen is amazing."
  } -Expected @(200,201)
  if ($res -and $res.data) { $reviewId = $res.data._id }
}
Test-API -Method GET -Url "/products/reviews/top" -Name "Public: Top reviews"

# ---- 16. USER: Q&A ----
Write-Host "`n[16] User: Q&A" -ForegroundColor Yellow
if ($productId) {
  $res = Test-API -Method POST -Url "/qa/product/$productId" -Headers $userHeaders -Name "Ask question" -Body @{
    question = "Does this phone support wireless charging?"
  } -Expected @(200,201)
  $questionId = if ($res -and $res.data) { $res.data._id } else { $null }

  Test-API -Method GET -Url "/qa/product/$productId" -Name "Get product Q&A"

  if ($questionId) {
    Test-API -Method POST -Url "/qa/$questionId/answer" -Headers $adminHeaders -Name "Admin answers question" -Body @{
      answer = "Yes, it supports 15W wireless charging and 4.5W reverse wireless charging."
    } -Expected @(200,201)

    Test-API -Method POST -Url "/qa/$questionId/upvote" -Headers $userHeaders -Name "Upvote question" -Expected @(200,201)
  }
}

# ---- 17. CONTACT FORM ----
Write-Host "`n[17] Contact Messages" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/contact" -Name "Submit contact form" -Body @{
  name = "John Customer"; email = "john@example.com"; phone = "9876543212"
  subject = "Product inquiry"; message = "I want to know about the warranty for Samsung Galaxy S24 Ultra"
} -Expected @(200,201)
if ($res -and $res.data) { $contactId = $res.data._id }

# ---- 18. SERVICE REQUEST ----
Write-Host "`n[18] Service Requests" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/service-requests" -Name "Create service request" -Body @{
  customerName = "Jane Doe"; customerPhone = "9876543213"; customerEmail = "jane@example.com"
  deviceBrand = "Samsung"; deviceModel = "Galaxy S24 Ultra"; serviceType = "screen_repair"
  description = "Screen cracked after accidental drop"
} -Expected @(200,201)
if ($res -and $res.data) { $serviceRequestId = $res.data._id }

# ---- 19. ADMIN: DASHBOARD ----
Write-Host "`n[19] Admin: Dashboard" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/dashboard/stats" -Headers $adminHeaders -Name "Dashboard stats"
Test-API -Method GET -Url "/admin/dashboard/revenue" -Headers $adminHeaders -Name "Monthly revenue"
Test-API -Method GET -Url "/admin/dashboard/top-products" -Headers $adminHeaders -Name "Top products"
Test-API -Method GET -Url "/admin/dashboard/recent-orders" -Headers $adminHeaders -Name "Recent orders"
Test-API -Method GET -Url "/admin/sales-report" -Headers $adminHeaders -Name "Sales report"

# ---- 20. ADMIN: ORDERS ----
Write-Host "`n[20] Admin: Order Management" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/orders" -Headers $adminHeaders -Name "List all orders"
if ($orderId) {
  Test-API -Method GET -Url "/admin/orders/$orderId" -Headers $adminHeaders -Name "Get order detail"
  Test-API -Method PATCH -Url "/admin/orders/$orderId/status" -Headers $adminHeaders -Name "Update order status" -Body @{
    orderStatus = "confirmed"; message = "Order confirmed and being processed"
  }
  Test-API -Method PATCH -Url "/admin/orders/$orderId/tracking" -Headers $adminHeaders -Name "Update tracking" -Body @{
    trackingNumber = "TRK123456789"; trackingUrl = "https://track.example.com/TRK123456789"
    logisticsPartner = "BlueDart"
  }
}

# ---- 21. ADMIN: USER MANAGEMENT ----
Write-Host "`n[21] Admin: Users" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/users" -Headers $adminHeaders -Name "List all users"
if ($userId) { Test-API -Method GET -Url "/admin/users/$userId" -Headers $adminHeaders -Name "Get user detail" }

# ---- 22. ADMIN: BANNERS ----
Write-Host "`n[22] Admin: Banners" -ForegroundColor Yellow
$res = Test-API -Method POST -Url "/admin/banners" -Headers $adminHeaders -Name "Create banner" -Body @{
  title = "Summer Sale"; subtitle = "Up to 50% off"; image = "https://example.com/banner.jpg"
  link = "/products?sale=summer"; isActive = $true; sortOrder = 1
} -Expected @(200,201)
if ($res -and $res.data) { $bannerId = $res.data._id }

Test-API -Method GET -Url "/banners" -Name "Public: Get banners"
Test-API -Method GET -Url "/admin/banners" -Headers $adminHeaders -Name "Admin: List banners"
if ($bannerId) {
  Test-API -Method PATCH -Url "/admin/banners/$bannerId/toggle" -Headers $adminHeaders -Name "Toggle banner"
}

# ---- 23. ADMIN: REVIEWS ----
Write-Host "`n[23] Admin: Reviews" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/reviews" -Headers $adminHeaders -Name "List all reviews"
if ($reviewId) {
  Test-API -Method PATCH -Url "/admin/reviews/$reviewId/approve" -Headers $adminHeaders -Name "Approve review"
}

# ---- 24. ADMIN: CONTACT MESSAGES ----
Write-Host "`n[24] Admin: Contact Messages" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/contact-messages" -Headers $adminHeaders -Name "List contact messages"
Test-API -Method GET -Url "/admin/contact-messages/unread-count" -Headers $adminHeaders -Name "Unread count"
if ($contactId) { Test-API -Method PATCH -Url "/admin/contact-messages/$contactId/read" -Headers $adminHeaders -Name "Mark as read" }

# ---- 25. ADMIN: SERVICE REQUESTS ----
Write-Host "`n[25] Admin: Service Requests" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/service-requests" -Headers $adminHeaders -Name "List service requests"
Test-API -Method GET -Url "/admin/service-requests/stats" -Headers $adminHeaders -Name "Service request stats"
if ($serviceRequestId) {
  Test-API -Method GET -Url "/admin/service-requests/$serviceRequestId" -Headers $adminHeaders -Name "Get service request"
  Test-API -Method PATCH -Url "/admin/service-requests/$serviceRequestId/status" -Headers $adminHeaders -Name "Update SR status" -Body @{
    status = "accepted"; adminNotes = "Device received, inspection in progress"; estimatedPrice = 8999
  }
}

# ---- 26. ADMIN: SETTINGS ----
Write-Host "`n[26] Admin: Settings" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/settings" -Headers $adminHeaders -Name "Get settings"
Test-API -Method PUT -Url "/admin/settings" -Headers $adminHeaders -Name "Update settings" -Body @{
  siteName = "AMOHA Mobiles"; tagline = "Explore Plus - Best Deals"; announcement = "Grand Sale Live!"; isAnnouncementActive = $true
}
Test-API -Method GET -Url "/settings" -Name "Public: Get settings"

# ---- 27. ADMIN: NOTIFICATIONS ----
Write-Host "`n[27] Admin: Notifications" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/notifications" -Headers $adminHeaders -Name "List notifications"
Test-API -Method GET -Url "/admin/notifications/recent" -Headers $adminHeaders -Name "Recent notifications"
Test-API -Method GET -Url "/admin/notifications/unread-count" -Headers $adminHeaders -Name "Unread notification count"

# ---- 28. ADMIN: CRM ----
Write-Host "`n[28] Admin: CRM" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/crm/customers" -Headers $adminHeaders -Name "List CRM customers"
Test-API -Method GET -Url "/admin/crm/segments" -Headers $adminHeaders -Name "CRM segments"
if ($userId) {
  Test-API -Method GET -Url "/admin/crm/customers/$userId" -Headers $adminHeaders -Name "Customer detail"
  $res = Test-API -Method POST -Url "/admin/crm/customers/$userId/notes" -Headers $adminHeaders -Name "Add CRM note" -Body @{
    note = "VIP customer, provide priority support"; type = "note"
  } -Expected @(200,201)
  if ($res -and $res.data) { $noteId = $res.data._id }
}

# ---- 29. ADMIN: PRODUCT VIEWS ----
Write-Host "`n[29] Admin: Product Views" -ForegroundColor Yellow
# Track a view first
if ($productId) {
  Test-API -Method POST -Url "/products/track-view" -Headers $userHeaders -Name "Track product view" -Body @{
    productId = $productId
  } -Expected @(200,201)
}
Test-API -Method GET -Url "/admin/product-views" -Headers $adminHeaders -Name "List product views"
Test-API -Method GET -Url "/admin/product-views/user-summary" -Headers $adminHeaders -Name "User view summary"

# ---- 30. ADMIN: POS ----
Write-Host "`n[30] Admin: POS" -ForegroundColor Yellow
if ($productId) {
  Test-API -Method POST -Url "/admin/pos/create-order" -Headers $adminHeaders -Name "POS create order" -Body @{
    items = @(@{ productId = $productId; productName = "Samsung Galaxy S24 Ultra"; price = 124999; quantity = 1 })
    subtotal = 124999; tax = 0; discount = 0; total = 124999; paymentMethod = "cash"
  } -Expected @(200,201)
}
Test-API -Method GET -Url "/admin/pos/orders" -Headers $adminHeaders -Name "POS order list"
Test-API -Method GET -Url "/admin/pos/today-stats" -Headers $adminHeaders -Name "POS today stats"
Test-API -Method GET -Url "/admin/pos/billing-info" -Headers $adminHeaders -Name "POS billing info"

# ---- 31. ADMIN: BARCODE ----
Write-Host "`n[31] Admin: Barcode" -ForegroundColor Yellow
if ($productId) {
  Test-API -Method POST -Url "/admin/barcode/regenerate/$productId" -Headers $adminHeaders -Name "Regenerate barcode" -Expected @(200,201)
}

# ---- 32. ADMIN: REPORTS ----
Write-Host "`n[32] Admin: Reports" -ForegroundColor Yellow
Test-API -Method GET -Url "/admin/reports/sales" -Headers $adminHeaders -Name "Sales report CSV"
Test-API -Method GET -Url "/admin/reports/inventory" -Headers $adminHeaders -Name "Inventory report CSV"

# ---- 33. ACTIVITY LOGS ----
Write-Host "`n[33] Activity Logs" -ForegroundColor Yellow
Test-API -Method GET -Url "/activity-logs" -Headers $adminHeaders -Name "List activity logs"

# ---- 34. USER: WALLET ----
Write-Host "`n[34] User: Wallet" -ForegroundColor Yellow
Test-API -Method GET -Url "/wallet/balance" -Headers $userHeaders -Name "Get wallet balance"
Test-API -Method GET -Url "/wallet/transactions" -Headers $userHeaders -Name "Wallet transactions"

# ---- 35. USER: ADDRESSES ----
Write-Host "`n[35] User: Addresses" -ForegroundColor Yellow
Test-API -Method GET -Url "/users/addresses" -Headers $userHeaders -Name "List addresses"

# ---- 36. USER: RETURNS ----
Write-Host "`n[36] Returns" -ForegroundColor Yellow
Test-API -Method GET -Url "/returns" -Headers $userHeaders -Name "User: List returns"
Test-API -Method GET -Url "/returns/admin/all" -Headers $adminHeaders -Name "Admin: All returns"
Test-API -Method GET -Url "/returns/admin/stats" -Headers $adminHeaders -Name "Admin: Return stats"

# ---- 37. PUBLIC ORDER TRACKING ----
Write-Host "`n[37] Public Order Tracking" -ForegroundColor Yellow
Test-API -Method GET -Url "/orders/track/public?orderNumber=DOESNOTEXIST&phone=1234567890" -Name "Track non-existent order" -Expected @(404)

# ---- 38. WISHLIST CLEANUP ----
Write-Host "`n[38] Wishlist: Remove item" -ForegroundColor Yellow
if ($productId) {
  Test-API -Method DELETE -Url "/wishlist/$productId" -Headers $userHeaders -Name "Remove from wishlist"
}

# ---- 39. CART CLEANUP ----
Write-Host "`n[39] Cart: Clear" -ForegroundColor Yellow
Test-API -Method DELETE -Url "/cart/clear" -Headers $userHeaders -Name "Clear cart"

# ---- 40. ADMIN: DELETE TEST DATA (cleanup) ----
Write-Host "`n[40] Cleanup" -ForegroundColor Yellow
if ($noteId) { Test-API -Method DELETE -Url "/admin/crm/notes/$noteId" -Headers $adminHeaders -Name "Delete CRM note" }
if ($contactId) { Test-API -Method DELETE -Url "/admin/contact-messages/$contactId" -Headers $adminHeaders -Name "Delete contact message" }
if ($serviceRequestId) { Test-API -Method DELETE -Url "/admin/service-requests/$serviceRequestId" -Headers $adminHeaders -Name "Delete service request" }
if ($reviewId -and $productId) { Test-API -Method DELETE -Url "/products/$productId/reviews/$reviewId" -Headers $userHeaders -Name "Delete review" }
if ($couponId) { Test-API -Method DELETE -Url "/admin/coupons/$couponId" -Headers $adminHeaders -Name "Delete coupon" }
if ($bannerId) { Test-API -Method DELETE -Url "/admin/banners/$bannerId" -Headers $adminHeaders -Name "Delete banner" }
if ($product2Id) { Test-API -Method DELETE -Url "/admin/products/$product2Id" -Headers $adminHeaders -Name "Delete product 2" }
if ($productId) { Test-API -Method DELETE -Url "/admin/products/$productId" -Headers $adminHeaders -Name "Delete product 1" }
if ($categoryId) { Test-API -Method DELETE -Url "/admin/categories/$categoryId" -Headers $adminHeaders -Name "Delete category" }
if ($brandId) { Test-API -Method DELETE -Url "/admin/brands/$brandId" -Headers $adminHeaders -Name "Delete brand" }

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $pass" -ForegroundColor Green
Write-Host "  Failed: $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
Write-Host "  Total:  $($pass + $fail)" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
  Write-Host "`n  FAILURES:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
