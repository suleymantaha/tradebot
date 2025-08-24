# Aşama 0: Planlama ve Temel Kurulum

## Görev: 00_03_DEV_ENVIRONMENT_SETUP - Geliştirme Ortamının Kurulumu

**Amaç:** Tüm geliştirme ekibi için tutarlı, tekrarlanabilir ve verimli bir yerel geliştirme ortamı oluşturmak. Bu, projenin farklı bileşenlerinin (backend, frontend, veritabanı vb.) kolayca çalıştırılmasını ve hata ayıklanmasını sağlamalıdır.

**Kapsam / Yapılacaklar:**

1. **Versiyon Kontrol Sistemi:**
    - [x] GitHub (veya GitLab/Bitbucket) üzerinde özel (private) bir repository oluşturulması.
    - [ ] `main` (veya `master`) ve `develop` gibi ana dalların oluşturulması.
    - [ ] Branching stratejisinin belirlenmesi (örn: Gitflow, GitHub Flow).
    - [ ] `.gitignore` dosyasının proje kök dizinine eklenmesi (Python, Node.js, IDE dosyaları vb. için).
2. **Backend Geliştirme Ortamı (Python/FastAPI):**
    - [ ] Python sürümünün belirlenmesi ve tüm ekip üyelerinin aynı sürümü kullanmasının sağlanması (örn: pyenv ile).
    - [ ] Sanal ortam (virtual environment) yönetimi için standart belirlenmesi (`venv` veya `poetry`).
    - [ ] Temel FastAPI proje yapısının oluşturulması.
    - [ ] `requirements.txt` (veya `pyproject.toml` - Poetry için) dosyasının oluşturulması ve temel bağımlılıkların eklenmesi (fastapi, uvicorn, sqlalchemy, psycopg2-binary/asyncpg, passlib, python-jose, python-dotenv).
    - [ ] Linter (Flake8/Pylint) ve Formatter (Black/Autopep8) yapılandırması.
    - [ ] VS Code için önerilen eklentilerin (Python, Pylance, Black Formatter vb.) listelenmesi.
3. **Frontend Geliştirme Ortamı (React):**
    - [ ] Node.js ve npm/yarn sürümlerinin belirlenmesi.
    - [ ] Vite (önerilir) veya Create React App ile temel React proje yapısının oluşturulması.
    - [ ] Temel bağımlılıkların eklenmesi (axios, react-router-dom, zustand/redux-toolkit, tailwindcss).
    - [ ] Linter (ESLint) ve Formatter (Prettier) yapılandırması.
    - [ ] VS Code için önerilen eklentilerin (ESLint, Prettier, Tailwind CSS IntelliSense vb.) listelenmesi.
4. **Veritabanı ve Diğer Servisler (Docker Compose):**
    - [ ] Proje kök dizininde `docker-compose.yml` dosyasının oluşturulması.
    - [ ] PostgreSQL servisi için yapılandırma.
    - [ ] Redis servisi (cache ve Celery broker/backend için) yapılandırması.
    - [ ] RabbitMQ servisi (Celery broker için alternatif) yapılandırması.
    - [ ] Geliştirme ortamı için `.env.example` dosyası oluşturulması ve `.env` dosyasının `.gitignore`'a eklenmesi.
5. **Asenkron Görevler (Celery):**
    - [ ] Temel Celery uygulamasının backend projesine entegre edilmesi.
    - [ ] `docker-compose.yml` dosyasına Celery worker servisi ve (isteğe bağlı) Celery Beat (periyodik görevler için) servisinin eklenmesi.
    - [ ] Flower (Celery izleme aracı) servisinin (isteğe bağlı) eklenmesi.
6. **IDE ve Araçlar:**
    - [ ] Tüm ekip için ortak IDE ayarları (örn: VS Code `.vscode/settings.json`).
    - [ ] Postman/Insomnia koleksiyonu için başlangıç yapısının oluşturulması.
7. **Dokümantasyon:**
    - [ ] Geliştirme ortamının nasıl kurulacağına dair basit bir `CONTRIBUTING.md` veya `DEVELOPMENT_SETUP.md` dosyası oluşturulması.

**Teknik Detaylar:**
- `docker-compose.yml` içinde servisler arası ağ bağlantıları ve port yönlendirmeleri doğru şekilde ayarlanmalıdır.
- Veritabanı verilerinin kalıcılığı için Docker volume'leri kullanılmalıdır.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Farklı işletim sistemlerinde (Windows, macOS, Linux) geliştirme ortamının sorunsuz çalışması hedeflenmelidir (Docker bu konuda yardımcı olur).
- Yeni bir ekip üyesinin hızlıca ortama adapte olabilmesi için kurulum adımları net ve basit olmalıdır.
- Gizli bilgilerin (API anahtarları, şifreler) asla Git repository'sine commit edilmemesi için `.env` dosyası ve `.gitignore` doğru kullanılmalıdır.
