# Aşama 1: MVP Geliştirme

## Görev: 01_08_FRONTEND_BASIC_LAYOUT_AUTH_PAGES - Temel Layout ve Kimlik Doğrulama Sayfaları

**Amaç:** Frontend uygulamasının temel sayfa düzenini (navbar, sidebar, footer vb.) oluşturmak ve kullanıcı kaydı, girişi için gerekli sayfaları ve formları geliştirmek.

**Kapsam / Yapılacaklar:**

1. **Proje Yapısı ve Kurulum:**
    - [ ] Vite (veya CRA) ile React projesi oluşturulacak.
    - [ ] `react-router-dom` ile temel routing yapısı kurulacak.
    - [ ] Tailwind CSS (veya seçilen stil kütüphanesi) entegre edilecek.
    - [ ] Global state yönetimi için Zustand (veya Redux Toolkit) temel kurulumu yapılacak (örn: kullanıcı oturum bilgisi için).
2. **Temel Layout Bileşeni (`MainLayout.jsx`):**
    - [ ] Uygulamanın genel çerçevesini oluşturacak bir layout bileşeni.
    - [ ] Basit bir Navbar (logo, navigasyon linkleri - Giriş/Kayıt veya Dashboard/Logout).
    - [ ] (Opsiyonel MVP) Basit bir Sidebar (ileride bot listesi vb. için yer).
    - [ ] İçeriğin gösterileceği ana alan (`<Outlet />` react-router-dom'dan).
    - [ ] Basit bir Footer.
3. **Kayıt Sayfası (`RegisterPage.jsx`):**
    - [ ] E-posta ve şifre giriş alanları içeren bir form.
    - [ ] Şifre tekrarı alanı (doğrulama için).
    - [ ] "Kayıt Ol" butonu.
    - [ ] Form gönderildiğinde `POST /api/v1/auth/register` endpoint'ine istek atacak.
    - [ ] Başarılı kayıt sonrası kullanıcıyı giriş sayfasına yönlendirme veya otomatik giriş sağlama.
    - [ ] Hata mesajlarını (örn: e-posta zaten kayıtlı, şifreler uyuşmuyor) gösterme.
    - [ ] Temel form validasyonu (alanların boş olmaması, e-posta formatı).
4. **Giriş Sayfası (`LoginPage.jsx`):**
    - [ ] E-posta ve şifre giriş alanları içeren bir form.
    - [ ] "Giriş Yap" butonu.
    - [ ] (Opsiyonel) "Beni Hatırla" seçeneği.
    - [ ] Form gönderildiğinde `POST /api/v1/auth/login` (veya `/api/v1/auth/token`) endpoint'ine istek atacak.
    - [ ] Başarılı girişte dönen JWT'yi güvenli bir şekilde (localStorage/sessionStorage veya httpOnly cookie - backend ayarı gerektirir) saklayacak ve global state'i güncelleyecek.
    - [ ] Kullanıcıyı gösterge paneline (dashboard) yönlendirecek.
    - [ ] Hata mesajlarını (örn: yanlış e-posta/şifre) gösterme.
5. **Routing Yapılandırması (`App.jsx` veya `routes.js`):**
    - [ ] `/register`, `/login` gibi public rotalar.
    - [ ] Giriş yapmış kullanıcıların erişebileceği korumalı rotalar için altyapı (`PrivateRoute` veya benzeri bir bileşen).
6. **API İstemcisi (Axios veya Fetch):**
    - [ ] API isteklerini merkezi bir yerden yönetmek için bir Axios instance'ı veya fetch wrapper fonksiyonları oluşturulacak.
    - [ ] JWT'yi otomatik olarak Authorization header'ına ekleyecek interceptor (Axios için).
7. **Global State (Oturum Yönetimi):**
    - [ ] Kullanıcının giriş yapmış olup olmadığı, kullanıcı bilgileri ve token gibi bilgilerin saklanacağı global state (Zustand store).
    - [ ] Logout fonksiyonu (token'ı siler, state'i sıfırlar, kullanıcıyı giriş sayfasına yönlendirir).

**UI Elementleri:**
- Formlar, input alanları, butonlar.
- Hata ve başarı mesajları için bildirimler/toast'lar.
- Navigasyon elemanları.

**Teknik Detaylar:**
- Form yönetimi için `react-hook-form` gibi bir kütüphane kullanılabilir (opsiyonel, ama önerilir).
- API istekleri için `async/await` kullanılacak.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Güvenlik: JWT'nin istemci tarafında saklanması XSS saldırılarına karşı dikkatli olmayı gerektirir. Eğer mümkünse, backend'den httpOnly cookie ile token yönetimi daha güvenlidir. MVP için localStorage/sessionStorage kabul edilebilir.
- Kullanıcı deneyimi: Form validasyonları ve hata mesajları kullanıcı dostu olmalı.
- Mobil uyumluluk (responsive design) temel seviyede düşünülmeli.

**Bağımlılıklar:**
- [Backend: Kullanıcı Kimlik Doğrulama](01_01_BACKEND_USER_AUTH.md) (API endpoint'leri hazır olmalı).
- Seçilen frontend teknolojileri (React, Vite, Tailwind CSS vb.).
