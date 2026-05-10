# Cart API Test Suite
# Tests all cart operations

$ErrorActionPreference = "Continue"
$base = "http://localhost:5001/api"

function Test-API {
    param([string]$Name, [string]$Method = "GET", [string]$Url, [hashtable]$Headers = @{}, [string]$Body = "", [bool]$ExpectError = $false)
    try {
        $params = @{Uri=$Url; Method=$Method; UseBasicParsing=$true}
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params -ErrorAction Stop
        $d = $r.Content | ConvertFrom-Json
        Write-Host "✓ $Name" -ForegroundColor Green
        return @{ok=$true; data=$d}
    } catch {
        $status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        $msg = $_.Exception.Message
        if ($ExpectError -and $status -ge 400) {
            Write-Host "✓ $Name (expected error)" -ForegroundColor Green
            return @{ok=$true; error=$msg}
        }
        Write-Host "✗ $Name - $msg" -ForegroundColor Red
        return @{ok=$false; error=$msg}
    }
}

Write-Host "`n========== CART API TESTS ==========`n" -ForegroundColor Cyan

# SETUP
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$regBody = @{name="Test$ts";email="t$ts@t.com";phone="9$($ts.ToString().Substring(0,9))";password="Test@123";confirmPassword="Test@123"} | ConvertTo-Json
$reg = Test-API "Register" "POST" "$base/auth/register" @{} $regBody
if (-not $reg.ok) { Write-Host "FATAL: Cannot register" -ForegroundColor Red; exit 1 }
$token = $reg.data.token
$H = @{Authorization="Bearer $token"}

$prods = Test-API "Get Products" "GET" "$base/products?limit=5"
if (-not $prods.ok -or $prods.data.data.products.Length -eq 0) { Write-Host "FATAL: No products" -ForegroundColor Red; exit 1 }
$pid = $prods.data.data.products[0]._id
$stock = $prods.data.data.products[0].stock
Write-Host "Test Product: $pid (stock: $stock)`n" -ForegroundColor DarkGray

# TEST 1: Get empty cart
Write-Host "[1] Get empty cart" -ForegroundColor Yellow
$cart1 = Test-API "  Cart (empty)" "GET" "$base/cart" $H
if ($cart1.ok) { Write-Host "  Items: $($cart1.data.data.items.Length)" -ForegroundColor DarkGray }

# TEST 2: Add to cart
Write-Host "`n[2] Add item to cart" -ForegroundColor Yellow
$addBody = @{productId=$pid; quantity=1} | ConvertTo-Json
$cart2 = Test-API "  Add item" "POST" "$base/cart/add" $H $addBody
if ($cart2.ok) {
    $itemId = $cart2.data.data.items[0]._id
    Write-Host "  Item ID: $itemId" -ForegroundColor DarkGray
    Write-Host "  Quantity: $($cart2.data.data.items[0].quantity)" -ForegroundColor DarkGray
    Write-Host "  Total: $($cart2.data.data.totalAmount)" -ForegroundColor DarkGray
}

# TEST 3: Update quantity
if ($cart2.ok -and $cart2.data.data.items.Length -gt 0) {
    Write-Host "`n[3] Update quantity" -ForegroundColor Yellow
    $itemId = $cart2.data.data.items[0]._id
    $updateBody = @{quantity=2} | ConvertTo-Json
    $cart3 = Test-API "  Increment to 2" "PUT" "$base/cart/item/$itemId" $H $updateBody
    if ($cart3.ok) { Write-Host "  New qty: $($cart3.data.data.items[0].quantity)" -ForegroundColor DarkGray }
}

# TEST 4: Stock validation
if ($cart2.ok -and $cart2.data.data.items.Length -gt 0 -and $stock -gt 0) {
    Write-Host "`n[4] Stock limit validation" -ForegroundColor Yellow
    $itemId = $cart2.data.data.items[0]._id
    $excessBody = @{quantity=($stock + 10)} | ConvertTo-Json
    $cart4 = Test-API "  Exceed stock" "PUT" "$base/cart/item/$itemId" $H $excessBody $true
}

# TEST 5: Min quantity validation
if ($cart2.ok -and $cart2.data.data.items.Length -gt 0) {
    Write-Host "`n[5] Minimum quantity validation" -ForegroundColor Yellow
    $itemId = $cart2.data.data.items[0]._id
    $zeroBody = @{quantity=0} | ConvertTo-Json
    $cart5 = Test-API "  Set to zero" "PUT" "$base/cart/item/$itemId" $H $zeroBody $true
}

# TEST 6: Remove item
if ($cart2.ok -and $cart2.data.data.items.Length -gt 0) {
    Write-Host "`n[6] Remove item" -ForegroundColor Yellow
    $itemId = $cart2.data.data.items[0]._id
    $cart6 = Test-API "  Remove" "DELETE" "$base/cart/item/$itemId" $H
    if ($cart6.ok) { Write-Host "  Items left: $($cart6.data.data.items.Length)" -ForegroundColor DarkGray }
}

# TEST 7: Add multiple items
Write-Host "`n[7] Multiple items" -ForegroundColor Yellow
$add1 = Test-API "  Add item 1" "POST" "$base/cart/add" $H (@{productId=$pid; quantity=1} | ConvertTo-Json)
if ($prods.data.data.products.Length -gt 1) {
    $pid2 = $prods.data.data.products[1]._id
    $add2 = Test-API "  Add item 2" "POST" "$base/cart/add" $H (@{productId=$pid2; quantity=1} | ConvertTo-Json)
    if ($add2.ok) { Write-Host "  Total items: $($add2.data.data.items.Length)" -ForegroundColor DarkGray }
}

# TEST 8: Clear cart
Write-Host "`n[8] Clear cart" -ForegroundColor Yellow
$clear = Test-API "  Clear" "DELETE" "$base/cart/clear" $H
$verify = Test-API "  Verify empty" "GET" "$base/cart" $H
if ($verify.ok) { Write-Host "  Items: $($verify.data.data.items.Length)" -ForegroundColor DarkGray }

Write-Host "`n========== TESTS COMPLETE ==========`n" -ForegroundColor Green
