# Aşama 3: İleri Seviye Özellikler
## Görev: 03_03_SOCIAL_TRADING_FEATURES - Sosyal Ticaret Özellikleri (Opsiyonel)

**Amaç:** Kullanıcıların platform içinde birbirleriyle etkileşim kurmasını, başarılı trader'ların stratejilerini (izinleriyle) kopyalamasını veya takip etmesini sağlayarak bir topluluk oluşturmak ve platformun çekiciliğini artırmak. Bu, genellikle premium bir özellik olarak sunulabilir.

**Kapsam / Yapılacaklar (Modüler Yaklaşım):**
1.  **Kullanıcı Profilleri ve Performans Paylaşımı:**
    - [ ] **Backend & Frontend:**
        *   Kullanıcıların genel (anonimleştirilmiş veya isteğe bağlı) performans metriklerini (toplam P&L, win rate, en iyi bot vb.) profillerinde paylaşabilmesi.
        *   Kullanıcıların birbirlerini takip edebilmesi.
2.  **Liderlik Tablosu (Leaderboard):**
    - [ ] **Backend & Frontend:**
        *   En iyi performans gösteren kullanıcıların (izinleriyle ve belirli kriterlere göre - örn: son 30 gün P&L) listelendiği bir liderlik tablosu.
        *   Filtreleme seçenekleri (zaman aralığı, strateji tipi vb.).
3.  **Strateji Kopyalama (Copy Trading - Temel Seviye):**
    - [ ] **Backend:**
        *   "Master Trader" (stratejisini kopyalatan) ve "Copier" (kopyalayan) arasında bir bağlantı kurulması.
        *   Master Trader bir işlem yaptığında (veya botu bir sinyal ürettiğinde), bu bilginin Copier'lara iletilmesi ve Copier'ların hesaplarında benzer bir işlemin (kendi risk ayarlarına göre ayarlanmış pozisyon büyüklüğü ile) otomatik olarak açılması/kapatılması.
        *   Bu, çok dikkatli bir şekilde tasarlanmalı ve API anahtarlarının güvenliği en üst düzeyde tutulmalıdır. Copier, Master'ın API anahtarına erişmemelidir. Platform, işlemleri Copier adına kendi API anahtarları üzerinden (eğer merkezi bir modelse) veya Copier'ın kendi API anahtarı üzerinden (daha yaygın) yapar.
        *   Gecikme (latency) minimizasyonu önemlidir.
    - [ ] **Frontend:**
        *   Kullanıcıların liderlik tablosundan veya profillerden kopyalamak istedikleri Master Trader'ları seçebilmesi.
        *   Kopyalama ayarları (ayrılan sermaye, pozisyon büyüklüğü oranı, maksimum risk vb.).
        *   Kopyalama işleminin durumu ve performansı hakkında raporlama.
    - [ ] **Riskler ve Sorumluluk Reddi:**
        *   Kullanıcılara, copy trading'in riskleri hakkında net uyarılar yapılmalı ve platformun yatırım tavsiyesi vermediği belirtilmeli.
4.  **Strateji Pazaryeri (Marketplace - Daha İleri Seviye):**
    - [ ] Kullanıcıların (veya platformun) başarılı backtest sonuçlarına sahip veya kanıtlanmış canlı performansı olan stratejileri (bot konfigürasyonlarını) abonelik veya tek seferlik ücret karşılığında sunabileceği bir alan.
    - [ ] Strateji sağlayıcıları için performans doğrulama mekanizmaları.
5.  **Tartışma Forumları / Yorumlar:**
    - [ ] Kullanıcıların stratejiler, piyasalar veya platform hakkında tartışabileceği basit bir forum veya bot/strateji sayfalarına yorum yapma özelliği.
6.  **Testler:**
    - [ ] Copy trading mekanizmasının farklı senaryolarda (piyasa dalgalanmaları, API hataları) doğru çalıştığını test et.
    - [ ] Performans paylaşımı ve liderlik tablosu verilerinin doğruluğunu test et.
    - [ ] Güvenlik açıklarına (özellikle API anahtarı ve işlem yetkileri konusunda) karşı kapsamlı testler.

**Teknik Detaylar:**
*   Copy trading, karmaşık bir altyapı gerektirir (düşük gecikmeli mesajlaşma, eş zamanlı işlem yönetimi).
*   Veritabanı, kullanıcılar arası ilişkileri (takip, kopyalama) ve performans verilerini verimli bir şekilde saklamalıdır.
*   Yasal ve düzenleyici konular (özellikle finansal tavsiye verme veya yönetme algısı yaratabilecek özellikler) dikkatlice incelenmelidir.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   **Yasal Uyumluluk:** Sosyal ticaret ve özellikle copy trading, bazı yargı bölgelerinde finansal hizmet düzenlemelerine tabi olabilir. Hukuki danışmanlık almak gerekebilir.
*   **Güvenlik:** Kullanıcı fonlarının ve API anahtarlarının güvenliği en üst düzeyde olmalıdır.
*   **Şeffaflık:** Master Trader'ların performans metrikleri şeffaf ve doğrulanabilir olmalıdır.
*   Bu özellikler platforma önemli bir karmaşıklık katacaktır. Adım adım ve dikkatli bir planlama ile ilerlenmelidir.

**Bağımlılıklar:**
*   [Kullanıcı Profilleri ve Temel Performans Metrikleri](02_02_DETAILED_TRADE_HISTORY_LOGGING.md gibi görevlerden gelen veriler)
*   [Çoklu Strateji Desteği](03_02_MULTI_STRATEGY_SUPPORT.md) (eğer kopyalanacak farklı stratejiler olacaksa)
