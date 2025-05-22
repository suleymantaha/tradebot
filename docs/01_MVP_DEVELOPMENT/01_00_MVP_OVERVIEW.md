# Aşama 1: MVP (Minimum Uygulanabilir Ürün) Geliştirme - Genel Bakış

Bu aşama, projenin temel işlevselliğe sahip, kullanıcıların ilk sürümde deneyimleyebileceği çalışan bir ürünün (MVP) geliştirilmesine odaklanır. Amaç, hızlı bir şekilde pazara çıkmak, kullanıcı geri bildirimi toplamak ve projenin gelecekteki yönünü belirlemektir.

## Bu Aşamanın Ana Hedefleri
*   [Detaylı Gereksinimler](_PARENT_DIR_/_PARENT_DIR_/00_PLANNING_AND_SETUP/00_01_DETAILED_REQUIREMENTS.md) dokümanında tanımlanan MVP özelliklerinin tamamını implemente etmek.
*   Güvenli ve stabil bir kullanıcı kimlik doğrulama sistemi oluşturmak.
*   Kullanıcıların Binance API anahtarlarını güvenli bir şekilde kaydedip yönetebilmesini sağlamak.
*   Belirlenen tek bir stratejiye dayalı olarak bot oluşturma, başlatma, durdurma ve temel konfigürasyonunu yapabilme imkanı sunmak.
*   Botların arka planda otonom olarak çalışmasını ve Binance üzerinde işlem yapmasını sağlamak.
*   Kullanıcılara botlarının durumu ve temel işlem geçmişi hakkında bilgi sunan bir gösterge paneli oluşturmak.
*   Temel testleri (birim, entegrasyon, kullanıcı kabul) yapmak.

## Bu Aşamada Tamamlanacak Ana Görevler
1.  [Backend: Kullanıcı Kimlik Doğrulama](01_01_BACKEND_USER_AUTH.md)
2.  [Backend: Binance API Entegrasyonu (Temel)](01_02_BACKEND_BINANCE_API_INTEGRATION.md)
3.  [Backend: Strateji Çekirdeğinin Yeniden Düzenlenmesi](01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
4.  [Backend: Bot Konfigürasyonu CRUD İşlemleri](01_04_BACKEND_BOT_CONFIG_CRUD.md)
5.  [Backend: Celery Worker Kurulumu](01_05_BACKEND_CELERY_WORKER_SETUP.md)
6.  [Backend: Bot Çalıştırma Mantığı (Celery Task)](01_06_BACKEND_BOT_EXECUTION_LOGIC.md)
7.  [Backend: Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md)
8.  [Frontend: Temel Layout ve Kimlik Doğrulama Sayfaları](01_08_FRONTEND_BASIC_LAYOUT_AUTH_PAGES.md)
9.  [Frontend: Gösterge Paneli Sayfası](01_09_FRONTEND_DASHBOARD_PAGE.md)
10. [Frontend: Bot Oluşturma Formu](01_10_FRONTEND_BOT_CREATION_FORM.md)
11. [Frontend: API Anahtarı Yönetimi Sayfası](01_11_FRONTEND_API_KEY_MANAGEMENT.md)
12. [MVP Testleri ve Temel Deployment](01_12_MVP_TESTING_AND_DEPLOYMENT.md)

## Beklenen Çıktılar
*   Fonksiyonel bir MVP web uygulaması.
*   Kullanıcıların kaydolup giriş yapabildiği, API anahtarlarını ekleyebildiği, bot oluşturup çalıştırabildiği ve temel performansını görebildiği bir sistem.
*   Projenin bir sonraki aşaması için temel oluşturacak sağlam bir kod tabanı.
