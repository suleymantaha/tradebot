# Aşama 1: MVP Geliştirme

## Görev: 01_01_BACKEND_USER_AUTH - Kullanıcı Kimlik Doğrulama Sistemi

Bu görev, kullanıcıların platforma kaydolmasını, giriş yapmasını ve oturumlarını yönetmesini sağlayacak backend altyapısının oluşturulmasını kapsar.

### Hedefler

* Kullanıcı kaydı (e-posta, şifre).
* Kullanıcı girişi (e-posta, şifre).
* Şifrelerin güvenli bir şekilde hash'lenerek saklanması (örn: bcrypt).
* JWT (JSON Web Token) tabanlı oturum yönetimi.
* Giriş yapmış kullanıcıyı doğrulayan korumalı (protected) endpoint'ler için altyapı.
* Şifre sıfırlama için temel altyapı (MVP'de tam fonksiyonel olmayabilir, ama planlanmalı).

### Teknik Detaylar

* **Framework:** FastAPI
* **Şifreleme:** `passlib` kütüphanesi (bcrypt ile).
* **JWT:** `python-jose` kütüphanesi.
* **Veritabanı Modeli:**
  * `User` (id, email, hashed_password, created_at, is_active, is_superuser vb.)

### API Endpointleri (Örnek)

* `POST /auth/register` (güçlü şifre politikası zorunlu: min 12 karakter, büyük/küçük, rakam, özel)
* `POST /auth/login` (token döner; IP/email bazlı rate limiting uygulanır)
* `POST /auth/forgot-password` (IP/email rate limiting; reset token üretimi ve email)
* `POST /auth/reset-password` (reset token hash ile doğrulanır; güçlü şifre politikası zorunlu)
* `GET /users/me` (korumalı, mevcut kullanıcı bilgilerini döner)

### Güvenlik Notları

* Reset token’lar veritabanında plaintext yerine SHA-256 hash olarak saklanır.
* Production’da `DATABASE_URL` ve `SECRET_KEY` zorunludur; `SQLALCHEMY_ECHO` varsayılan kapalıdır.
* Rate limiting Redis ile yapılır; Redis erişilemezse geliştirme/test ortamında graceful degrade uygulanır.

### Yapılacaklar Listesi

- [ ] `User` Pydantic modellerini (schema) oluştur (request, response, DB).
* [ ] `User` SQLAlchemy modelini (veritabanı tablosu) oluştur.
* [ ] Veritabanı migration script'ini oluştur (Alembic ile).
* [ ] Şifre hash'leme ve doğrulama yardımcı fonksiyonlarını yaz.
* [ ] JWT oluşturma ve doğrulama yardımcı fonksiyonlarını yaz.
* [ ] Kayıt (`/auth/register`) endpoint'ini implemente et.
* [ ] Giriş (`/auth/login`) endpoint'ini implemente et.
* [ ] Korumalı endpoint'ler için dependency (bağımlılık) oluştur (`get_current_user`).
* [ ] `/users/me` endpoint'ini implemente et.
* [ ] Temel birim testlerini yaz (kayıt, giriş, token doğrulama).

### Tahmini Süre

* X Adam-Gün

### Notlar ve Riskler

* E-posta doğrulaması MVP sonrası eklenebilir.
* OAuth2 (Google/GitHub ile giriş) MVP sonrası düşünülebilir.
