from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse
from app.core.crypto import encrypt_value, decrypt_value
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/api-keys", tags=["api-keys"])

@router.post("/", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(api_key_in: ApiKeyCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    encrypted_api_key = encrypt_value(api_key_in.api_key)
    encrypted_secret_key = encrypt_value(api_key_in.secret_key)
    new_api_key = ApiKey(
        user_id=current_user.id,
        encrypted_api_key=encrypted_api_key,
        encrypted_secret_key=encrypted_secret_key,
        label=api_key_in.label,
        is_valid=False
    )
    db.add(new_api_key)
    await db.commit()
    await db.refresh(new_api_key)
    return new_api_key

@router.get("/", response_model=list[ApiKeyResponse])
async def list_api_keys(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_keys = result.scalars().all()
    return api_keys

@router.delete("/{api_key_id}", status_code=204)
async def delete_api_key(api_key_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == api_key_id, ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.delete(api_key)
    await db.commit()
    return None
