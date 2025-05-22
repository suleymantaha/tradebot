# Aşama 2: Özellik Geliştirmeleri
## Görev: 02_01_ADVANCED_STRATEGY_PARAMS_UI - Gelişmiş Strateji Parametreleri Arayüzü

**Amaç:** Kullanıcılara, bot oluşturma ve düzenleme formlarında daha detaylı ve esnek strateji parametreleri ayarlama imkanı sunmak. Özellikle `partial_take_profits` ve `max_trade_duration_hours` gibi mevcut kodda bulunan ama MVP'de arayüzde olmayan ayarları eklemek.

**Kapsam / Yapılacaklar:**
1.  **Backend Değişiklikleri:**
    - [ ] `BotConfig` modeline yeni alanlar eklemek (eğer mevcut değilse):
        *   `partial_take_profits_config` (JSONB veya Text - örn: `[{"percentage": 1, "ratio": 0.1}, {"percentage": 2, "ratio": 0.1}]`)
        *   `max_trade_duration_hours` (Integer, nullable=True)
    - [ ] `BotConfigCreate` ve `BotConfigUpdate` Pydantic şemalarını bu yeni alanları içerecek şekilde güncellemek.
    - [ ] CRUD servislerinde bu yeni parametrelerin validasyonunu ve işlenmesini sağlamak.
    - [ ] Strateji motoru (`TradingStrategy` sınıfı), bu yeni konfigürasyonları okuyup kullanacak şekilde güncellenmeli.
        *   Kısmi kar alma mantığı (pozisyonun belirli yüzdelerini, belirli kar hedeflerinde kapatma).
        *   Maksimum işlem süresi dolduğunda pozisyonu kapatma mantığı.
2.  **Frontend Değişiklikleri (Bot Oluşturma/Düzenleme Formu):**
    - [ ] **Kısmi Kar Alma (Partial Take Profits) Arayüzü:**
        *   Kullanıcının dinamik olarak kar alma hedefleri (yüzde olarak) ve her hedefte kapatılacak pozisyon oranı (yüzde olarak) ekleyip çıkarabileceği bir arayüz elemanı (örn: "Hedef Ekle" butonu ile satır ekleme).
        *   Örnek:
            *   Hedef 1: Kar %`[input]` -> Pozisyonun %`[input]` kadarını kapat
            *   Hedef 2: Kar %`[input]` -> Pozisyonun %`[input]` kadarını kapat
        *   Girilen oranların toplamının %100'ü geçmemesi gibi validasyonlar.
    - [ ] **Maksimum İşlem Süresi Arayüzü:**
        *   `max_trade_duration_hours` için bir input alanı (Number). 0 veya boş ise sınırsız anlamına gelebilir.
    - [ ] **Diğer Potansiyel Gelişmiş Ayarlar:**
        *   Belirli saatlerde işlem yapmama (örn: haber saatleri).
        *   Minimum işlem hacmi gibi filtreler. (Bu daha çok stratejiye özel olur)
3.  **Veritabanı Migration'ları:**
    - [ ] `BotConfig` tablosuna yeni sütunlar için Alembic migration script'i oluşturulacak.
4.  **Testler:**
    - [ ] Backend: Yeni parametrelerin doğru kaydedilip strateji motoruna iletildiğini test et. Kısmi kar alma ve maksimum işlem süresi mantığının strateji içinde doğru çalıştığını test et (mock'lanmış verilerle).
    - [ ] Frontend: Yeni form elemanlarının doğru çalışıp veri gönderdiğini test et. Validasyonların çalıştığını test et.

**UI Elementleri:**
*   Dinamik form alanları (kısmi kar alma için satır ekleme/çıkarma).
*   Sayısal giriş alanları, yüzdesel girişler.
*   Açıklayıcı tooltip'ler.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   Kısmi kar alma mantığı karmaşık olabilir. Kullanıcı arayüzünün sezgisel olması önemlidir.
*   Strateji motorunun bu yeni parametreleri doğru yorumlayıp uygulaması kritik.
*   Çok fazla gelişmiş ayar eklemek, arayüzü karmaşıklaştırabilir. Dengeli bir yaklaşım benimsenmeli.

**Bağımlılıklar:**
*   [MVP Bot Oluşturma Formu](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_10_FRONTEND_BOT_CREATION_FORM.md)
*   [Backend: Strateji Çekirdeği](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
*   [Backend: Bot Konfigürasyonu CRUD](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_04_BACKEND_BOT_CONFIG_CRUD.md)
