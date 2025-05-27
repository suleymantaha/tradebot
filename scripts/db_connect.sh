#!/bin/bash

# TradeBot PostgreSQL Bağlantı Script'i
# Kullanım: ./scripts/db_connect.sh

echo "🐘 TradeBot PostgreSQL'e bağlanılıyor..."

# Docker container'ının çalışıp çalışmadığını kontrol et
if ! docker ps | grep -q tradebot-postgres; then
    echo "❌ PostgreSQL container'ı çalışmıyor!"
    echo "🔄 Container'ı başlatmak için: docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL container'ı çalışıyor."
echo "📡 Veritabanına bağlanılıyor..."
echo ""
echo "💡 Yararlı komutlar:"
echo "   \\dt              - Tabloları listele"
echo "   \\d users         - Users tablosu yapısı"
echo "   \\d bot_configs   - Bot configs tablosu yapısı"
echo "   \\q               - Çıkış"
echo ""

# PostgreSQL'e bağlan
docker exec -it tradebot-postgres psql -U tradebot_user -d tradebot_db
