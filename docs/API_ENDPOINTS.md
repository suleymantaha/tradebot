# API Endpointleri Dokümantasyonu

Bu doküman, AlgoTrade Web Platformu'nun backend API endpoint'lerini listeler ve açıklar. Tüm endpoint'ler `/api/v1` base path'ini kullanır. Kimlik doğrulama gerektiren endpoint'ler için geçerli bir JWT (JSON Web Token) `Authorization: Bearer <token>` başlığında gönderilmelidir.

## Kimlik Doğrulama (`/auth`)

*   **`POST /auth/register`**
    *   Açıklama: Yeni bir kullanıcı kaydı oluşturur.
    *   Request Body: `UserCreate` (email, password)
    *   Response: `201 Created` - `UserResponse` (id, email, is_active)
    *   Hatalar: `400 Bad Request`, `409 Conflict` (e-posta zaten kullanımda)

*   **`POST /auth/login`** (veya `/auth/token`)
    *   Açıklama: Kullanıcı girişi yapar ve JWT access token döndürür.
    *   Request Body: `OAuth2PasswordRequestForm` (username=email, password)
    *   Response: `200 OK` - `Token` (access_token, token_type)
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`

## Kullanıcılar (`/users`)

*   **`GET /users/me`**
    *   Açıklama: Mevcut giriş yapmış kullanıcının bilgilerini döndürür.
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `200 OK` - `UserResponse`
    *   Hatalar: `401 Unauthorized`

*   **`PUT /users/me`** (MVP Sonrası)
    *   Açıklama: Mevcut kullanıcının profil bilgilerini (örn: şifre) günceller.
    *   Kimlik Doğrulama: Gerekli.
    *   Request Body: `UserUpdate` (örn: new_password, current_password)
    *   Response: `200 OK` - `UserResponse`
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`

## API Anahtarları (`/api-keys`)

*   **`POST /api-keys`**
    *   Açıklama: Mevcut kullanıcı için yeni bir borsa API anahtarı ekler.
    *   Kimlik Doğrulama: Gerekli.
    *   Request Body: `ApiKeyCreate` (api_key, secret_key, exchange_name - eğer çoklu borsa desteği varsa)
    *   Response: `201 Created` - `ApiKeyResponse` (maskelenmiş anahtar, geçerlilik durumu)
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (zaten anahtar var - MVP için)

*   **`GET /api-keys/me`**
    *   Açıklama: Mevcut kullanıcının kayıtlı API anahtar bilgisini döndürür.
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `200 OK` - `ApiKeyResponse` (veya `404 Not Found` eğer anahtar yoksa)
    *   Hatalar: `401 Unauthorized`

*   **`DELETE /api-keys/me`**
    *   Açıklama: Mevcut kullanıcının kayıtlı API anahtarını siler.
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `204 No Content`
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

## Botlar (`/bots`)

*   **`POST /bots`**
    *   Açıklama: Mevcut kullanıcı için yeni bir ticaret botu konfigürasyonu oluşturur.
    *   Kimlik Doğrulama: Gerekli.
    *   Request Body: `BotConfigCreate` (tüm bot parametreleri)
    *   Response: `201 Created` - `BotConfigResponse` (oluşturulan botun detayları)
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`

*   **`GET /bots`**
    *   Açıklama: Mevcut kullanıcının tüm botlarını listeler.
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `200 OK` - `List[BotConfigResponse]`
    *   Hatalar: `401 Unauthorized`

*   **`GET /bots/{bot_id}`**
    *   Açıklama: Belirli bir botun detaylarını (konfigürasyon ve durum) getirir.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `bot_id` (Integer)
    *   Response: `200 OK` - `BotConfigResponse` (içinde `BotState` bilgisi de olabilir veya ayrı bir alan olarak)
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

*   **`PUT /bots/{bot_id}`**
    *   Açıklama: Belirli bir botun konfigürasyonunu günceller.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `bot_id` (Integer)
    *   Request Body: `BotConfigUpdate` (güncellenecek parametreler)
    *   Response: `200 OK` - `BotConfigResponse`
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

*   **`DELETE /bots/{bot_id}`**
    *   Açıklama: Belirli bir botu siler.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `bot_id` (Integer)
    *   Response: `204 No Content`
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

*   **`POST /bots/{bot_id}/start`**
    *   Açıklama: Belirli bir botu başlatır.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `bot_id` (Integer)
    *   Response: `200 OK` - Mesaj (örn: `{"message": "Bot started successfully"}`)
    *   Hatalar: `401 Unauthorized`, `404 Not Found`, `409 Conflict` (bot zaten çalışıyor)

*   **`POST /bots/{bot_id}/stop`**
    *   Açıklama: Belirli bir botu durdurur.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `bot_id` (Integer)
    *   Response: `200 OK` - Mesaj (örn: `{"message": "Bot stopped successfully"}`)
    *   Hatalar: `401 Unauthorized`, `404 Not Found`, `409 Conflict` (bot zaten durmuş)

*   **`GET /bots/{bot_id}/status-stream`** (Aşama 2+)
    *   Açıklama: Belirli bir botun durumu için Server-Sent Events (SSE) akışı başlatır.
    *   Kimlik Doğrulama: Gerekli (token query parametresi veya cookie ile yapılabilir).
    *   Response: `text/event-stream`
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

## İşlemler (`/trades`) (Aşama 2+)

*   **`GET /trades`**
    *   Açıklama: Mevcut kullanıcının tüm işlemlerini listeler. Query parametreleri ile filtrelenebilir (bot_id, symbol, date_from, date_to).
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `200 OK` - `List[TradeResponse]`
    *   Hatalar: `401 Unauthorized`

*   **`GET /trades/{trade_id}`**
    *   Açıklama: Belirli bir işlemin detaylarını getirir.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `trade_id` (Integer)
    *   Response: `200 OK` - `TradeResponse`
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

## Backtests (`/backtests`) (Aşama 3+)

*   **`POST /backtests`**
    *   Açıklama: Yeni bir backtest görevi başlatır.
    *   Kimlik Doğrulama: Gerekli.
    *   Request Body: `BacktestConfigCreate` (sembol, timeframe, başlangıç/bitiş tarihi, strateji, parametreler)
    *   Response: `202 Accepted` - `BacktestJobResponse` (backtest_id, status)
    *   Hatalar: `400 Bad Request`, `401 Unauthorized`

*   **`GET /backtests`**
    *   Açıklama: Mevcut kullanıcının tüm backtest görevlerini listeler.
    *   Kimlik Doğrulama: Gerekli.
    *   Response: `200 OK` - `List[BacktestJobResponse]`
    *   Hatalar: `401 Unauthorized`

*   **`GET /backtests/{backtest_id}`**
    *   Açıklama: Belirli bir backtest'in durumunu ve sonuçlarını (tamamlandıysa) getirir.
    *   Kimlik Doğrulama: Gerekli.
    *   Path Parametre: `backtest_id` (String/UUID)
    *   Response: `200 OK` - `BacktestResultResponse` (durum, P&L, metrikler, işlemler)
    *   Hatalar: `401 Unauthorized`, `404 Not Found`

---
Pydantic Şema Referansları (Örnekler):
(Bu kısım API dokümanında veya ayrı bir şema dokümanında detaylandırılabilir)

*   `UserCreate`: `{ "email": "user@example.com", "password": "securepassword123" }`
*   `BotConfigCreate`: `{ "name": "My BTC Bot", "symbol": "BTC/USDT", "timeframe": "1h", ... }`
*   ...diğer şemalar
