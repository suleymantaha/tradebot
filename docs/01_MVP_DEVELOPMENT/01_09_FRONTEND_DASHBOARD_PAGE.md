# Aşama 1: MVP Geliştirme

## Görev: 01_09_FRONTEND_DASHBOARD_PAGE - Gösterge Paneli Sayfası

**Amaç:** Giriş yapmış kullanıcıların aktif botlarını, temel performans metriklerini ve son işlemlerini görebilecekleri bir ana sayfa (dashboard) oluşturmak.

**Kapsam / Yapılacaklar:**

1. **Dashboard Sayfası Bileşeni (`DashboardPage.jsx`):**
    - [ ] Bu sayfa, giriş yapmış kullanıcılar için ana karşılama ekranı olacak.
    - [ ] Korumalı bir rota (`PrivateRoute` ile erişilebilir) olmalı.
2. **Veri Çekme:**
    - [ ] Sayfa yüklendiğinde, kullanıcının botlarını (`GET /api/v1/bots`) ve genel hesap özetini (ileride eklenecek bir endpoint veya bot verilerinden türetilecek) çekmek için API istekleri yapılacak.
3. **Bot Listesi Gösterimi:**
    - [ ] Kullanıcının sahip olduğu botların bir listesi (kart veya tablo formatında).
    - [ ] Her bot için gösterilecek temel bilgiler:
        - Bot Adı (`BotConfig.name`)
        - Sembol (`BotConfig.symbol`)
        - Timeframe (`BotConfig.timeframe`)
        - Durum (`BotState.status` - Çalışıyor, Durdu, Hata) - Renkli ikonlarla belirtilebilir.
        - Mevcut Pozisyon (`BotState.in_position` ise "Long" veya "Short", değilse "Pozisyonda Değil")
        - Günlük P&L (`BotState.daily_pnl`)
        - Botu Başlat/Durdur butonu (ilgili API endpoint'lerini çağıracak: `POST /api/v1/bots/{bot_id}/start` ve `POST /api/v1/bots/{bot_id}/stop`).
        - Botu Düzenle/Sil ikonları/butonları (ilgili sayfalara yönlendirecek veya modal açacak).
4. **Genel Bakış / Özet Bilgiler (Opsiyonel MVP):**
    - [ ] Toplam teorik P&L (tüm botlardan).
    - [ ] Aktif bot sayısı / Toplam bot sayısı.
    - [ ] (Opsiyonel) Basit bir P&L grafiği (MVP sonrası daha detaylı).
5. **"Yeni Bot Oluştur" Butonu:**
    - [ ] Kullanıcıyı bot oluşturma formuna ([Frontend: Bot Oluşturma Formu](01_10_FRONTEND_BOT_CREATION_FORM.md)) yönlendirecek bir buton.
6. **Durum Yönetimi:**
    - [ ] Çekilen bot verileri ve diğer dashboard bilgileri global state'te (Zustand) veya sayfa bazlı state'te (useState, useReducer) saklanacak.
    - [ ] Bot başlatma/durdurma işlemleri sonrası liste güncellenmeli.
7. **Kullanıcı Deneyimi:**
    - [ ] Veriler yüklenirken loading göstergeleri.
    - [ ] Hata durumunda kullanıcıya bilgi mesajları.
    - [ ] Temiz ve anlaşılır bir arayüz.

**UI Elementleri:**
- Kartlar (her bot için).
- Tablo (alternatif bot listesi gösterimi).
- Butonlar (Yeni Bot, Başlat/Durdur, Düzenle, Sil).
- İkonlar (durum, işlemler için).
- Loading spinner/iskelet (skeleton) ekranları.

**Teknik Detaylar:**
- API'den gelen bot listesi map edilerek UI'da render edilecek.
- Bot başlatma/durdurma işlemleri asenkron olacak ve kullanıcıya geri bildirim verilecek (örn: toast notification).

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Çok sayıda botu olan kullanıcılar için performans (liste render etme) düşünülebilir (virtualization MVP sonrası).
- Gerçek zamanlı bot durumu güncellemesi MVP için gerekli değil; sayfa yenileme veya periyodik veri çekme ile sağlanabilir. Websocket entegrasyonu MVP sonrasıdır.
- Botların `daily_pnl` ve diğer sayaçları backend tarafında `BotState` içinde tutulacak ve buradan okunacak.

**Bağımlılıklar:**
- [Backend: Bot Konfigürasyonu CRUD İşlemleri](01_04_BACKEND_BOT_CONFIG_CRUD.md) (Bot listeleme, başlatma, durdurma API'leri).
- [Temel Layout ve Kimlik Doğrulama Sayfaları](01_08_FRONTEND_BASIC_LAYOUT_AUTH_PAGES.md) (Korumalı rota ve kullanıcı oturumu).
