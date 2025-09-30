from cryptography.fernet import Fernet
import os

# Anahtar yönetimi: Gerçek ortamda bu anahtar .env veya güvenli bir yerde tutulmalı
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_env_key = os.getenv("FERNET_KEY")

if ENVIRONMENT == "production":
    if not _env_key:
        raise RuntimeError("FERNET_KEY is required in production environment")
    FERNET_KEY = _env_key
else:
    FERNET_KEY = _env_key or Fernet.generate_key().decode()

fernet = Fernet(FERNET_KEY.encode())

def encrypt_value(value: str) -> str:
    """Verilen değeri şifreler."""
    return fernet.encrypt(value.encode()).decode()

def decrypt_value(token: str) -> str:
    """Şifreli değeri çözer."""
    return fernet.decrypt(token.encode()).decode()
