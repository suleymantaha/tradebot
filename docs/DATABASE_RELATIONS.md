# Veritabanı Tablo İlişkileri

Bu doküman, AlgoTrade Web Platformu'nun PostgreSQL veritabanındaki ana tabloları ve aralarındaki ilişkileri özetler. Modeller SQLAlchemy kullanılarak tanımlanmıştır.

## Ana Tablolar ve İlişkiler

```mermaid
erDiagram
    USERS ||--o{ API_KEYS : "has"
    USERS ||--o{ BOT_CONFIGS : "owns"
    USERS ||--o{ TRADES : "performs (denormalized)"
    USERS ||--o{ BOT_ACTIVITY_LOGS : "generates (denormalized)"
    USERS ||--o{ USER_NOTIFICATION_PREFERENCES : "has"
    USERS ||--o{ BACKTEST_JOBS : "initiates"

    BOT_CONFIGS ||--|{ BOT_STATE : "has one"
    BOT_CONFIGS ||--o{ TRADES : "generates"
    BOT_CONFIGS ||--o{ BOT_ACTIVITY_LOGS : "logs to"

    API_KEYS {
        Integer id PK
        Integer user_id FK
        String encrypted_api_key
        String encrypted_secret_key
        String exchange_name "Default: binance"
        Boolean is_valid
        DateTime created_at
        DateTime updated_at
    }

    USERS {
        Integer id PK
        String email UK
        String hashed_password
        Boolean is_active
        DateTime created_at
        DateTime updated_at
    }

    BOT_CONFIGS {
        Integer id PK
        Integer user_id FK
        String name
        String symbol
        String timeframe
        String exchange_name "Default: binance (FK to ApiKey.exchange_name or independent)"
        Boolean is_active
        String strategy_type "e.g., ema_cross_rsi"
        JSONB strategy_params "Strategy specific params"
        Numeric initial_capital
        Numeric daily_target_perc
        Numeric max_daily_loss_perc
        Numeric position_size_perc
        Numeric position_size_fixed
        Numeric stop_loss_perc
        Numeric take_profit_perc
        Numeric trailing_stop_perc
        Boolean trailing_stop_active
        Integer check_interval_seconds
        JSONB partial_take_profits_config
        Integer max_trade_duration_hours
        DateTime created_at
        DateTime updated_at
    }

    BOT_STATE {
        Integer bot_config_id PK, FK
        String status "running, stopped, error"
        Boolean in_position
        Numeric entry_price
        Numeric current_position_size_coins
        Numeric trailing_stop_price
        Numeric max_price_since_entry
        Numeric take_profit_price
        Numeric stop_loss_price
        Numeric daily_pnl
        Integer daily_trades_count
        DateTime last_run_at
        String last_error_message
        DateTime last_updated_at
    }

    TRADES {
        Integer id PK
        Integer bot_config_id FK
        Integer user_id FK
        String binance_order_id "Or generic exchange_order_id"
        String symbol
        String side "BUY, SELL"
        String order_type "MARKET, LIMIT"
        Numeric price
        Numeric quantity_filled
        Numeric quote_quantity_filled
        Numeric commission_amount
        String commission_asset
        Numeric pnl
        String entry_reason
        String exit_reason
        DateTime timestamp
    }

    BOT_ACTIVITY_LOGS {
        Integer id PK
        Integer bot_config_id FK
        Integer user_id FK
        DateTime timestamp
        String log_level "INFO, WARNING, ERROR, DEBUG"
        String message
        JSONB details
    }

    USER_NOTIFICATION_PREFERENCES {
        Integer id PK
        Integer user_id FK
        String notification_type "e.g., trade_executed, error_occurred"
        Boolean email_enabled
        String webhook_url
        Boolean webhook_enabled
        DateTime created_at
        DateTime updated_at
    }

    BACKTEST_JOBS {
        String id PK "UUID or similar"
        Integer user_id FK
        String status "pending, running, completed, failed"
        JSONB config "Backtest parameters"
        JSONB results "Summary and detailed results"
        DateTime created_at
        DateTime updated_at
    }
