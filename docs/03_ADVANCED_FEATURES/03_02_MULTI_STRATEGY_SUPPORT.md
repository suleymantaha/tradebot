# Aşama 3: İleri Seviye Özellikler

## Görev: 03_02_MULTI_STRATEGY_SUPPORT - Çoklu Strateji Desteği / Strateji Oluşturucu

**Amaç:** Platforma, mevcut EMA Cross + RSI stratejisine ek olarak farklı ticaret stratejileri eklemek veya kullanıcıların belirli yapı bloklarını kullanarak kendi basit stratejilerini (görsel veya form tabanlı bir arayüzle) oluşturmalarına imkan tanımak.

**Kapsam / Yapılacaklar:**

1. **Strateji Abstraksiyon Katmanı (Backend):**
    - [ ] Her bir stratejinin ortak bir arayüzü (interface) veya base class'ı (`BaseStrategy`) implemente etmesi sağlanacak.
        - Örnek metodlar: `__init__(params, api_client, state)`, `check_signals()`, `manage_position()`, `get_required_parameters()`.
    - [ ] Mevcut EMA Cross + RSI stratejisi bu base class'tan türetilecek.
    - [ ] Yeni stratejiler (örn: MACD Stratejisi, Bollinger Bands Stratejisi, Ichimoku Cloud Stratejisi) bu arayüze uygun olarak geliştirilecek.
2. **Yeni Hazır Stratejiler Ekleme:**
    - [ ] Popüler ve anlaşılır birkaç yeni strateji seçilip implemente edilecek.
    - [ ] Her yeni strateji için gerekli parametreler tanımlanacak.
3. **Strateji Seçimi (Frontend):**
    - [ ] Bot oluşturma/düzenleme formunda, kullanıcının mevcut stratejiler arasından seçim yapabileceği bir dropdown veya liste eklenecek.
    - [ ] Seçilen stratejiye göre formdaki "Strateji Parametreleri" bölümü dinamik olarak değişecek ve o stratejiye ait parametreleri gösterecek.
4. **(Opsiyonel - Daha İleri Seviye) Basit Strateji Oluşturucu:**
    - [ ] **Kural Tabanlı Arayüz (Frontend):**
        - Kullanıcının "Eğer [Koşul1] VE/VEYA [Koşul2] ise AL/SAT" gibi kurallar tanımlayabileceği bir arayüz.
        - Koşullar:
            - İndikatör Karşılaştırmaları (örn: EMA(kısa) > EMA(uzun), RSI < 30)
            - Fiyat Karşılaştırmaları (örn: Fiyat > Önceki Mum Kapanışı)
        - Temel indikatörler (EMA, SMA, RSI, MACD, BB) ve bunların parametreleri kullanıcı tarafından ayarlanabilir olmalı.
    - [ ] **Backend Mantığı:**
        - Kullanıcının oluşturduğu bu kuralları yorumlayıp, sinyal üretecek bir "Meta Strateji" motoru.
        - Bu, mevcut strateji çekirdeğinin daha genel bir versiyonu olabilir.
5. **Veritabanı Değişiklikleri:**
    - [ ] `BotConfig` modeline `strategy_type` (String, örn: "ema_cross_rsi", "macd_strategy") alanı eklenecek.
    - [ ] Stratejiye özel parametreler `BotConfig` içinde JSONB bir alanda (`strategy_params`) veya strateji tipine göre ayrı sütunlarda saklanabilir. JSONB daha esnek olacaktır.
6. **API Değişiklikleri:**
    - [ ] Bot oluşturma/güncelleme endpoint'leri `strategy_type` ve `strategy_params` alacak şekilde güncellenecek.
7. **Backtesting Entegrasyonu:**
    - [ ] [Backtesting Modülü](03_01_BACKTESTING_MODULE.md) de farklı stratejileri ve oluşturulan özel stratejileri test edebilmeli.
8. **Testler:**
    - [ ] Her yeni stratejinin doğru çalıştığını (sinyal üretme, pozisyon yönetimi) test et.
    - [ ] Strateji seçimi ve parametrelerin dinamik değişiminin frontend'de doğru çalıştığını test et.
    - [ ] (Strateji oluşturucu varsa) Oluşturulan kuralların doğru yorumlanıp sinyal ürettiğini test et.

**Teknik Detaylar:**
- Strateji parametrelerinin dinamik olarak formda gösterilmesi için frontend'de iyi bir state yönetimi ve bileşen yapısı gerekecek.
- Strateji oluşturucu, oldukça karmaşık bir özellik olabilir. MVP'si basit koşullarla başlayabilir.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Her yeni strateji, dikkatlice test edilmeli ve belgelenmelidir.
- Strateji oluşturucu, kullanıcıların çok karmaşık veya mantıksız kurallar oluşturmasına izin vermemeli (bazı kısıtlamalar gerekebilir).
- Kullanıcıların kendi stratejilerini paylaşması/kopyalaması sonraki bir özellik olabilir ([Sosyal Ticaret](03_03_SOCIAL_TRADING_FEATURES.md)).

**Bağımlılıklar:**
- [Strateji Çekirdeği](../01_MVP_DEVELOPMENT/01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
- [Bot Oluşturma Formu](../01_MVP_DEVELOPMENT/01_10_FRONTEND_BOT_CREATION_FORM.md)
- [Backtesting Modülü](03_01_BACKTESTING_MODULE.md) (entegrasyon için)