#!/bin/bash
"""
TradeBot GUI Installer - Build Script
====================================
Cross-platform executable builder
"""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the installer directory
if [ ! -f "main.py" ]; then
    print_error "main.py bulunamadı! installer/ dizininde olduğunuzdan emin olun."
    exit 1
fi

print_status "TradeBot GUI Installer Build başlatılıyor..."

# Create build environment
print_status "Build ortamı hazırlanıyor..."
mkdir -p build/dist build/work

# Install dependencies
print_status "Bağımlılıklar kuruluyor..."
pip install -r requirements.txt

# Create PyInstaller spec file
print_status "PyInstaller spec dosyası oluşturuluyor..."
cat > build/tradebot_installer.spec << 'EOF'
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
        'webbrowser'
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
    icon='../assets/icon.ico' if os.path.exists('../assets/icon.ico') else None,
)
EOF

# Build executable
print_status "Executable oluşturuluyor..."
cd build
pyinstaller --clean tradebot_installer.spec

# Check if build successful
if [ -f "dist/TradeBot_Installer" ] || [ -f "dist/TradeBot_Installer.exe" ]; then
    print_success "✅ Build başarıyla tamamlandı!"

    # Show build info
    echo ""
    echo -e "${CYAN}📦 Build Bilgileri:${NC}"
    echo "   📁 Build dizini: $(pwd)/dist/"
    ls -la dist/

    # Create installer package
    print_status "Installer paketi oluşturuluyor..."
    cd dist

    # Detect OS and create appropriate package
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - Create .tar.gz
        tar -czf TradeBot_Installer_Linux.tar.gz TradeBot_Installer
        print_success "Linux paketi: TradeBot_Installer_Linux.tar.gz"

    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Create .dmg (if hdiutil available)
        if command -v hdiutil &> /dev/null; then
            mkdir -p TradeBot_Installer_macOS
            cp TradeBot_Installer TradeBot_Installer_macOS/
            hdiutil create -volname "TradeBot Installer" -srcfolder TradeBot_Installer_macOS -ov -format UDZO TradeBot_Installer_macOS.dmg
            print_success "macOS paketi: TradeBot_Installer_macOS.dmg"
        else
            tar -czf TradeBot_Installer_macOS.tar.gz TradeBot_Installer
            print_success "macOS paketi: TradeBot_Installer_macOS.tar.gz"
        fi

    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows - Create .zip
        if command -v zip &> /dev/null; then
            zip -r TradeBot_Installer_Windows.zip TradeBot_Installer.exe
            print_success "Windows paketi: TradeBot_Installer_Windows.zip"
        elif command -v powershell &> /dev/null; then
            powershell -Command "Compress-Archive -Path 'TradeBot_Installer.exe' -DestinationPath 'TradeBot_Installer_Windows.zip'"
            print_success "Windows paketi: TradeBot_Installer_Windows.zip"
        else
            print_warning "Windows paketi oluşturulamadı (zip veya powershell bulunamadı)"
        fi
    fi

    echo ""
    print_success "🎉 Build işlemi tamamlandı!"
    print_status "Installer dosyaları 'build/dist/' dizininde"

else
    print_error "❌ Build başarısız!"
    exit 1
fi
