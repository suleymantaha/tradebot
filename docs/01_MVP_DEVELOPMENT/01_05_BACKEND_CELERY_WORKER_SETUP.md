# Aşama 1: MVP Geliştirme
## Görev: 01_05_BACKEND_CELERY_WORKER_SETUP - Celery Worker Kurulumu

**Amaç:** Arka planda uzun süren ve periyodik görevleri (özellikle ticaret botlarının çalıştırılması) yönetecek Celery ve mesaj kuyruğu (RabbitMQ/Redis) altyapısını kurmak ve yapılandırmak.

**Kapsam / Yapılacaklar:**
- [ ] **Celery Kurulumu ve Yapılandırması:**
    - [ ] `celery` ve mesaj kuyruğu istemci kütüphanesinin (`redis` veya `amqp` - RabbitMQ için) backend projesine eklenmesi.
    - [ ] Celery uygulama örneğinin (`Celery` app instance) oluşturulması ve yapılandırılması.
        *   Broker URL (örn: `redis://localhost:6379/0` veya `amqp://guest:guest@localhost:5672//`)
        *   Result backend URL (eğer görev sonuçları saklanacaksa, örn: `redis://localhost:6379/0` veya veritabanı)
        *   Görevlerin (tasks) otomatik olarak bulunacağı modüllerin (`include` veya `autodiscover_tasks`) belirtilmesi.
        *   Görev serileştirme (task serialization) formatının belirlenmesi (örn: json).
- [ ] **Mesaj Kuyruğu Kurulumu (Docker Compose ile):**
    - [ ] `docker-compose.yml` dosyasına RabbitMQ veya Redis servisi eklenmesi.
- [ ] **Temel Bir Celery Görevi Oluşturma:**
    - [ ] Basit bir test görevi (`@app.task` decorator'ı ile) tanımlanıp, API endpoint'i üzerinden tetiklenerek çalışıp çalışmadığının kontrol edilmesi.
- [ ] **Celery Worker Servisi (Docker Compose ile):**
    - [ ] `docker-compose.yml` dosyasına Celery worker'larını çalıştıracak bir servis eklenmesi.
        *   Komut: `celery -A your_project.celery_app worker -l info`
        *   Backend kodu ve bağımlılıkları içeren Docker imajını kullanmalı.
        *   Mesaj kuyruğuna bağlanabilmeli.
- [ ] **Celery Beat Servisi (Periyodik Görevler İçin - Opsiyonel MVP, ama planlanmalı):**
    - [ ] Eğer botlar sabit aralıklarla (örn: her dakika) merkezi bir zamanlayıcı ile tetiklenecekse Celery Beat servisi kurulmalı.
    - [ ] `docker-compose.yml` dosyasına Celery Beat servisi eklenmesi.
        *   Komut: `celery -A your_project.celery_app beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler` (Eğer Django kullanılıyorsa veya veritabanı tabanlı schedule için) veya basit bir schedule.
    - [ ] Alternatif olarak, her bot başlatıldığında kendi periyodik görevini kendisi oluşturabilir (dinamik periyodik görevler).
- [ ] **Flower (Celery İzleme Aracı - Opsiyonel):**
    - [ ] `docker-compose.yml` dosyasına Flower servisi eklenerek görevlerin durumu izlenebilir.
- [ ] **Yapılandırma Yönetimi:**
    - [ ] Celery ve mesaj kuyruğu bağlantı bilgileri `.env` dosyalarından okunmalı.
- [ ] **Loglama:**
    - [ ] Celery worker loglarının düzgün bir şekilde yapılandırılması.

**Teknik Detaylar:**
*   Broker seçimi: Redis, başlangıç için daha basit ve hızlı kurulabilir. RabbitMQ, daha karmaşık senaryolar ve daha yüksek güvenilirlik için tercih edilebilir. MVP için Redis yeterli olacaktır.
*   Her bir aktif bot için ayrı bir Celery görevi mi çalışacak, yoksa tek bir periyodik görev tüm aktif botları mı kontrol edecek? Bu, [Bot Çalıştırma Mantığı](01_06_BACKEND_BOT_EXECUTION_LOGIC.md) görevinde netleştirilecek. MVP için her botun kendi `check_interval`'ine göre dinamik olarak schedule edilmesi (örn: `apply_async` ile `countdown`) veya Celery Beat ile belirli aralıklarla bir "ana dispatch" görevinin çalıştırılması düşünülebilir.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   Mesaj kuyruğunun ve worker'ların doğru şekilde iletişim kurduğundan emin olunmalı.
*   Worker'ların kaynak kullanımı (CPU, bellek) izlenmeli.
*   Görevlerin idempotent olması (aynı görevin birden fazla kez çalıştırılmasının sorun yaratmaması) bazı senaryolarda önemli olabilir.
*   Hata durumunda görevlerin yeniden denenme (retry) politikaları belirlenmeli.

**Bağımlılıklar:**
*   [Geliştirme Ortamı Kurulumu](_PARENT_DIR_/_PARENT_DIR_/00_PLANNING_AND_SETUP/00_03_DEV_ENVIRONMENT_SETUP.md) (Docker Compose, Redis/RabbitMQ).
