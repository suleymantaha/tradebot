# Deployment Stratejisi

Bu doküman, uygulamanın geliştirme (development), hazırlık (staging) ve üretim (production) ortamlarına nasıl dağıtılacağına dair stratejiyi özetler.

## Genel Prensipler
*   **Konteynerleştirme:** Uygulamanın tüm bileşenleri (backend, frontend, worker'lar) Docker kullanılarak konteynerleştirilecektir. Bu, ortam tutarlılığı sağlar ve dağıtımı basitleştirir.
*   **Orkestrasyon:** Docker Compose, geliştirme ve basit hazırlık ortamları için kullanılacaktır. Üretim ortamı için, projenin büyüklüğüne ve karmaşıklığına bağlı olarak Kubernetes (K8s) veya benzeri bir orkestrasyon aracı değerlendirilebilir. Başlangıçta Docker Compose ile yönetilen bir VPS/EC2 de yeterli olabilir.
*   **CI/CD (Sürekli Entegrasyon / Sürekli Dağıtım):** Kod değişiklikleri ana dala (main/master) merge edildiğinde otomatik testlerin çalıştırılması ve başarılı olursa hazırlık/üretim ortamına dağıtım yapılması hedeflenmektedir (GitHub Actions veya GitLab CI/CD).
*   **Altyapı Olarak Kod (Infrastructure as Code - IaC):** Mümkünse Terraform veya AWS CloudFormation gibi araçlarla altyapı kaynaklarının (sunucular, veritabanları, ağlar) kod ile yönetilmesi uzun vadede faydalı olacaktır.
*   **Sıfır Kesinti (Zero-Downtime) Deployment:** Mümkün olduğunca blue/green deployment veya rolling updates gibi stratejilerle güncellemeler sırasında servis kesintisi yaşanmaması hedeflenir.

## Ortamlar
1.  **Geliştirme (Development):**
    *   Her geliştirici kendi lokal makinesinde Docker Compose ile çalışır.
    *   Kod değişiklikleri anında yansıtılır (hot-reloading).
    *   Hata ayıklama araçları ve detaylı loglama aktiftir.
2.  **Hazırlık (Staging):**
    *   Üretim ortamına çok benzeyen bir ortamdır.
    *   Yeni özellikler ve düzeltmeler burada test edilir.
    *   Veritabanı, üretim verilerinin bir kopyası (anonimleştirilmiş) veya temsili bir veri seti olabilir.
    *   CI/CD ile otomatik olarak güncellenir.
3.  **Üretim (Production):**
    *   Canlı kullanıcıların eriştiği ortam.
    *   Yüksek erişilebilirlik ve performans için optimize edilmiştir.
    *   Sıkı güvenlik önlemleri uygulanır.
    *   Detaylı izleme (monitoring) ve uyarı (alerting) sistemleri kuruludur.
    *   Veritabanı yedeklemeleri düzenli olarak yapılır.

## Deployment Akışı (Örnek CI/CD ile)
1.  Geliştirici kodu özellik dalına (feature branch) push eder.
2.  Pull Request (PR) açılır.
3.  Otomatik testler (birim, entegrasyon) CI sunucusunda çalışır.
4.  Kod incelemesi (code review) yapılır.
5.  PR onaylanır ve ana dala (main/develop) merge edilir.
6.  CI sunucusu:
    *   Docker imajlarını oluşturur.
    *   İmajları bir container registry'ye (Docker Hub, AWS ECR, GitHub Container Registry) push eder.
    *   Hazırlık (staging) ortamına otomatik deploy eder.
7.  Hazırlık ortamında manuel ve/veya otomatik kabul testleri yapılır.
8.  Onay sonrası, üretim ortamına dağıtım tetiklenir (manuel veya otomatik).

## Temel Bileşenlerin Dağıtımı
*   **Backend (FastAPI):** Docker konteyneri olarak, Gunicorn + Uvicorn worker'ları ile çalışır.
*   **Frontend (React):** Statik dosyalar (HTML, CSS, JS) olarak build edilir. Nginx tarafından sunulabilir veya bir CDN'e yüklenebilir. Backend API'si için Nginx reverse proxy görevi görür.
*   **Celery Workers:** Ayrı Docker konteynerleri olarak çalışır.
*   **RabbitMQ/Redis:** Docker konteyneri olarak veya yönetilen servis (managed service) olarak.
*   **PostgreSQL:** Docker konteyneri olarak (küçük ölçekli) veya yönetilen servis (AWS RDS, DigitalOcean Managed DB) olarak (önerilir).
*   **Nginx:** Reverse proxy, SSL sonlandırma, statik dosya sunumu ve rate limiting için.

## İzleme ve Loglama
*   **Uygulama Performans İzleme (APM):** Sentry, Datadog, New Relic gibi araçlar (veya açık kaynak Prometheus + Grafana).
*   **Log Yönetimi:** ELK Stack (Elasticsearch, Logstash, Kibana) veya EFK Stack, Grafana Loki, veya bulut sağlayıcılarının loglama servisleri (AWS CloudWatch Logs).
*   **Uyarılar (Alerting):** Kritik hatalar, yüksek kaynak kullanımı, servis kesintileri için uyarı mekanizmaları (örn: Prometheus Alertmanager, PagerDuty entegrasyonu).

## Yedekleme ve Kurtarma
*   **Veritabanı:** Düzenli otomatik yedeklemeler (günlük/saatlik). Point-in-Time Recovery (PITR) hedeflenmelidir.
*   **Yapılandırma Dosyaları:** Versiyon kontrol sisteminde saklanmalıdır.
*   **Felaket Kurtarma Planı (Disaster Recovery Plan):** Temel bir plan oluşturulmalıdır.

---
**Klasör: `00_PLANNING_AND_SETUP/`**

**`00_PLANNING_AND_SETUP/00_00_PLANNING_AND_SETUP_OVERVIEW.md`**
```markdown
# Aşama 0: Planlama ve Temel Kurulum - Genel Bakış

Bu aşama, projenin temellerinin atıldığı, gereksinimlerin netleştirildiği, mimari kararların verildiği ve geliştirme ortamının hazırlandığı kritik bir evredir. Başarılı bir proje için sağlam bir planlama şarttır.

## Bu Aşamanın Ana Hedefleri
*   Projenin kapsamını, MVP (Minimum Uygulanabilir Ürün) özelliklerini ve gelecek vizyonunu netleştirmek.
*   Teknik mimariyi, kullanılacak teknolojileri ve araçları belirlemek.
*   Temel güvenlik prensiplerini ve veri yönetimi stratejilerini oluşturmak.
*   Geliştirme, test ve CI/CD süreçleri için ortamları hazırlamak.
*   Proje yönetimi ve iletişim kanallarını belirlemek.

## Bu Aşamada Tamamlanacak Dokümanlar ve Görevler
1.  [Detaylı Gereksinim Analizi](00_01_DETAILED_REQUIREMENTS.md)
2.  [Mimari Tasarım](00_02_ARCHITECTURE_DESIGN.md)
3.  [Geliştirme Ortamının Kurulumu](00_03_DEV_ENVIRONMENT_SETUP.md)

## Beklenen Çıktılar
*   Kabul edilmiş bir gereksinim dokümanı.
*   Onaylanmış bir teknik mimari ve teknoloji yığını.
*   Tüm ekip üyeleri için hazır ve tutarlı bir geliştirme ortamı.
*   Proje için versiyon kontrol sistemi (Git repository) kurulumu.
