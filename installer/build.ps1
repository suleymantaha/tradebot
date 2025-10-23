# TradeBot GUI Installer - Windows Build Script
# PowerShell script for Windows

param(
    [switch]$Clean,
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if we're in the installer directory
if (-not (Test-Path "main.py")) {
    Write-Error "main.py bulunamadı! installer/ dizininde olduğunuzdan emin olun."
    exit 1
}

Write-Status "TradeBot GUI Installer Build başlatılıyor..."

# Create build environment
Write-Status "Build ortamı hazırlanıyor..."
if (Test-Path "build") {
    if ($Clean) {
        Remove-Item -Recurse -Force "build"
    }
}
New-Item -ItemType Directory -Path "build\dist", "build\work" -Force | Out-Null

# Install dependencies
Write-Status "Bağımlılıklar kuruluyor..."
pip install -r requirements.txt

# Create PyInstaller spec file
Write-Status "PyInstaller spec dosyası oluşturuluyor..."
$specContent = @"
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['../main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('../assets', 'assets'),
    ],
    hiddenimports=[
        'tkinter',
        'tkinter.ttk',
        'tkinter.messagebox',
        'tkinter.filedialog',
        'cryptography',
        'cryptography.fernet',
        'secrets',
        'threading',
        'subprocess',
        'webbrowser',
        'win32com.client'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TradeBot_Installer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Icon disabled due to PIL compatibility issues
)
"@

$specContent | Out-File -FilePath "build\tradebot_installer.spec" -Encoding UTF8

# Build executable
Write-Status "Executable oluşturuluyor..."
Set-Location "build"
pyinstaller --clean tradebot_installer.spec

# Check if build successful
if (Test-Path "dist\TradeBot_Installer.exe") {
    Write-Success "✅ Build başarıyla tamamlandı!"

    # Show build info
    Write-Host ""
    Write-Host "📦 Build Bilgileri:" -ForegroundColor $Cyan
    Write-Host "   📁 Build dizini: $(Get-Location)\dist\"
    Get-ChildItem "dist\" | Format-Table Name, Length, LastWriteTime

    # Create installer package
    Write-Status "Installer paketi oluşturuluyor..."
    Set-Location "dist"

    # Create Windows package
    if (Test-Path "TradeBot_Installer.exe") {
        Compress-Archive -Path "TradeBot_Installer.exe" -DestinationPath "TradeBot_Installer_Windows.zip" -Force
        Write-Success "Windows paketi: TradeBot_Installer_Windows.zip"
    }

    Write-Host ""
    Write-Success "🎉 Build işlemi tamamlandı!"
    Write-Status "Installer dosyaları 'build\dist\' dizininde"

} else {
    Write-Error "❌ Build başarısız!"
    exit 1
}

Set-Location "..\.."
