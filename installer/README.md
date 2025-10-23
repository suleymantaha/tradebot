# 🚀 TradeBot GUI Installer

Grafik arayüzlü TradeBot kurulum programı. Kullanıcı dostu arayüz ile tüm kurulum işlemlerini otomatikleştirir.

## 🌟 Özellikler

### ✅ Mevcut Özellikler

- **5 Adımlı Kurulum Sihirbazı**
  - Hoş geldiniz sayfası
  - Sistem gereksinimleri kontrolü
  - Konfigürasyon ayarları
  - Otomatik kurulum
  - Tamamlama ve erişim bilgileri

- **Sistem Kontrolü**
  - Docker & Docker Compose kontrolü
  - curl & git kontrolü
  - Otomatik eksik bileşen uyarıları

- **Güvenlik**
  - Otomatik güvenli şifre üretimi
  - PostgreSQL ve pgAdmin şifreleri
  - JWT Secret Key ve Fernet anahtarı üretimi

- **Konfigürasyon**
  - Port ayarları (Frontend, Backend, PostgreSQL, pgAdmin)
  - Ortam seçimi (Production/Development)
  - Kurulum dizini seçimi

- **Masaüstü Entegrasyonu** ⭐ YENİ
  - Platform bağımsız masaüstü ikonu oluşturma
  - Windows: .lnk shortcuts
  - Linux: .desktop files
  - macOS: .app bundles
  - Çift tıklama ile proje başlatma

- **Proje Yönetimi Scripts** ⭐ YENİ
  - start_tradebot.sh/bat: Projeyi başlatma
  - stop_tradebot.sh/bat: Projeyi durdurma
  - Otomatik tarayıcı açma
  - Platform bağımsız çalışma

- **Gelişmiş Error Logging** ⭐ YENİ
  - Detaylı hata kaydı (`installer.log`)
  - Gerçek zamanlı hata görüntüleme
  - Timestamp'li log entries
  - Console ve dosya logging
  - Hata durumunda popup pencere

- **Otomatik Kurulum**
  - Docker container build ve start
  - Nginx konfigürasyonu
  - Environment dosyası oluşturma
  - Servis health check'leri

- **Web Entegrasyonu**
  - Otomatik tarayıcı açma
  - Frontend, API Docs, pgAdmin erişimi
  - Tek tıklama ile tüm servislere erişim

### 🛠️ Kullanım

#### Gereksinimler

- Python 3.8+
- tkinter (çoğu Python kurulumunda mevcut)
- Docker & Docker Compose
- Internet bağlantısı

#### Kurulum ve Çalıştırma

```bash
# Bağımlılıkları kur
pip install -r installer/requirements.txt

# GUI Installer'ı çalıştır
python installer/main.py
```

#### Build (Standalone Executable)

**Linux/macOS:**
```bash
# Build script'i çalıştır
cd installer
chmod +x build.sh
./build.sh
```

**Windows:**
```powershell
# PowerShell script'i çalıştır
cd installer
.\build.ps1

# Veya bash script'i (WSL/Git Bash ile)
cd installer
bash build.sh
```

# Çıktılar
ls dist/
# - TradeBot-Installer-Windows.exe (Windows için)
# - TradeBot-Installer-macOS.dmg (macOS için)
# - TradeBot-Installer-Linux.tar.gz (Linux için)

### 📱 Platform Desteği

| Platform | Desktop Icon | Start Scripts | Error Logging |
|----------|--------------|---------------|---------------|
| Windows  | ✅ .lnk      | ✅ .bat       | ✅ Tam       |
| Linux    | ✅ .desktop  | ✅ .sh        | ✅ Tam       |
| macOS    | ✅ .app      | ✅ .sh        | ✅ Tam       |

### 🖥️ Masaüstü İkonu Özellikleri

- **Otomatik Oluşturma**: Kurulum sonrası masaüstünde ikon görünür
- **Çift Tıklama Başlatma**: İkona çift tıklayarak TradeBot başlatılır
- **Platform Uyumlu**: Windows, Linux, macOS'te çalışır
- **Terminal Entegrasyonu**: Başlatma durumu terminal/cmd'de görünür
- **Otomatik Tarayıcı**: Frontend otomatik olarak açılır

### 📋 Error Logging Özellikleri

- **Real-time Logging**: Kurulum sırasında hatalar anında görünür
- **Dosya Logging**: `installer.log` dosyasında tüm detaylar
- **Popup Uyarıları**: Kritik hatalar popup ile gösterilir
- **Timestamp**: Tüm loglar zaman damgası ile
- **Exception Details**: Tam exception stack trace

### 🚀 Kurulum Sonrası

Kurulum tamamlandıktan sonra:

1. **Masaüstü İkonu**: Masaüstünüzde "TradeBot" ikonu oluşacak
2. **Çift Tıklama**: İkona çift tıklayarak projeyi başlatın
3. **Tarayıcı**: Frontend otomatik olarak açılacak
4. **Scripts**: Manual başlatma için start_tradebot.sh/bat kullanın

#### Manuel Başlatma

```bash
# Linux/macOS
./start_tradebot.sh

# Windows
start_tradebot.bat
```

#### Manuel Durdurma

```bash
# Linux/macOS
./stop_tradebot.sh

# Windows
stop_tradebot.bat
```

### 🎯 Roadmap

- [x] Masaüstü ikonu oluşturma
- [x] Gelişmiş error logging
- [x] Platform bağımsız start/stop scripts
- [ ] Otomatik güncelleme kontrolü
- [ ] Tema desteği (Dark/Light mode)
- [ ] Multi-language desteği
- [ ] Cloud deployment seçenekleri
- [ ] Backup/restore funktionları

### 🐛 Hata Giderme

#### Log Dosyaları

- `installer.log`: Kurulum logları
- `docker-compose logs`: Container logları

#### Yaygın Hatalar

1. **Docker başlatılamıyor**: `sudo systemctl start docker` (Linux) veya Docker Desktop'ı başlatın (Windows)
2. **Port çakışması**: Port numaralarını değiştirin
3. **İzin hatası**: Script'leri executable yapın: `chmod +x *.sh` (Linux/macOS)
4. **pywin32 hatası (Windows)**: `pip install pywin32` komutunu çalıştırın
5. **Encoding hatası (Windows)**: Batch script'lerde UTF-8 encoding sorunu - installer otomatik düzeltir
6. **Docker Desktop bulunamadı**: Windows'ta Docker Desktop'ın kurulu olduğundan emin olun
7. **PowerShell execution policy**: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### Masaüstü İkonu Sorunları

- **Linux**: `.desktop` dosyasını executable yapın
- **Windows**: İcon path'ini kontrol edin
- **macOS**: App bundle permissions kontrol edin

### 📞 Destek

Sorun yaşarsanız:

1. `installer.log` dosyasını kontrol edin
2. "Log Dosyası Aç" butonunu kullanın
3. GitHub Issues'da rapor edin
4. Error popup'ından detayları kopyalayın

### 📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır.

---

**⭐ Beğendiyseniz GitHub'da yıldız vermeyi unutmayın!**
