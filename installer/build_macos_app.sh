#!/bin/bash

# TradeBot GUI Installer - macOS App Builder
# Çift tıklamayla çalışan .app paketi oluşturur

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the installer directory
if [ ! -f "main.py" ]; then
    print_error "main.py bulunamadı! installer/ dizininde olduğunuzdan emin olun."
    exit 1
fi

print_status "🍎 macOS TradeBot Installer .app paketi oluşturuluyor..."

# Create virtual environment if not exists
if [ ! -d "build_env" ]; then
    print_status "Virtual environment oluşturuluyor..."
    python3 -m venv build_env
fi

# Activate virtual environment
print_status "Virtual environment aktifleştiriliyor..."
source build_env/bin/activate

# Install PyInstaller if not installed
if ! command -v pyinstaller &> /dev/null; then
    print_status "PyInstaller kuruluyor..."
    pip install pyinstaller
fi

# Install dependencies
print_status "Bağımlılıklar kuruluyor..."
pip install -r requirements.txt

# Create build directory
mkdir -p build

# Create icon if not exists
if [ ! -f "assets/icon.icns" ]; then
    print_status "App ikonu oluşturuluyor..."
    mkdir -p assets

    # Create a simple icon using Python (if needed)
    python3 << 'EOF'
import tkinter as tk
from tkinter import Canvas
import os

# Create a simple icon
root = tk.Tk()
root.withdraw()

canvas = Canvas(root, width=512, height=512, bg='white')
canvas.pack()

# Draw a simple trade bot icon
canvas.create_oval(50, 50, 462, 462, fill='#2E86AB', outline='#1B4F72', width=10)
canvas.create_text(256, 200, text='T', font=('Arial', 200, 'bold'), fill='white')
canvas.create_text(256, 350, text='B', font=('Arial', 100, 'bold'), fill='white')

# This won't create a real .icns but shows the intent
print("Simple icon placeholder created")
root.destroy()
EOF
fi

# Create PyInstaller spec file for macOS
print_status "macOS PyInstaller spec dosyası oluşturuluyor..."
cat > build/tradebot_installer_macos.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None

a = Analysis(
    ['../main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('../assets', 'assets'),
        ('../../docker-compose.yml', '.'),
        ('../../Dockerfile.backend', '.'),
        ('../../requirements.txt', '.'),
        ('../../alembic.ini', '.'),
        ('../../alembic/env.py', 'alembic'),
        ('../../alembic/versions', 'alembic/versions'),
        ('../../app', 'app'),
        ('../../frontend', 'frontend'),
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
        'os',
        'sys',
        'platform'
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
    [],
    exclude_binaries=True,
    name='TradeBot Installer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TradeBot Installer',
)

app = BUNDLE(
    coll,
    name='TradeBot Installer.app',
    icon='../assets/icon.icns' if os.path.exists('../assets/icon.icns') else None,
    bundle_identifier='com.tradebot.installer',
    info_plist={
        'NSPrincipalClass': 'NSApplication',
        'NSAppleScriptEnabled': False,
        'CFBundleName': 'TradeBot Installer',
        'CFBundleDisplayName': 'TradeBot Installer',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleInfoDictionaryVersion': '6.0',
        'LSMinimumSystemVersion': '10.12.0',
        'NSHumanReadableCopyright': 'Copyright © 2024 TradeBot. All rights reserved.',
        'CFBundleDocumentTypes': [],
        'LSApplicationCategoryType': 'public.app-category.developer-tools',
    },
)
EOF

# Build the .app
print_status "macOS .app paketi build ediliyor..."
cd build
pyinstaller --clean tradebot_installer_macos.spec

# Check if build successful
if [ -d "dist/TradeBot Installer.app" ]; then
    print_success "✅ macOS .app paketi başarıyla oluşturuldu!"

    # Make it executable
    chmod +x "dist/TradeBot Installer.app/Contents/MacOS/TradeBot Installer"

    # Show build info
    echo ""
    echo -e "${CYAN}📱 macOS App Bilgileri:${NC}"
    echo "   📁 App konumu: $(pwd)/dist/TradeBot Installer.app"
    echo "   📏 App boyutu: $(du -h "dist/TradeBot Installer.app" | cut -f1)"

    # Create DMG if hdiutil is available
    if command -v hdiutil &> /dev/null; then
        print_status "DMG disk image oluşturuluyor..."
        cd dist

        # Create a temporary directory for DMG contents
        mkdir -p dmg_temp
        cp -R "TradeBot Installer.app" dmg_temp/

        # Create symbolic link to Applications folder
        ln -sf /Applications dmg_temp/Applications

        # Create DMG
        hdiutil create -volname "TradeBot Installer" \
                      -srcfolder dmg_temp \
                      -ov -format UDZO \
                      "TradeBot-Installer-macOS.dmg"

        # Cleanup
        rm -rf dmg_temp

        print_success "📀 DMG oluşturuldu: TradeBot-Installer-macOS.dmg"
        echo ""
        echo -e "${GREEN}🎉 Tamamlandı!${NC}"
        echo ""
        echo -e "${CYAN}Kullanım:${NC}"
        echo "1. ${YELLOW}TradeBot-Installer-macOS.dmg${NC} dosyasını çift tıklayın"
        echo "2. ${YELLOW}TradeBot Installer.app${NC}'i Applications klasörüne sürükleyin"
        echo "3. Applications klasöründen ${YELLOW}TradeBot Installer${NC}'a çift tıklayın"
        echo ""
        echo -e "${CYAN}Veya direkt çalıştır:${NC}"
        echo "open '$(pwd)/TradeBot Installer.app'"

    else
        print_success "✅ .app paketi hazır!"
        echo ""
        echo -e "${CYAN}Kullanım:${NC}"
        echo "open '$(pwd)/TradeBot Installer.app'"
    fi

else
    print_error "❌ macOS .app build başarısız!"
    exit 1
fi

print_status "Virtual environment deaktifleştiriliyor..."
deactivate

print_success "🍎 macOS build işlemi tamamlandı!"
