#!/usr/bin/env python3
"""
TradeBot Security Setup Script
==============================
Güvenli environment değişkenleri oluşturur
"""

import os
import secrets
import string
from pathlib import Path
from cryptography.fernet import Fernet
from urllib.parse import quote

def generate_secure_password(length=32):
    """Güvenli şifre oluştur"""
    # URL-safe karakterler kullan
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_secret_key():
    """Güvenli secret key oluştur"""
    return secrets.token_urlsafe(32)

def generate_fernet_key():
    """Güvenli fernet key oluştur"""
    return Fernet.generate_key().decode()

def create_secure_env():
    """Güvenli .env dosyası oluştur"""
    print("TradeBot Guvenlik Kurulumu")
    print("=" * 40)
    
    # Mevcut .env dosyasını kontrol et
    env_path = Path(".env")
    if env_path.exists():
        response = input(".env dosyasi zaten mevcut. Uzerine yazmak istiyor musunuz? (y/N): ")
        if response.lower() != 'y':
            print("Islem iptal edildi.")
            return
    
    # Güvenli değerler oluştur
    print("Guvenli anahtarlar olusturuluyor...")
    
    postgres_password = generate_secure_password(24)
    secret_key = generate_secret_key()
    fernet_key = generate_fernet_key()
    pgadmin_password = generate_secure_password(16)
    redis_password = generate_secure_password(24)
    pgpass_enc = quote(postgres_password, safe='')
    
    # .env içeriği
    env_content = f"""# ========================================
# TradeBot Environment Configuration
# ========================================
# Bu dosya otomatik oluşturuldu
# ÖNEMLİ: Bu dosyayı git'e commit etmeyin!

# ====================================
# DATABASE CONFIGURATION
# ====================================
POSTGRES_PASSWORD={postgres_password}

# ====================================
# PGADMIN CONFIGURATION (Development)
# ====================================
PGADMIN_DEFAULT_EMAIL=admin@tradebot.local
PGADMIN_DEFAULT_PASSWORD={pgadmin_password}

# ====================================
# SECURITY CONFIGURATION
# ====================================
SECRET_KEY={secret_key}
ALGORITHM=HS512
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ====================================
# ENCRYPTION CONFIGURATION
# ====================================
FERNET_KEY={fernet_key}

# ====================================
# APPLICATION CONFIGURATION
# ====================================
ENVIRONMENT=production
LOG_LEVEL=INFO
LIVE_TRADING_ENABLED=false
TESTNET_URL=true
TRADE_WEBHOOK_URL=

# Binance API anahtarı doğrulama ortamı
VALIDATE_API_ON_TESTNET=0

# SMTP (opsiyonel)
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@tradebot.com

# ====================================
# FRONTEND CONFIGURATION
# ====================================
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:8000

# ====================================
# LOGGING
# ====================================
LOG_FILE=/app/logs/tradebot.log

# ====================================
# REDIS / CELERY CONFIGURATION
# ====================================
REDIS_PASSWORD={redis_password}
REDIS_URL=redis://:{redis_password}@redis:6379/0
CELERY_BROKER_URL=redis://:{redis_password}@redis:6379/0
CELERY_RESULT_BACKEND=redis://:{redis_password}@redis:6379/0

# ====================================
# DATABASE URL
# ====================================
DATABASE_URL=postgresql+asyncpg://tradebot_user:{pgpass_enc}@postgres:5432/tradebot_db
SYNC_DATABASE_URL=postgresql://tradebot_user:{pgpass_enc}@postgres:5432/tradebot_db
"""
    
    # Dosyayı yaz
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
    
    # Dosya izinlerini güvenli hale getir (Unix/Linux)
    if os.name != 'nt':  # Windows değilse
        os.chmod(env_path, 0o600)  # Sadece owner okuyabilir
    
    print("Guvenli .env dosyasi olusturuldu!")
    print(f"Konum: {env_path.absolute()}")
    print()
    print("Olusturulan Guvenli Degerler:")
    print(f"   PostgreSQL Sifresi: {postgres_password[:8]}...")
    print(f"   pgAdmin Sifresi: {pgadmin_password[:8]}...")
    print(f"   Secret Key: {secret_key[:8]}...")
    print(f"   Fernet Key: {fernet_key[:8]}...")
    print()
    print("ONEMLI:")
    print("   - Bu degerleri guvenli bir yerde saklayin")
    print("   - .env dosyasini git'e commit etmeyin")
    print("   - Production'da bu degerleri degistirin")
    print()
    print("Simdi 'docker compose up -d' ile servisleri baslatabilirsiniz!")

if __name__ == "__main__":
    create_secure_env()
