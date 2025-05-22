from cryptography.fernet import Fernet
import os

# Anahtar yönetimi: Gerçek ortamda bu anahtar .env veya güvenli bir yerde tutulmalı
FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key().decode())
fernet = Fernet(FERNET_KEY.encode())

def encrypt_value(value: str) -> str:
    """Verilen değeri şifreler."""
    return fernet.encrypt(value.encode()).decode()

def decrypt_value(token: str) -> str:
    """Şifreli değeri çözer."""
    return fernet.decrypt(token.encode()).decode()
