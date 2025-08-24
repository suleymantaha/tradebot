# Teknik Stack

Bu doküman, projede kullanılacak ana teknolojileri ve araçları listeler. Seçimler, projenin gereksinimleri, ölçeklenebilirlik, güvenlik ve geliştirme hızı göz önünde bulundurularak yapılmıştır.

## Backend

* **Programlama Dili:** Python (3.9+)
* **Web Framework:** FastAPI
* **Asenkron Görev Yöneticisi:** Celery
* **Mesaj Kuyruğu:** RabbitMQ (veya Redis - Celery broker olarak)
* **ORM (Object-Relational Mapper):** SQLAlchemy (Async versiyonu ile)
* **Veritabanı İstemcisi:** `asyncpg` (PostgreSQL için)

## Frontend

* **JavaScript Framework/Kütüphane:** React (Vite ile)
* **State Management:** Zustand (alternatif: Redux Toolkit)
* **Stil:** Tailwind CSS (alternatif: Material-UI, Chakra UI)
* **API İstemcisi:** Axios veya `fetch` API
* **Grafik Kütüphanesi:** Chart.js veya Recharts

## Veritabanı

* **Relational Database:** PostgreSQL (13+)
* **Caching:** Redis

## DevOps & Deployment

* **Konteynerleştirme:** Docker, Docker Compose
* **CI/CD (Sürekli Entegrasyon/Sürekli Dağıtım):** GitHub Actions (veya GitLab CI/CD)
* **Web Sunucusu / Reverse Proxy:** Nginx
* **Hosting Platformu (Örnekler):**
  * AWS (EC2, RDS, ElastiCache, SQS)
  * DigitalOcean (Droplets, Managed Databases)
  * Google Cloud Platform (Compute Engine, Cloud SQL)
  * Render, Railway (PaaS seçenekleri)

## Geliştirme Araçları

* **Versiyon Kontrol Sistemi:** Git
* **Kod Editörü/IDE:** Visual Studio Code, PyCharm
* **API Test Aracı:** Postman, Insomnia, veya VS Code eklentileri (Thunder Client)
* **Proje Yönetimi (Öneri):** Trello, Jira, Notion, veya GitHub Issues/Projects

## Diğer Kütüphaneler ve Araçlar

* **Binance API Bağlantısı:** `python-binance` (veya kendi özel sarmalayıcınız)
* **Teknik İndikatörler:** `TA-Lib` veya `pandas_ta`
* **Şifreleme:** `passlib` (şifre hashing için), `cryptography` (API anahtarları için)
* **Yapılandırma Yönetimi:** `.env` dosyaları (`python-dotenv`)
* **Loglama:** Python'ın `logging` modülü, yapılandırılmış loglama (örn: `structlog`)
