# Connect local Aurea Plast folder to GitHub (Windows PowerShell)
# Default folder matches: C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast
#
# Run in PowerShell:
#   cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\scripts\connect-windows.ps1
# Or from anywhere:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast\scripts\connect-windows.ps1"

param(
  [string]$LocalPath = "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast",
  [string]$RepoUrl = "https://github.com/ghazanfar3/aurea-plast-website.git",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Aurea Plast — connect local folder to GitHub" -ForegroundColor Cyan
Write-Host "Local:  $LocalPath"
Write-Host "Remote: $RepoUrl"
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not installed. Install from https://git-scm.com/download/win then re-run." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $LocalPath)) {
  Write-Host "Folder not found. Creating and cloning into:" -ForegroundColor Yellow
  Write-Host "  $LocalPath"
  New-Item -ItemType Directory -Path (Split-Path $LocalPath -Parent) -Force | Out-Null
  git clone $RepoUrl $LocalPath
  Set-Location $LocalPath
  git checkout $Branch
  Write-Host "Done. Folder is connected to GitHub ($Branch)." -ForegroundColor Green
  exit 0
}

Set-Location $LocalPath

if (-not (Test-Path ".git")) {
  Write-Host "Initializing git in existing folder..." -ForegroundColor Yellow
  git init
  git remote remove origin 2>$null
  git remote add origin $RepoUrl
  git fetch origin
  git branch -M $Branch
  # Prefer remote history; keep local untracked files if they don't conflict
  git checkout -B $Branch "origin/$Branch" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not fast-checkout origin/$Branch. Pulling with allow-unrelated..." -ForegroundColor Yellow
    git pull origin $Branch --allow-unrelated-histories --no-edit
  }
} else {
  Write-Host "Git already present. Updating remote + pulling latest $Branch..." -ForegroundColor Yellow
  $existing = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0) {
    git remote add origin $RepoUrl
  } elseif ($existing -notlike "*ghazanfar3/aurea-plast-website*") {
    Write-Host "Updating origin from:" -ForegroundColor Yellow
    Write-Host "  $existing"
    Write-Host "to:"
    Write-Host "  $RepoUrl"
    git remote set-url origin $RepoUrl
  }
  git fetch origin
  git checkout $Branch 2>$null
  if ($LASTEXITCODE -ne 0) { git checkout -B $Branch "origin/$Branch" }
  git pull origin $Branch
}

Write-Host ""
Write-Host "Connected." -ForegroundColor Green
git remote -v
git status -sb
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "  1. Open this folder in Cursor"
Write-Host "  2. Edit locally / preview with:  python -m http.server 4173"
Write-Host "  3. Say 'deploy' when you want changes pushed live to aureaplastclinic.com"
Write-Host ""
