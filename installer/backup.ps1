param(
  [string]$Destination = "backups",
  [string]$ZipName = "installer-backup-$(Get-Date -Format yyyyMMdd-HHmmss).zip",
  [switch]$IncludeCompose = $true,
  [switch]$IncludeEnv = $true,
  [switch]$IncludeVersion = $true,
  [switch]$IncludeDocs = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-BackupZip {
  param([string]$RootPath, [string]$DestFolder, [string]$ZipFile)

  if (-not (Test-Path $DestFolder)) { New-Item -ItemType Directory -Path $DestFolder | Out-Null }

  $staging = Join-Path $DestFolder "staging-$(Get-Date -Format yyyyMMdd-HHmmss)"
  New-Item -ItemType Directory -Path $staging | Out-Null

  # Copy installer folder
  Copy-Item -Path (Join-Path $RootPath 'installer') -Destination (Join-Path $staging 'installer') -Recurse -Force

  if ($IncludeCompose) {
    foreach ($f in @('docker-compose.yml','docker-compose-pgadmin-only.yml')) {
      $src = Join-Path $RootPath $f
      if (Test-Path $src) { Copy-Item -Path $src -Destination $staging -Force }
    }
  }

  if ($IncludeEnv) {
    foreach ($f in @('.env','env.example','env.secure.template')) {
      $src = Join-Path $RootPath $f
      if (Test-Path $src) { Copy-Item -Path $src -Destination $staging -Force }
    }
  }

  if ($IncludeVersion) {
    $ver = Join-Path $RootPath 'version.json'
    if (Test-Path $ver) { Copy-Item -Path $ver -Destination $staging -Force }
  }

  if ($IncludeDocs) {
    $doc = Join-Path $RootPath 'docs/INSTALLER_OPTIMIZASYON_APPLY_LOG.md'
    if (Test-Path $doc) { 
      $docDest = Join-Path $staging 'docs'
      New-Item -ItemType Directory -Path $docDest -ErrorAction SilentlyContinue | Out-Null
      Copy-Item -Path $doc -Destination $docDest -Force 
    }
  }

  $zipPath = Join-Path $DestFolder $ZipFile
  if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }
  Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -Force

  Remove-Item -Path $staging -Recurse -Force
  return $zipPath
}

try {
  $root = (Get-Location).Path
  Write-Host "Yedekleme başlıyor..." -ForegroundColor Cyan
  $zip = New-BackupZip -RootPath $root -DestFolder $Destination -ZipFile $ZipName
  Write-Host "Yedek oluşturuldu: $zip" -ForegroundColor Green
} catch {
  Write-Host "Yedekleme hatası: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
