# Aşama 1: MVP Geliştirme

## Görev: 01_10_FRONTEND_BOT_CREATION_FORM - Bot Oluşturma Formu

**Amaç:** Kullanıcıların yeni ticaret botları oluşturabilmesi için gerekli tüm strateji parametrelerini girebilecekleri bir form sayfası geliştirmek.

**Kapsam / Yapılacaklar:**

1. **Bot Oluşturma Sayfası Bileşeni (`CreateBotPage.jsx` veya Modal):**
    - [ ] Bu sayfa/modal, kullanıcıların yeni bir bot yapılandırmasını girmesini sağlar.
    - [ ] Korumalı bir rota olmalı.
2. **Form Alanları:**
    - [ ] **Temel Bilgiler:**
        - Bot Adı (örn: "ETH Scalper") - `name` (String)
        - Sembol (örn: "BTC/USDT", "ETH/BTC") - `symbol` (String, kullanıcı elle girebilir veya seçilebilir liste olabilir)
        - Timeframe (örn: "1m", "5m", "1h", "4h") - `timeframe` (Dropdown/Select)
    - [ ] **Risk Yönetimi Parametreleri:**
        - (Opsiyonel MVP) Başlangıç Sermayesi (Bilgi amaçlı) - `initial_capital` (Number)
        - Günlük Kar Hedefi (%) - `daily_target_perc` (Number)
        - Maksimum Günlük Kayıp (%) - `max_daily_loss_perc` (Number)
        - Pozisyon Büyüklüğü (% veya Sabit Miktar) - `position_size_perc` veya `position_size_fixed` (Number, kullanıcı birini seçebilmeli)
        - Maksimum Günlük İşlem Sayısı - `max_daily_trades` (Number)
    - [ ] **İşlem Parametreleri:**
        - Stop Loss (%) - `stop_loss_perc` (Number)
        - Take Profit (%) - `take_profit_perc` (Number)
        - Trailing Stop (%) - `trailing_stop_perc` (Number, 0 ise pasif)
        - Trailing Stop Aktif mi? - `trailing_stop_active` (Checkbox)
    - [ ] **Stratejiye Özel Parametreler (EMA Cross + RSI):**
        - Hızlı EMA Periyodu - `ema_fast` (Number)
        - Yavaş EMA Periyodu - `ema_slow` (Number)
        - RSI Periyodu - `rsi_period` (Number)
        - RSI Aşırı Satım Seviyesi - `rsi_oversold` (Number)
        - RSI Aşırı Alım Seviyesi - `rsi_overbought` (Number)
    - [ ] **Diğer Ayarlar (MVP'de kullanıcıdan alınmayabilir, varsayılan kullanılabilir):**
        - Kontrol Aralığı (saniye) - `check_interval_seconds` (Number, varsayılan 60)
        - Maker Fee, Taker Fee, Slippage (Varsayılan değerler kullanılabilir, ileride ayarlanabilir)
3. **Form Yönetimi ve Validasyon:**
    - [ ] `react-hook-form` veya benzeri bir kütüphane kullanılması önerilir.
    - [ ] Zorunlu alanların kontrolü.
    - [ ] Sayısal alanların geçerli sayılar olup olmadığının kontrolü (min/max değerler).
    - [ ] Sembol formatı (örn: XXX/YYY).
4. **Form Gönderimi:**
    - [ ] "Bot Oluştur" butonu.
    - [ ] Form verileri toplanarak `POST /api/v1/bots` endpoint'ine gönderilecek.
    - [ ] Başarılı oluşturma sonrası kullanıcıyı dashboard'a yönlendirme ve başarı mesajı gösterme.
    - [ ] Hata durumunda form üzerinde veya genel bir alanda hata mesajları gösterme.
5. **Kullanıcı Deneyimi:**
    - [ ] Alanlar için açıklayıcı etiketler ve tooltip'ler (yardımcı bilgiler).
    - [ ] Mantıksal gruplama (örn: Risk Yönetimi, Strateji Parametreleri).

**UI Elementleri:**
- Input alanları (text, number).
- Dropdown/Select (timeframe için).
- Checkbox (trailing stop aktifliği için).
- Butonlar (Oluştur, İptal).
- Hata mesajları.
- Tooltips.

**Teknik Detaylar:**
- Form state'i `react-hook-form` ile yönetilecek.
- API'ye gönderilecek JSON payload'ı, backend `BotConfigCreate` şemasına uygun olmalı.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Çok fazla parametre olduğu için formun kullanıcı dostu olması önemlidir. Adım adım form (wizard) veya akordiyon menüler MVP sonrası düşünülebilir.
- Varsayılan değerler (placeholders veya gerçek default'lar) kullanıcıya yardımcı olabilir.
- Sembol ve timeframe seçimi için Binance'ten geçerli pariteleri ve zaman aralıklarını çekip dropdown'da sunmak MVP sonrası bir iyileştirme olabilir. MVP'de kullanıcı manuel girebilir.

**Bağımlılıklar:**
- [Backend: Bot Konfigürasyonu CRUD İşlemleri](01_04_BACKEND_BOT_CONFIG_CRUD.md) (Bot oluşturma API'si).
- [Temel Layout ve Kimlik Doğrulama Sayfaları](01_08_FRONTEND_BASIC_LAYOUT_AUTH_PAGES.md).
