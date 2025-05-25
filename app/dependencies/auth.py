from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.jwt import verify_access_token
from app.models.user import User
from app.database import SessionLocal
from app.schemas.token import TokenData
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: AsyncSession = Depends(get_db)) -> Optional[User]:
    """Optional authentication - returns User if authenticated, None if not"""
    if not token:
        return None

    try:
        payload = verify_access_token(token)
        if payload is None:
            return None

        email: str = payload.get("sub")
        if email is None:
            return None

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        # Check if user is active
        if user and user.is_active:
            return user
        return None
    except:
        return None
