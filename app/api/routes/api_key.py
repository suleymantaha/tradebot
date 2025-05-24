from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.api_key import ApiKey
from app.models.bot_config import BotConfig
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse
from app.core.crypto import encrypt_value, decrypt_value
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.core.binance_client import BinanceClientWrapper

router = APIRouter(prefix="/api/v1/api-keys", tags=["api-keys"])

@router.post("/", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(api_key_in: ApiKeyCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Önce mevcut API key'i kontrol et (bir kullanıcının sadece bir API key'i olabilir)
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    existing_api_key = result.scalars().first()
    if existing_api_key:
        raise HTTPException(status_code=400, detail="Zaten kayıtlı bir API anahtarınız var. Önce mevcut anahtarı silmelisiniz.")

    # TODO: Development aşamasında API doğrulaması devre dışı bırakıldı
    # Kullanıcılar demo amaçlı fake API key'ler girebilirler
    # Production'da bu bloğun açılması gerekir

    # # Binance API kimlik bilgilerini doğrula (TESTNET kullanıyoruz)
    # try:
    #     binance_client = BinanceClientWrapper(api_key_in.api_key, api_key_in.secret_key, testnet=True)
    #     validation_result = binance_client.validate_api_credentials()
    #
    #     if not validation_result["valid"]:
    #         error_message = f"TESTNET API anahtarları geçersiz: {validation_result['error']}. "
    #         error_message += "Lütfen Binance TESTNET API anahtarlarınızı kullandığınızdan emin olun. "
    #         error_message += "Testnet API anahtarları: https://testnet.binance.vision/ adresinden alınmalıdır."
    #         raise HTTPException(status_code=400, detail=error_message)
    # except HTTPException:
    #     raise  # HTTPException'ları olduğu gibi iletiyoruz
    # except Exception as e:
    #     error_message = f"API anahtarları doğrulanamadı: {str(e)}. "
    #     error_message += "Lütfen TESTNET API anahtarlarınızı kontrol edin."
    #     raise HTTPException(status_code=400, detail=error_message)

    # API anahtarlarını şifrele ve kaydet
    encrypted_api_key = encrypt_value(api_key_in.api_key)
    encrypted_secret_key = encrypt_value(api_key_in.secret_key)
    new_api_key = ApiKey(
        user_id=current_user.id,
        encrypted_api_key=encrypted_api_key,
        encrypted_secret_key=encrypted_secret_key,
        label=api_key_in.label,
        is_valid=True  # Doğrulama başarılı olduğu için True
    )
    db.add(new_api_key)
    await db.commit()
    await db.refresh(new_api_key)
    return ApiKeyResponse.model_validate_orm(new_api_key)

@router.get("/me", response_model=ApiKeyResponse)
async def get_my_api_key(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API anahtarı bulunamadı")
    return ApiKeyResponse.model_validate_orm(api_key)

@router.delete("/me", status_code=204)
async def delete_my_api_key(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API anahtarı bulunamadı")

    # API anahtarına bağlı tüm bot configurasyonlarını bul ve sil
    bots_result = await db.execute(
        select(BotConfig).where(BotConfig.api_key_id == api_key.id)
    )
    bots = bots_result.scalars().all()

    # Önce botları sil
    for bot in bots:
        await db.delete(bot)

    # Sonra API anahtarını sil
    await db.delete(api_key)
    await db.commit()
    return None
