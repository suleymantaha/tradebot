# Aşama 1: MVP Geliştirme

## Görev: 01_06_BACKEND_BOT_EXECUTION_LOGIC - Bot Çalıştırma Mantığı (Celery Task)

**Amaç:** Kullanıcı tarafından başlatılan ticaret botlarının, belirlenen `check_interval` ile periyodik olarak strateji mantığını çalıştıracak Celery görevini/görevlerini oluşturmak ve yönetmek.

**Kapsam / Yapılacaklar:**

- [ ] **Celery Görevi Tanımlama (`run_bot_strategy_cycle`):**
  - [ ] `@app.task` decorator'ı ile bir Celery görevi oluşturulacak.
  - [ ] Bu görev, parametre olarak `bot_config_id` ve `user_id` (veya sadece `bot_config_id` alıp user'ı oradan bulabilir) alacak.
- [ ] **Görev İçindeki Mantık:**
    1. [ ] `bot_config_id` ve `user_id` kullanarak veritabanından `BotConfig` ve en son `BotState` bilgilerini çek.
    2. [ ] Kullanıcının `ApiKey` bilgilerini çek ve secret'ını çöz (`decrypt_data`).
    3. [ ] Eğer bot `is_active` değilse veya `BotState.status` 'stopped' ise görevi sonlandır.
    4. [ ] Binance API istemcisini, çözülmüş API anahtarları ile başlat.
    5. [ ] [Yeniden düzenlenen `TradingStrategy` sınıfından](01_03_BACKEND_STRATEGY_CORE_REFACTOR.md) bir örnek (instance) oluştur. `BotConfig` ve `BotState` bilgilerini bu sınıfa parametre olarak geç.
    6. [ ] `trading_strategy_instance.run_cycle()` metodunu çağırarak stratejinin bir döngüsünü çalıştır.
    7. [ ] `run_cycle()` metodundan dönen güncel bot durumu (yeni `BotState` bilgileri: `in_position`, `entry_price`, P&L, işlem detayları vb.) ve işlem kayıtlarını al.
    8. [ ] Yeni `BotState` bilgilerini veritabanına kaydet/güncelle.
    9. [ ] Eğer bir işlem yapıldıysa (`execute_trade` başarılı olduysa), işlem detaylarını `Trades` tablosuna kaydet.
    10. [ ] Günlük P&L ve günlük trade sayısı gibi sayaçları güncelle (`BotState` içinde).
    11. [ ] `max_daily_loss` veya `daily_target`'a ulaşıldıysa botu otomatik olarak durdur (`BotConfig.is_active = False`, `BotState.status = 'stopped'`).
    12. [ ] Herhangi bir hata oluşursa, hatayı logla ve `BotState.last_error` alanını güncelle. Gerekirse botu durdur (`BotState.status = 'error'`).
- [ ] **Görevin Periyodik Çalıştırılması:**
  - **Yöntem 1: Dinamik Görev Zamanlama (Önerilen Başlangıç):**
    - [ ] Bot `start_bot` API endpoint'i ile başlatıldığında, `run_bot_strategy_cycle` görevi bir kez hemen (`apply_async()`) ve ardından her `check_interval` (örn: 60 saniye) sonunda kendini tekrar çağıracak şekilde (`apply_async(countdown=check_interval)`) zincirleme olarak tetiklenir.
    - [ ] Bot `stop_bot` ile durdurulduğunda, bu zincirleme çağrı kesilir (görev bir sonraki çağrıyı yapmaz).
  - **Yöntem 2: Celery Beat ile Merkezi Zamanlama (Alternatif):**
    - [ ] Celery Beat, periyodik olarak (örn: her dakika) bir "ana dispatch" görevi çalıştırır.
    - [ ] Bu ana görev, veritabanından tüm `is_active=True` olan botları çeker ve her biri için `run_bot_strategy_cycle` görevini ayrı ayrı (`apply_async()`) tetikler. Bu yöntem, botların kendi `check_interval`'lerini yönetmeyi karmaşıklaştırabilir.
- [ ] **Durum Senkronizasyonu:**
  - [ ] Botun durumu (veritabanındaki `BotState`) ile Celery görevinin çalışma durumu arasında tutarlılık sağlanmalı.
- [ ] **Hata Yönetimi ve Yeniden Deneme:**
  - [ ] Celery görevi içinde oluşabilecek hatalar (API bağlantı sorunları, geçici Binance hataları) için yeniden deneme (retry) mekanizmaları (`task.retry()`) eklenebilir.
  - [ ] Kalıcı hatalarda görev sonlandırılmalı ve bot durumu 'error' olarak işaretlenmeli.
- [ ] **İşlem Kayıtları (`Trades` Tablosu):**
  - [ ] Strateji bir alım/satım yaptığında, bu işlemin detayları (sembol, tip (BUY/SELL), miktar, fiyat, komisyon, P&L, timestamp) `Trades` tablosuna kaydedilecek.
  - [ ] `Trades` modeli (id, bot_config_id, user_id, symbol, side, price, quantity, fee, pnl, timestamp).

**Teknik Detaylar:**
- Görevlerin çakışmaması (aynı bot için birden fazla `run_bot_strategy_cycle` görevinin aynı anda çalışmaması) için önlemler alınabilir (örn: Redis lock, Celery `singleton` pattern - daha ileri seviye). MVP'de, doğru zincirleme ile bu büyük ölçüde önlenebilir.
- `check_interval` kullanıcı tarafından bot konfigürasyonunda belirlenecek.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Uzun süre çalışan botların bellek sızıntısı yapmamasına dikkat edilmeli.
- Binance API rate limitlerine çok dikkat edilmeli. Çok sayıda bot çalışıyorsa, istekler dağıtılmalı veya toplu hale getirilmeli (mümkünse).
- Eğer bir bot görevi bir şekilde "takılırsa" veya sonlanmazsa ne olacağı düşünülmeli (timeout mekanizmaları).
- Bot durdurulduğunda, o an çalışan Celery görevinin bir sonraki döngüyü başlatmaması sağlanmalı.

**Bağımlılıklar:**
- [Celery Worker Kurulumu](01_05_BACKEND_CELERY_WORKER_SETUP.md)
- [Strateji Çekirdeğinin Yeniden Düzenlenmesi](01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
- [Bot Konfigürasyonu CRUD İşlemleri](01_04_BACKEND_BOT_CONFIG_CRUD.md) (BotConfig ve BotState modelleri).
- [Veritabanı Şeması ve Migration'lar](01_07_BACKEND_DATABASE_SCHEMA.md) (Trades tablosu).
