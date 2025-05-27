# 🚀 TradeBot GUI Installer

Modern grafik arayüzlü kurulum programı - Her seviyedeki kullanıcı için kolay kurulum!

## ✨ Özellikler

### 🎯 **Kullanıcı Dostu Arayüz**
- ✅ Step-by-step kurulum sihirbazı
- ✅ Görsel ilerleme çubuğu
- ✅ Real-time log görüntüleme
- ✅ Sistem gereksinim kontrolü
- ✅ Otomatik hata tespiti

### 🔧 **Akıllı Konfigürasyon**
- ✅ Otomatik güvenli şifre oluşturma
- ✅ Port çakışması kontrolü
- ✅ Dizin seçimi (browse)
- ✅ Development/Production mod
- ✅ Konfigürasyon validasyonu

### 🔐 **Güvenlik**
- ✅ Rastgele şifre oluşturma
- ✅ Encryption key otomatik üretim
- ✅ Güvenli environment dosyası
- ✅ Şifre maskeleme

### 🚀 **Post-Install**
- ✅ Tek tıkla servis açma
- ✅ Erişim bilgileri özeti
- ✅ Başarı durumu gösterimi
- ✅ Browser entegrasyonu

## 📋 Sistem Gereksinimleri

### 🐧 **Linux**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker docker-compose python3 python3-pip

# CentOS/RHEL/Fedora
sudo yum install docker docker-compose python3 python3-pip
```

### 🍎 **macOS**
```bash
# Homebrew ile
brew install docker docker-compose python3

# Veya Docker Desktop kurulumu
```

### 🪟 **Windows**
- Docker Desktop for Windows
- Python 3.8+ (Microsoft Store'dan)
- Git for Windows

## 🚀 Kullanım

### 📥 **1. İndirme**

#### GitHub Releases'tan:
```bash
# Linux
wget https://github.com/suleymantaha/tradebot/releases/latest/download/TradeBot_Installer_Linux.tar.gz
tar -xzf TradeBot_Installer_Linux.tar.gz
./TradeBot_Installer

# Windows
# TradeBot_Installer_Windows.zip indirin ve çıkartın
# TradeBot_Installer.exe çalıştırın

# macOS
# TradeBot_Installer_macOS.dmg indirin ve mount edin
```

#### Kaynak Koddan:
```bash
git clone https://github.com/suleymantaha/tradebot.git
cd tradebot/installer
python3 main.py
```

### 🎯 **2. Kurulum Adımları**

#### **Adım 1: Hoş Geldin**
- Proje tanıtımı
- Kurulum hakkında bilgi
- Gereksinimler uyarısı

#### **Adım 2: Sistem Kontrolü**
- Docker kurulum kontrolü
- Docker Compose kontrolü
- Git ve curl kontrolü
- Eksik bileşen uyarıları

#### **Adım 3: Konfigürasyon**
```
Temel Ayarlar:
✅ Kurulum dizini seçimi
✅ PostgreSQL şifresi (otomatik/manuel)
✅ pgAdmin email/şifre
✅ Port ayarları (default: 3000, 8000, 5432, 5050)
✅ Environment seçimi (Production/Development)
```

#### **Adım 4: Kurulum**
- Real-time kurulum logları
- İlerleme çubuğu
- Hata durumunda detaylar
- Docker build ve start

#### **Adım 5: Tamamlandı**
- Erişim bilgileri özeti
- Tek tıkla browser açma
- Şifre bilgileri
- Final durum

## 🛠️ Geliştirme

### 📦 **Build**

```bash
cd installer/
chmod +x build.sh
./build.sh
```

**Outputs:**
- Linux: `TradeBot_Installer_Linux.tar.gz`
- Windows: `TradeBot_Installer_Windows.zip`
- macOS: `TradeBot_Installer_macOS.dmg`

### 🧪 **Test**

```bash
# GUI test (development)
python3 main.py

# Dependency test
pip install -r requirements.txt
python3 -c "import tkinter; print('✅ GUI ready')"
```

### 📁 **Yapı**

```
installer/
├── main.py              # Ana GUI uygulaması
├── requirements.txt     # Python bağımlılıkları
├── build.sh            # Build script
├── README.md           # Bu dosya
├── assets/             # Görseller, ikonlar
├── ui/                 # UI bileşenleri (gelecek)
├── backend/            # Kurulum mantığı (gelecek)
└── build/              # Build çıktıları
    ├── dist/           # Final executables
    └── work/           # Geçici dosyalar
```

## 🔄 Yol Haritası

### 🎯 **v2.1 - UI Geliştirmeleri**
- [ ] Modern tema (customtkinter)
- [ ] Animasyonlar
- [ ] Dark/Light mod
- [ ] Logo ve ikonlar

### 🎯 **v2.2 - Gelişmiş Özellikler**
- [ ] Multi-language desteği
- [ ] Auto-updater
- [ ] Rollback özelliği
- [ ] Detaylı system diagnostics

### 🎯 **v2.3 - Electron Version**
- [ ] Web teknolojileri (React/Vue)
- [ ] Cloud sync ayarları
- [ ] Remote installer
- [ ] Browser tabanlı GUI

### 🎯 **v3.0 - Enterprise**
- [ ] Silent install mode
- [ ] Mass deployment
- [ ] Group Policy support
- [ ] Centralized configuration

## 🐛 Bilinen Sorunlar

1. **Windows Defender** - False positive uyarısı verebilir
2. **macOS Gatekeeper** - İmzasız uygulama uyarısı
3. **Linux Permissions** - Docker group membership gerekli

## 🆘 Destek

### 🔍 **Sorun Giderme**

#### GUI açılmıyor:
```bash
# Python ve tkinter kontrolü
python3 -c "import tkinter; print('OK')"

# Bağımlılık kurulumu
pip install -r requirements.txt
```

#### Docker hatası:
```bash
# Docker servis kontrolü
sudo systemctl status docker

# Docker group ekleme
sudo usermod -aG docker $USER
```

### 📞 **İletişim**
- 🐛 Bug Reports: GitHub Issues
- 💡 Feature Requests: GitHub Discussions
- 📧 Email: support@tradebot.local
- 💬 Discord: TradeBot Community

## 📄 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

---

**⭐ Beğendiyseniz GitHub'da yıldız vermeyi unutmayın!**
