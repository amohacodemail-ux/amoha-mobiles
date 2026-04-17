$ErrorActionPreference = "Continue"
$base = "http://localhost:5001/api"

function Test-Endpoint {
    param([string]$Name, [string]$Method = "GET", [string]$Url, [hashtable]$Headers = @{}, [string]$Body = "", [string]$Expected = "200")
    try {
        $params = @{Uri=$Url; Method=$Method; UseBasicParsing=$true}
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        $d = $r.Content | ConvertFrom-Json
        Write-Host "PASS  $Name ($($r.StatusCode))" -ForegroundColor Green
        return $d
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $msg = try { ($_.ErrorDetails.Message | ConvertFrom-Json).message } catch { $_.Exception.Message }
        Write-Host "FAIL  $Name ($status) - $msg" -ForegroundColor Red
        return $null
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " COMPREHENSIVE API TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Register
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$regBody = @{name="APITest$ts";email="at$ts@test.com";phone="9$($ts.ToString().Substring(0,9))";password="Test@12345";confirmPassword="Test@12345"} | ConvertTo-Json
$reg = Test-Endpoint "Register" "POST" "$base/auth/register" @{} $regBody "201"
$token = $reg.token
$uid = $reg.user._id
$H = @{Authorization="Bearer $token"}
Write-Host "  Token: $($token.Substring(0,30))..." -ForegroundColor DarkGray
Write-Host "  UID: $uid" -ForegroundColor DarkGray

# 2. Login
$loginBody = @{email="at$ts@test.com";password="Test@12345"} | ConvertTo-Json
Test-Endpoint "Login" "POST" "$base/auth/login" @{} $loginBody

# 3. Profile
$profile = Test-Endpoint "Get Profile" "GET" "$base/auth/profile" $H
Write-Host "  User: $($profile.data.name), KYC: $($profile.data.kyc.status)" -ForegroundColor DarkGray

# 4. Categories
$cats = Test-Endpoint "Categories" "GET" "$base/categories"
Write-Host "  Count: $($cats.data.Length)" -ForegroundColor DarkGray

# 5. Brands
$brands = Test-Endpoint "Brands" "GET" "$base/brands"
Write-Host "  Count: $($brands.data.Length)" -ForegroundColor DarkGray

# 6. Products (paginated)
$prods = Test-Endpoint "Products List" "GET" "$base/products?limit=3"
Write-Host "  totalProducts=$($prods.data.totalProducts), totalPages=$($prods.data.totalPages), currentPage=$($prods.data.currentPage), hasMore=$($prods.data.hasMore)" -ForegroundColor DarkGray
$testPid = $prods.data.products[0]._id
$testSlug = $prods.data.products[0].slug
Write-Host "  First: $($prods.data.products[0].name) (id=$testPid)" -ForegroundColor DarkGray

# 7. Product Detail
$prod = Test-Endpoint "Product Detail" "GET" "$base/products/$testSlug"
Write-Host "  name=$($prod.data.name), price=$($prod.data.price), reviews=$($prod.data.reviews.Length), brand=$($prod.data.brand), inStock=$($prod.data.inStock)" -ForegroundColor DarkGray

# 8. Featured
$feat = Test-Endpoint "Featured Products" "GET" "$base/products/featured"
Write-Host "  Count: $(if($feat.data){$feat.data.Length}else{0})" -ForegroundColor DarkGray

# 9. Trending
$trend = Test-Endpoint "Trending Products" "GET" "$base/products/trending"
Write-Host "  Count: $(if($trend.data){$trend.data.Length}else{0})" -ForegroundColor DarkGray

# 10. Search
$search = Test-Endpoint "Search Suggestions" "GET" "$base/products/search/suggestions?q=admin"
Write-Host "  Count: $(if($search.data){$search.data.Length}else{0})" -ForegroundColor DarkGray
if ($search.data -and $search.data.Length -gt 0) {
    Write-Host "  Fields: _id=$($search.data[0]._id), thumbnail=$($search.data[0].thumbnail), price=$($search.data[0].price), brand=$($search.data[0].brand)" -ForegroundColor DarkGray
}

# 11. Banners
$banners = Test-Endpoint "Banners" "GET" "$base/banners"
Write-Host "  Count: $(if($banners.data){$banners.data.Length}else{0})" -ForegroundColor DarkGray

# 12. Settings
$settings = Test-Endpoint "Settings" "GET" "$base/settings"

# 13. Cart (empty)
$cart = Test-Endpoint "Cart (empty)" "GET" "$base/cart" $H
Write-Host "  items=$($cart.data.items.Length), totalItems=$($cart.data.totalItems)" -ForegroundColor DarkGray

# 14. Add to Cart
$cartAdd = Test-Endpoint "Add to Cart" "POST" "$base/cart/add" $H (@{productId=$testPid;quantity=2;color="Black"}|ConvertTo-Json)
Write-Host "  items=$($cartAdd.data.items.Length), totalItems=$($cartAdd.data.totalItems), totalAmount=$($cartAdd.data.totalAmount)" -ForegroundColor DarkGray
if ($cartAdd.data.items.Length -gt 0) {
    $item = $cartAdd.data.items[0]
    Write-Host "  Cart item: product._id=$($item.product._id), product.name=$($item.product.name), product.price=$($item.product.price), qty=$($item.quantity), price=$($item.price)" -ForegroundColor DarkGray
}

# 15. Wishlist
$wl = Test-Endpoint "Wishlist (empty)" "GET" "$base/wishlist" $H
Write-Host "  items=$($wl.data.items.Length)" -ForegroundColor DarkGray

$wlAdd = Test-Endpoint "Add to Wishlist" "POST" "$base/wishlist" $H (@{productId=$testPid}|ConvertTo-Json)
if ($wlAdd -and $wlAdd.data.items.Length -gt 0) {
    $wlItem = $wlAdd.data.items[0]
    Write-Host "  Wishlist item: product._id=$($wlItem.product._id), product.name=$($wlItem.product.name), addedAt=$($wlItem.addedAt)" -ForegroundColor DarkGray
}

# 16. Orders (empty)
$orders = Test-Endpoint "Orders (empty)" "GET" "$base/orders" $H
Write-Host "  totalOrders=$($orders.data.totalOrders), orders=$($orders.data.orders.Length)" -ForegroundColor DarkGray

# 17. Create Order (COD)
$orderBody = @{
    shippingAddress=@{fullName="Test User";phone="9876543210";addressLine1="123 Test St";city="TestCity";state="TestState";pincode="123456";type="home"}
    paymentMethod="cod"
} | ConvertTo-Json -Depth 3
$order = Test-Endpoint "Create Order (COD)" "POST" "$base/orders" $H $orderBody "201"
if ($order) {
    $o = $order.data
    Write-Host "  orderNumber=$($o.orderNumber), orderStatus=$($o.orderStatus), totalAmount=$($o.totalAmount), deliveryCharge=$($o.deliveryCharge), items=$($o.items.Length)" -ForegroundColor DarkGray
    $testOid = $o._id
}

# 18. Get Order by ID
if ($testOid) {
    $orderDetail = Test-Endpoint "Order Detail" "GET" "$base/orders/$testOid" $H
    Write-Host "  orderStatus=$($orderDetail.data.orderStatus), statusHistory=$($orderDetail.data.statusHistory.Length)" -ForegroundColor DarkGray
}

# 19. Cart should be empty after order
$cartAfter = Test-Endpoint "Cart (after order)" "GET" "$base/cart" $H
Write-Host "  items=$($cartAfter.data.items.Length), totalItems=$($cartAfter.data.totalItems)" -ForegroundColor DarkGray

# 20. Contact form
$contactBody = @{name="Test";email="test@test.com";phone="1234567890";subject="Test subject";message="Test message body"} | ConvertTo-Json
Test-Endpoint "Contact Form" "POST" "$base/contact" @{} $contactBody "201"

# 21. Wallet balance
Test-Endpoint "Wallet Balance" "GET" "$base/wallet/balance" $H

# 22. Returns
Test-Endpoint "Returns" "GET" "$base/returns" $H

# 23. Related products
Test-Endpoint "Related Products" "GET" "$base/products/$testPid/related"

# 24. Category products
if ($cats -and $cats.data.Length -gt 0) {
    $catSlug = $cats.data[0].slug
    $catProds = Test-Endpoint "Category Products" "GET" "$base/products/category/$catSlug"
    Write-Host "  totalProducts=$($catProds.data.totalProducts)" -ForegroundColor DarkGray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
