from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.auth import get_db, get_current_user_optional
from app.models.user import User
from app.models.api_key import ApiKey
from app.core.crypto import decrypt_value
from app.core.binance_client import BinanceClientWrapper
from sqlalchemy.future import select
from typing import Optional
import traceback
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/symbols", tags=["symbols"])

@router.get("/spot")
async def get_spot_symbols(db: AsyncSession = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    """Spot trading sembolleri listesi - Authentication opsiyonel"""

    # API key kontrol et (sadece authenticated user için)
    api_key = None
    if current_user:
        result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
        api_key = result.scalars().first()

    # Binance'dan dinamik olarak çek
    try:
        symbols = None

        if api_key:
            logger.info(f"API key bulundu, kullanıcı API'si ile spot sembol çekiliyor...")
            # API key varsa şifreleri çöz ve kendi API ile dene
            api_key_plain = decrypt_value(api_key.encrypted_api_key)
            secret_key_plain = decrypt_value(api_key.encrypted_secret_key)

            # Önce testnet dene, sonra mainnet
            try:
                logger.info("Testnet ile spot sembol deneniyor...")
                client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=True)
                validation = client.validate_api_credentials()
                if validation['valid']:
                    symbols = client.get_all_symbols()
                    logger.info(f"Testnet ile {len(symbols) if symbols else 0} spot sembol alındı")
            except Exception as e:
                logger.warning(f"Testnet spot sembol hatası: {e}")
                try:
                    logger.info("Mainnet ile spot sembol deneniyor...")
                    client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=False)
                    validation = client.validate_api_credentials()
                    if validation['valid']:
                        symbols = client.get_all_symbols()
                        logger.info(f"Mainnet ile {len(symbols) if symbols else 0} spot sembol alındı")
                except Exception as e2:
                    logger.warning(f"Mainnet spot sembol hatası: {e2}")
                    symbols = None

        # API key yoksa veya başarısız olursa public endpoint kullan
        if not symbols:
            logger.info("Public API ile spot sembol çekiliyor...")
            symbols = BinanceClientWrapper.get_public_symbols()
            logger.info(f"Public API ile {len(symbols) if symbols else 0} spot sembol alındı")

        if symbols and len(symbols) > 0:
            # USDT ile işlem gören sembolleri filtrele
            usdt_symbols = [s for s in symbols if s['quoteAsset'] == 'USDT']
            logger.info(f"USDT filtreleme sonrası {len(usdt_symbols)} spot sembol")

            # Popüler coinleri öncelikle sırala
            priority_symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI']
            prioritized_symbols = []
            other_symbols = []

            for symbol in usdt_symbols:
                if symbol['baseAsset'] in priority_symbols:
                    prioritized_symbols.append(symbol)
                else:
                    other_symbols.append(symbol)

            # Popüler coinleri önce, sonra diğerlerini alfabetik sırala
            prioritized_symbols.sort(key=lambda x: priority_symbols.index(x['baseAsset']) if x['baseAsset'] in priority_symbols else 999)
            other_symbols.sort(key=lambda x: x['symbol'])

            # Birleştir ve tümünü döndür
            final_symbols = prioritized_symbols + other_symbols
            logger.info(f"Final spot sembol listesi: {len(final_symbols)} sembol döndürülüyor")
            return final_symbols
        else:
            raise Exception("Binance'dan hiç sembol alınamadı")

    except Exception as e:
        # Tüm yöntemler başarısız oldu - Error fırlat
        logger.error(f"KRITIK: Tüm spot sembol yükleme yöntemleri başarısız: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="Sembol listesi şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin veya sistem yöneticisine bildirin."
        )

@router.get("/futures")
async def get_futures_symbols(db: AsyncSession = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    """Futures trading sembolleri listesi - Authentication opsiyonel"""

    # API key kontrol et (sadece authenticated user için)
    api_key = None
    if current_user:
        result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id))
        api_key = result.scalars().first()

    # Binance'dan dinamik olarak çek
    try:
        symbols = None

        if api_key:
            logger.info(f"API key bulundu, kullanıcı API'si ile futures sembol çekiliyor...")
            # API key varsa şifreleri çöz ve kendi API ile dene
            api_key_plain = decrypt_value(api_key.encrypted_api_key)
            secret_key_plain = decrypt_value(api_key.encrypted_secret_key)

            # Önce testnet dene, sonra mainnet
            try:
                logger.info("Testnet ile futures sembol deneniyor...")
                client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=True)
                validation = client.validate_api_credentials()
                if validation['valid']:
                    symbols = client.get_futures_symbols()
                    logger.info(f"Testnet ile {len(symbols) if symbols else 0} futures sembol alındı")
            except Exception as e:
                logger.warning(f"Testnet futures sembol hatası: {e}")
                try:
                    logger.info("Mainnet ile futures sembol deneniyor...")
                    client = BinanceClientWrapper(api_key_plain, secret_key_plain, testnet=False)
                    validation = client.validate_api_credentials()
                    if validation['valid']:
                        symbols = client.get_futures_symbols()
                        logger.info(f"Mainnet ile {len(symbols) if symbols else 0} futures sembol alındı")
                except Exception as e2:
                    logger.warning(f"Mainnet futures sembol hatası: {e2}")
                    symbols = None

        # API key yoksa veya başarısız olursa public endpoint kullan
        if not symbols:
            logger.info("Public API ile futures sembol çekiliyor...")
            symbols = BinanceClientWrapper.get_public_futures_symbols()
            logger.info(f"Public API ile {len(symbols) if symbols else 0} futures sembol alındı")

        if symbols and len(symbols) > 0:
            # USDT ile işlem gören sembolleri filtrele
            usdt_symbols = [s for s in symbols if s['quoteAsset'] == 'USDT']
            logger.info(f"USDT filtreleme sonrası {len(usdt_symbols)} futures sembol")

            # Popüler futures coinleri öncelikle sırala
            priority_symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC']
            prioritized_symbols = []
            other_symbols = []

            for symbol in usdt_symbols:
                if symbol['baseAsset'] in priority_symbols:
                    prioritized_symbols.append(symbol)
                else:
                    other_symbols.append(symbol)

            # Popüler coinleri önce, sonra diğerlerini alfabetik sırala
            prioritized_symbols.sort(key=lambda x: priority_symbols.index(x['baseAsset']) if x['baseAsset'] in priority_symbols else 999)
            other_symbols.sort(key=lambda x: x['symbol'])

            # Birleştir ve tümünü döndür
            final_symbols = prioritized_symbols + other_symbols
            logger.info(f"Final futures sembol listesi: {len(final_symbols)} sembol döndürülüyor")
            return final_symbols
        else:
            raise Exception("Binance'dan hiç futures sembol alınamadı")

    except Exception as e:
        # Tüm yöntemler başarısız oldu - Error fırlat
        logger.error(f"KRITIK: Tüm futures sembol yükleme yöntemleri başarısız: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="Futures sembol listesi şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin veya sistem yöneticisine bildirin."
        )
