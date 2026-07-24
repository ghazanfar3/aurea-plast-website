# Push local Clinic photos to GitHub (main) so the live site can use them.
# Run in PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass
#   & "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast\scripts\push-clinic-photos.ps1"

$ErrorActionPreference = "Stop"

$Project = "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
$SrcCandidates = @(
  (Join-Path $Project "assets\images\Clinic"),
  (Join-Path $Project "assets\images\clinic")
)
$Dest = Join-Path $Project "assets\images\clinic"
$Wanted = @(
  "hero-lounge.jpg",
  "reception-desk.jpg",
  "reception-wide.jpg",
  "waiting-sofas.jpg",
  "lounge-chairs.jpg"
)

$Src = $SrcCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Src) {
  Write-Host "Clinic folder not found. Checked:" -ForegroundColor Red
  $SrcCandidates | ForEach-Object { Write-Host "  $_" }
  exit 1
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Source: $Src" -ForegroundColor Cyan
Write-Host "Files found:" -ForegroundColor Cyan
Get-ChildItem -Path $Src -File | ForEach-Object { Write-Host ("  {0}  ({1:N0} KB)" -f $_.Name, ($_.Length/1KB)) }

# 1) Copy exact expected names if present (case-insensitive)
foreach ($name in $Wanted) {
  $match = Get-ChildItem -Path $Src -File | Where-Object { $_.Name -ieq $name } | Select-Object -First 1
  if ($match) {
    Copy-Item $match.FullName (Join-Path $Dest $name) -Force
    Write-Host "OK exact: $name" -ForegroundColor Green
  }
}

# 2) If still missing, fill remaining slots from leftover images (sorted by name)
$missing = @()
foreach ($name in $Wanted) {
  if (-not (Test-Path (Join-Path $Dest $name))) { $missing += $name }
}

if ($missing.Count -gt 0) {
  $used = @{}
  foreach ($name in $Wanted) {
    $p = Join-Path $Dest $name
    if (Test-Path $p) {
      # mark source names already used via exact match
    }
  }
  $leftovers = Get-ChildItem -Path $Src -File -Include *.jpg,*.jpeg,*.png,*.webp,*.JPG,*.JPEG,*.PNG,*.WEBP -ErrorAction SilentlyContinue
  if (-not $leftovers) {
    $leftovers = Get-ChildItem -Path $Src -File | Where-Object {
      $_.Extension -match '\.(jpe?g|png|webp)$'
    }
  }
  # Prefer files not already copied as an expected name
  $already = Get-ChildItem -Path $Dest -File | ForEach-Object { $_.Name.ToLowerInvariant() }
  $pool = @($leftovers | Where-Object { $already -notcontains $_.Name.ToLowerInvariant() } | Sort-Object Name)
  # Also allow reusing all images if names differ entirely
  if ($pool.Count -lt $missing.Count) {
    $pool = @($leftovers | Sort-Object Name)
  }
  $i = 0
  foreach ($name in $missing) {
    if ($i -ge $pool.Count) { break }
    Copy-Item $pool[$i].FullName (Join-Path $Dest $name) -Force
    Write-Host ("OK mapped: {0}  <=  {1}" -f $name, $pool[$i].Name) -ForegroundColor Yellow
    $i++
  }
}

Write-Host ""
Write-Host "Destination now:" -ForegroundColor Cyan
Get-ChildItem -Path $Dest -File | ForEach-Object { Write-Host ("  {0}  ({1:N0} KB)" -f $_.Name, ($_.Length/1KB)) }

$ready = $true
foreach ($name in $Wanted) {
  if (-not (Test-Path (Join-Path $Dest $name))) {
    Write-Host "MISSING: $name" -ForegroundColor Red
    $ready = $false
  }
}
if (-not $ready) {
  Write-Host "Not enough image files to fill all 5 slots. Add more photos then re-run." -ForegroundColor Red
  exit 1
}

Set-Location $Project
git rev-parse --is-inside-work-tree | Out-Null
git remote get-url origin | Out-Null
git checkout main
git pull origin main
git add assets/images/clinic/*.jpg assets/images/clinic/*.jpeg assets/images/clinic/*.png assets/images/clinic/*.webp 2>$null
git status --short assets/images/clinic
git commit -m "Add real Aurea Plast clinic photos"
git push origin main

Write-Host ""
Write-Host "Uploaded to GitHub main. Tell Cursor: deploy" -ForegroundColor Green
