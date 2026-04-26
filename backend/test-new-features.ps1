param(
  [string]$ApiUrl   = "https://amoha-backend-v2.onrender.com/api",
  [string]$Email    = $env:ADMIN_EMAIL,
  [string]$Password = $env:ADMIN_PASSWORD
)
$pass = 0; $fail = 0

function Test-Assert {
  param([string]$Name, [scriptblock]$Check)
  try { & $Check; Write-Host "  [PASS] $Name" -ForegroundColor Green; $script:pass++ }
  catch { Write-Host "  [FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red; $script:fail++ }
}

function Invoke-Api {
  param([string]$Path, [string]$Method = "GET", [hashtable]$Body = $null, [string]$Token = "")
  $uri = "$ApiUrl$Path"
  $headers = @{ "Content-Type" = "application/json" }
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $params = @{ Uri = $uri; Method = $Method; Headers = $headers; UseBasicParsing = $true }
  if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Compress) }
  $resp = Invoke-WebRequest @params
  return $resp.Content | ConvertFrom-Json
}

Write-Host ""
Write-Host "=== Authenticating ===" -ForegroundColor Cyan
$Token = ""
if ($Email -and $Password) {
  try {
    $loginResp = Invoke-Api "/auth/login" "POST" @{ email = $Email; password = $Password }
    $Token = $loginResp.token
    Write-Host "  Logged in as $Email" -ForegroundColor Green
  } catch { Write-Host "  Login failed: $_" -ForegroundColor Red }
} else {
  Write-Host "  (no credentials - admin tests skipped)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "=== Public Endpoints ===" -ForegroundColor Cyan

Test-Assert "GET /categories returns 200 and success" {
  $r = Invoke-Api "/categories"
  if ($r.success -ne $true) { throw "success != true" }
}

Test-Assert "GET /categories includes productCount" {
  $r = Invoke-Api "/categories"
  $cats = $r.data.categories
  if (-not $cats -or $cats.Count -eq 0) { return }
  $first = $cats[0]
  if ($null -eq $first.productCount) { throw "productCount missing" }
}

Test-Assert "GET /categories/:slug returns by slug" {
  $r = Invoke-Api "/categories"
  $cats = $r.data.categories
  if (-not $cats -or $cats.Count -eq 0) { return }
  $slug = $cats[0].slug
  $r2 = Invoke-Api "/categories/$slug"
  if ($r2.success -ne $true) { throw "getBySlug failed" }
  if ($r2.data.slug -ne $slug) { throw "slug mismatch" }
}

Test-Assert "GET /products?category=<slug> works without error" {
  $r = Invoke-Api "/categories"
  $cats = $r.data.categories
  if (-not $cats -or $cats.Count -eq 0) { return }
  $slug = $cats[0].slug
  $pr = Invoke-Api ("/products?category=" + $slug + "&limit=5")
  if ($pr.success -ne $true) { throw "category filter failed" }
}

Test-Assert "GET /products?sort=newest" {
  $r = Invoke-Api "/products?sort=newest&limit=5"
  if ($r.success -ne $true) { throw "sort=newest failed" }
}

Test-Assert "GET /products?priceMin=100&priceMax=50000" {
  $r = Invoke-Api ("/products?priceMin=100" + "&priceMax=50000" + "&limit=5")
  if ($r.success -ne $true) { throw "priceMin/Max failed" }
}

if ($Token) {
  Write-Host ""
  Write-Host "=== Admin Endpoints ===" -ForegroundColor Cyan

  Test-Assert "GET /admin/reports/sales-summary?period=month" {
    $r = Invoke-Api "/admin/reports/sales-summary?period=month" "GET" -Token $Token
    if ($r.success -ne $true) { throw "sales-summary failed" }
    if ($null -eq $r.data.totalRevenue) { throw "totalRevenue missing" }
  }

  Test-Assert "GET /admin/reports/orders" {
    $r = Invoke-Api ("/admin/reports/orders?page=1" + "&limit=10") "GET" -Token $Token
    if ($r.success -ne $true) { throw "reports/orders failed" }
  }

  Test-Assert "GET /rfq returns list" {
    $r = Invoke-Api "/rfq" "GET" -Token $Token
    if ($r.success -ne $true) { throw "GET /rfq failed" }
  }

  Test-Assert "POST /rfq creates RFQ" {
    $suppResp = Invoke-Api "/suppliers?limit=1" "GET" -Token $Token
    $suppliers = $suppResp.data.suppliers
    if (-not $suppliers -or $suppliers.Count -eq 0) { return }
    $supplierId = $suppliers[0]._id
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $r = Invoke-Api "/rfq" "POST" @{
      supplierId = $supplierId
      items = @(@{ name = "Test $ts"; quantity = 2 })
    } -Token $Token
    if ($r.success -ne $true) { throw "POST /rfq failed: $($r.message)" }
    if (-not $r.data.rfqNumber) { throw "rfqNumber missing" }
  }

  Test-Assert "GET /purchase-requests returns list" {
    $r = Invoke-Api "/purchase-requests" "GET" -Token $Token
    if ($r.success -ne $true) { throw "GET /purchase-requests failed" }
  }

  $script:testPrId = $null
  Test-Assert "POST /purchase-requests creates PR" {
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $r = Invoke-Api "/purchase-requests" "POST" @{
      items = @(@{ name = "Item $ts"; quantity = 3 })
      reason = "PS test $ts"
      urgency = "normal"
    } -Token $Token
    if ($r.success -ne $true) { throw "POST /purchase-requests failed: $($r.message)" }
    if (-not $r.data.prNumber) { throw "prNumber missing" }
    $script:testPrId = $r.data._id
  }

  Test-Assert "PATCH /purchase-requests/:id/approve" {
    if (-not $script:testPrId) { return }
    $r = Invoke-Api "/purchase-requests/$($script:testPrId)/approve" "PATCH" @{ notes = "PS approved" } -Token $Token
    if ($r.success -ne $true) { throw "approve failed: $($r.message)" }
    if ($r.data.status -ne "approved") { throw "status != approved (got $($r.data.status))" }
  }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  PASSED: $pass   FAILED: $fail"
if ($fail -gt 0) { Write-Host "  SOME TESTS FAILED" -ForegroundColor Red; exit 1 }
else { Write-Host "  ALL TESTS PASSED" -ForegroundColor Green; exit 0 }