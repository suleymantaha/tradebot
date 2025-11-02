# Aşama 1: MVP Geliştirme

## Görev: 01_02_BACKEND_BINANCE_API_INTEGRATION - Binance API Entegrasyonu (Temel)

**Amaç:** Kullanıcıların Binance API anahtarlarını (API Key ve Secret Key) platforma güvenli bir şekilde kaydetmelerini, doğrulamalarını ve bu anahtarların backend tarafından güvenli bir şekilde saklanmasını sağlamak.

**Kapsam / Yapılacaklar:**

- [ ] **Veritabanı Modeli:**
  - [ ] `ApiKey` modeli (id, user_id (FK to User), encrypted_api_key, encrypted_secret_key, is_valid, created_at) SQLAlchemy ile tanımlanacak.
- [ ] **Pydantic Şemaları:**
  - [ ] `ApiKeyCreate` (kullanıcıdan almak için: api_key, secret_key)
  - [ ] `ApiKeyResponse` (kullanıcıya göstermek için: id, api_key_masked, is_valid, created_at - secret asla gösterilmez)
- [ ] **Şifreleme İşlemleri:**
  - [ ] `cryptography.fernet` kullanılarak API anahtarları ve secret'ları için şifreleme (`encrypt_data`) ve çözme (`decrypt_data`) yardımcı fonksiyonları.
  - [ ] Fernet anahtarı (`ENCRYPTION_KEY`) güvenli bir şekilde yönetilmeli (`.env` dosyasından).
- [ ] **Binance API İstemcisi:**
  - [ ] `python-binance` kütüphanesi (veya özel bir HTTP istemcisi) kullanılarak Binance API ile etkileşim kuracak bir servis/yardımcı sınıf oluşturulması.
  - [ ] API anahtarlarının geçerliliğini kontrol etmek için bir fonksiyon (örn: hesap bilgilerini çekme, `get_account()`).
- [ ] **API Endpointleri (FastAPI Router):**
  - [ ] `POST /api/v1/api-keys`: Kullanıcının yeni API anahtarlarını eklemesi. Eklemeden önce geçerlilik kontrolü yapılır. Başarılı ise şifrelenerek veritabanına kaydedilir. Bir kullanıcının sadece bir aktif API anahtar seti olabilir (MVP için).
  - [ ] `GET /api/v1/api-keys/me`: Mevcut kullanıcının kayıtlı API anahtar bilgisini (maskelenmiş API key, geçerlilik durumu) döndürür.
  - [ ] `DELETE /api/v1/api-keys/me`: Mevcut kullanıcının kayıtlı API anahtarını siler.
- [ ] **Hata Yönetimi:** Binance API'den dönebilecek hataların (geçersiz anahtar, yetki sorunu vb.) yakalanması ve kullanıcıya uygun mesajlarla iletilmesi.
- [ ] **Birim Testleri:** API anahtarı ekleme, getirme, silme ve şifreleme/çözme işlemleri için.

**Teknik Detaylar:**

- API Key'in bir kısmı maskelenerek (örn: son 4 karakteri gösterilerek) kullanıcıya gösterilebilir, ancak Secret Key **asla** gösterilmemelidir.
- Her kullanıcının sadece bir adet Binance API anahtar setine sahip olmasına izin verilecek (MVP için). Daha sonra birden fazla anahtar yönetimi eklenebilir.

**API Endpointleri:**

- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys/me`
- `DELETE /api/v1/api-keys/me`

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**

- **Güvenlik:** Bu modülün güvenliği kritiktir. [SECURITY_GUIDELINES.md](../SECURITY_GUIDELINES.md) dikkatlice uygulanmalıdır.
- API anahtarlarının doğrulanması sırasında Binance API'ye istek atılacağı için rate limitlere dikkat edilmelidir.
- Kullanıcılara API anahtarı oluştururken hangi izinleri vermeleri gerektiği konusunda net talimatlar sunulmalıdır (frontend tarafında).

**Ortam Değişkenleri:**

- `VALIDATE_API_ON_TESTNET` (0/1): API anahtarı doğrulaması için testnet kullanımı.
- `LIVE_TRADING_ENABLED` (true/false): Canlı işlem modunu açar; kapalıysa testnet istemcisi kullanılır.
- `TESTNET_URL` (true/false): Public sembol listeleri için testnet URL seçiminde kullanılır.

**Bağımlılıklar:**

- [Kullanıcı Kimlik Doğrulama Sistemi](01_01_BACKEND_USER_AUTH.md) (Kullanıcıya ait API anahtarı saklanacağı için).
- [Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md) (ApiKey tablosunun oluşturulmuş olması).

## Binance Resmi API Baz URL’leri ve WebSocket Akışları

### Global (Spot/SAPI)
- `https://api.binance.com` — Global Spot ve SAPI REST ana endpoint.
- `https://api1.binance.com` · `https://api2.binance.com` · `https://api3.binance.com` · `https://api4.binance.com` — Performans alternatifleri; stabilite değişebilir.
- `wss://stream.binance.com:9443` · `wss://stream.binance.com:443` — Spot WebSocket; ham `/ws/<streamName>` veya birleşik `/stream?streams=...`.
- `wss://data-stream.binance.vision` — Yalnızca piyasa verisi WebSocket (user data stream yok).
- `https://data-api.binance.vision` — Spot piyasa verisi REST aynası (doküman/test amaçlı).

### SAPI (/sapi)
- `https://api.binance.com/sapi/*` — Margin, Wallet/Asset, Simple Earn, Staking, Loan, Convert vb. imzalı/anahtarlı endpoint ailesi. IP/UID limit header’ları bulunur.

### USDT-M Futures (FAPI)
- `https://fapi.binance.com` — USDT-M Futures REST.
- `wss://fstream.binance.com` — USDT-M Futures WebSocket (ham `/ws`, birleşik `/stream`; user stream listenKey).

### COIN-M Futures (DAPI)
- `https://dapi.binance.com` — COIN-M Futures REST.
- `wss://dstream.binance.com` — COIN-M Futures WebSocket.

### Options (EAPI)
- `https://eapi.binance.com` — Options REST (imzalı hesap/işlem uçları).

### Portfolio Margin (PAPI)
- `https://papi.binance.com` — Portfolio Margin REST.
- `wss://fstream.binance.com/pm` — Portfolio Margin kullanıcı verisi WebSocket.

### Margin Olay Akışları
- `wss://margin-stream.binance.com` — Margin liability ve margin call etkinlik akışları.

### Bölgesel (Binance.US)
- `https://api.binance.us` — Binance.US REST.
- `wss://stream.binance.us:9443` — Binance.US Spot WebSocket.

### Testnet ve Alternatif Yayınlar
- `https://testnet.binancefuture.com` — Futures (USDT-M) REST testnet.
- `wss://testnet.binancefuture.com` — Futures (USDT-M) WebSocket testnet.
- `wss://dstream.binancefuture.com` — COIN-M Futures WebSocket testnet.
- `wss://testnet.binance.vision` — Spot yalnızca piyasa verisi WebSocket test yayını.

### Kullanım Notları
- GET parametreler sorgu dizisiyle; POST/PUT/DELETE parametreler sorgu veya `application/x-www-form-urlencoded` gövde ile gönderilir. İmzalı uçlar için `timestamp`, `recvWindow` ve HMAC-SHA256 imza gereklidir.
- Spot WebSocket bağlantıları 24 saat geçerlidir; ping/pong zorunludur. Aynı şekilde Futures WebSocket için de 24 saat/ping/pong kuralları geçerlidir.
- Zaman damgaları varsayılan olarak milisaniye cinsindedir. Mikro saniye için `timeUnit=MICROSECOND` URL parametresi kullanılabilir.

### Resmi Referanslar
- Spot WebSocket Streams ve limitler: https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
- USDT-M Futures WebSocket: https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams
- SAPI Genel Bilgi ve limitler: https://developers.binance.com/docs/staking/general-info
- Margin Change Log (listen token ve event WS): https://developers.binance.com/docs/margin_trading/change-log
- Binance.US WebSocket/REST: https://docs.binance.us/ ve https://github.com/binance-us/binance-us-api-docs/blob/master/web-socket-streams.md
- İç API Endpointleri (platform backend): [API_ENDPOINTS.md](../API_ENDPOINTS.md)
