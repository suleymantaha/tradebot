from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_secret = os.getenv("SECRET_KEY")
if ENVIRONMENT == "production" and not _secret:
    raise RuntimeError("SECRET_KEY is required in production")
SECRET_KEY = _secret or "supersecretkey"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# Token süresini 7 güne çıkardık (10080 dakika = 7 gün)
# Önceden 30 dakika idi, şimdi kullanıcı 1 hafta login kalmış olacak
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

# 🆕 Remember Me için 30 günlük token süresi
REMEMBER_ME_EXPIRE_MINUTES = int(os.getenv("REMEMBER_ME_EXPIRE_MINUTES", 43200))  # 30 gün

# Create JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, remember_me: bool = False) -> str:
    """Create a JWT access token with optional remember me functionality."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    elif remember_me:
        # Remember Me seçilirse 30 günlük token
        expire = datetime.utcnow() + timedelta(minutes=REMEMBER_ME_EXPIRE_MINUTES)
    else:
        # Normal login için 7 günlük token
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify and decode JWT token
def verify_access_token(token: str) -> Optional[dict]:
    """Verify a JWT access token and return the payload if valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
