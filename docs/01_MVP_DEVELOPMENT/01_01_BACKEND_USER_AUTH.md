# Aşama 1: MVP Geliştirme

## Görev: 01_01_BACKEND_USER_AUTH - Kullanıcı Kimlik Doğrulama Sistemi

**Amaç:** Kullanıcıların platforma kaydolmasını, giriş yapmasını ve oturumlarını yönetmesini sağlayacak güvenli backend altyapısının oluşturulması.

**Kapsam / Yapılacaklar:**

- [ ] **Veritabanı Modeli:**
  - [ ] `User` modeli (id, email, hashed_password, is_active, created_at) SQLAlchemy ile tanımlanacak.
- [ ] **Pydantic Şemaları:**
  - [ ] `UserCreate` (kayıt için: email, password)
  - [ ] `UserLogin` (giriş için: email, password)
  - [ ] `UserResponse` (kullanıcı bilgilerini döndürmek için: id, email, is_active)
  - [ ] `Token` (JWT token ve token tipi için)
  - [ ] `TokenData` (JWT payload'ı için: kullanıcı email/id)
- [ ] **Şifre İşlemleri:**
  - [ ] `passlib` kütüphanesi (bcrypt ile) kullanılarak şifre hash'leme ve doğrulama fonksiyonları (`get_password_hash`, `verify_password`).
- [ ] **JWT İşlemleri:**
  - [ ] `python-jose` kütüphanesi kullanılarak JWT oluşturma (`create_access_token`) ve çözme/doğrulama (`verify_token_access`) fonksiyonları.
  - [ ] `SECRET_KEY` ve `ALGORITHM` yapılandırması (`.env` dosyasından).
- [ ] **API Endpointleri (FastAPI Router):**
  - [ ] `POST /auth/register`: Yeni kullanıcı kaydı. E-posta benzersizliği kontrolü.
  - [ ] `POST /auth/login`: Kullanıcı girişi. Başarılı girişte JWT access token döndürür.
  - [ ] `GET /users/me`: Korumalı endpoint. Geçerli JWT ile istek yapan kullanıcının bilgilerini döndürür (Dependency Injection ile `get_current_active_user`).
- [ ] **Bağımlılıklar (Dependencies):**
  - [ ] `get_current_user`: JWT'yi doğrular ve kullanıcı objesini döndürür.
  - [ ] `get_current_active_user`: `get_current_user`'ı kullanır ve kullanıcının aktif olup olmadığını kontrol eder.
- [ ] **Hata Yönetimi:** Uygun HTTP durum kodları ve hata mesajları (örn: 400 Bad Request, 401 Unauthorized, 409 Conflict).
- [ ] **Birim Testleri:** Kayıt, giriş, token oluşturma/doğrulama senaryoları için.

**Teknik Detaylar:**

- FastAPI'nin `OAuth2PasswordBearer` ve `OAuth2PasswordRequestForm` sınıfları kullanılacak.
- Kullanıcı e-postaları benzersiz olmalı (veritabanı seviyesinde `UNIQUE` kısıtlaması).

**API Endpointleri:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (resmi adıyla `token`)
- `GET /api/v1/users/me`

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**

- Şifre sıfırlama MVP'de olmayabilir, ancak ileride ekleneceği düşünülerek e-posta alanı zorunlu tutulmalı.
- E-posta doğrulama MVP sonrası eklenebilir.
- JWT `exp` (expiration time) env ile yönetilir. Mevcut uygulamada varsayılan erişim token süresi 7 gün (`ACCESS_TOKEN_EXPIRE_MINUTES=10080`), "Beni Hatırla" seçilirse 30 gün (`REMEMBER_ME_EXPIRE_MINUTES=43200`). Production için daha kısa süre (örn: 15-60 dk) ve ileride refresh token mekanizması önerilir.

**Bağımlılıklar:**

- [Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md) (User tablosunun oluşturulmuş olması)
- [Geliştirme Ortamı Kurulumu](../00_PLANNING_AND_SETUP/00_03_DEV_ENVIRONMENT_SETUP.md)