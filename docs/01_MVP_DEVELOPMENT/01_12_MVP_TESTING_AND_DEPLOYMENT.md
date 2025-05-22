# Aşama 1: MVP Geliştirme
## Görev: 01_12_MVP_TESTING_AND_DEPLOYMENT - MVP Testleri ve Temel Deployment

**Amaç:** Geliştirilen MVP (Minimum Uygulanabilir Ürün) sürümünün kapsamlı bir şekilde test edilmesi, hataların giderilmesi ve temel bir hazırlık (staging) veya üretim (production) ortamına deploy edilerek ilk kullanıcılarla buluşturulmaya hazır hale getirilmesi.

**Kapsam / Yapılacaklar:**
1.  **Birim Testleri (Unit Tests):**
    - [ ] Backend: FastAPI (`TestClient`), Pytest.
        *   Kullanıcı kimlik doğrulama fonksiyonları.
        *   API anahtarı şifreleme/çözme.
        *   Bot konfigürasyon servisleri (temel CRUD).
        *   Strateji sınıfının çekirdek mantığı (mock'lanmış Binance API ile).
    - [ ] Frontend: Jest, React Testing Library.
        *   Temel bileşenlerin render edilmesi (formlar, butonlar).
        *   Basit kullanıcı etkileşimleri (tıklama, veri girişi).
        *   State değişiklikleri.
2.  **Entegrasyon Testleri (Integration Tests):**
    - [ ] Backend API endpoint'lerinin uçtan uca test edilmesi (veritabanı etkileşimleri dahil).
        *   Kullanıcı kaydı -> API anahtarı ekleme -> Bot oluşturma -> Bot başlatma/durdurma.
    - [ ] Frontend ve Backend arasındaki API iletişiminin test edilmesi.
        *   Frontend formlarından gönderilen verilerin backend'e doğru ulaşıp işlemesi.
        *   Backend'den dönen verilerin frontend'de doğru gösterilmesi.
    - [ ] Celery görevlerinin temel entegrasyonu (bir görev tetiklenip, basit bir işlem yapıp yapmadığı).
3.  **Kullanıcı Kabul Testleri (UAT - User Acceptance Testing):**
    - [ ] [Detaylı Gereksinimler](_PARENT_DIR_/_PARENT_DIR_/00_PLANNING_AND_SETUP/00_01_DETAILED_REQUIREMENTS.md) dokümanındaki MVP özelliklerinin tamamının manuel olarak test edilmesi.
    - [ ] Gerçek bir Binance testnet hesabı veya çok düşük miktarlarla canlı hesap kullanılarak botların alım-satım yapıp yapmadığının kontrolü.
    - [ ] Farklı kullanıcı senaryolarının (yeni kullanıcı, mevcut kullanıcı, hatalı veri girişi vb.) denenmesi.
    - [ ] Tarayıcı uyumluluk testleri (Chrome, Firefox, Edge - temel seviyede).
    - [ ] Mobil görünüm testleri (responsive design).
4.  **Performans ve Yük Testleri (Temel Seviye MVP için):**
    - [ ] Birkaç eş zamanlı kullanıcının sistemi yavaşlatıp yavaşlatmadığına dair basit gözlemler. (Detaylı testler MVP sonrası).
5.  **Güvenlik Testleri (Temel Seviye MVP için):**
    - [ ] OWASP Top 10'a karşı temel kontroller (elle veya basit tarama araçlarıyla).
    - [ ] API anahtarlarının güvenli saklandığının teyidi.
    - [ ] Yetkilendirme kontrollerinin çalıştığının teyidi (bir kullanıcı başkasının botuna erişememeli).
6.  **Hata Düzeltme (Bug Fixing):**
    - [ ] Testler sırasında bulunan hataların önceliklendirilerek giderilmesi.
7.  **Hazırlık (Staging) Ortamının Kurulumu:**
    - [ ] Üretime benzer bir ortamın Docker Compose veya basit bir VPS üzerinde kurulması.
    - [ ] Tüm servislerin (backend, frontend, veritabanı, redis, celery worker) bu ortamda çalışır hale getirilmesi.
8.  **Deployment Pratiği:**
    - [ ] Uygulamanın hazırlık ortamına deploy edilmesi.
    - [ ] `.env` dosyalarının ve diğer yapılandırmaların doğru ayarlandığından emin olunması.
    - [ ] Logların kontrol edilmesi.
9.  **Dokümantasyon Güncellemesi:**
    - [ ] Test sonuçları ve bilinen sorunlar (varsa) dokümante edilmeli.
    - [ ] Temel deployment adımları not edilmeli.
10. **(Opsiyonel) Üretim Ortamına İlk Deployment:**
    - [ ] Eğer hazırlık ortamı stabil ise, çok sınırlı bir kullanıcı kitlesi için üretim ortamına deploy edilebilir.
    - [ ] Üretim için Nginx yapılandırması (SSL, reverse proxy) yapılmalı.
    - [ ] Veritabanı yedekleme stratejisi düşünülmeli.

**Teknik Detaylar:**
*   Test verileri oluşturulmalı (hem geçerli hem geçersiz senaryolar için).
*   CI/CD pijaması MVP için tam otomatik olmayabilir, ancak temel script'ler hazırlanabilir.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   Test aşaması aceleye getirilmemelidir. Özellikle finansal işlemler yapan bir uygulamada hataların maliyeti yüksek olabilir.
*   Binance testnet API'si, canlı API ile %100 aynı davranmayabilir. Bazı limitler veya özellikler farklılık gösterebilir.
*   Deployment süreci ilk başta manuel olabilir, ancak otomatize edilmesi hedeflenmelidir.
*   Gizli bilgilerin (production .env dosyaları, SSL sertifikaları) güvenli bir şekilde yönetilmesi kritiktir.

**Bağımlılıklar:**
*   MVP kapsamındaki tüm geliştirme görevlerinin tamamlanmış olması.
*   [Deployment Stratejisi](_PARENT_DIR_/_PARENT_DIR_/DEPLOYMENT_STRATEGY.md) dokümanındaki temel prensipler.
