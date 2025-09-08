# Aşama 2: Özellik Geliştirmeleri

## Görev: 02_04_NOTIFICATION_SYSTEM - Bildirim Sistemi (E-posta/Webhook)

**Amaç:** Kullanıcıları, botlarıyla ilgili önemli olaylardan (örn: büyük karlar/zararlar, bot hataları, önemli işlemler) haberdar etmek için bir bildirim sistemi kurmak. Başlangıçta e-posta bildirimleri ve/veya basit webhook'lar hedeflenebilir.

**Kapsam / Yapılacaklar:**

1. **Bildirim Türlerinin Belirlenmesi:**
    - [ ] İşlem yapıldı (Alım/Satım).
    - [ ] Stop-loss tetiklendi.
    - [ ] Take-profit tetiklendi.
    - [ ] Günlük kar hedefine ulaşıldı.
    - [ ] Günlük zarar limitine ulaşıldı, bot durduruldu.
    - [ ] Bot bir hata nedeniyle durdu.
    - [ ] API anahtarı geçersiz oldu.
2. **Kullanıcı Bildirim Ayarları:**
    - [ ] **Backend:**
        - `UserNotificationPreference` modeli (user_id, notification_type, email_enabled, webhook_enabled, webhook_url).
        - Kullanıcının hangi bildirim türleri için hangi kanallardan (e-posta, webhook) bildirim almak istediğini ayarlayabileceği API endpoint'leri.
    - [ ] **Frontend:**
        - Kullanıcı profilinde veya ayarlar sayfasında bildirim tercihlerini yönetebileceği bir arayüz.
3. **E-posta Bildirimleri:**
    - [ ] **Backend:**
        - E-posta gönderme servisi entegrasyonu (örn: SendGrid, Mailgun, veya SMTP ile kendi sunucunuzdan).
        - `fastapi-mail` gibi bir kütüphane kullanılabilir.
        - E-posta şablonları (HTML/text) oluşturulması.
        - Belirlenen olaylar gerçekleştiğinde (örn: `run_bot_strategy_cycle` içinde veya ayrı bir Celery görevi ile) e-posta gönderme mantığı.
4. **Webhook Bildirimleri (Basit):**
    - [ ] **Backend:**
        - Kullanıcının tanımladığı bir URL'ye, belirlenen olaylar gerçekleştiğinde JSON payload'ı ile POST isteği gönderme mantığı.
        - Webhook gönderme işlemleri de asenkron (Celery görevi) olmalı.
        - Temel güvenlik: Webhook URL'lerinin HTTPS olması zorunlu tutulabilir. İmzalama (signing) MVP+ için düşünülebilir.
5. **Bildirim Tetikleme Mekanizması:**
    - [ ] Strateji motoru veya bot yönetim servisleri, bildirim gerektiren bir olay oluştuğunda, bu olayı ve ilgili verileri (kullanıcı id, bot id, olay tipi, detaylar) bir Celery görevine iletecek.
    - [ ] Bu Celery görevi, kullanıcının tercihlerine göre e-posta veya webhook gönderecek.
6. **Testler:**
    - [ ] Backend: E-posta ve webhook'ların doğru formatta ve doğru zamanda gönderildiğini test et. Kullanıcı tercihlerinin dikkate alındığını test et.
    - [ ] Frontend: Bildirim ayarları formunun doğru çalışıp API'ye veri gönderdiğini test et.

**Teknik Detaylar:**
- E-posta ve webhook gönderme işlemleri, ana işlem akışını (bot çalışması) bloke etmemek için kesinlikle asenkron (Celery) olmalıdır.
- E-posta şablonları için Jinja2 gibi bir şablon motoru kullanılabilir.
- Webhook payload'ları standart bir yapıda olmalı.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Kullanıcılara çok fazla bildirim göndermek spam olarak algılanabilir. Bildirim sıklığı ve türleri iyi ayarlanmalı.
- E-posta gönderim servislerinin limitleri ve maliyetleri göz önünde bulundurulmalı.
- Webhook'ların güvenliği (özellikle payload içeriği ve hedef URL'nin doğrulanması) önemlidir. İmzalama, API anahtarı gibi yöntemler ileride eklenebilir.
- Telegram, Discord gibi platformlara bildirim MVP sonrası düşünülebilir.

**Bağımlılıklar:**
- [Backend: Bot Çalıştırma Mantığı](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_06_BACKEND_BOT_EXECUTION_LOGIC.md) (Bildirimleri tetikleyecek olaylar burada oluşur).
- [Celery Worker Kurulumu](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_05_BACKEND_CELERY_WORKER_SETUP.md)
