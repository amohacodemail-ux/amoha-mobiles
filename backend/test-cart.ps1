# Cart API Test Suite
$ErrorActionPreference = "Continue"
$base = "http://localhost:10000/api"

function Test-API {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [bool]$ExpectError = $false
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        if ($ExpectError) {
            Write-Host "FAIL: $Name - Expected error but got success" -ForegroundColor Red
            return @{success=$false; data=$data}
        }
        
        Write-Host "PASS: $Name" -ForegroundColor Green
        return @{success=$true; data=$data}
    }
    catch {
        $statusCode = 0
        $errorMsg = $_.Exception.Message
        $errorDetail = ""
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd()
                $reader.Close()
                $errorJson = $errorBody | ConvertFrom-Json
                $errorDetail = $errorJson.message
            } catch {
                $errorDetail = $errorMsg
            }
        }
        
        if ($ExpectError -and $statusCode -ge 400) {
            Write-Host "PASS: $Name (Expected error: $errorDetail)" -ForegroundColor Green
            return @{success=$true; error=$errorDetail; status=$statusCode}
        }
        
        Write-Host "FAIL: $Name - [$statusCode] $errorDetail" -ForegroundColor Red
        return @{success=$false; error=$errorDetail; status=$statusCode}
    }
}

Write-Host "`n=== CART API TESTS ===`n" -ForegroundColor Cyan

# Setup: Register
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$phoneNum = "9" + $timestamp.ToString().Substring(0,9)
$registerData = @{
    name = "TestUser$timestamp"
    email = "test$timestamp@example.com"
    phone = $phoneNum
    password = "Test@12345"
    confirmPassword = "Test@12345"
} | ConvertTo-Json

Write-Host "Registering test user..." -ForegroundColor Yellow
$registerResult = Test-API "Register" "POST" "$base/auth/register" @{} $registerData

if (-not $registerResult.success) {
    Write-Host "ERROR: Cannot register user. Exiting." -ForegroundColor Red
    exit 1
}

$token = $registerResult.data.token
$authHeaders = @{Authorization = "Bearer $token"}
Write-Host "Token: $($token.Substring(0,20))...`n" -ForegroundColor DarkGray

# Get products
Write-Host "Getting products..." -ForegroundColor Yellow
$productsResult = Test-API "Get Products" "GET" "$base/products?limit=20"

if (-not $productsResult.success -or $productsResult.data.data.products.Count -eq 0) {
    Write-Host "ERROR: No products available. Exiting." -ForegroundColor Red
    exit 1
}

# Find a product with stock > 1 for better testing
$testProduct = $null
foreach ($product in $productsResult.data.data.products) {
    if ($product.stock -gt 1) {
        $testProduct = $product
        break
    }
}

# If no product with stock > 1, use first product
if (-not $testProduct) {
    Write-Host "  WARNING: No products with stock > 1, using first product" -ForegroundColor Yellow
    $testProduct = $productsResult.data.data.products[0]
}

$productId = $testProduct._id
$productStock = $testProduct.stock
Write-Host "Product ID: $productId" -ForegroundColor DarkGray
Write-Host "Product Stock: $productStock`n" -ForegroundColor DarkGray

# TEST 1: Get empty cart
Write-Host "[TEST 1] Get empty cart" -ForegroundColor Cyan
$cartResult = Test-API "Get Cart" "GET" "$base/cart" $authHeaders
if ($cartResult.success) {
    Write-Host "  Items: $($cartResult.data.data.items.Count)" -ForegroundColor Gray
    Write-Host "  Total: $($cartResult.data.data.totalAmount)`n" -ForegroundColor Gray
}

# TEST 2: Add to cart
Write-Host "[TEST 2] Add item to cart" -ForegroundColor Cyan
$addData = @{
    productId = $productId
    quantity = 1
} | ConvertTo-Json

$addResult = Test-API "Add to Cart" "POST" "$base/cart/add" $authHeaders $addData
$cartItemId = $null

if ($addResult.success) {
    Write-Host "  Items: $($addResult.data.data.items.Count)" -ForegroundColor Gray
    Write-Host "  Total: $($addResult.data.data.totalAmount)" -ForegroundColor Gray
    if ($addResult.data.data.items.Count -gt 0) {
        $cartItemId = $addResult.data.data.items[0]._id
        Write-Host "  Item ID: $cartItemId`n" -ForegroundColor Gray
    }
}

# TEST 3: Update quantity
if ($cartItemId) {
    Write-Host "[TEST 3] Update quantity" -ForegroundColor Cyan
    if ($productStock -gt 1) {
        $updateData = @{quantity = 2} | ConvertTo-Json
        $updateResult = Test-API "Update Quantity" "PUT" "$base/cart/item/$cartItemId" $authHeaders $updateData $false
        if ($updateResult.success) {
            $updatedItem = $updateResult.data.data.items | Where-Object { $_._id -eq $cartItemId }
            Write-Host "  New Quantity: $($updatedItem.quantity)" -ForegroundColor Gray
            Write-Host "  Total: $($updateResult.data.data.totalAmount)`n" -ForegroundColor Gray
        }
    } else {
        Write-Host "  SKIP: Stock only $productStock, cannot increment to 2" -ForegroundColor Yellow
        Write-Host ""
    }
}

# TEST 4: Stock validation
if ($cartItemId -and $productStock -gt 0) {
    Write-Host "[TEST 4] Stock validation (should fail)" -ForegroundColor Cyan
    $excessQty = $productStock + 10
    $excessData = @{quantity = $excessQty} | ConvertTo-Json
    $excessResult = Test-API "Exceed Stock" "PUT" "$base/cart/item/$cartItemId" $authHeaders $excessData $true
    Write-Host ""
}

# TEST 5: Minimum quantity validation
if ($cartItemId) {
    Write-Host "[TEST 5] Minimum quantity validation (should fail)" -ForegroundColor Cyan
    $zeroData = @{quantity = 0} | ConvertTo-Json
    $zeroResult = Test-API "Set to Zero" "PUT" "$base/cart/item/$cartItemId" $authHeaders $zeroData $true
    Write-Host ""
}

# TEST 6: Remove item
if ($cartItemId) {
    Write-Host "[TEST 6] Remove item" -ForegroundColor Cyan
    $removeResult = Test-API "Remove Item" "DELETE" "$base/cart/item/$cartItemId" $authHeaders
    if ($removeResult.success) {
        Write-Host "  Items Left: $($removeResult.data.data.items.Count)`n" -ForegroundColor Gray
    }
}

# TEST 7: Clear cart
Write-Host "[TEST 7] Clear cart" -ForegroundColor Cyan
$clearResult = Test-API "Clear Cart" "DELETE" "$base/cart/clear" $authHeaders
$verifyResult = Test-API "Verify Empty" "GET" "$base/cart" $authHeaders
if ($verifyResult.success) {
    Write-Host "  Items: $($verifyResult.data.data.items.Count)" -ForegroundColor Gray
    Write-Host "  Total: $($verifyResult.data.data.totalAmount)`n" -ForegroundColor Gray
}

Write-Host "=== ALL TESTS COMPLETE ===`n" -ForegroundColor Green
