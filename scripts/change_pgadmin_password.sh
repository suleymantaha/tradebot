#!/bin/bash

echo "🌐 pgAdmin Şifre Değiştirme Tool'u"
echo "=================================="

# Yeni şifre iste
read -s -p "🔑 pgAdmin için yeni şifre girin: " NEW_PASSWORD
echo
read -s -p "🔑 Şifreyi tekrar girin: " CONFIRM_PASSWORD
echo

# Şifrelerin eşleşip eşleşmediğini kontrol et
if [ "$NEW_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
    echo "❌ Şifreler eşleşmiyor!"
    exit 1
fi

# Şifre uzunluğunu kontrol et
if [ ${#NEW_PASSWORD} -lt 6 ]; then
    echo "❌ Şifre en az 6 karakter olmalı!"
    exit 1
fi

echo "🔄 pgAdmin şifresi değiştiriliyor..."

# docker-compose-pgadmin-only.yml dosyasını güncelle
if [ -f docker-compose-pgadmin-only.yml ]; then
    # Eski şifreyi yenisiyle değiştir
    sed -i "s/PGADMIN_DEFAULT_PASSWORD:.*/PGADMIN_DEFAULT_PASSWORD: $NEW_PASSWORD/" docker-compose-pgadmin-only.yml

    echo "✅ pgAdmin yapılandırması güncellendi!"

    # pgAdmin container'ını yeniden başlat
    echo "🔄 pgAdmin yeniden başlatılıyor..."
    docker-compose -f docker-compose-pgadmin-only.yml down
    docker-compose -f docker-compose-pgadmin-only.yml up -d

    if [ $? -eq 0 ]; then
        echo "✅ pgAdmin başarıyla yeniden başlatıldı!"
        echo ""
        echo "📋 Yeni Giriş Bilgileri:"
        echo "   URL: http://localhost:5050"
        echo "   Email: admin@tradebot.local"
        echo "   Password: $NEW_PASSWORD"
    else
        echo "❌ pgAdmin yeniden başlatma başarısız!"
        exit 1
    fi
else
    echo "❌ docker-compose-pgadmin-only.yml dosyası bulunamadı!"
    exit 1
fi
