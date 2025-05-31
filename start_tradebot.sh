#!/bin/bash
echo "TradeBot başlatılıyor..."
cd "/Users/baba/Documents/tradebot"
docker-compose up -d

echo ""
echo "TradeBot başlatıldı!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "pgAdmin: http://localhost:5050"
echo ""
echo "Tarayıcılar otomatik olarak açılacak..."
sleep 3

# Open in default browser
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v open > /dev/null; then
    open "http://localhost:3000" &
fi

echo "TradeBot hazır!"
