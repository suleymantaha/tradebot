# Aşama 2: Özellik Geliştirmeleri
## Görev: 02_03_REALTIME_BOT_STATUS_MONITORING - Gerçek Zamanlı Bot Durumu İzleme (Temel)

**Amaç:** Kullanıcılara, botlarının mevcut durumu, pozisyonları ve önemli metrikleri hakkında daha anlık (gerçek zamanlıya yakın) bilgi sunarak platformun etkileşimini artırmak.

**Kapsam / Yapılacaklar:**
1.  **Backend Hazırlıkları (WebSocket veya SSE):**
    *   **Yöntem Seçimi:**
        *   **Server-Sent Events (SSE):** Tek yönlü (sunucudan istemciye) iletişim için daha basit bir seçenek. Bot durumu güncellemeleri için genellikle yeterlidir. FastAPI SSE'yi destekler.
        *   **WebSockets:** Çift yönlü iletişim için daha güçlüdür, ancak bu özellik için overkill olabilir. FastAPI WebSockets'ı da destekler.
        *   **MVP için SSE tercih edilebilir.**
    - [ ] SSE endpoint'i oluşturma (`/api/v1/bots/{bot_id}/status-stream` veya genel bir stream `/api/v1/bots/status-stream` kullanıcıya ait botlar için).
    - [ ] Bot durumu (`BotState`) veritabanında güncellendiğinde (örn: `run_bot_strategy_cycle` görevi tarafından), bu güncellemeyi ilgili SSE bağlantılarına (veya bir mesaj kuyruğu aracılığıyla SSE yayınlayıcısına) iletmek.
        *   Bu, `BotState` güncellendikten sonra bir Redis Pub/Sub kanalı üzerinden bir mesaj yayınlayarak ve SSE endpoint'inin bu kanalı dinleyerek yapılabilir.
2.  **Frontend Entegrasyonu:**
    - [ ] Dashboard'da veya bot detay sayfasında:
        *   SSE bağlantısı kurmak (`EventSource` API'si ile).
        *   Sunucudan gelen durum güncellemelerini (JSON formatında) dinlemek.
        *   Gelen verilerle ilgili botun UI'daki gösterimini (durum, P&L, pozisyon bilgisi vb.) anında güncellemek.
    - [ ] Bağlantı kesildiğinde veya hata oluştuğunda yeniden bağlanma mantığı eklemek.
3.  **Gösterilecek Anlık Veriler (Örnek):**
    - [ ] Botun genel durumu (Çalışıyor, Durdu, Pozisyonda, Hata vb.).
    - [ ] Mevcut açık pozisyonun P&L'i.
    - [ ] Günlük P&L.
    - [ ] Son işlem zamanı.
    - [ ] Trailing stop fiyatı (eğer aktifse).
4.  **Alternatif (Daha Basit) Yöntem: Kısa Aralıklarla Polling:**
    - [ ] Eğer WebSocket/SSE entegrasyonu bu aşamada karmaşık geliyorsa, frontend belirli aralıklarla (örn: 5-10 saniyede bir) bot durumunu API'den çekerek (`GET /api/v1/bots/{bot_id}` veya `/api/v1/bots`) güncelleyebilir. Bu, "gerçek zamanlı" hissini bir miktar verir ancak sunucuya daha fazla yük bindirir. Bu görevde SSE hedeflenmeli.
5.  **Testler:**
    - [ ] Backend: SSE endpoint'inin doğru veri yayınladığını ve güncellemeleri ilettiğini test et.
    - [ ] Frontend: SSE bağlantısının kurulduğunu, verilerin doğru alındığını ve UI'ın doğru güncellendiğini test et. Bağlantı kesilme ve yeniden bağlanma senaryolarını test et.

**UI Elementleri:**
*   Mevcut dashboard/bot listesi elemanları dinamik olarak güncellenecek.
*   Belki küçük bir "canlı" göstergesi (yeşil nokta vb.).

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   Çok sayıda kullanıcı ve bot olduğunda WebSocket/SSE bağlantı yönetimi sunucu kaynaklarını etkileyebilir. Ölçeklenebilir bir çözüm (örn: Redis Pub/Sub ile yayınlama) önemlidir.
*   Kullanıcı tarayıcı sekmesini kapattığında veya sayfadan ayrıldığında SSE bağlantısı düzgün kapatılmalı.
*   Sadece gerçekten değişen verilerin gönderilmesi (diff gönderimi) optimizasyon sağlayabilir, ancak MVP+ için daha karmaşıktır.

**Bağımlılıklar:**
*   [Backend: Bot Çalıştırma Mantığı](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_06_BACKEND_BOT_EXECUTION_LOGIC.md) (BotState güncellemeleri buradan tetiklenecek).
*   [Frontend: Gösterge Paneli](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_09_FRONTEND_DASHBOARD_PAGE.md)
