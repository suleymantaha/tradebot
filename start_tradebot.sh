#!/bin/bash

echo "🚀 TradeBot başlatılıyor..."

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if Docker is running
check_docker() {
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Docker Desktop on macOS
start_docker_macos() {
    echo "⚠️  Docker çalışmıyor, Docker Desktop başlatılıyor..."
    open -a Docker

    echo "⏳ Docker Desktop'ın başlaması bekleniyor..."
    local max_wait=60
    local wait_time=0

    while [ $wait_time -lt $max_wait ]; do
        sleep 5
        wait_time=$((wait_time + 5))

        if check_docker; then
            echo "✅ Docker Desktop başarıyla başlatıldı!"
            return 0
        fi

        echo "⏳ Docker başlatılıyor... (${wait_time}/${max_wait}s)"
    done

    echo "❌ Docker Desktop belirtilen sürede başlatılamadı!"
    echo "Lütfen Docker Desktop'ı manuel olarak açın ve tekrar deneyin."
    return 1
}

# Check if Docker is running
if ! check_docker; then
    echo "⚠️  Docker servisi çalışmıyor..."

    # Detect platform and try to start Docker
    case "$(uname -s)" in
        Darwin*)
            if ! start_docker_macos; then
                exit 1
            fi
            ;;
        Linux*)
            echo "Linux sistemde Docker servisini başlatmak için sudo gerekebilir..."
            sudo systemctl start docker
            sleep 3
            if ! check_docker; then
                echo "❌ Docker servisi başlatılamadı!"
                echo "Lütfen 'sudo systemctl start docker' komutunu çalıştırın."
                exit 1
            fi
            echo "✅ Docker servisi başlatıldı!"
            ;;
        *)
            echo "❌ Desteklenmeyen platform. Lütfen Docker'ı manuel olarak başlatın."
            exit 1
            ;;
    esac
else
    echo "✅ Docker servisi çalışıyor!"
fi

# Start TradeBot services
echo ""
echo "🔨 TradeBot servisleri başlatılıyor..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 TradeBot başarıyla başlatıldı!"
echo ""
    echo "📊 Erişim Linkleri:"
    echo "   Frontend:    http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   pgAdmin:     http://localhost:5050"
echo ""
    echo "⏳ Servislerin tam olarak hazır olması 30-60 saniye sürebilir..."
    echo "🌐 Tarayıcı otomatik olarak açılacak..."

sleep 3

# Open in default browser
    if command -v open > /dev/null; then
        open "http://localhost:3000" &
    elif command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:3000" &
fi

    echo ""
    echo "✅ TradeBot hazır!"
    echo "💡 Durdurma için: ./stop_tradebot.sh komutunu kullanın"
else
    echo ""
    echo "❌ TradeBot başlatılırken hata oluştu!"
    echo "🔍 Hata detayları için: docker-compose logs"
    exit 1
fi
