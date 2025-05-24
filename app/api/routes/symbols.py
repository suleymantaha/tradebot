from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.models.api_key import ApiKey
from app.core.crypto import decrypt_value
from app.core.binance_client import BinanceClientWrapper
from sqlalchemy.future import select

router = APIRouter(prefix="/api/v1/symbols", tags=["symbols"])

@router.get("/spot")
async def get_spot_symbols(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Spot trading sembolleri listesi"""
    # Kullanıcının API key'ini al
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()

    if not api_key:
        # API key yoksa demo sembolleri döndür
        return [
            {"symbol": "BTCUSDT", "baseAsset": "BTC", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ETHUSDT", "baseAsset": "ETH", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ADAUSDT", "baseAsset": "ADA", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "BNBUSDT", "baseAsset": "BNB", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "SOLUSDT", "baseAsset": "SOL", "quoteAsset": "USDT", "status": "TRADING"},
        ]

    try:
        # API anahtarlarını çöz
        api_key_plain = decrypt_value(api_key.encrypted_api_key)
        secret_key_plain = decrypt_value(api_key.encrypted_secret_key)

        # Binance client oluştur
        client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=True)
        symbols = client.get_all_symbols()

        if symbols:
            return symbols
        else:
            raise HTTPException(status_code=500, detail="Sembol listesi alınamadı")

    except Exception as e:
        # Hata durumunda demo sembolleri döndür
        return [
            {"symbol": "BTCUSDT", "baseAsset": "BTC", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ETHUSDT", "baseAsset": "ETH", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ADAUSDT", "baseAsset": "ADA", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "BNBUSDT", "baseAsset": "BNB", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "SOLUSDT", "baseAsset": "SOL", "quoteAsset": "USDT", "status": "TRADING"},
        ]

@router.get("/futures")
async def get_futures_symbols(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Futures trading sembolleri listesi"""
    # Kullanıcının API key'ini al
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
    api_key = result.scalars().first()

    if not api_key:
        # API key yoksa demo sembolleri döndür
        return [
            {"symbol": "BTCUSDT", "baseAsset": "BTC", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ETHUSDT", "baseAsset": "ETH", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ADAUSDT", "baseAsset": "ADA", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "BNBUSDT", "baseAsset": "BNB", "quoteAsset": "USDT", "status": "TRADING"},
        ]

    try:
        # API anahtarlarını çöz
        api_key_plain = decrypt_value(api_key.encrypted_api_key)
        secret_key_plain = decrypt_value(api_key.encrypted_secret_key)

        # Binance client oluştur
        client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=True)
        symbols = client.get_futures_symbols()

        if symbols:
            return symbols
        else:
            raise HTTPException(status_code=500, detail="Futures sembol listesi alınamadı")

    except Exception as e:
        # Hata durumunda demo sembolleri döndür
        return [
            {"symbol": "BTCUSDT", "baseAsset": "BTC", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ETHUSDT", "baseAsset": "ETH", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "ADAUSDT", "baseAsset": "ADA", "quoteAsset": "USDT", "status": "TRADING"},
            {"symbol": "BNBUSDT", "baseAsset": "BNB", "quoteAsset": "USDT", "status": "TRADING"},
        ]
