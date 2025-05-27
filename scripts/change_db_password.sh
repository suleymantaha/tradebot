#!/bin/bash

echo "🔐 PostgreSQL Şifre Değiştirme Tool'u"
echo "====================================="

# Yeni şifre iste
read -s -p "🔑 tradebot_user için yeni şifre girin: " NEW_PASSWORD
echo
read -s -p "🔑 Şifreyi tekrar girin: " CONFIRM_PASSWORD
echo

# Şifrelerin eşleşip eşleşmediğini kontrol et
if [ "$NEW_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
    echo "❌ Şifreler eşleşmiyor!"
    exit 1
fi

# Şifre uzunluğunu kontrol et
if [ ${#NEW_PASSWORD} -lt 8 ]; then
    echo "❌ Şifre en az 8 karakter olmalı!"
    exit 1
fi

echo "🔄 PostgreSQL şifresi değiştiriliyor..."

# PostgreSQL'de şifreyi değiştir
sudo -u postgres psql << EOF
ALTER USER tradebot_user PASSWORD '$NEW_PASSWORD';
EOF

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL şifresi başarıyla değiştirildi!"

    # .env dosyasını güncelle
    if [ -f .env ]; then
        echo "📝 .env dosyası güncelleniyor..."

        # Eski şifreyi yenisiyle değiştir
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env

        echo "✅ .env dosyası güncellendi!"
        echo ""
        echo "⚠️  ÖNEMLİ:"
        echo "   - Backend servislerini yeniden başlatın"
        echo "   - pgAdmin bağlantı ayarlarını güncelleyin"
    else
        echo "⚠️  .env dosyası bulunamadı - manuel güncelleme gerekli!"
    fi
else
    echo "❌ Şifre değiştirme başarısız!"
    exit 1
fi
