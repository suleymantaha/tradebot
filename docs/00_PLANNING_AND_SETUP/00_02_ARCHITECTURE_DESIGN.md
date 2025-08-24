# Aşama 0: Planlama ve Temel Kurulum

## Görev: 00_02_ARCHITECTURE_DESIGN - Mimari Tasarım

**Amaç:** Projenin genel sistem mimarisini, ana bileşenlerini, aralarındaki etkileşimleri ve veri akışını tanımlamak. Bu, geliştirme sürecine rehberlik edecek ve tutarlı bir yapı sağlayacaktır.

**Kapsam / Ana Başlıklar:**

1. **Genel Mimari Yaklaşımı:**
    * **Katmanlı Mimari (Layered Architecture):**
        * Sunum Katmanı (Frontend - React)
        * Uygulama Katmanı (Backend - FastAPI: API Endpointleri, Servisler)
        * İş Mantığı Katmanı (Strateji Motoru, Bot Yönetimi)
        * Veri Erişim Katmanı (SQLAlchemy ORM, Veritabanı)
    * **Asenkron İşlemler:** Celery ve RabbitMQ/Redis ile uzun süren görevlerin (bot operasyonları, bildirimler) yönetimi.
2. **Ana Bileşenler:**
    * **Web Sunucusu (Nginx):** Reverse proxy, SSL sonlandırma, statik dosya sunumu.
    * **API Sunucusu (FastAPI):** Kullanıcı isteklerini işler, iş mantığını çağırır, veritabanı ile etkileşir.
    * **Frontend Uygulaması (React):** Kullanıcı arayüzünü oluşturur, API ile etkileşir.
    * **Celery Workers:** Arka planda bot stratejilerini periyodik olarak çalıştırır, Binance API ile etkileşir.
    * **Mesaj Kuyruğu (RabbitMQ/Redis):** API sunucusu ve Celery worker'ları arasında görevleri iletir.
    * **Veritabanı (PostgreSQL):** Kullanıcı bilgileri, bot konfigürasyonları, işlem geçmişi, bot durumları gibi kalıcı verileri saklar.
    * **Cache (Redis):** Sık erişilen verileri, oturum bilgilerini önbelleğe alır.
3. **Veri Akış Şemaları (Örnekler):**
    * Kullanıcı Kaydı/Girişi
    * Bot Oluşturma ve Başlatma
    * Botun Periyodik Çalışması ve İşlem Yapması
    * Verilerin Gösterge Panelinde Gösterilmesi
4. **Veritabanı Tasarımı (Genel Bakış):**
    * Ana tablolar ve ilişkileri (Detaylar için [DATABASE_RELATIONS.md](_PARENT_DIR_/_PARENT_DIR_/DOCS/DATABASE_RELATIONS.md)).
    * Kullanıcılar (Users)
    * Bot Konfigürasyonları (BotConfigs)
    * Bot Durumları (BotStates) - Her botun `in_position`, `entry_price` gibi dinamik bilgilerini saklamak için.
    * İşlem Geçmişi (Trades)
    * API Anahtarları (ApiKeys) - Kullanıcılara ait, şifrelenmiş.
5. **API Tasarımı (Genel Bakış):**
    * RESTful prensiplerine uygun.
    * Ana kaynaklar: `/users`, `/auth`, `/bots`, `/trades`.
    * Versiyonlama stratejisi (örn: `/api/v1/...`).
    * Detaylar için [API_ENDPOINTS.md](_PARENT_DIR_/_PARENT_DIR_/DOCS/API_ENDPOINTS.md).
6. **Güvenlik Mimarisi:**
    * [SECURITY_GUIDELINES.md](_PARENT_DIR_/_PARENT_DIR_/SECURITY_GUIDELINES.md) referans alınacak.
    * API anahtarı şifreleme ve güvenli saklama.
    * Yetkilendirme ve kimlik doğrulama akışları.
7. **Ölçeklenebilirlik ve Performans:**
    * API sunucusu ve Celery worker'ları yatay olarak ölçeklenebilir (birden fazla instance çalıştırılabilir).
    * Veritabanı okuma replikaları (read replicas) ileride düşünülebilir.
    * Caching stratejileri.

**Teknik Detaylar:**

* Monolitik başlangıç, ihtiyaç halinde mikroservislere geçiş planlanabilir. FastAPI'nin modüler yapısı buna uygundur.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**

* Başlangıçta mimariyi aşırı karmaşık hale getirmemek önemlidir. MVP odaklı bir yaklaşımla başlayıp, ihtiyaç duyuldukça evrimleştirilmelidir.
* Bileşenler arasındaki iletişim arayüzleri (API'ler, mesaj formatları) net bir şekilde tanımlanmalıdır.
* Binance API ile etkileşimde hata yönetimi ve yeniden deneme mekanizmaları mimaride düşünülmelidir.
