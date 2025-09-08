# Aşama 1: MVP Geliştirme

## Görev: 01_07_BACKEND_DATABASE_SCHEMA - Veritabanı Şeması ve Migration'lar

**Amaç:** Projenin MVP aşaması için gerekli tüm veritabanı tablolarını SQLAlchemy modelleri olarak tanımlamak ve Alembic kullanarak veritabanı migration script'lerini oluşturmak.

**Kapsam / Yapılacaklar:**

1. **SQLAlchemy Base ve Engine Kurulumu:**
    - [ ] `database.py` (veya benzeri) bir dosyada SQLAlchemy `engine`, `SessionLocal` ve `Base` (declarative base) tanımlanacak.
    - [ ] Asenkron engine (`create_async_engine`) ve session (`AsyncSession`) kullanılacak.
2. **Alembic Kurulumu ve Yapılandırması:**
    - [ ] `alembic init alembic` komutu ile Alembic yapısı oluşturulacak.
    - [ ] `alembic.ini` dosyasında `sqlalchemy.url` veritabanı bağlantı bilgisi ile güncellenecek.
    - [ ] `alembic/env.py` dosyasında `target_metadata = Base.metadata` satırı eklenerek SQLAlchemy modellerinin Alembic tarafından tanınması sağlanacak.
3. **Veritabanı Modellerinin Tanımlanması (SQLAlchemy):**
    - **`User` Modeli (`models/user.py`):**
        - [ ] `id` (Integer, Primary Key, Autoincrement)
        - [ ] `email` (String, Unique, Index)
        - [ ] `hashed_password` (String)
        - [ ] `is_active` (Boolean, default=True)
        - [ ] `created_at` (DateTime, default=func.now())
        - [ ] `updated_at` (DateTime, default=func.now(), onupdate=func.now())
        - [ ] İlişkiler: `api_keys` (one-to-many to ApiKey), `bot_configs` (one-to-many to BotConfig)
    - **`ApiKey` Modeli (`models/api_key.py`):**
        - [ ] `id` (Integer, Primary Key, Autoincrement)
        - [ ] `user_id` (Integer, ForeignKey("users.id"), Index)
        - [ ] `encrypted_api_key` (String)
        - [ ] `encrypted_secret_key` (String)
        - [ ] `label` (String, nullable=True, örn: "My Main Binance Account") - MVP'de basit tutulabilir, sadece bir tane olacağı için.
        - [ ] `is_valid` (Boolean, default=False)
        - [ ] `created_at` (DateTime, default=func.now())
        - [ ] `updated_at` (DateTime, default=func.now(), onupdate=func.now())
        - [ ] İlişki: `owner` (many-to-one to User)
    - **`BotConfig` Modeli (`models/bot_config.py`):**
        - [ ] `id` (Integer, Primary Key, Autoincrement)
        - [ ] `user_id` (Integer, ForeignKey("users.id"), Index)
        - [ ] `name` (String, örn: "BTC/USDT EMA Cross")
        - [ ] `symbol` (String, örn: "BTC/USDT")
        - [ ] `timeframe` (String, örn: "1h")
        - [ ] `is_active` (Boolean, default=False, botun çalışıp çalışmadığını manuel olarak kontrol eder)
        - [ ] `initial_capital` (Numeric, nullable=True, bilgi amaçlı)
        - [ ] `daily_target_perc` (Numeric, nullable=True)
        - [ ] `max_daily_loss_perc` (Numeric, nullable=True)
        - [ ] `position_size_perc` (Numeric, nullable=True, örn: bakiye yüzdesi)
        - [ ] `position_size_fixed` (Numeric, nullable=True, örn: sabit USDT miktarı)
        - [ ] `stop_loss_perc` (Numeric)
        - [ ] `take_profit_perc` (Numeric)
        - [ ] `trailing_stop_perc` (Numeric, nullable=True)
        - [ ] `trailing_stop_active` (Boolean, default=False)
        - [ ] `ema_fast` (Integer)
        - [ ] `ema_slow` (Integer)
        - [ ] `rsi_period` (Integer)
        - [ ] `rsi_oversold` (Integer)
        - [ ] `rsi_overbought` (Integer)
        - [ ] `max_daily_trades` (Integer, nullable=True)
        - [ ] `check_interval_seconds` (Integer, default=60)
        - [ ] `created_at` (DateTime, default=func.now())
        - [ ] `updated_at` (DateTime, default=func.now(), onupdate=func.now())
        - [ ] İlişkiler: `owner` (many-to-one to User), `state` (one-to-one to BotState), `trades` (one-to-many to Trade)
    - **`BotState` Modeli (`models/bot_state.py`):**
        - [ ] `id` (Integer, Primary Key, ForeignKey("bot_configs.id")) # One-to-one ilişki için
        - [ ] `status` (String, default="stopped", örn: "running", "stopped", "error")
        - [ ] `in_position` (Boolean, default=False)
        - [ ] `entry_price` (Numeric, nullable=True)
        - [ ] `current_position_size_coins` (Numeric, nullable=True)
        - [ ] `trailing_stop_price` (Numeric, nullable=True)
        - [ ] `max_price_since_entry` (Numeric, nullable=True) # Trailing stop için
        - [ ] `take_profit_price` (Numeric, nullable=True)
        - [ ] `stop_loss_price` (Numeric, nullable=True)
        - [ ] `daily_pnl` (Numeric, default=0.0)
        - [ ] `daily_trades_count` (Integer, default=0)
        - [ ] `last_run_at` (DateTime, nullable=True)
        - [ ] `last_error_message` (Text, nullable=True)
        - [ ] `last_updated_at` (DateTime, default=func.now(), onupdate=func.now())
        - [ ] İlişki: `config` (one-to-one to BotConfig)
    - **`Trade` Modeli (`models/trade.py`):**
        - [ ] `id` (Integer, Primary Key, Autoincrement)
        - [ ] `bot_config_id` (Integer, ForeignKey("bot_configs.id"), Index)
        - [ ] `user_id` (Integer, ForeignKey("users.id"), Index) # Denormalizasyon, sorgu kolaylığı için
        - [ ] `binance_order_id` (String, nullable=True, Unique)
        - [ ] `symbol` (String)
        - [ ] `side` (String, örn: "BUY", "SELL")
        - [ ] `order_type` (String, örn: "MARKET", "LIMIT")
        - [ ] `price` (Numeric) # Ortalama dolum fiyatı
        - [ ] `quantity_filled` (Numeric) # Dolan miktar
        - [ ] `quote_quantity_filled` (Numeric) # Dolan quote miktar (örn: USDT)
        - [ ] `commission_amount` (Numeric, nullable=True)
        - [ ] `commission_asset` (String, nullable=True)
        - [ ] `pnl` (Numeric, nullable=True) # Bu işlemden elde edilen P&L (genellikle pozisyon kapanınca hesaplanır)
        - [ ] `timestamp` (DateTime, default=func.now())
        - [ ] İlişkiler: `bot` (many-to-one to BotConfig), `user` (many-to-one to User)
4. **İlk Migration'ın Oluşturulması:**
    - [ ] `alembic revision -m "create_initial_tables"` komutu ile boş bir migration dosyası oluşturulacak.
    - [ ] Migration dosyasının `upgrade()` fonksiyonuna `op.create_table()` komutları ile yukarıdaki tabloların oluşturulma kodları eklenecek.
    - [ ] `downgrade()` fonksiyonuna `op.drop_table()` komutları eklenecek.
    - [ ] Alternatif olarak, `env.py`'de `compare_type=True` ayarı ile otomatik migration script üretimi (`alembic revision -m "message" --autogenerate`) kullanılabilir (modeller `models/__init__.py` veya benzeri bir yerden import edilmeli).
5. **Veritabanına Uygulama:**
    - [ ] `alembic upgrade head` komutu ile migration'lar veritabanına uygulanacak.

**Teknik Detaylar:**
- Tüm modeller `Base` sınıfından türetilecek.
- İlişkiler (`relationship` ve `ForeignKey`) doğru bir şekilde tanımlanacak.
- Gerekli yerlerde index'ler (`index=True`) kullanılacak.
- `Numeric` tipinin hassasiyeti (precision, scale) finansal veriler için uygun şekilde ayarlanmalı.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- Modellerde değişiklik yapıldığında yeni migration'lar (`alembic revision -m "message" --autogenerate`) oluşturulmalı ve uygulanmalıdır.
- Veritabanı şeması, projenin erken aşamalarında dikkatlice planlanmalı, çünkü sonradan büyük değişiklikler yapmak zor olabilir.
- Şifrelenmiş veriler (API anahtarları) için `String` veya `Text` tipi kullanılabilir, şifreleme/çözme uygulama katmanında yapılır.

**Bağımlılıklar:**
- [Geliştirme Ortamı Kurulumu](_PARENT_DIR_/_PARENT_DIR_/00_PLANNING_AND_SETUP/00_03_DEV_ENVIRONMENT_SETUP.md) (SQLAlchemy, Alembic, PostgreSQL).
- Diğer backend görevleri bu modellere bağımlı olacaktır.
