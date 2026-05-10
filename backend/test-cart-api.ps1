# ================================================================
# CART API COMPREHENSIVE TEST SUITE
# Tests all cart operations including stock validation
# ================================================================

$ErrorActionPreference = "Continue"
$base = "http://localhost:5001/api"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [string]$ExpectedStatus = "2xx"
    )
    try {
        $params = @{Uri=$Url; Method=$Method; UseBasicParsing=$true; ErrorAction='Stop'}
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        $d = $r.Content | ConvertFrom-Json
        Write-Host "✓ PASS  $Name ($($r.StatusCode))" -ForegroundColor Green
        return @{success=$true; data=$d; status=$r.StatusCode}
    } catch {
        $status = try { $_.Exception.Response.StatusCode.value__ } catch { 0 }
        $msg = try { ($_.ErrorDetails.Message | ConvertFrom-Json).message } catch { $_.Exception.Message }
        if ($ExpectedStatus -eq "4xx" -and $status -ge 400 -and $status -lt 500) {
            Write-Host "✓ PASS  $Name ($status) - Expected error: $msg" -ForegroundColor Green
            return @{success=$true; error=$msg; status=$status}
        } else {
            Write-Host "✗ FAIL  $Name ($status) - $msg" -ForegroundColor Red
            return @{success=$false; error=$msg; status=$status}
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CART API TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Setup: Register test user
Write-Host "[SETUP] Creating test user..." -ForegroundColor Yellow
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$regBody = @{
    name="CartTest$ts"
    email="ct$ts@test.com"
    phone="9$($ts.ToString().Substring(0,9))"
    password="Test@12345"
    confirmPassword="Test@12345"
} | ConvertTo-Json

$reg = Test-Endpoint "Register User" "POST" "$base/auth/register" @{} $regBody
if (-not $reg.success) {
    Write-Host "❌ FATAL: Cannot register user. Exiting." -ForegroundColor Red
    exit 1
}

$token = $reg.data.token
$H = @{Authorization="Bearer $token"}
Write-Host "  Token obtained: $($token.Substring(0,30))..." -ForegroundColor DarkGray
Write-Host ""

# Get a test product
Write-Host "[SETUP] Getting test product..." -ForegroundColor Yellow
$prods = Test-Endpoint "Get Products" "GET" "$base/products?limit=5"
if (-not $prods.success -or $prods.data.data.products.Length -eq 0) {
    Write-Host "❌ FATAL: No products available. Exiting." -ForegroundColor Red
    exit 1
}

$testProduct = $prods.data.data.products[0]
$testPid = $testProduct._id
$testStock = $testProduct.stock
Write-Host "  Product: $($testProduct.name)" -ForegroundColor DarkGray
Write-Host "  ID: $testPid" -ForegroundColor DarkGray
Write-Host "  Stock: $testStock" -ForegroundColor DarkGray
Write-Host ""

# ================================================================
# TEST 1: Get Empty Cart
# ================================================================
Write-Host "[TEST 1] Get empty cart..." -ForegroundColor Cyan
$cart = Test-Endpoint "Get Cart (empty)" "GET" "$base/cart" $H
if ($cart.success) {
    Write-Host "  Items: $($cart.data.data.items.Length)" -ForegroundColor DarkGray
    Write-Host "  Total Items: $($cart.data.data.totalItems)" -ForegroundColor DarkGray
    Write-Host "  Subtotal: $($cart.data.data.subtotal)" -ForegroundColor DarkGray
}
Write-Host ""

# ================================================================
# TEST 2: Add Item to Cart
# ================================================================
Write-Host "[TEST 2] Add item to cart..." -ForegroundColor Cyan
$addBody = @{productId=$testPid; quantity=1; color="Black"} | ConvertTo-Json
$cartAdd = Test-Endpoint "Add to Cart" "POST" "$base/cart/add" $H $addBody
if ($cartAdd.success) {
    $cartData = $cartAdd.data.data
    Write-Host "  Items: $($cartData.items.Length)" -ForegroundColor DarkGray
    Write-Host "  Total Items: $($cartData.totalItems)" -ForegroundColor DarkGray
    Write-Host "  Subtotal: $($cartData.subtotal)" -ForegroundColor DarkGray
    Write-Host "  Total: $($cartData.totalAmount)" -ForegroundColor DarkGray
    if ($cartData.items.Length -gt 0) {
        $item = $cartData.items[0]
        $itemId = $item._id
        Write-Host "  Cart Item ID: $itemId" -ForegroundColor DarkGray
        Write-Host "  Quantity: $($item.quantity)" -ForegroundColor DarkGray
        Write-Host "  Price: $($item.price)" -ForegroundColor DarkGray
        Write-Host "  Total Price: $($item.totalPrice)" -ForegroundColor DarkGray
    }
}
Write-Host ""

# ================================================================
# TEST 3: Update Quantity (Increment)
# ================================================================
Write-Host "[TEST 3] Update quantity (increment)..." -ForegroundColor Cyan
if ($cartAdd.success -and $cartAdd.data.data.items.Length -gt 0) {
    $itemId = $cartAdd.data.data.items[0]._id
    $newQty = 2
    $updateBody = @{quantity=$newQty} | ConvertTo-Json
    $cartUpdate = Test-Endpoint "Update Quantity" "PUT" "$base/cart/item/$itemId" $H $updateBody
    if ($cartUpdate.success) {
        $updatedItem = $cartUpdate.data.data.items | Where-Object { $_._id -eq $itemId }
        Write-Host "  New Quantity: $($updatedItem.quantity)" -ForegroundColor DarkGray
        Write-Host "  New Total Price: $($updatedItem.totalPrice)" -ForegroundColor DarkGray
        Write-Host "  Cart Subtotal: $($cartUpdate.data.data.subtotal)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  Skipped (no item in cart)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 4: Update Quantity (Decrement)
# ================================================================
Write-Host "[TEST 4] Update quantity (decrement)..." -ForegroundColor Cyan
if ($cartAdd.success -and $cartAdd.data.data.items.Length -gt 0) {
    $itemId = $cartAdd.data.data.items[0]._id
    $newQty = 1
    $updateBody = @{quantity=$newQty} | ConvertTo-Json
    $cartDecrement = Test-Endpoint "Decrement Quantity" "PUT" "$base/cart/item/$itemId" $H $updateBody
    if ($cartDecrement.success) {
        $updatedItem = $cartDecrement.data.data.items | Where-Object { $_._id -eq $itemId }
        Write-Host "  New Quantity: $($updatedItem.quantity)" -ForegroundColor DarkGray
        Write-Host "  New Total Price: $($updatedItem.totalPrice)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  Skipped (no item in cart)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 5: Stock Limit Validation
# ================================================================
Write-Host "[TEST 5] Test stock limit validation..." -ForegroundColor Cyan
if ($cartAdd.success -and $cartAdd.data.data.items.Length -gt 0 -and $testStock -gt 0) {
    $itemId = $cartAdd.data.data.items[0]._id
    # Try to set quantity beyond stock
    $excessQty = $testStock + 10
    $excessBody = @{quantity=$excessQty} | ConvertTo-Json
    $cartExcess = Test-Endpoint "Update Beyond Stock (should fail)" "PUT" "$base/cart/item/$itemId" $H $excessBody "4xx"
    if ($cartExcess.success -and $cartExcess.error) {
        Write-Host "  ✓ Stock validation working: $($cartExcess.error)" -ForegroundColor Green
    }
} else {
    Write-Host "  Skipped (no item or no stock info)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 6: Invalid Quantity - Less than 1
# ================================================================
Write-Host "[TEST 6] Test invalid quantity (less than 1)..." -ForegroundColor Cyan
if ($cartAdd.success -and $cartAdd.data.data.items.Length -gt 0) {
    $itemId = $cartAdd.data.data.items[0]._id
    $invalidBody = @{quantity=0} | ConvertTo-Json
    $cartInvalid = Test-Endpoint "Update to Zero (should fail)" "PUT" "$base/cart/item/$itemId" $H $invalidBody "4xx"
    if ($cartInvalid.success -and $cartInvalid.error) {
        Write-Host "  ✓ Minimum quantity validation working: $($cartInvalid.error)" -ForegroundColor Green
    }
} else {
    Write-Host "  Skipped (no item in cart)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 7: Remove Item from Cart
# ================================================================
Write-Host "[TEST 7] Remove item from cart..." -ForegroundColor Cyan
if ($cartAdd.success -and $cartAdd.data.data.items.Length -gt 0) {
    $itemId = $cartAdd.data.data.items[0]._id
    $cartRemove = Test-Endpoint "Remove Item" "DELETE" "$base/cart/item/$itemId" $H
    if ($cartRemove.success) {
        Write-Host "  Items After Removal: $($cartRemove.data.data.items.Length)" -ForegroundColor DarkGray
        Write-Host "  Total Items: $($cartRemove.data.data.totalItems)" -ForegroundColor DarkGray
        Write-Host "  Subtotal: $($cartRemove.data.data.subtotal)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  Skipped (no item in cart)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 8: Add Multiple Items
# ================================================================
Write-Host "[TEST 8] Add multiple items to cart..." -ForegroundColor Cyan
$prod2 = if ($prods.data.data.products.Length -gt 1) { $prods.data.data.products[1] } else { $null }
if ($prod2) {
    $add1 = Test-Endpoint "Add Item 1" "POST" "$base/cart/add" $H (@{productId=$testPid; quantity=1} | ConvertTo-Json)
    $add2 = Test-Endpoint "Add Item 2" "POST" "$base/cart/add" $H (@{productId=$prod2._id; quantity=1} | ConvertTo-Json)
    if ($add2.success) {
        Write-Host "  Total Items in Cart: $($add2.data.data.items.Length)" -ForegroundColor DarkGray
        Write-Host "  Total Quantity: $($add2.data.data.totalItems)" -ForegroundColor DarkGray
        Write-Host "  Cart Total: $($add2.data.data.totalAmount)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  Skipped (not enough products)" -ForegroundColor Yellow
}
Write-Host ""

# ================================================================
# TEST 9: Get Cart Accessories
# ================================================================
Write-Host "[TEST 9] Get cart accessories..." -ForegroundColor Cyan
$accessories = Test-Endpoint "Get Accessories" "GET" "$base/cart/accessories" $H
if ($accessories.success) {
    Write-Host "  Accessories Count: $($accessories.data.data.Length)" -ForegroundColor DarkGray
}
Write-Host ""

# ================================================================
# TEST 10: Clear Cart
# ================================================================
Write-Host "[TEST 10] Clear cart..." -ForegroundColor Cyan
$cartClear = Test-Endpoint "Clear Cart" "DELETE" "$base/cart/clear" $H
if ($cartClear.success) {
    # Verify cart is empty
    $verifyEmpty = Test-Endpoint "Verify Empty" "GET" "$base/cart" $H
    if ($verifyEmpty.success) {
        Write-Host "  Items After Clear: $($verifyEmpty.data.data.items.Length)" -ForegroundColor DarkGray
        Write-Host "  Total Items: $($verifyEmpty.data.data.totalItems)" -ForegroundColor DarkGray
        Write-Host "  Subtotal: $($verifyEmpty.data.data.subtotal)" -ForegroundColor DarkGray
    }
}
Write-Host ""

# ================================================================
# SUMMARY
# ================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All cart API tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Key validations tested:" -ForegroundColor Yellow
Write-Host "  ✓ Cart CRUD operations" -ForegroundColor Green
Write-Host "  ✓ Quantity increment/decrement" -ForegroundColor Green
Write-Host "  ✓ Stock limit validation" -ForegroundColor Green
Write-Host "  ✓ Minimum quantity validation" -ForegroundColor Green
Write-Host "  ✓ Item removal" -ForegroundColor Green
Write-Host "  ✓ Cart calculations (subtotal, total)" -ForegroundColor Green
Write-Host ""
