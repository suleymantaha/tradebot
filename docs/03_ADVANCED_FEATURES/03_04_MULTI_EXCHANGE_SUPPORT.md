# Aşama 3: İleri Seviye Özellikler
## Görev: 03_04_MULTI_EXCHANGE_SUPPORT - Çoklu Borsa Desteği (Opsiyonel)

**Amaç:** Platformun sadece Binance ile değil, Kraken, Coinbase Pro, KuCoin gibi diğer popüler kripto para borsalarıyla da entegre olmasını sağlayarak kullanıcı tabanını genişletmek ve daha fazla esneklik sunmak.

**Kapsam / Yapılacaklar:**
1.  **Borsa Abstraksiyon Katmanı (Backend):**
    - [ ] Farklı borsaların API'leriyle etkileşim kurmak için ortak bir arayüz (interface) veya base class (`BaseExchangeAPI`) tanımlanacak.
    - [ ] Bu arayüz, temel borsa işlevlerini (fiyat çekme, bakiye sorgulama, emir verme, emir durumunu kontrol etme vb.) standartlaştıracak metodlara sahip olmalı.
    - [ ] Mevcut Binance API entegrasyonu bu base class'tan türetilecek veya bu arayüze uygun hale getirilecek.
    - [ ] Her yeni borsa için bu arayüzü implemente eden ayrı bir sınıf/modül geliştirilecek (örn: `KrakenAPI`, `CoinbaseProAPI`).
        *   Her borsa API'sinin kendine özgü istek formatları, kimlik doğrulama yöntemleri, rate limitleri ve hata kodları olduğu için bu, önemli bir geliştirme çabası gerektirir. `ccxt` gibi birleşik borsa API kütüphanesi bu süreci büyük ölçüde basitleştirebilir.
2.  **`ccxt` Kütüphanesi Entegrasyonu (Şiddetle Tavsiye Edilir):**
    - [ ] `ccxt` kütüphanesi, 100'den fazla borsayı destekleyen standart bir API sağlar. Bu kütüphaneyi kullanmak, her borsa için ayrı ayrı API istemcisi yazma yükünü ortadan kaldırır.
    - [ ] Borsa abstraksiyon katmanı, `ccxt`'nin sağladığı fonksiyonlar etrafında bir sarmalayıcı (wrapper) olabilir.
3.  **Kullanıcı Arayüzü (Frontend):**
    - [ ] API anahtarı ekleme sayfasında borsa seçimi (dropdown).
    - [ ] Bot oluşturma/düzenleme formunda, seçilen borsaya göre geçerli sembollerin ve işlem çiftlerinin listelenmesi (veya kullanıcının girmesi).
    - [ ] Dashboard ve raporlama kısımlarında, farklı borsalardaki botların ve işlemlerin ayırt edilebilir şekilde gösterilmesi.
4.  **Veritabanı Değişiklikleri:**
    - [ ] `ApiKey` modeline `exchange_name` (String, örn: "binance", "kraken") alanı eklenecek.
    - [ ] `BotConfig` modeline `exchange_name` alanı eklenebilir (veya API anahtarından türetilebilir).
    - [ ] Sembol formatları borsadan borsaya değişebilir (örn: "BTC/USDT" vs "XBTUSDT"). Bu tutarlılık sağlanmalı.
5.  **Strateji Motoru ve Bot Çalıştırma Mantığı:**
    - [ ] Strateji motoru ve bot çalıştırma mantığı, seçilen borsaya uygun API istemcisini (veya `ccxt` üzerinden ilgili borsayı) kullanacak şekilde güncellenmeli.
    - [ ] Emir miktarı ve fiyat hassasiyetleri (precision) borsaya göre değişir. Bunlar dinamik olarak çekilmeli veya yapılandırılmalı.
6.  **Testler:**
    - [ ] Her yeni eklenen borsa için API entegrasyonunun (fiyat çekme, emir verme vb.) testnet veya çok küçük miktarlarla canlı hesaplarda kapsamlı bir şekilde test edilmesi.
    - [ ] Farklı borsalardaki botların UI'da doğru şekilde yönetilip gösterildiğini test et.
    - [ ] `ccxt` kullanılıyorsa, kütüphanenin güncellemeleri ve olası bug'ları takip edilmeli.

**Teknik Detaylar:**
*   `ccxt` kütüphanesi, bu görevin karmaşıklığını önemli ölçüde azaltır. Ancak yine de her borsanın kendine özgü davranışları (rate limitler, emir tipleri, hata mesajları) olabileceği için dikkatli entegrasyon gereklidir.
*   Farklı borsaların API anahtarı formatları ve güvenlik gereksinimleri farklıdır.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   Her yeni borsa eklemek, test ve bakım yükünü artırır.
*   Borsaların API'leri zaman zaman değişebilir, bu da platformda güncelleme gerektirebilir.
*   Kullanıcılara, her borsanın kendi komisyon oranları, işlem limitleri ve kuralları olduğu konusunda bilgi verilmeli.
*   Tüm borsalarda tüm stratejilerin (veya indikatörlerin) aynı şekilde çalışacağının garantisi yoktur (veri kalitesi, likidite farklılıkları).

**Bağımlılıklar:**
*   Mevcut Binance API entegrasyonu.
*   [API Anahtarı Yönetimi](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_11_FRONTEND_API_KEY_MANAGEMENT.md) (arayüz değişiklikleri için).
*   [Bot Oluşturma Formu](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_10_FRONTEND_BOT_CREATION_FORM.md) (arayüz değişiklikleri için).
