# 🚀 TradeBot - Professional Cryptocurrency Trading Bot

<div align="center">

![TradeBot Banner](https://img.shields.io/badge/TradeBot-v2.0-blue?style=for-the-badge&logo=bitcoin)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker)
![Python](https://img.shields.io/badge/Python-3.11+-yellow?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)

**🎯 Profesyonel otomatik kripto para trading botu - Tek komutla kurulum!**

</div>

---

## 📋 İçindekiler

- [✨ Özellikler](#-özellikler)
- [🛠️ Sistem Gereksinimleri](#️-sistem-gereksinimleri)
- [🚀 Hızlı Kurulum](#-hızlı-kurulum)
- [📊 Kullanım](#-kullanım)
- [⚙️ Konfigürasyon](#️-konfigürasyon)
- [🐳 Docker](#-docker)
- [🔧 Geliştirme](#-geliştirme)
- [⬇️ Güncelleme & Paketleme](#️-güncelleme--paketleme)
- [🆘 Sorun Giderme](#-sorun-giderme)
- [📄 Lisans](#-lisans)

---

## ✨ Özellikler

### 📈 **Trading Özellikleri**s

- 🤖 **Otomatik Trading**: EMA ve RSI stratejileri
- 📊 **Teknik Analiz**: Çoklu gösterge desteği
- 💰 **Risk Yönetimi**: Stop-loss, take-profit, trailing stop
- 🎯 **Position Yönetimi**: Spot ve Futures desteği
- 🔄 **Backtest**: Geçmiş verilerle strateji testi
- 📱 **Real-time Monitoring**: Canlı bot izleme

### 🎨 **Kullanıcı Arayüzü**

- 🌓 **Dark/Light Tema**: Modern ve responsive tasarım
- 📊 **Dashboard**: Kapsamlı bot ve hesap yönetimi
- 💳 **Bakiye Gösterimi**: Real-time Binance bakiye widget'ı
- 🔍 **Sembol Arama**: 400+ spot, 422+ futures sembol desteği
- 📈 **Performans Grafikleri**: Detaylı analiz araçları

### 🔒 **Güvenlik**

- 🛡️ **JWT Authentication**: Güvenli kullanıcı doğrulaması
- 🔐 **API Key Encryption**: Fernet encryption ile güvenli depolama
- 🚪 **Rate Limiting**: API koruma mekanizmaları
- 📝 **Audit Logging**: Tüm işlemler loglama

### 🏗️ **Teknik Altyapı**

- ⚡ **FastAPI Backend**: Yüksek performanslı API
- ⚛️ **React Frontend**: Modern SPA uygulaması
- 🐘 **PostgreSQL**: Güvenilir veri depolama
- 🔴 **Redis**: Hızlı cache sistemi
- 🐳 **Docker**: Kolay deployment ve ölçeklendirme

---

## 🛠️ Sistem Gereksinimleri

### 📋 **Minimum Gereksinimler**

- 🖥️ **OS**: Linux, macOS, Windows (WSL2)
- 💾 **RAM**: 4GB minimum, 8GB önerilen
- 💿 **Disk**: 10GB boş alan
- 🌐 **Network**: İnternet bağlantısı

### 📦 **Yazılım Gereksinimleri**

- 🐳 **Docker**: 20.10+
- 🔧 **Docker Compose**: 2.0+
- 📥 **curl**: Web istekleri için
- 📂 **git**: Kaynak kod indirme

---

## 🚀 Hızlı Kurulum

### 🎯 **Seçenek 1: GUI Installer (Önerilen!)**

**🌟 YENI! Grafik Arayüzlü Kurulum**

Teknik olmayan kullanıcılar için kullanıcı dostu, adım adım kurulum deneyimi:

#### 📥 **İndirme & Çalıştırma**

```bash
# 1. Proje indirme
git clone https://github.com/suleymantaha/tradebot.git
cd tradebot

# 2. GUI Installer'ı başlatma
cd installer
python3 main.py
```

#### ✨ **GUI Installer Özellikleri**

- 🎯 **5 Adımlı Sihirbaz**: Hoş geldin → Sistem kontrolü → Konfigürasyon → Kurulum → Tamamlandı
- ✅ **Sistem Gereksinim Kontrolü**: Docker, Docker Compose, Git otomatik kontrolü
- 🐳 **Docker Otomatik Başlatma**: Docker çalışmıyorsa otomatik olarak başlatır (macOS/Windows/Linux)
- 🔐 **Güvenli Şifre Oluşturma**: PostgreSQL ve pgAdmin şifreleri otomatik
- 📊 **Real-time İzleme**: Kurulum ilerlemesi ve logları canlı görüntüleme
- 🖱️ **Tek Tıkla Servis Açma**: Frontend, API Docs, pgAdmin direkt browser'da
- ⚙️ **Kolay Konfigürasyon**: Port ayarları, environment seçimi, dizin seçimi
- 🍎 **macOS App Bundle**: Masaüstü ikonu ile tek tıkla başlatma

### 🎯 **Seçenek 2: Terminal/Komut Satırı**

#### 1️⃣ **Proje İndirme**

```bash
git clone https://github.com/suleymantaha/tradebot.git
cd tradebot
```

### 2️⃣ **Otomatik Kurulum**

```bash
chmod +x install.sh
./install.sh
```

**🚀 Gelişmiş Başlatma Özelliği:**

TradeBot başlatma script'i artık Docker'ı otomatik olarak kontrol eder ve başlatır:

- 🐳 **Docker Kontrolü**: Her başlatmada Docker'ın çalışıp çalışmadığını kontrol eder
- 🍎 **macOS Desteği**: Docker Desktop otomatik başlatma
- 🐧 **Linux Desteği**: systemctl ile Docker servis başlatma
- 🪟 **Windows Desteği**: Docker Desktop otomatik başlatma
- ⏱️ **Akıllı Bekleme**: Docker başlatılırken 60 saniyelik timeout
- 💬 **Kullanıcı Dostu Mesajlar**: İşlem durumu hakkında detaylı bilgilendirme

### 3️⃣ **İşlem Tamamlandı! 🎉**

Kurulum script'i otomatik olarak:

- ✅ Sistem gereksinimlerini kontrol eder
- 🐳 **Docker'ı otomatik başlatır** (gerekirse)
- ✅ Environment dosyasını oluşturur
- ✅ Encryption anahtarları üretir
- ✅ Docker container'larını başlatır
- ✅ Database migration'larını çalıştırır
- ✅ Tüm servisleri ayağa kaldırır

### 4️⃣ **Erişim**

- 🌐 **Frontend**: <http://localhost:3000>
- 🔧 **Backend API**: <http://localhost:8000>
- 📚 **API Docs**: <http://localhost:8000/docs>

---

## 📊 Kullanım

### 👤 **İlk Kurulum Adımları**

1. **Hesap Oluşturma**
   - <http://localhost:3000> adresine gidin
   - "Kayıt Ol" butonuna tıklayın
   - Email ve şifrenizi girin

2. **API Anahtarı Ekleme**
   - Dashboard'a gidin
   - "API Anahtarı Ekle" butonuna tıklayın
   - Binance API Key ve Secret Key'inizi girin

3. **İlk Bot Oluşturma**
   - "Yeni Bot Oluştur" seçeneğini seçin
   - Trading parametrelerini ayarlayın
   - Bot'u başlatın

### 🔑 **Binance API Anahtarı Alma**

1. [Binance](https://www.binance.com) hesabınıza giriş yapın
2. "API Management" bölümüne gidin
3. "Create API" butonuna tıklayın
4. API Key ve Secret Key'i kopyalayın
5. **Güvenlik**: IP whitelist kullanın

### 📈 **Bot Stratejileri**

#### **EMA Crossover Stratejisi**

- 🟢 **BUY**: Hızlı EMA > Yavaş EMA
- 🔴 **SELL**: Hızlı EMA < Yavaş EMA
- ⚙️ **Parametreler**: EMA Fast (12), EMA Slow (26)

#### **RSI Stratejisi**

- 🟢 **BUY**: RSI < 30 (Oversold)
- 🔴 **SELL**: RSI > 70 (Overbought)
- ⚙️ **Parametreler**: RSI Period (14)

#### **Kombine Strateji**

- 🤝 **EMA + RSI**: Her iki sinyalin onayı
- 🎯 **Daha güvenli**: Yanlış sinyal riski azalır

---

## ⚙️ Konfigürasyon

### 🔧 **Environment Variables**

#### 📄 `.env` Dosyası

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# Security
SECRET_KEY=your_generated_secret_key
# Production'da zorunlu (runtime'da otomatik üretilmez)
FERNET_KEY=your_generated_fernet_key

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
VITE_API_URL=http://localhost:8000
LIVE_TRADING_ENABLED=false
TESTNET_URL=true
VALIDATE_API_ON_TESTNET=0

# Workers (senkron sürücü için)
SYNC_DATABASE_URL=postgresql://tradebot_user:${POSTGRES_PASSWORD}@postgres:5432/tradebot_db
```

#### 🚨 **Güvenlik Notları**

- 🔐 `SECRET_KEY` Production'da zorunludur (runtime'da yoksa backend başlatılmaz).
- 🔐 `FERNET_KEY` Production'da zorunludur ve runtime'da otomatik üretilmez. Installer anahtar üretebilir; manuel üretim için:

```bash
python3 -c "import base64,os;print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

- 🔄 Development'ta `FERNET_KEY` tanımlı değilse runtime'da geçici üretilir; ancak restart’larda değişeceği için sabit bir değer kullanmanız önerilir.
- 🛡️ `.env` dosyasını version control'e eklemeyin

### 📊 **Bot Parametreleri**

#### 💰 **Risk Yönetimi**

```javascript
{
  "stop_loss_perc": 2.0,        // %2 stop loss
  "take_profit_perc": 4.0,      // %4 take profit
  "trailing_stop_perc": 1.0,    // %1 trailing stop
  "max_daily_loss_perc": 5.0,   // Günlük max kayıp %5
  "position_size_perc": 10.0    // Sermayenin %10'u
}
```

#### 📈 **Teknik Göstergeler**

```javascript
{
  "ema_fast": 12,               // Hızlı EMA periyodu
  "ema_slow": 26,               // Yavaş EMA periyodu
  "rsi_period": 14,             // RSI periyodu
  "rsi_oversold": 30,           // RSI oversold seviyesi
  "rsi_overbought": 70          // RSI overbought seviyesi
}
```

---

## 🐳 Docker

### 📦 **Container'lar**

- **🐘 postgres**: PostgreSQL database
- **🔴 redis**: Redis cache
- **⚡ backend**: FastAPI application
- **⚛️ frontend**: React application
- **🌐 nginx**: Reverse proxy (production)

### 🛠️ **Faydalı Komutlar**

```bash
# Servisleri başlatma
docker-compose up -d

# Logları görme
docker-compose logs -f backend
docker-compose logs -f frontend

# Servisleri yeniden başlatma
docker-compose restart

# Servisleri durdurma
docker-compose down

# Tüm verileri silme
docker-compose down -v

# Sadece backend'i yeniden build etme
docker-compose build --no-cache backend
docker-compose up -d backend

# Container'a shell ile bağlanma
docker exec -it tradebot-backend bash
```

### 🔄 **Development Mode**

```bash
# Development ortamı için
docker-compose -f docker-compose.dev.yml up -d

# Hot reload ile çalıştırma
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

cd frontend
npm install
npm run dev
```

### 🐳 **İpuçları**

- **Logları Takip Etme**: `docker-compose logs -f <servis_adı>` (örn: `backend`, `frontend`)
- **Container İçinde Komut Çalıştırma**: `docker-compose exec <servis_adı> <komut>` (örn: `docker-compose exec backend bash`)
- **Tüm Servisleri Durdurma**: `docker-compose down`
- **Verileri Silerek Durdurma (Dikkat!)**: `docker-compose down -v` (Tüm volumelardaki datayı siler)

---

## 🔧 Geliştirme

### ��️ **Proje Yapısı**

```
tradebot/
├── 📁 app/                    # Backend (FastAPI)
│   ├── 📁 api/               # API routes
│   ├── 📁 core/              # Core utilities
│   ├── 📁 models/            # Database models
│   ├── 📁 schemas/           # Pydantic schemas
│   └── 📁 services/          # Business logic
├── 📁 frontend/              # Frontend (React)
│   ├── 📁 src/
│   │   ├── 📁 components/    # React components
│   │   ├── 📁 pages/         # Page components
│   │   ├── 📁 services/      # API services
│   │   └── 📁 store/         # State management
│   └── 📁 public/            # Static files
├── 📁 alembic/               # Database migrations
├── 📁 scripts/               # Utility scripts
├── 📁 docs/                  # Documentation
├── 🐳 docker-compose.yml     # Docker configuration
├── 🔧 install.sh             # Installation script
└── 📄 README.md              # This file
```

---

## ⬇️ Güncelleme & Paketleme

### 📦 Paket oluşturma

```bash
# Manifest üret
make manifest

# Paket oluştur (dist/tradebot-YYYYMMDD-HHMMSS.tar.gz)
make package
```

### ✅ Doğrulama

```bash
# Var olan manifest ile dosyaları doğrula (eksik/değişik/fazla)
make verify
```

### 🔄 Güncelleme / Onarım

```bash
# Paketten eksik/bozuk dosyaları senkronize et
make update PKG=dist/tradebot-YYYYMMDD-HHMMSS.tar.gz

# Aynı işlem (alias)
make repair PKG=dist/tradebot-YYYYMMDD-HHMMSS.tar.gz
```

### 🎯 İleri seviye: CLI kullanımı

```bash
# Hariç tutulacak desenleri görüntüleme
python3 scripts/tradebotctl.py print-ignore

# Kaynak dizin + manifest ile (paketsiz) güncelleme
python3 scripts/tradebotctl.py update --source /path/to/source --manifest /path/to/source/tradebot.manifest.json

# Dry-run (kopyalamadan göster)
python3 scripts/tradebotctl.py update --package dist/tradebot-YYYYMMDD-HHMMSS.tar.gz --dry-run
```

Notlar:

- `.manifestignore` ile paket dışında bırakılacak dosyaları belirleyebilirsiniz.
- `.env`, `logs/`, `node_modules/`, `venv/` gibi çalışma zamanı/çıktı dizinleri varsayılan olarak hariç tutulur.

### 🛠️ **Backend Development**

```bash
# Virtual environment oluşturma
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate     # Windows

# Dependencies kurma
pip install -r requirements.txt

# Database migration
alembic upgrade head

# Development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ⚛️ **Frontend Development**

```bash
cd frontend

# Dependencies kurma
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 🗄️ **Database Migration**

```bash
# Yeni migration oluşturma
alembic revision --autogenerate -m "migration description"

# Migration'ları uygulama
alembic upgrade head

# Migration geri alma
alembic downgrade -1
```

### 🗄️ **Database Yönetimi**

#### **PostgreSQL Bağlantısı**

```bash
# Hızlı bağlantı
./scripts/db_connect.sh

# Manuel bağlantı
docker exec -it tradebot-postgres psql -U tradebot_user -d tradebot_db

# Database monitoring
python3 scripts/db_monitor.py
```

#### **pgAdmin Web Arayüzü**

```bash
# pgAdmin'i başlat (development mode)
docker-compose --profile development up -d pgadmin

# Tarayıcıda aç: http://localhost:5050
# Email: admin@tradebot.local
# Password: admin123
```

#### **Detaylı PostgreSQL Rehberi**

📚 **[PostgreSQL Kullanım Rehberi](docs/PostgreSQL_KULLANIM_REHBERI.md)**

### 🧱 **Veritabanı Migration Yönetimi (Alembic)**

SQLAlchemy modellerinizde (örn: `app/models/` altındaki dosyalarda) veritabanı şemasını etkileyecek bir değişiklik yaptığınızda (kolon ekleme/çıkarma, tablo ekleme/çıkarma vb.), aşağıdaki adımları izleyerek veritabanı migration'larını yönetmelisiniz:

1. **Model Değişikliği**: SQLAlchemy modelinizi güncelleyin.
2. **Yeni Revision Oluşturma**:

    ```bash
    docker-compose exec backend alembic revision -m "yaptığınız_değişikliğin_kısa_açıklaması"
    ```

    Örnek: `docker-compose exec backend alembic revision -m "add_phone_to_users_table"`
3. **Revision Dosyasını Düzenleme**:
    - Oluşturulan yeni revision dosyası `alembic/versions/` altında yer alır.
    - Bu dosyayı açın. Alembic genellikle basit değişiklikleri otomatik olarak `upgrade()` ve `downgrade()` fonksiyonlarına ekler.
    - **Mutlaka kontrol edin!** Gerekirse `op.add_column()`, `op.drop_column()` gibi komutları manuel olarak ekleyin veya düzenleyin.
    - `downgrade()` fonksiyonunun, `upgrade()` fonksiyonundaki değişiklikleri geri alacak şekilde doğru doldurulduğundan emin olun.
4. **Migration'ı Uygulama**:

    ```bash
    docker-compose exec backend alembic upgrade head
    ```

    Bu komut, bekleyen tüm migration'ları veritabanınıza uygular.
5. **Test Etme**: Uygulamanızın beklendiği gibi çalıştığından ve veritabanı değişikliklerinin doğru olduğundan emin olun.

Bu adımları takip etmek, veritabanı şemanız ile uygulama kodunuzun senkronize kalmasını sağlar ve "column does not exist" gibi hataların önüne geçer.

---

## 🆘 Sorun Giderme

### ❓ **Sık Karşılaşılan Sorunlar**

#### 🐳 **Docker İssues**

```bash
# Docker servisi çalışmıyor
sudo systemctl start docker

# Port çakışması
sudo lsof -i :3000
sudo lsof -i :8000

# Permission denied
sudo usermod -aG docker $USER
# Terminal'i yeniden başlatın
```

#### 🔐 **API Key Sorunları**

```bash
# Encryption error
# .env dosyasında FERNET_KEY kontrol edin
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# API key geçersiz
# Binance'de API key'in aktif olduğundan emin olun
# IP whitelist kontrol edin
```

#### 📊 **Database Sorunları**

```bash
# Connection error
docker-compose logs postgres

# Migration hatası
docker exec -it tradebot-backend alembic upgrade head

# Database reset
docker-compose down -v
docker-compose up -d
```

#### 🌐 **Frontend Sorunları**

```bash
# Build hatası
cd frontend
npm install
npm run build

# CORS error
# Backend'de CORS ayarlarını kontrol edin

# API bağlantı sorunu
# VITE_API_URL environment variable'ını kontrol edin
```

### 📋 **Log Kontrolü**

```bash
# Tüm servis logları
docker-compose logs -f

# Sadece backend logları
docker-compose logs -f backend

# Sadece frontend logları
docker-compose logs -f frontend

# Son 100 satır log
docker-compose logs --tail=100 backend
```

### 🔍 **Debug Mode**

```bash
# Backend debug mode
LOG_LEVEL=DEBUG docker-compose up -d backend

# Database query logging
# .env dosyasına ekleyin:
SQLALCHEMY_ECHO=true
```

---

## 🔒 Güvenlik

### 🛡️ **En İyi Uygulamalar**

- 🔐 **API Keys**: Asla git'e commit etmeyin
- 🌐 **CORS**: Production'da proper CORS ayarlayın
- 🔑 **Passwords**: Güçlü şifreler kullanın (otomatik oluşturulur)
 - 🛡️ **Sertleştirilmiş Kurulum**: Ayrıntılı rehber için bkz. `SECURE_INSTALL.md`
- 📱 **2FA**: Binance hesabınızda 2FA aktif edin
- 💻 **IP Whitelist**: API key'lerde IP kısıtlaması yapın

### 🔐 **Dinamik Şifre Oluşturma**

Install script'i otomatik olarak güvenli şifreler oluşturur:

```bash
# Oluşturulan şifreleri görme
echo "PostgreSQL Şifre: $(grep POSTGRES_PASSWORD .env | cut -d= -f2)"
echo "pgAdmin Şifre: $(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)"
echo "Secret Key: $(grep SECRET_KEY .env | cut -d= -f2)"
echo "Fernet Key: $(grep FERNET_KEY .env | cut -d= -f2)"
```

**🔒 Güvenlik Özellikleri:**

- 🎲 **Rastgele Şifreler**: Her kurulumda farklı şifreler
- 🔢 **Güçlü Encryption**: 256-bit AES encryption
- 📝 **Secure Storage**: .env dosyasında korumalı
- 🔄 **No Hardcoded Secrets**: Kaynak kodda sabit şifre yok

### 🚨 **Production Deployment**

```bash
# SSL/TLS sertifikası
# nginx/ssl/ klasörüne certificate files koyun

# Environment variables
ENVIRONMENT=production
DEBUG=false

# Database backup
pg_dump tradebot_db > backup.sql

# Firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🤝 Katkıda Bulunma

### 🎯 **Contribution Guidelines**

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. 📝 Make your changes
4. ✅ Add tests if applicable
5. 📋 Update documentation
6. 🔄 Submit a pull request

### 🐛 **Bug Reports**

[GitHub Issues](https://github.com/suleymantaha/tradebot/issues) üzerinden:

- 📝 Detaylı açıklama
- 🔄 Reproduce steps
- 📊 Expected vs actual behavior
- 💻 System information

### 💡 **Feature Requests**

- 🎯 Use case açıklaması
- 📈 Expected benefits
- 🔧 Technical considerations

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

```
MIT License

Copyright (c) 2024 TradeBot

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projeleri kullanmaktadır:

- 🐍 [FastAPI](https://fastapi.tiangolo.com/)
- ⚛️ [React](https://react.dev/)
- 🐘 [PostgreSQL](https://www.postgresql.org/)
- 🔴 [Redis](https://redis.io/)
- 🐳 [Docker](https://www.docker.com/)
- 📊 [Binance API](https://binance-docs.github.io/apidocs/)

---

<div align="center">

**🚀 TradeBot ile Happy Trading! 💰📈**

[![GitHub stars](https://img.shields.io/github/stars/suleymantaha/tradebot?style=social)](https://github.com/suleymantaha/tradebot)
[![GitHub forks](https://img.shields.io/github/forks/suleymantaha/tradebot?style=social)](https://github.com/suleymantaha/tradebot)

</div>
