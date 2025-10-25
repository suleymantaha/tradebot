# Aşama 0: Planlama ve Temel Kurulum

## Görev: 00_01_DETAILED_REQUIREMENTS - Detaylı Gereksinim Analizi

**Amaç:** Projenin kapsamını, temel işlevlerini, kullanıcı beklentilerini ve başarı kriterlerini net bir şekilde tanımlamak. Bu doküman, MVP (Minimum Uygulanabilir Ürün) ve sonraki fazlar için yol haritası oluşturacaktır.

**Kapsam / Ana Başlıklar:**

1. **Proje Vizyonu ve Hedefleri:**
    * Projenin genel amacı nedir?
    * Hangi problemi çözmeyi hedefliyor?
    * Hedef kullanıcı kitlesi kimlerdir?
2. **MVP (Minimum Uygulanabilir Ürün) Özellikleri:**
    * **Kullanıcı Yönetimi:**
        * [ ] Kullanıcı kaydı (e-posta, şifre)
        * [ ] Kullanıcı girişi
        * [ ] Şifre sıfırlama (temel)
    * **Binance API Entegrasyonu:**
        * [ ] Kullanıcının API anahtarını (key & secret) güvenli bir şekilde girmesi ve saklanması
        * [ ] API anahtarı geçerlilik kontrolü
    * **Bot Yönetimi (Tek Strateji - Mevcut Strateji):**
        * [ ] Yeni bot oluşturma (sembol, timeframe, temel strateji parametreleri)
        * [ ] Botu başlatma / durdurma
        * [ ] Bot konfigürasyonunu kaydetme
        * [ ] Aktif botları listeleme
    * **Temel Strateji Parametreleri (Kullanıcı Tarafından Ayarlanabilir):**
        * [ ] `initial_capital` (kullanıcı için bilgi amaçlı, gerçek bakiye Binance'ten)
        * [ ] `daily_target` (%)
        * [ ] `max_daily_loss` (%)
        * [ ] `position_size` (botun her işlemde kullanacağı % veya sabit miktar)
        * [ ] `stop_loss` (%)
        * [ ] `take_profit` (%)
        * [ ] `trailing_stop` (%) ve `trailing_stop_active` (boolean)
        * [ ] `ema_fast`, `ema_slow`
        * [ ] `rsi_period`, `rsi_oversold`, `rsi_overbought`
        * [ ] `max_daily_trades`
    * **Temel Raporlama ve Gösterge Paneli:**
        * [ ] Kullanıcının toplam teorik P&L'i (gerçekleşen işlemlerden)
        * [ ] Aktif botların durumu (çalışıyor, durdu, hata)
        * [ ] Basit işlem geçmişi listesi (bot bazlı)
    * **Güvenlik:**
        * [ ] API anahtarlarının şifreli saklanması
        * [ ] HTTPS kullanımı
3. **MVP Sonrası Potansiyel Özellikler (Faz 2, Faz 3):**
    * Detaylı grafikler ve analitikler
    * Birden fazla strateji seçeneği
    * Backtesting modülü
    * Bildirim sistemi (e-posta, Telegram)
    * Gelişmiş risk yönetimi araçları (örn: partial take profits arayüzden ayarlanabilir)
    * Farklı borsalarla entegrasyon
    * Sosyal ticaret özellikleri
4. **Fonksiyonel Olmayan Gereksinimler:**
    * **Performans:** Ortalama sayfa yükleme süresi, bot tepki süresi.
    * **Güvenlik:** [SECURITY_GUIDELINES.md](../SECURITY_GUIDELINES.md) referans alınacak.
    * **Ölçeklenebilirlik:** Belirli sayıda eş zamanlı kullanıcı ve botu destekleyebilme.
    * **Kullanılabilirlik:** Sezgisel ve kullanıcı dostu arayüz.
    * **Güvenilirlik:** Botların 7/24 kesintisiz çalışması, hata toleransı.
5. **Kısıtlar:**
    * Sadece Binance borsası (MVP için).
    * Sadece spot piyasalar (MVP için).
    * Belirlenen teknik stack.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**

* MVP kapsamını çok geniş tutmamak, hızlı bir şekilde çalışan bir ürün ortaya çıkarmak önemlidir.
* Kullanıcı geri bildirimleri MVP sonrası geliştirmeler için kritik olacaktır.
* Binance API limitleri ve değişiklikleri takip edilmelidir.