# Aşama 2: Özellik Geliştirmeleri
## Görev: 02_02_DETAILED_TRADE_HISTORY_LOGGING - Detaylı İşlem Geçmişi ve Loglama

**Amaç:** Kullanıcılara, botlarının gerçekleştirdiği işlemler hakkında daha detaylı bilgi sunmak ve botların çalışma adımlarına dair log kayıtlarını erişilebilir kılmak.

**Kapsam / Yapılacaklar:**
1.  **Detaylı İşlem Geçmişi (`Trades` Tablosu Genişletme):**
    - [ ] **Backend:**
        *   `Trade` modeline (ve veritabanı tablosuna) ek alanlar eklenebilir (eğer MVP'de yoksa veya daha detay gerekliyse):
            *   `strategy_signal_details` (JSONB/Text, örn: hangi indikatörler sinyali tetikledi)
            *   `slippage_amount` (Numeric)
            *   `entry_reason` / `exit_reason` (String, örn: "EMA Cross", "Stop Loss Hit", "Take Profit Hit", "Trailing Stop")
            *   `position_duration_seconds` (Integer, pozisyon kapanınca)
        *   Strateji motoru (`TradingStrategy`), bu detayları işlem yapıldığında `Trade` objesine dolduracak şekilde güncellenmeli.
    - [ ] **Frontend:**
        *   Kullanıcının işlem geçmişini görüntüleyebileceği ayrı bir sayfa veya dashboard'da daha detaylı bir bölüm.
        *   Her işlem için yukarıdaki ek bilgilerin gösterilmesi.
        *   Filtreleme (sembol, tarih aralığı, bot'a göre) ve sıralama özellikleri.
        *   İşlem geçmişini CSV olarak dışa aktarma seçeneği.
2.  **Bot Operasyon Logları:**
    - [ ] **Backend:**
        *   Yeni bir veritabanı tablosu: `BotActivityLog` (id, bot_config_id, user_id, timestamp, log_level (INFO, WARNING, ERROR), message, details (JSONB, opsiyonel)).
        *   Strateji motoru (`TradingStrategy`) ve Celery görevleri (`run_bot_strategy_cycle`) önemli olayları (veri çekme, indikatör hesaplama, sinyal algılama, emir gönderme denemesi, emir sonucu, hata oluşumu vb.) bu tabloya loglayacak.
        *   Log mesajları standart bir formatta olmalı.
    - [ ] **Frontend:**
        *   Her botun detay sayfasında veya ayrı bir log görüntüleme bölümünde, ilgili bot'a ait `BotActivityLog` kayıtlarının gösterilmesi.
        *   Filtreleme (log seviyesi, tarih aralığı) ve arama özellikleri.
        *   Logların gerçek zamanlıya yakın bir şekilde güncellenmesi (polling veya WebSocket ile - bu görevde polling yeterli).
3.  **Veritabanı Migration'ları:**
    - [ ] `Trade` tablosundaki değişiklikler ve yeni `BotActivityLog` tablosu için Alembic migration script'leri.
4.  **Testler:**
    - [ ] Backend: Ek işlem detaylarının ve bot loglarının doğru şekilde kaydedildiğini test et.
    - [ ] Frontend: Detaylı işlem geçmişi ve bot loglarının doğru görüntülendiğini, filtreleme ve sıralamanın çalıştığını test et.

**UI Elementleri:**
*   Detaylı tablolar (işlem geçmişi, loglar).
*   Filtreleme ve sıralama kontrolleri (dropdown, date picker, search input).
*   Dışa aktarma butonu.
*   Sayfalandırma (pagination) eğer kayıt sayısı çok fazlaysa.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   `BotActivityLog` tablosu zamanla çok büyüyebilir. Performans için uygun index'leme ve gerekirse log rotasyonu/arşivleme stratejileri düşünülmeli (uzun vadede).
*   Log mesajlarının kullanıcı için anlaşılır olması önemlidir, çok teknik jargonlardan kaçınılmalı veya açıklanmalı.
*   Hassas bilgilerin (API secret'ları gibi) loglara yazılmadığından emin olunmalı.

**Bağımlılıklar:**
*   [MVP İşlem Kayıtları](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_06_BACKEND_BOT_EXECUTION_LOGIC.md) (Trades tablosu temeli)
*   [Backend: Strateji Çekirdeği](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
