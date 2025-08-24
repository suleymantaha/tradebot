# Aşama 1: MVP Geliştirme

## Görev: 01_03_BACKEND_STRATEGY_CORE_REFACTOR - Strateji Çekirdeğinin Yeniden Düzenlenmesi

**Amaç:** Mevcut Python ticaret stratejisi kodunu, platformun backend yapısına (özellikle Celery görevleri içinde çalışacak şekilde) entegre edilebilir, yapılandırılabilir ve yönetilebilir bir sınıf/modül haline getirmek.

**Kapsam / Yapılacaklar:**

- [ ] **Strateji Sınıfı Tasarımı (`TradingStrategy`):**
  - [ ] Mevcut strateji mantığını içeren bir Python sınıfı oluşturulacak.
  - [ ] `__init__` metodu:
    - Gerekli parametreleri (sembol, timeframe, EMA periyotları, RSI periyotları, SL/TP yüzdeleri, pozisyon büyüklüğü vb.) alacak.
    - Kullanıcının Binance API istemcisini (ayarlarıyla birlikte) alacak.
    - Gerekli teknik indikatör hesaplayıcılarını (örn: `pandas_ta`) başlatacak.
  - [ ] `fetch_data()` metodu: Belirli bir sembol ve timeframe için OHLCV verilerini Binance'ten çekecek.
  - [ ] `calculate_indicators()` metodu: Çekilen verilere göre EMA, RSI gibi gerekli indikatörleri hesaplayacak.
  - [ ] `check_signals()` metodu: Hesaplanan indikatörlere göre alım/satım sinyallerini üretecek.
  - [ ] `manage_position()` metodu: Mevcut pozisyonu (varsa) yönetecek (stop-loss, take-profit, trailing stop kontrolü).
  - [ ] `execute_trade()` metodu: Üretilen sinyale göre Binance üzerinde alım/satım emri gönderecek.
  - [ ] `run_cycle()` veya `process()` metodu: Yukarıdaki adımları (veri çekme, indikatör hesaplama, sinyal kontrolü, pozisyon yönetimi, işlem yapma) içeren ana çalışma döngüsü.
- [ ] **Durum Yönetimi (State Management):**
  - [ ] Strateji sınıfı, botun mevcut durumunu (pozisyonda mı, giriş fiyatı, SL fiyatı, TP fiyatı, trailing stop fiyatı vb.) kendi içinde tutacak. Bu durum, her döngüden sonra veya önemli olaylarda veritabanına kaydedilmek üzere dışarıya raporlanacak. (Mevcut `self.state_file` mantığı veritabanına taşınacak.)
- [ ] **Konfigürasyon:**
  - [ ] Strateji parametreleri (EMA uzunlukları, RSI seviyeleri vb.) dışarıdan (veritabanından gelen bot konfigürasyonu ile) ayarlanabilir olmalı.
- [ ] **Binance API Entegrasyonu:**
  - [ ] Strateji sınıfı, işlem yapmak ve hesap bilgilerini almak için şifresi çözülmüş ve yapılandırılmış bir Binance API istemcisi örneğini kullanacak.
- [ ] **Hata Yönetimi:**
  - [ ] Binance API hataları, veri çekme sorunları, hesaplama hataları gibi durumlar için uygun hata yakalama ve loglama mekanizmaları eklenecek.
- [ ] **Loglama:**
  - [ ] Stratejinin önemli adımları (sinyal üretimi, emir gönderme, hata durumları) için detaylı loglama.
- [ ] **Test Edilebilirlik:**
  - [ ] Strateji sınıfının birim testleri yazılabilecek şekilde modüler olması sağlanacak. Binance API çağrıları mock'lanabilir olmalı.

**Teknik Detaylar:**
- `pandas` ve `pandas_ta` (veya `TA-Lib`) kütüphaneleri teknik analiz için kullanılacak.
- Mevcut koddaki global değişkenler ve dosya tabanlı durum yönetimi ortadan kaldırılacak, sınıf tabanlı ve veritabanı odaklı bir yapıya geçilecek.
- Bu sınıf, her bir kullanıcı botu için ayrı bir örnek (instance) olarak Celery worker'ları tarafından çalıştırılacak.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Mevcut strateji mantığının doğru bir şekilde yeni sınıfa aktarılması önemlidir.
- Sınıfın, farklı konfigürasyonlarla (farklı semboller, timeframeler, parametreler) çalışabilmesi sağlanmalıdır.
- Performans: Veri çekme ve indikatör hesaplama adımları optimize edilmelidir.
- Strateji, Binance API'sinin gerektirdiği order parametrelerini (miktar hassasiyeti, fiyat hassasiyeti) dikkate almalıdır.

**Bağımlılıklar:**
- [Binance API Entegrasyonu (Temel)](01_02_BACKEND_BINANCE_API_INTEGRATION.md) (Stratejinin kullanacağı API istemcisi için).
