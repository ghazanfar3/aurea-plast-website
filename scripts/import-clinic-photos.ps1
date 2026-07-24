# Copy the 6 clinic photos into assets/images/clinic with correct names.
# Edit the SourceFiles paths below to match where your photos are on disk.
$Project = "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
$Dest = Join-Path $Project "assets\images\clinic"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

# Map: destination name = source file path (UPDATE THESE)
$Map = @{
  "hero-lounge.jpg"    = ""  # lounge with backlit circular AureaPlast logo
  "reception-desk.jpg" = ""  # reception desk close-up with RECEPTION letters
  "reception-wide.jpg" = ""  # wider reception / wood wall + pendant
  "waiting-sofas.jpg"  = ""  # blue sofas waiting area
  "lounge-chairs.jpg"  = ""  # cream chairs under logo
  "lounge-portal.jpg"  = ""  # lounge with oval LED portal
}

foreach ($name in $Map.Keys) {
  $src = $Map[$name]
  if ([string]::IsNullOrWhiteSpace($src) -or -not (Test-Path $src)) {
    Write-Host "Skip $name (set source path in script)" -ForegroundColor Yellow
    continue
  }
  Copy-Item $src (Join-Path $Dest $name) -Force
  Write-Host "Copied $name" -ForegroundColor Green
}
Write-Host "Then run: python scripts/optimize-clinic-images.py" -ForegroundColor Cyan
