from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.api_key import ApiKey
from app.models.bot_config import BotConfig
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse
from app.core.crypto import encrypt_value, decrypt_value
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
import app.core.binance_client as binance_client_module
from typing import Dict, cast
import logging

router = APIRouter(prefix="/api/v1/api-keys", tags=["api-keys"])

@router.post("/", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(api_key_in: ApiKeyCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Önce mevcut API key'i kontrol et (bir kullanıcının sadece bir API key'i olabilir)
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    existing_api_key = result.scalars().first()
    if existing_api_key:
        raise HTTPException(status_code=400, detail="Zaten kayıtlı bir API anahtarınız var. Önce mevcut anahtarı silmelisiniz.")

    # Binance API kimlik bilgilerini doğrula (GERÇEK TRADING İÇİN AKTİF)
    try:
        client = binance_client_module.BinanceClientWrapper(api_key_in.api_key, api_key_in.secret_key, testnet=False)
        validation_result = client.validate_api_credentials()

        if not validation_result["valid"]:
            error_message = f"API anahtarları geçersiz: {validation_result['error']}. "
            error_message += "Lütfen geçerli Binance API anahtarlarınızı kullandığınızdan emin olun. "
            error_message += "Mainnet API anahtarları için: https://www.binance.com/en/my/settings/api-management"
            raise HTTPException(status_code=400, detail=error_message)
    except HTTPException:
        raise  # HTTPException'ları olduğu gibi iletiyoruz
    except Exception as e:
        error_message = f"API anahtarları doğrulanamadı: {str(e)}. "
        error_message += "Lütfen API anahtarlarınızı kontrol edin."
        raise HTTPException(status_code=400, detail=error_message)

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

@router.get("/balance")
async def get_balance(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Kullanıcının Binance bakiyesini döndürür"""
    logger = logging.getLogger(__name__)

    # API key'i kontrol et
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()

    if not api_key:
        raise HTTPException(status_code=404, detail="API anahtarı bulunamadı")

    try:
        logger.info(f"Balance çekiliyor kullanıcı için: {current_user.id}")

        # API anahtarlarını çöz
        api_key_plain = decrypt_value(cast(str, api_key.encrypted_api_key))
        secret_key_plain = decrypt_value(cast(str, api_key.encrypted_secret_key))

        logger.info(f"API anahtarları başarıyla çözüldü")

        # Binance client oluştur
        binance_client = binance_client_module.BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=False)
        logger.info("Binance client oluşturuldu")

        # Spot ve Futures bakiyelerini al
        logger.info("Spot bakiye çekiliyor...")
        spot_balance = binance_client.get_balance("USDT")
        logger.info(f"Spot bakiye sonucu: {spot_balance}")

        logger.info("Futures bakiye çekiliyor...")
        futures_balance = binance_client.get_futures_balance("USDT")
        logger.info(f"Futures bakiye sonucu: {futures_balance}")

        # None değerlerini 0.0 yap
        spot_balance = spot_balance or 0.0
        futures_balance = futures_balance or 0.0

        result = {
            "spot_balance": spot_balance,
            "futures_balance": futures_balance,
            "total_balance": spot_balance + futures_balance,
            "currency": "USDT"
        }

        logger.info(f"Balance endpoint başarılı sonuç: {result}")
        return result

    except Exception as e:
        logger.error(f"Balance endpoint hatası: {str(e)}", exc_info=True)
        # Gerçek API hatası durumunda hata fırlat (demo mode kapalı)
        raise HTTPException(
            status_code=500,
            detail=f"Bakiye bilgisi alınamadı: {str(e)}. API anahtarlarınızı kontrol edin."
        )
