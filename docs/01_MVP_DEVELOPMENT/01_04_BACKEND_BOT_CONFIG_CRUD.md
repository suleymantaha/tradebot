# Aşama 1: MVP Geliştirme

## Görev: 01_04_BACKEND_BOT_CONFIG_CRUD - Bot Konfigürasyonu CRUD İşlemleri

**Amaç:** Kullanıcıların ticaret botlarını oluşturmasını, mevcut botlarının konfigürasyonlarını görüntülemesini, güncellemesini ve silmesini sağlayacak API endpoint'lerini ve backend mantığını oluşturmak.

**Kapsam / Yapılacaklar:**

- [ ] **Veritabanı Modeli:**
  - [ ] `BotConfig` modeli (id, user_id (FK to User), name, symbol, timeframe, is_active, initial_capital, daily_target, max_daily_loss, position_size, maker_fee, taker_fee, slippage, stop_loss, take_profit, trailing_stop, trailing_stop_active, ema_fast, ema_slow, rsi_period, rsi_oversold, rsi_overbought, max_daily_trades, created_at, updated_at) SQLAlchemy ile tanımlanacak.
  - [ ] `BotState` modeli (id, bot_config_id (FK to BotConfig), in_position, entry_price, position_size_coins, trailing_stop_price, max_price_since_entry, take_profit_price, stop_loss_price, last_run_at, last_error, daily_pnl, daily_trades_count, status (running, stopped, error), last_updated) SQLAlchemy ile tanımlanacak. Bu, stratejinin dinamik durumunu saklar.
- [ ] **Pydantic Şemaları:**
  - [ ] `BotConfigCreate` (bot oluşturmak için gerekli tüm parametreler)
  - [ ] `BotConfigUpdate` (güncellenebilecek parametreler)
  - [ ] `BotConfigResponse` (bot bilgilerini döndürmek için tüm parametreler + id, created_at, updated_at)
  - [ ] `BotStateResponse` (botun mevcut durumunu döndürmek için)
- [ ] **CRUD Servisleri (Backend Logic):**
  - [ ] `create_bot(user_id, bot_config_data)`: Yeni bir bot konfigürasyonu ve başlangıç `BotState`'i oluşturur.
  - [ ] `get_bot(user_id, bot_id)`: Kullanıcıya ait belirli bir botun konfigürasyonunu ve durumunu getirir.
  - [ ] `list_bots(user_id)`: Kullanıcıya ait tüm botları listeler.
  - [ ] `update_bot(user_id, bot_id, bot_config_update_data)`: Bot konfigürasyonunu günceller (Çalışan bir botun bazı parametreleri güncellenemeyebilir, bu kural tanımlanmalı).
  - [ ] `delete_bot(user_id, bot_id)`: Bot konfigürasyonunu ve ilişkili durumunu siler (Çalışan bir bot önce durdurulmalı).
  - [ ] `start_bot(user_id, bot_id)`: Botun `is_active` flag'ini `true` yapar, `status`'unu 'running' yapar ve Celery görevini tetikler (veya Celery Beat'in almasını sağlar).
  - [ ] `stop_bot(user_id, bot_id)`: Botun `is_active` flag'ini `false` yapar, `status`'unu 'stopped' yapar ve çalışan Celery görevini (mümkünse) sonlandırır/işaretler.
- [ ] **API Endpointleri (FastAPI Router):**
  - [ ] `POST /api/v1/bots`: Yeni bot oluşturur.
  - [ ] `GET /api/v1/bots`: Kullanıcının tüm botlarını listeler.
  - [ ] `GET /api/v1/bots/{bot_id}`: Belirli bir botun detaylarını getirir.
  - [ ] `PUT /api/v1/bots/{bot_id}`: Bot konfigürasyonunu günceller.
  - [ ] `DELETE /api/v1/bots/{bot_id}`: Botu siler.
  - [ ] `POST /api/v1/bots/{bot_id}/start`: Botu başlatır.
  - [ ] `POST /api/v1/bots/{bot_id}/stop`: Botu durdurur.
- [ ] **Doğrulamalar:**
  - [ ] Gelen verilerin (sembol formatı, sayısal değer aralıkları vb.) doğrulanması.
  - [ ] Kullanıcının sadece kendi botları üzerinde işlem yapabilmesi (yetkilendirme).
- [ ] **Birim Testleri:** CRUD işlemleri ve başlatma/durdurma senaryoları için.

**Teknik Detaylar:**
- `BotConfig` ve `BotState` arasında one-to-one ilişki olacak.
- `initial_capital` gibi bazı parametreler kullanıcıya bilgi amaçlı olup, gerçek bakiye Binance'ten çekilir. Strateji, `position_size`'ı bu bakiye üzerinden hesaplayabilir.
- Botun çalışıp çalışmadığı (`is_active` ve `BotState.status`) durumu önemlidir.

**API Endpointleri:**
- `POST /api/v1/bots`
- `GET /api/v1/bots`
- `GET /api/v1/bots/{bot_id}`
- `PUT /api/v1/bots/{bot_id}`
- `DELETE /api/v1/bots/{bot_id}`
- `POST /api/v1/bots/{bot_id}/start`
- `POST /api/v1/bots/{bot_id}/stop`

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Çalışan bir botun hangi parametrelerinin değiştirilebileceği net bir şekilde belirlenmeli (örn: SL/TP anlık güncellenebilir mi, yoksa bot durdurulup mu güncellenmeli?). MVP için çalışan botun konfigürasyonu değiştirilemez denebilir.
- Bot silinirken, ilişkili tüm verilerin (işlem geçmişi vb.) ne olacağına karar verilmeli (soft delete / hard delete).
- `symbol` ve `timeframe` kombinasyonunun kullanıcı için benzersiz olması gerekebilir (bir kullanıcı aynı çift için aynı zaman aralığında birden fazla aynı strateji botu çalıştırmamalı).

**Bağımlılıklar:**
- [Kullanıcı Kimlik Doğrulama Sistemi](01_01_BACKEND_USER_AUTH.md)
- [Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md) (BotConfig, BotState tabloları).
