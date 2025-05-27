# 🚀 TradeBot - Hızlı Kurulum Rehberi

## ⚡ Tek Komutla Kurulum

```bash
git clone https://github.com/suleymantaha/tradebot.git
cd tradebot
chmod +x install.sh
./install.sh
```

## 🔐 Otomatik Şifre Oluşturma

Kurulum sırasında **güvenli rastgele şifreler** otomatik oluşturulur:

- 🗄️ **PostgreSQL şifresi**
- 🛠️ **pgAdmin şifresi**
- 🔑 **JWT Secret Key**
- 🔐 **Fernet Encryption Key**

## 📋 Kurulum Sonrası Erişim

### 🌐 Web Arayüzleri
| Servis | URL | Açıklama |
|--------|-----|----------|
| 🎯 **Frontend** | http://localhost:3000 | Ana uygulama |
| 🔧 **Backend API** | http://localhost:8000 | REST API |
| 📚 **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI |
| 🗃️ **pgAdmin** | http://localhost:5050 | Veritabanı yönetimi |

### 🔐 Şifreleri Öğrenme

```bash
# PostgreSQL şifresi
grep POSTGRES_PASSWORD .env | cut -d= -f2

# pgAdmin giriş bilgileri
echo "Email: $(grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2)"
echo "Şifre: $(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)"

# Tüm şifreleri tek seferde göster
echo "=== TradeBot Şifreleri ==="
echo "PostgreSQL: $(grep POSTGRES_PASSWORD .env | cut -d= -f2)"
echo "pgAdmin Email: $(grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2)"
echo "pgAdmin Şifre: $(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)"
```

## 🗃️ pgAdmin Veritabanı Bağlantısı

pgAdmin'de PostgreSQL'e bağlanmak için:

### 1️⃣ pgAdmin'i Başlat
```bash
docker-compose --profile development up -d pgadmin
```

### 2️⃣ Bağlantı Bilgileri
- **Host**: `host.docker.internal`
- **Port**: `5432`
- **Database**: `tradebot_db`
- **Username**: `tradebot_user`
- **Password**: `.env` dosyasından `POSTGRES_PASSWORD`

## 🛠️ Faydalı Komutlar

```bash
# Servisleri durdur
docker-compose down

# Servisleri yeniden başlat
docker-compose restart

# Logları izle
docker-compose logs -f

# Tüm verileri sil ve yeniden başlat
docker-compose down -v
./install.sh

# Sadece pgAdmin'i başlat
docker-compose --profile development up -d pgadmin

# Sadece ana servisleri başlat (pgAdmin olmadan)
docker-compose up -d
```

## ❓ Sorun Giderme

### 🐳 Docker Çalışmıyor
```bash
# Docker'ı başlat
sudo systemctl start docker

# Docker grubuna kullanıcı ekle
sudo usermod -aG docker $USER

# Terminal'i yeniden başlat
newgrp docker
```

### 🔄 Yeniden Kurulum
```bash
# Tümünü temizle
docker-compose down -v
docker system prune -f

# Yeniden kur
./install.sh
```

### 📊 Port Çakışması
```bash
# Hangi portlar kullanılıyor kontrol et
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432
sudo lsof -i :5050

# Çakışan proces'i durdur
sudo kill -9 PID_NUMBER
```

## 🎯 İlk Adımlar

1. **Frontend'e git**: http://localhost:3000
2. **Hesap oluştur**: Email ve şifre ile kayıt ol
3. **API Key ekle**: Binance API anahtarınızı ekleyin
4. **Bot oluştur**: İlk trading botunuzu yapılandırın
5. **Başlat**: Botunuzu çalıştırın ve izleyin

## 📚 Daha Fazla Bilgi

- 📖 [README.md](README.md) - Detaylı dokümantasyon
- 🐘 [PostgreSQL Rehberi](docs/PostgreSQL_KULLANIM_REHBERI.md)
- 🗃️ [pgAdmin Bağlantı Rehberi](docs/PGADMIN_BAGLANTI_REHBERI.md)

---

**🎉 Happy Trading! 💰📈**
