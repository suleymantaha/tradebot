# 🐘 PostgreSQL Kullanım Rehberi - TradeBot

Bu rehber, TradeBot projesinde PostgreSQL'in nasıl kullanıldığını ve nasıl yönetileceğini açıklar.

## 🎯 PostgreSQL'in TradeBot'taki Rolü

PostgreSQL, TradeBot uygulamasının **beyin** ve **hafızası** gibi çalışır:

### 📊 **Sakladığı Ana Veriler**

| Tablo | İçerik | Amaç |
|-------|--------|------|
| 👤 `users` | Kullanıcı hesapları | Giriş yapma, kimlik doğrulama |
| 🔑 `api_keys` | Binance API anahtarları | Şifrelenmiş borsaya bağlantı |
| 🤖 `bot_configs` | Bot ayarları | Strateji, risk parametreleri |
| 📈 `bot_states` | Bot durumları | Anlık çalışma durumu |
| 💰 `trades` | İşlem geçmişi | Alım/satım kayıtları |
| 📋 `backtests` | Test sonuçları | Strateji performans analizi |

## 🛠️ Pratik Kullanım

### 1️⃣ **Veritabanına Bağlanma**

#### Docker ile bağlanma (Önerilen):
```bash
# PostgreSQL container'ına giriş
docker exec -it tradebot-postgres psql -U tradebot_user -d tradebot_db

# Veya kısa yoldan
./scripts/db_connect.sh
```

#### Manuel bağlanma:
```bash
# Sistem PostgreSQL'i kullanıyorsanız
psql -h localhost -p 5432 -U tradebot_user -d tradebot_db
```

### 2️⃣ **Temel PostgreSQL Komutları**

```sql
-- Tabloları listele
\dt

-- Tablo yapısını gör
\d users
\d bot_configs

-- Veritabanı boyutunu gör
\l+

-- Çıkış yap
\q
```

### 3️⃣ **Kullanışlı Sorgular**

#### **📊 Genel İstatistikler**
```sql
-- Toplam kullanıcı sayısı
SELECT COUNT(*) as kullanici_sayisi FROM users;

-- Aktif bot sayısı
SELECT COUNT(*) as aktif_bot_sayisi
FROM bot_configs
WHERE is_active = true;

-- Bugünkü toplam işlem sayısı
SELECT COUNT(*) as bugun_islem_sayisi
FROM trades
WHERE DATE(timestamp) = CURRENT_DATE;
```

#### **🤖 Bot Performansları**
```sql
-- Tüm botların günlük performansı
SELECT
    bc.name as bot_adi,
    bc.symbol,
    bs.daily_pnl as gunluk_kar_zarar,
    bs.daily_trades_count as gunluk_islem_sayisi,
    bs.status as durum
FROM bot_configs bc
JOIN bot_states bs ON bc.id = bs.id
WHERE bc.is_active = true;
```

#### **💰 İşlem Analizi**
```sql
-- En karlı işlemler (son 10)
SELECT
    symbol,
    side,
    price,
    quantity_filled,
    pnl,
    timestamp
FROM trades
WHERE pnl > 0
ORDER BY pnl DESC
LIMIT 10;

-- Sembol bazında toplam kar/zarar
SELECT
    symbol,
    COUNT(*) as islem_sayisi,
    SUM(pnl) as toplam_kar_zarar,
    AVG(pnl) as ortalama_kar_zarar
FROM trades
GROUP BY symbol
ORDER BY toplam_kar_zarar DESC;
```

#### **📈 Trend Analizi**
```sql
-- Günlük işlem hacmi
SELECT
    DATE(timestamp) as tarih,
    COUNT(*) as islem_sayisi,
    SUM(quote_quantity_filled) as hacim_usdt
FROM trades
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY tarih DESC;
```

### 4️⃣ **Veri Yönetimi**

#### **💾 Yedekleme**
```bash
# Tüm veritabanını yedekle
docker exec tradebot-postgres pg_dump -U tradebot_user tradebot_db > backup_$(date +%Y%m%d).sql

# Sadece belirli tabloyu yedekle
docker exec tradebot-postgres pg_dump -U tradebot_user -t trades tradebot_db > trades_backup.sql
```

#### **🔄 Geri Yükleme**
```bash
# Yedekten geri yükle
docker exec -i tradebot-postgres psql -U tradebot_user tradebot_db < backup_20240527.sql
```

#### **🧹 Temizlik**
```sql
-- Eski işlem kayıtlarını sil (30 günden eski)
DELETE FROM trades
WHERE timestamp < CURRENT_DATE - INTERVAL '30 days';

-- Bot error loglarını temizle
UPDATE bot_states
SET last_error_message = NULL
WHERE last_error_message IS NOT NULL;
```

### 5️⃣ **Monitoring ve Debugging**

#### **📊 Database Monitor Script'i**
```bash
# Otomatik istatistik raporu
python3 scripts/db_monitor.py

# Gerekli modülü kur
pip install tabulate asyncpg
```

#### **🔍 Performans İzleme**
```sql
-- Yavaş çalışan sorgular
SELECT
    query,
    mean_time,
    calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Aktif bağlantılar
SELECT
    datname,
    usename,
    application_name,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'tradebot_db';
```

#### **📋 Tablo Boyutları**
```sql
-- En büyük tablolar
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as boyut
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### 6️⃣ **Web Arayüzü (pgAdmin)**

Görsel veritabanı yönetimi için pgAdmin kullanabilirsiniz:

```bash
# pgAdmin'i başlat
docker-compose --profile development up -d pgadmin

# Şifreleri öğren
echo "pgAdmin URL: http://localhost:5050"
echo "pgAdmin Email: $(grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2)"
echo "pgAdmin Şifre: $(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)"
echo "PostgreSQL Şifre: $(grep POSTGRES_PASSWORD .env | cut -d= -f2)"
```

**pgAdmin'de TradeBot veritabanını ekleme:**
1. "Add New Server" tıklayın
2. **Name**: TradeBot Database
3. **Host**: host.docker.internal
4. **Port**: 5432
5. **Database**: tradebot_db
6. **Username**: tradebot_user
7. **Password**: `.env` dosyasındaki `POSTGRES_PASSWORD` değeri

### 7️⃣ **Yaygın Sorunlar ve Çözümler**

#### **❌ Bağlantı Hatası**
```bash
# PostgreSQL container'ı çalışıyor mu?
docker ps | grep postgres

# Container'ı yeniden başlat
docker-compose restart postgres

# Port çakışması kontrolü
sudo lsof -i :5432
```

#### **💾 Disk Alanı Sorunu**
```sql
-- Büyük tabloları bul
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Eski logları temizle
VACUUM FULL;
```

#### **🐌 Yavaş Sorgular**
```sql
-- İndeks eksikliği kontrolü
EXPLAIN ANALYZE SELECT * FROM trades WHERE symbol = 'BTCUSDT';

-- Performans iyileştirme
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
```

### 8️⃣ **Güvenlik**

#### **🔒 Güvenlik En İyi Uygulamaları**
- ✅ Güçlü şifreler kullanın (.env dosyası)
- ✅ API anahtarları şifrelenmiş saklanır
- ✅ Regular backup alın
- ✅ Sadece gerekli portları açın
- ✅ Production'da postgres portunu kapatın

#### **🛡️ Production Ayarları**
```yaml
# docker-compose.yml'de production için
postgres:
  # Port'u dışarıya açma
  # ports:
  #   - "5432:5432"

  # Güvenlik ayarları
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Güçlü şifre
    POSTGRES_HOST_AUTH_METHOD: md5  # trust yerine md5
```

## 🎓 Sonuç

PostgreSQL, TradeBot'un kalbidir:
- 🏦 **Veri Güvenliği**: ACID özellikleri
- ⚡ **Performans**: Hızlı sorgular ve indexing
- 🔗 **İlişkisel Veri**: Tablolar arası bağlantılar
- 📊 **Analitik**: SQL ile güçlü veri analizi
- 🛡️ **Güvenlik**: Şifreleme ve yetkilendirme

Bu rehberle PostgreSQL'i etkili şekilde kullanabilir ve TradeBot'unuzun verilerini yönetebilirsiniz!
