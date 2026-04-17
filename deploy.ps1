# deploy.ps1 - Deploy to new repo setup (origin-first)
# Usage:
#   .\deploy.ps1 "your commit message"

param(
    [string]$CommitMessage = ""
)

$root = $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "=== AMOHA Deploy Script (new account) ===" -ForegroundColor Cyan

if (-not $CommitMessage) {
    $CommitMessage = Read-Host "Enter commit message (leave blank to skip commit)"
}

function Exit-OnGitError {
    param(
        [string]$Message
    )

    if ($LASTEXITCODE -ne 0) {
        Write-Host $Message -ForegroundColor Red
        exit 1
    }
}

# --- Preflight checks ---
Write-Host ""
Write-Host "[0/3] Running preflight checks..." -ForegroundColor Yellow

$origin = git remote get-url origin
Exit-OnGitError "Missing 'origin' remote. Configure your new GitHub repo first."

if ([string]::IsNullOrWhiteSpace($origin)) {
    Write-Host "Origin remote is empty. Configure your new GitHub repo URL." -ForegroundColor Red
    exit 1
}

git ls-remote --heads origin *> $null
Exit-OnGitError "Origin is not reachable. Check GitHub auth/permissions for your new account."

Write-Host "Preflight passed. Origin: $origin" -ForegroundColor Green

# --- Step 1: Commit ---
if ($CommitMessage) {
    Write-Host ""
    Write-Host "[1/3] Committing changes..." -ForegroundColor Yellow
    git add -A
    Exit-OnGitError "Failed to stage changes."
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Commit skipped or failed. Continuing to push..." -ForegroundColor Yellow
    }
}

# --- Step 2: Push monorepo ---
Write-Host ""
Write-Host "[2/3] Pushing main branch to origin..." -ForegroundColor Yellow
git push origin main
Exit-OnGitError "Failed to push 'main' to origin."
Write-Host "Main push complete." -ForegroundColor Green

# --- Step 3: Optional split repos (if configured) ---
Write-Host ""
Write-Host "[3/3] Optional split repo pushes..." -ForegroundColor Yellow

$frontendRemote = $env:FRONTEND_REMOTE
$adminRemote = $env:ADMIN_REMOTE

if ($frontendRemote) {
    git ls-remote --heads $frontendRemote *> $null
    Exit-OnGitError "Frontend remote '$frontendRemote' is not reachable."

    git branch -D frontend-split 2>&1 | Out-Null
    git subtree split --prefix=frontend -b frontend-split | Out-Null
    Exit-OnGitError "Failed to create frontend subtree split."

    git push $frontendRemote frontend-split:main --force
    Exit-OnGitError "Failed to push frontend subtree to '$frontendRemote'."

    git branch -D frontend-split 2>&1 | Out-Null
    Write-Host "Frontend split push complete." -ForegroundColor Green
} else {
    Write-Host "FRONTEND_REMOTE not set; skipping frontend split push." -ForegroundColor DarkYellow
}

if ($adminRemote) {
    git ls-remote --heads $adminRemote *> $null
    Exit-OnGitError "Admin remote '$adminRemote' is not reachable."

    git branch -D admin-split 2>&1 | Out-Null
    git subtree split --prefix=admin -b admin-split | Out-Null
    Exit-OnGitError "Failed to create admin subtree split."

    git push $adminRemote admin-split:main --force
    Exit-OnGitError "Failed to push admin subtree to '$adminRemote'."

    git branch -D admin-split 2>&1 | Out-Null
    Write-Host "Admin split push complete." -ForegroundColor Green
} else {
    Write-Host "ADMIN_REMOTE not set; skipping admin split push." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "=== Deploy complete for new account setup ===" -ForegroundColor Cyan
Write-Host "  Origin: $origin"
Write-Host "  Next: trigger/review Render + Vercel deploys from connected new repos"
Write-Host ""
