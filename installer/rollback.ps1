param(
  [Parameter(Mandatory=$true)][string]$BackupZipPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
  if (-not (Test-Path $BackupZipPath)) { throw "Belirtilen yedek zip bulunamadı: $BackupZipPath" }
  $root = (Get-Location).Path
  $timestamp = (Get-Date -Format yyyyMMdd-HHmmss)
  $restorePoint = Join-Path $root "restorepoints"
  if (-not (Test-Path $restorePoint)) { New-Item -ItemType Directory -Path $restorePoint | Out-Null }

  Write-Host "♻️ Rollback başlıyor..." -ForegroundColor Cyan

  # Mevcut installer klasörünü restore point'e taşı
  if (Test-Path (Join-Path $root 'installer')) {
    $backupInstaller = Join-Path $restorePoint "installer.$timestamp.bak"
    Move-Item -Path (Join-Path $root 'installer') -Destination $backupInstaller -Force
    Write-Host "🔒 Mevcut installer yedeklendi: $backupInstaller" -ForegroundColor Yellow
  }

  # Zip'i geçici bir klasöre aç
  $tmp = Join-Path $root "tmp-restore-$timestamp"
  New-Item -ItemType Directory -Path $tmp | Out-Null
  Expand-Archive -Path $BackupZipPath -DestinationPath $tmp -Force

  # İçeriği kök dizine geri kopyala
  $restInstaller = Join-Path $tmp 'installer'
  if (Test-Path $restInstaller) { Copy-Item -Path $restInstaller -Destination (Join-Path $root 'installer') -Recurse -Force }
  foreach ($f in @('docker-compose.yml','docker-compose-pgadmin-only.yml','.env','env.example','env.secure.template','version.json')) {
    $src = Join-Path $tmp $f
    if (Test-Path $src) { Copy-Item -Path $src -Destination $root -Force }
  }

  Remove-Item -Path $tmp -Recurse -Force
  Write-Host "✅ Rollback tamamlandı" -ForegroundColor Green
} catch {
  Write-Host "❌ Rollback hatası: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
