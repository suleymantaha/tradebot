# pgAdmin PostgreSQL Bağlantı Rehberi

## 🔗 Bağlantı Sorunu Çözümü ✅

pgAdmin Docker container'ından PostgreSQL'e bağlanırken **"Connection refused"** hatası alıyorsanız, bu PostgreSQL'in güvenlik ayarlarından kaynaklanır. PostgreSQL sadece localhost (127.0.0.1) bağlantılarını kabul ediyor.

**✅ ÇÖZÜM**: pgAdmin'i `host.docker.internal` desteği ile çalıştırdık!

## ✅ GÜNCEL Doğru Bağlantı Ayarları

pgAdmin'de yeni server eklerken aşağıdaki bilgileri kullanın:

### 🔐 Şifreleri Öğrenme

Kurulum sırasında otomatik olarak rastgele şifreler oluşturulur. Şifreleri öğrenmek için:

```bash
# PostgreSQL şifresi
grep POSTGRES_PASSWORD .env | cut -d= -f2

# pgAdmin şifresi
grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2

# pgAdmin email
grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2
```

### Server Bilgileri
- **Name**: TradeBot DB
- **Server Group**: Servers

### Connection Bilgileri
- **Host name/address**: `host.docker.internal`
- **Port**: `5432`
- **Maintenance database**: `tradebot_db`
- **Username**: `tradebot_user`
- **Password**: `.env` dosyasından `POSTGRES_PASSWORD` değeri

### Diğer Ayarlar
- **SSL mode**: Prefer
- **Save password**: ✅ (İsterseniz işaretleyebilirsiniz)

## 🛠️ Adım Adım Bağlantı

1. **pgAdmin şifrelerini öğrenin**:
   ```bash
   # Terminal'de proje klasöründe çalıştırın
   echo "pgAdmin URL: http://localhost:5050"
   echo "pgAdmin Email: $(grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2)"
   echo "pgAdmin Şifre: $(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)"
   echo "PostgreSQL Şifre: $(grep POSTGRES_PASSWORD .env | cut -d= -f2)"
   ```

2. **pgAdmin'e gidin**: http://localhost:5050

3. **Giriş yapın**:
   - Email: `.env` dosyasındaki `PGADMIN_DEFAULT_EMAIL`
   - Şifre: `.env` dosyasındaki `PGADMIN_DEFAULT_PASSWORD`

4. **Sağ tık** > **Create** > **Server...**

5. **General sekmesi**:
   - Name: `TradeBot DB`

6. **Connection sekmesi**:
   - Host: `host.docker.internal`
   - Port: `5432`
   - Database: `tradebot_db`
   - Username: `tradebot_user`
   - Password: `.env` dosyasındaki `POSTGRES_PASSWORD` değeri

7. **Save** butonuna tıklayın

## 🔧 Son Çözüm Detayları

**Son Durum**: pgAdmin port 5050'de çalışıyor ve `host.docker.internal` ile host makineye erişebiliyor.

### Güncel pgAdmin Container'ı
pgAdmin artık `docker-compose.yml` içinde tanımlanmış ve environment variable'larını `.env` dosyasından alıyor:

```bash
# pgAdmin'i development profile ile başlatın
docker-compose --profile development up -d pgadmin
```

### Önemli Parametreler
- `host.docker.internal` → Container'dan host makineye erişim
- Port 5050 → pgAdmin web arayüzü
- Environment variable'lar `.env` dosyasından geliyor

## 🔍 Sorunun Kök Nedeni

PostgreSQL'in `pg_hba.conf` dosyası sadece localhost bağlantılarını kabul ediyordu:
```
host    tradebot_db     tradebot_user   127.0.0.1/32            scram-sha-256
```

`host.docker.internal` Docker tarafından host makineye yönlendiriliyor ve PostgreSQL bunu localhost olarak görüyor.

## 🧪 Bağlantı Test

Terminal'den bağlantıyı test etmek için:
```bash
# Doğrudan bağlantı testi (.env'den şifre alarak)
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d= -f2)
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U tradebot_user -d tradebot_db -c "SELECT version();"

# Container'dan host.docker.internal test
docker exec tradebot-pgadmin ping -c 1 host.docker.internal
```

## 📚 Veritabanı Yapısı

Bağlandıktan sonra göreceğiniz tablolar:
- `users` - Kullanıcı hesapları
- `api_keys` - Binance API anahtarları
- `bot_configs` - Bot konfigürasyonları
- `bot_states` - Bot durumları
- `trades` - İşlem geçmişi
- `backtests` - Backtest sonuçları
- `alembic_version` - Veritabanı sürüm yönetimi

## 🎯 Özet

✅ **URL**: http://localhost:5050
✅ **Login**: `.env` dosyasındaki email/şifre
✅ **Host**: `host.docker.internal` kullanın
✅ **Şifreler**: `.env` dosyasında otomatik oluşturulur

Artık her kurulumda farklı güvenli şifreler oluşturulacak! 🚀
