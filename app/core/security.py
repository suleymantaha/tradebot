from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash a password for storing

def get_password_hash(password: str) -> str:
    """Hash the given password using bcrypt."""
    return pwd_context.hash(password)

# Verify a stored password against one provided by user

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed version."""
    return pwd_context.verify(plain_password, hashed_password)
