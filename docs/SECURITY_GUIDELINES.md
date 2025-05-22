# Güvenlik Yönergeleri

Bu platform, kullanıcıların hassas finansal bilgilerini ve API anahtarlarını işleyeceği için güvenlik en yüksek öncelik olmalıdır. Aşağıdaki yönergeler, geliştirme ve operasyon süreçlerinde dikkate alınmalıdır.

1.  **API Anahtarı Yönetimi (Kritik):**
    *   Kullanıcıların Binance API anahtarları (API Key ve Secret Key) veritabanında **her zaman** güçlü bir şifreleme algoritması (örn: AES-256, Fernet - `cryptography` kütüphanesi) kullanılarak şifrelenmiş olarak saklanmalıdır. Şifreleme anahtarı (encryption key) güvenli bir şekilde yönetilmeli (örn: environment variable, secrets manager).
    *   API secret key'leri, sadece bot operasyonları sırasında geçici olarak bellekte çözülmeli ve işlem bittikten sonra derhal bellekten silinmelidir.
    *   Kullanıcılara, oluşturdukları API anahtarlarına **sadece "Spot ve Marjin Alım Satımını Etkinleştir"** yetkisi vermeleri, **"Çekimleri Etkinleştir" yetkisini KESİNLİKLE vermemeleri** ve IP erişim kısıtlaması (whitelist) kullanmaları konusunda net ve görünür uyarılar yapılmalıdır.
    *   API anahtarları asla loglara yazılmamalı, istemci tarafına (frontend) gönderilmemeli veya URL parametrelerinde taşınmamalıdır.

2.  **Veri İletişimi:**
    *   Platforma yapılan tüm HTTP istekleri ve platformdan yapılan tüm dış API çağrıları (Binance vb.) **HTTPS (TLS)** üzerinden zorunlu kılınmalıdır.
    *   HSTS (HTTP Strict Transport Security) başlığı kullanılmalıdır.

3.  **Kimlik Doğrulama ve Yetkilendirme:**
    *   Kullanıcı şifreleri, güçlü bir hashing algoritması (örn: bcrypt, Argon2 - `passlib` kütüphanesi) ile tuzlanarak (salted) saklanmalıdır.
    *   Oturum yönetimi için güvenli mekanizmalar (örn: JWT - JSON Web Tokens) kullanılmalı. JWT'ler kısa ömürlü olmalı ve refresh token mekanizması kullanılmalıdır.
    *   İki Faktörlü Kimlik Doğrulama (2FA - TOTP) kullanıcı hesapları için şiddetle tavsiye edilir ve MVP sonrası bir özellik olarak planlanmalıdır.
    *   Tüm API endpoint'leri için uygun yetkilendirme kontrolleri yapılmalıdır. Kullanıcılar sadece kendi verilerine ve botlarına erişebilmelidir.

4.  **Web Zafiyetlerine Karşı Koruma (OWASP Top 10):**
    *   **SQL Injection:** ORM kullanımı ve parametreli sorgular ile önlenmelidir.
    *   **Cross-Site Scripting (XSS):** Frontend framework'lerinin sunduğu XSS korumaları kullanılmalı, kullanıcı girdileri sanitize edilmeli/escape edilmelidir. Content Security Policy (CSP) başlığı kullanılmalıdır.
    *   **Cross-Site Request Forgery (CSRF):** Durum değiştiren (state-changing) HTTP metodları (POST, PUT, DELETE) için CSRF tokenları kullanılmalıdır.
    *   **Broken Access Control:** Tüm endpoint'lerde ve veri erişimlerinde sıkı yetkilendirme kontrolleri yapılmalıdır.
    *   **Security Misconfiguration:** Tüm yazılım bileşenleri (OS, web sunucusu, veritabanı, frameworkler) güvenli yapılandırmalarla kullanılmalı ve güncel tutulmalıdır.
    *   **Insecure Deserialization:** Güvenilmeyen kaynaklardan gelen verilerin deserializasyonundan kaçınılmalıdır.

5.  **Rate Limiting ve Brute-Force Koruması:**
    *   Giriş denemeleri, API istekleri (hem kullanıcıdan gelen hem de Binance'e giden) için rate limiting uygulanmalıdır.
    *   Başarısız giriş denemelerinden sonra hesap geçici olarak kilitlenmelidir.

6.  **Bağımlılık Yönetimi ve Güvenliği:**
    *   Kullanılan tüm kütüphaneler ve bağımlılıklar düzenli olarak güncellenmeli ve bilinen zafiyetlere karşı (örn: `pip-audit`, Snyk, GitHub Dependabot) taranmalıdır.

7.  **Hata Yönetimi ve Loglama:**
    *   Hassas bilgiler (stack trace'ler, API anahtarları, veritabanı detayları) içeren hata mesajları asla son kullanıcıya gösterilmemelidir. Genel hata mesajları kullanılmalı, detaylı teknik hatalar sunucu tarafında güvenli bir şekilde loglanmalıdır.
    *   Loglar, yetkisiz erişime karşı korunmalı ve hassas veriler (örn: API secret'ları) içermemelidir.

8.  **Sunucu ve Altyapı Güvenliği:**
    *   İşletim sistemi ve sunucu yazılımları düzenli olarak güncellenmelidir.
    *   Firewall kuralları ile gereksiz portlar kapatılmalı, sadece gerekli servislere erişim izni verilmelidir.
    *   Mümkünse, veritabanı ve diğer backend servisleri public internete açık olmamalı, özel ağ içinde çalışmalıdır.
    *   Düzenli güvenlik taramaları ve sızma testleri (penetration testing) yapılması değerlendirilmelidir.

9.  **Güvenli Geliştirme Yaşam Döngüsü (SSDLC):**
    *   Güvenlik, tasarım aşamasından itibaren geliştirme sürecinin bir parçası olmalıdır.
    *   Kod incelemelerinde (code reviews) güvenlik açıklarına dikkat edilmelidir.
