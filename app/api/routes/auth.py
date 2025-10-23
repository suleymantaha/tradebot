from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import secrets
import hashlib
from app.core.rate_limit import enforce_rate_limit, get_client_ip
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password
from app.core.jwt import create_access_token
from app.dependencies.auth import get_db, get_current_active_user
import os
from typing import cast, Any

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(status_code=409, detail="Email already registered")
    hashed_password = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit: IP and email
    client_ip = get_client_ip(request)
    await enforce_rate_limit(f"rl:login:ip:{client_ip}", limit=5, window_seconds=60)
    await enforce_rate_limit(f"rl:login:email:{user_in.email.lower()}", limit=10, window_seconds=3600)

    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, cast(str, user.hashed_password)):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not cast(bool, user.is_active):
        raise HTTPException(status_code=400, detail="Inactive user")

    # 🆕 Remember Me desteği ile token oluştur
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        remember_me=bool(user_in.remember_me)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# 🆕 Şifre sıfırlama endpoint'leri
@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(
    req: Request,
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Şifre sıfırlama talebi oluştur ve email gönder"""
    try:
        # Rate limit: IP and email
        client_ip = get_client_ip(req)
        await enforce_rate_limit(f"rl:forgot:ip:{client_ip}", limit=5, window_seconds=60)
        await enforce_rate_limit(f"rl:forgot:email:{request.email.lower()}", limit=3, window_seconds=3600)

        # Kullanıcıyı bul
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()

        if not user:
            # Güvenlik için her durumda success döndür (email enumeration'ı önlemek için)
            return PasswordResetResponse(message="Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.")

        if not cast(bool, user.is_active):
            return PasswordResetResponse(message="Hesap aktif değil.")

        # Reset token oluştur (güvenli random string)
        reset_token = secrets.token_urlsafe(32)
        reset_token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        # Database'de token'ı hash olarak sakla
        cast(Any, user).reset_token = reset_token_hash
        cast(Any, user).reset_token_expires = expires_at
        await db.commit()

        # 🔧 User'ı refresh et (lazy loading sorununu çözmek için)
        await db.refresh(user)

        # 🔧 Sadece console'a yazdır (email service kullanma)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        print("=" * 60)
        print("📧 PASSWORD RESET EMAIL (DEVELOPMENT MODE)")
        print("=" * 60)
        print(f"📧 To: {user.email}")
        print(f"📧 Subject: 🔐 Şifre Sıfırlama Talebi - TradeBot")
        print(f"🔗 Reset URL: {reset_url}")
        print(f"🔑 Token: {reset_token}")
        print("=" * 60)

        # 🔧 Development mode'da reset URL'i de response'a ekle
        if os.getenv("ENVIRONMENT", "development") == "development":
            return PasswordResetResponse(message=f"Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.\n\n🔧 DEV MODE: {reset_url}")

        return PasswordResetResponse(message="Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.")

    except Exception as e:
        print(f"❌ Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Şifre sıfırlama talebi işlenirken hata oluştu.")

@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset token ile şifreyi sıfırla"""
    try:
        # Token'ı ve süresini kontrol et
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()
        result = await db.execute(
            select(User).where(
                User.reset_token == token_hash,
                User.reset_token_expires > datetime.now(timezone.utc)
            )
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş token.")

        if not cast(bool, user.is_active):
            raise HTTPException(status_code=400, detail="Hesap aktif değil.")

        # Şifre politikası kontrolü
        pw = request.new_password
        if (len(pw) < 12
            or not any(c.islower() for c in pw)
            or not any(c.isupper() for c in pw)
            or not any(c.isdigit() for c in pw)
            or not any(not c.isalnum() for c in pw)):
            raise HTTPException(status_code=400, detail="Şifre politikası: en az 12 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.")

        # Yeni şifreyi hashle ve kaydet
        cast(Any, user).hashed_password = get_password_hash(request.new_password)

        # Reset token'ı temizle
        cast(Any, user).reset_token = None
        cast(Any, user).reset_token_expires = None

        await db.commit()

        # 🔧 User'ı refresh et (lazy loading sorununu çözmek için)
        await db.refresh(user)

        print(f"✅ Password reset successful for: {user.email}")

        return PasswordResetResponse(message="Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Şifre sıfırlama işlemi sırasında hata oluştu.")
