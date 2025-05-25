#!/bin/bash

echo "🚀 Starting TradeBot Backend..."

# Database bağlantısını bekle
echo "⏳ Waiting for database connection..."
while ! pg_isready -h postgres -p 5432 -U tradebot_user; do
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 2
done

echo "✅ Database connection established!"

# Redis bağlantısını kontrol et
echo "⏳ Checking Redis connection..."
while ! redis-cli -h redis ping > /dev/null 2>&1; do
    echo "⏳ Waiting for Redis to be ready..."
    sleep 2
done

echo "✅ Redis connection established!"

# Alembic migration'ları çalıştır
echo "🔄 Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migrations failed!"
    exit 1
fi

# Health check endpoint'ini main app'e ekle
python3 -c "
import sys
import os
sys.path.append('/app')

# Health router'ı main app'e ekle
health_router_content = '''
# Health check router
from app.api.routes.health import router as health_router
app.include_router(health_router)
'''

# main.py dosyasının sonuna ekle
with open('/app/app/main.py', 'r') as f:
    content = f.read()

if 'health_router' not in content:
    with open('/app/app/main.py', 'a') as f:
        f.write(health_router_content)
    print('✅ Health check endpoint added to main app')
else:
    print('✅ Health check endpoint already exists')
"

echo "🎯 Starting FastAPI server..."

# Production modda uvicorn başlat
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --access-log \
    --no-server-header
