# TradeBot Güvenli Docker Kurulumu ve Testleri

Bu doküman, `c:\Users\Suley\OneDrive\Documents\tradebot\.env` dosyasını güvenli biçimde oluşturarak TradeBot’u Docker ile sertleştirilmiş (hardened) şekilde kurmanız ve kurulum sonrası işlevsellik, güvenlik ve performans testlerini gerçekleştirmeniz için adım adım rehber sunar.

## Önkoşullar
- Windows: Docker Desktop (Compose desteği ile)
- Linux/macOS: Docker Engine ve Docker Compose
- Python 3.11+ (opsiyonel, .env jeneratörü için)

## 1. Güvenli .env Oluşturma
`.env` dosyası gizli bilgiler içerir; güçlü anahtarlar ve parolalar otomatik üretilir.

Seçenekler:
- Windows/Mac/Linux (Python ile): `python scripts/setup_env.py`
- Alternatif (daha kapsamlı): `python scripts/setup_security.py`
- Linux/macOS (bash kurulum): `./install.sh` (env ve anahtarları üretir)

Notlar:
- `.env` dosyası proje kök dizininde oluşturulur: `c:\Users\Suley\OneDrive\Documents\tradebot\.env`
- Üretilen değerler: `POSTGRES_PASSWORD`, `PGADMIN_DEFAULT_PASSWORD`, `SECRET_KEY`, `FERNET_KEY`, `REDIS_PASSWORD`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `DATABASE_URL`, `SYNC_DATABASE_URL`
- Varsayılan zayıf kimlik bilgileri kaldırılmıştır; tüm sırlar güçlü biçimde üretilir.

## 2. Docker Servislerini Sertleştirilmiş Şekilde Başlatma
- İmajları derle: `docker compose --profile production build`
- Servisleri başlat: `docker compose --profile production up -d`

Güvenlik Sertleştirmeleri (otomatik):
- Tüm uygulama konteynerleri non-root kullanıcı ile çalışır
- `no-new-privileges:true`, `cap_drop: [ALL]`, `read_only: true`, `tmpfs: [/tmp]`
- Redis parola zorunlu; Postgres parolası `.env` üzerinden alınır
- JWT algoritması `HS512`, şifreleme `FERNET_KEY` ile (production’da zorunlu)

## 3. Kurulum Sonrası Testler

### 3.1 İşlevsellik Testleri
- Backend sağlık ucu: `curl http://localhost:8000/health` (200 döndürmelidir)
- Docker sağlık kontrolleri: `docker ps` ve `docker inspect tradebot-backend`
- Database bağlantısı: `docker-compose logs postgres` ve migration çıktıları
- Redis bağlantısı: `docker-compose logs redis`

### 3.2 Güvenlik Taramaları
- İmaj taraması (Trivy): `docker run --rm aquasec/trivy image tradebot-backend:latest`
- Taban katman analizi: `docker scout quickview tradebot-backend:latest` (opsiyonel)
- Python bağımlılık denetimi: `pip install pip-audit && pip-audit`
- Node bağımlılık denetimi (frontend): `cd frontend && npm audit --production`

### 3.3 Performans Testleri
- Canlı kaynak izleme: `docker stats`
- Basit HTTP yük testi: `wrk -t4 -c50 -d30s http://localhost:8000/docs` (wrk kuruluysa)
- İsteğe bağlı: Locust ile senaryo tabanlı testler

## 4. Güvenlik Önlemleri ve En İyi Uygulamalar
- `.env` dosyasını asla sürüm kontrolüne eklemeyin (proje .gitignore’da engellenir)
- `.env` içeriğini imajlara kopyalamayın (proje `.dockerignore` ile engellenir)
- Üretilen parolaları düzenli aralıklarla döndürün (rotate)
- `FERNET_KEY` production’da zorunlu; yoksa backend başlatma esnasında hata verir
- Token süresi (`ACCESS_TOKEN_EXPIRE_MINUTES`) özelleştirilebilir; varsayılan 10080 (7 gün)

## 5. Sorun Giderme
- Backend 401/403: `SECRET_KEY`, `ALGORITHM`, token süresi kontrol edin
- Şifreleme hatası: `FERNET_KEY` mevcut ve 44 karakter url-safe mi?
- Database bağlantı sorunu: `DATABASE_URL` içindeki parola URL-encoded mı? (installer otomatik encode eder)
- Redis auth hatası: `REDIS_PASSWORD` ve URL’lerin `redis://:<parola>@redis:6379/0` formatında olduğundan emin olun
- Port çakışması: Compose dosyasındaki `ports` bölümlerini değiştirin

## 6. Şifre Döndürme (Rotate)
- PostgreSQL: `./scripts/change_db_password.sh`
- pgAdmin: `./scripts/change_pgadmin_password.sh`
- Redis: `.env` içindeki `REDIS_PASSWORD` değerini değiştirin ve `docker compose up -d redis` ile yeniden başlatın

## 7. Ek Notlar
- Ağ güvenliği: `tradebot-network` internal bridge, servisler arası izolasyon sağlar
- Production proxy: `nginx` `read_only` ve `no-new-privileges` ile çalışır

Hazır! Artık TradeBot güvenli ve sertleştirilmiş Docker kurulumuyla çalışıyor.

