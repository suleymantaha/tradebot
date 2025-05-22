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
*   API Key'in bir kısmı maskelenerek (örn: son 4 karakteri gösterilerek) kullanıcıya gösterilebilir, ancak Secret Key **asla** gösterilmemelidir.
*   Her kullanıcının sadece bir adet Binance API anahtar setine sahip olmasına izin verilecek (MVP için). Daha sonra birden fazla anahtar yönetimi eklenebilir.

**API Endpointleri:**
*   `POST /api/v1/api-keys`
*   `GET /api/v1/api-keys/me`
*   `DELETE /api/v1/api-keys/me`

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   **Güvenlik:** Bu modülün güvenliği kritiktir. [SECURITY_GUIDELINES.md](_PARENT_DIR_/_PARENT_DIR_/SECURITY_GUIDELINES.md) dikkatlice uygulanmalıdır.
*   API anahtarlarının doğrulanması sırasında Binance API'ye istek atılacağı için rate limitlere dikkat edilmelidir.
*   Kullanıcılara API anahtarı oluştururken hangi izinleri vermeleri gerektiği konusunda net talimatlar sunulmalıdır (frontend tarafında).

**Bağımlılıklar:**
*   [Kullanıcı Kimlik Doğrulama Sistemi](01_01_BACKEND_USER_AUTH.md) (Kullanıcıya ait API anahtarı saklanacağı için).
*   [Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md) (ApiKey tablosunun oluşturulmuş olması).
