from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        if (len(v) < 12
            or not any(c.islower() for c in v)
            or not any(c.isupper() for c in v)
            or not any(c.isdigit() for c in v)
            or not any(not c.isalnum() for c in v)):
            raise ValueError("Şifre politikası: en az 12 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool

    model_config = {
        "from_attributes": True
    }

# 🆕 Şifre sıfırlama için yeni schema'lar
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str):
        if (len(v) < 12
            or not any(c.islower() for c in v)
            or not any(c.isupper() for c in v)
            or not any(c.isdigit() for c in v)
            or not any(not c.isalnum() for c in v)):
            raise ValueError("Şifre politikası: en az 12 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.")
        return v

class PasswordResetResponse(BaseModel):
    message: str
