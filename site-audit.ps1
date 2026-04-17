$ErrorActionPreference = 'Continue'

$frontBase = 'https://www.amohamobiles.com'
$adminBase = 'https://admin.amohamobiles.com'

function Normalize-Route([string]$relativePath) {
  $r = $relativePath.Replace('\\', '/')
  $r = $r -replace '/page.tsx$', ''
  if ([string]::IsNullOrWhiteSpace($r)) { return '/' }
  if (-not $r.StartsWith('/')) { $r = '/' + $r }
  return $r
}

$frontRoot = (Resolve-Path 'frontend/src/app').Path
$frontPages = Get-ChildItem frontend/src/app -Recurse -File -Filter page.tsx |
  ForEach-Object { $_.FullName.Replace($frontRoot, '') } |
  ForEach-Object { Normalize-Route $_ }

$frontResolved = @()
foreach ($p in ($frontPages | Select-Object -Unique)) {
  switch ($p) {
    '/product/[slug]' { $frontResolved += '/product/iphone-15-pro-max' }
    '/category/[slug]' { $frontResolved += '/category/smartphones' }
    default { $frontResolved += $p }
  }
}
$frontResolved = $frontResolved | Select-Object -Unique

$adminRoot = (Resolve-Path 'admin/src/app').Path
$adminPages = Get-ChildItem admin/src/app -Recurse -File -Filter page.tsx |
  ForEach-Object { $_.FullName.Replace($adminRoot, '') } |
  ForEach-Object { Normalize-Route $_ } |
  ForEach-Object { $_ -replace '^/\(admin\)', '' -replace '^/\(auth\)', '' }

$adminResolved = @()
foreach ($p in ($adminPages | Select-Object -Unique)) {
  switch ($p) {
    '/orders/[id]' { $adminResolved += '/orders/sample-order-id' }
    '/products/[id]/edit' { $adminResolved += '/products/sample-product-id/edit' }
    '/crm/[customerId]' { $adminResolved += '/crm/sample-customer-id' }
    default { $adminResolved += $p }
  }
}
$adminResolved = $adminResolved | Select-Object -Unique

function Test-Url {
  param([string]$url)
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 35
    $has500Marker = $r.Content -match '500\s*Something Went Wrong'
    [pscustomobject]@{
      url = $url
      status = [int]$r.StatusCode
      ok = ([int]$r.StatusCode -lt 500 -and -not $has500Marker)
      marker500 = $has500Marker
    }
  }
  catch {
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      [pscustomobject]@{
        url = $url
        status = [int]$resp.StatusCode
        ok = ([int]$resp.StatusCode -lt 500)
        marker500 = $false
      }
    }
    else {
      [pscustomobject]@{
        url = $url
        status = 'ERR'
        ok = $false
        marker500 = $false
      }
    }
  }
}

$results = @()
foreach ($p in $frontResolved) { $results += Test-Url "$frontBase$p" }
foreach ($p in $adminResolved) { $results += Test-Url "$adminBase$p" }

try {
  $plist = ((Invoke-WebRequest -Uri "$frontBase/api/products?limit=300" -UseBasicParsing -TimeoutSec 45).Content | ConvertFrom-Json).data.products
  foreach ($p in $plist) {
    $results += Test-Url "$frontBase/product/$($p.slug)"
    $results += Test-Url "https://amohamobiles.com/product/$($p.slug)"
  }
}
catch {}

$fails = $results | Where-Object { -not $_.ok }

Write-Output "TOTAL_URLS_TESTED=$($results.Count)"
Write-Output "FAILED=$($fails.Count)"
Write-Output "--- FAIL LIST ---"
$fails | Select-Object -First 250 url, status, marker500 | Format-Table -AutoSize
Write-Output "--- SUMMARY ---"
Write-Output "FrontendRoutes=$($frontResolved.Count) AdminRoutes=$($adminResolved.Count) ProductUrlsTested=$((($results.url | Where-Object { $_ -match '/product/' }).Count))"
