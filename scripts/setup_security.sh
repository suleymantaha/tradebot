#!/bin/bash

echo "🔒 TradeBot Güvenlik Kurulumu"
echo "============================="

# Python kontrol et
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 bulunamadı! Lütfen Python3 kurun."
    exit 1
fi

echo "🔑 Güvenlik anahtarları oluşturuluyor..."

# SECRET_KEY oluştur (JWT için)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# FERNET_KEY oluştur (API anahtarları şifreleme için)
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# .env dosyası oluştur
cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=tradebot_secure_pass_123

# Security Keys (OTOMATIK OLUŞTURULDU - DEĞİŞTİRMEYİN!)
SECRET_KEY=$SECRET_KEY
FERNET_KEY=$FERNET_KEY

# JWT Configuration
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
VITE_API_URL=http://localhost:8000

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database URL
DATABASE_URL=postgresql+asyncpg://tradebot_user:tradebot_secure_pass_123@localhost:5432/tradebot_db
EOF

echo "✅ .env dosyası oluşturuldu!"
echo ""
echo "📋 Oluşturulan Ayarlar:"
echo "   🐘 PostgreSQL Şifresi: tradebot_secure_pass_123"
echo "   🔐 SECRET_KEY: ✅ Oluşturuldu (64 karakter)"
echo "   🔒 FERNET_KEY: ✅ Oluşturuldu (44 karakter)"
echo ""
echo "⚠️  GÜVENLİK UYARILARI:"
echo "   ❗ .env dosyasını kimseyle paylaşmayın!"
echo "   ❗ Git'e .env dosyasını push etmeyin!"
echo "   ❗ Production'da şifreleri değiştirin!"
echo ""
echo "🔧 Şifre değiştirmek için:"
echo "   🐘 Database: ./scripts/change_db_password.sh"
echo "   🌐 pgAdmin: ./scripts/change_pgadmin_password.sh"
