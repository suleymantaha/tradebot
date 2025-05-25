-- TradeBot Database Initialization Script
-- Bu script PostgreSQL container başladığında otomatik çalışır

-- Database ve user'ı oluştur (eğer yoksa)
DO $$
BEGIN
    -- Database oluştur
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tradebot_db') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE tradebot_db');
    END IF;

    -- User oluştur
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tradebot_user') THEN
        CREATE USER tradebot_user WITH PASSWORD 'tradebot_secure_pass_123';
    END IF;

    -- Permissions ver
    GRANT ALL PRIVILEGES ON DATABASE tradebot_db TO tradebot_user;
    GRANT ALL ON SCHEMA public TO tradebot_user;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO tradebot_user;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO tradebot_user;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO tradebot_user;

    -- Future objects için de permission ver
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tradebot_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tradebot_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO tradebot_user;

END
$$;

-- Initial data (opsiyonel)
-- Bu kısım Alembic migration'lardan sonra çalışacak

\echo 'TradeBot database initialization completed successfully!'
