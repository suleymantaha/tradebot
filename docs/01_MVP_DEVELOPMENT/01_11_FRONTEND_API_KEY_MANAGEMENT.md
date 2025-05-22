# Aşama 1: MVP Geliştirme
## Görev: 01_11_FRONTEND_API_KEY_MANAGEMENT - API Anahtarı Yönetimi Sayfası

**Amaç:** Kullanıcıların Binance API anahtarlarını (API Key ve Secret Key) platforma girmelerini, mevcut anahtarlarını (maskelenmiş) görmelerini ve silmelerini sağlayacak bir arayüz oluşturmak.

**Kapsam / Yapılacaklar:**
1.  **API Anahtarı Yönetim Sayfası Bileşeni (`ApiKeyPage.jsx`):**
    - [ ] Bu sayfa, kullanıcıların API anahtarlarını yönetmesine olanak tanır.
    - [ ] Korumalı bir rota olmalı.
2.  **Mevcut API Anahtarını Gösterme:**
    - [ ] Sayfa yüklendiğinde `GET /api/v1/api-keys/me` endpoint'ine istek atarak kullanıcının mevcut API anahtar bilgisini (varsa) çek.
    - [ ] Eğer API anahtarı kayıtlıysa:
        *   Maskelenmiş API Key (örn: `abc...xyz`)
        *   Geçerlilik Durumu (`is_valid` - Doğru, Yanlış)
        *   Eklenme Tarihi
        *   "Sil" butonu
    - [ ] Eğer API anahtarı kayıtlı değilse veya silinmişse, yeni anahtar ekleme formunu göster.
3.  **Yeni API Anahtarı Ekleme Formu:**
    - [ ] API Key giriş alanı (text).
    - [ ] Secret Key giriş alanı (password type veya text - kullanıcıya uyarı ile).
    - [ ] "Kaydet" butonu.
    - [ ] Form gönderildiğinde `POST /api/v1/api-keys` endpoint'ine istek atacak.
    - [ ] Başarılı kayıttan sonra sayfayı güncelleyerek yeni (maskelenmiş) anahtarı ve durumunu göstermeli.
    - [ ] Hata mesajlarını (örn: geçersiz anahtar, API bağlantı hatası) gösterme.
4.  **API Anahtarını Silme:**
    - [ ] "Sil" butonuna tıklandığında kullanıcıdan onay iste (confirm dialog).
    - [ ] Onay verilirse `DELETE /api/v1/api-keys/me` endpoint'ine istek atacak.
    - [ ] Başarılı silme sonrası sayfayı güncelleyerek API anahtarı ekleme formunu göstermeli.
5.  **Güvenlik Uyarıları:**
    - [ ] Sayfada, API anahtarlarının güvenliği, hangi izinlerin verilmesi gerektiği (sadece trade, çekim izni olmamalı) ve IP kısıtlaması kullanımı hakkında net uyarılar ve bilgilendirme metinleri bulunmalı.
    - [ ] Secret Key'in sadece bir kez girileceği ve sonradan platformda tam olarak gösterilmeyeceği belirtilmeli.
6.  **Kullanıcı Deneyimi:**
    - [ ] API anahtarlarını girerken kopyala-yapıştır kolaylığı.
    - [ ] İşlemler sırasında loading göstergeleri ve geri bildirim mesajları.

**UI Elementleri:**
*   Input alanları (API Key, Secret Key).
*   Butonlar (Kaydet, Sil).
*   Bilgilendirme metinleri ve uyarı kutuları.
*   Maskelenmiş API Key gösterimi.
*   Onay diyalogu (silme işlemi için).

**Teknik Detaylar:**
*   Form yönetimi için `react-hook-form` kullanılabilir.
*   Secret Key alanı için "göster/gizle" butonu eklenebilir.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
*   **Güvenlik:** Kullanıcıların doğru izinlere sahip API anahtarları oluşturması için yönlendirme çok önemlidir. Yanlışlıkla çekim izni verilmiş anahtarlar büyük risk oluşturur.
*   API anahtarı doğrulama işlemi backend'de yapılır; frontend sadece sonucu gösterir.
*   Kullanıcıya, API anahtarını neden istediğinizi ve nasıl kullanılacağını açıklayan net bilgiler verin.

**Bağımlılıklar:**
*   [Backend: Binance API Entegrasyonu (Temel)](01_02_BACKEND_BINANCE_API_INTEGRATION.md) (API anahtarı CRUD endpoint'leri).
*   [Temel Layout ve Kimlik Doğrulama Sayfaları](01_08_FRONTEND_BASIC_LAYOUT_AUTH_PAGES.md).
