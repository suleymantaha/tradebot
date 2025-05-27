#!/bin/bash

echo "🐘 TradeBot Veritabanı Kurulumu (Sistem PostgreSQL)"
echo "================================================="

# PostgreSQL servisinin çalışıp çalışmadığını kontrol et
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL servisi çalışmıyor!"
    echo "🔄 Servisi başlatmak için: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL servisi çalışıyor."

# Kullanıcı ve veritabanı oluştur
echo "📊 Kullanıcı ve veritabanı oluşturuluyor..."

# Manuel olarak komutları çalıştır
sudo -u postgres psql << 'EOF'
-- Kullanıcı oluştur
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'tradebot_user') THEN

      CREATE ROLE tradebot_user LOGIN PASSWORD 'tradebot_secure_pass_123';
   END IF;
END
$$;

-- Database oluştur
SELECT 'CREATE DATABASE tradebot_db OWNER tradebot_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tradebot_db')\gexec

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE tradebot_db TO tradebot_user;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Kullanıcı ve veritabanı başarıyla oluşturuldu!"
else
    echo "❌ Kullanıcı/veritabanı oluşturma hatası!"
    exit 1
fi

# tradebot_db'ye bağlan ve ek yetkileri ver
echo "🔐 Ek yetkiler veriliyor..."
sudo -u postgres psql -d tradebot_db << 'EOF'
GRANT ALL ON SCHEMA public TO tradebot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradebot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradebot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tradebot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tradebot_user;
EOF

echo "✅ Yetkiler başarıyla verildi!"

# Bağlantıyı test et
echo "🔍 Bağlantı test ediliyor..."
if PGPASSWORD=tradebot_secure_pass_123 psql -h localhost -U tradebot_user -d tradebot_db -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ TradeBot veritabanı bağlantısı başarılı!"
    echo ""
    echo "📋 Bağlantı Bilgileri:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: tradebot_db"
    echo "   Username: tradebot_user"
    echo "   Password: tradebot_secure_pass_123"
    echo ""
    echo "🌐 pgAdmin: http://localhost:5050"
    echo "   Email: admin@tradebot.local"
    echo "   Password: admin123"
else
    echo "❌ Veritabanı bağlantı testi başarısız!"
    exit 1
fi
