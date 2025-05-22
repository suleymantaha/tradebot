from app.core.celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.bot_state import BotState
from app.models.bot_config import BotConfig
from app.database import DATABASE_URL
import asyncio
from app.core.crypto import decrypt_value
from app.models.api_key import ApiKey
from binance.client import Client
from app.models.trade import Trade
from datetime import datetime

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Binance client helper

def get_binance_client(api_key: str, api_secret: str) -> Client:
    return Client(api_key, api_secret)

@celery_app.task
def run_bot_task(bot_config_id: int):
    """Gerçek trade mantığı ile bot task'ı."""
    asyncio.run(_run_bot(bot_config_id))

async def _run_bot(bot_config_id: int):
    async with AsyncSessionLocal() as session:
        # BotConfig ve ilişkili ApiKey'i çek
        result = await session.execute(
            BotConfig.__table__.select().where(BotConfig.id == bot_config_id)
        )
        bot_config_row = result.first()
        if not bot_config_row:
            return
        bot_config = bot_config_row[0] if isinstance(bot_config_row, tuple) else bot_config_row
        # ApiKey'i çek
        result = await session.execute(
            ApiKey.__table__.select().where(ApiKey.id == bot_config.api_key_id)
        )
        api_key_row = result.first()
        if not api_key_row:
            return
        api_key = api_key_row[0] if isinstance(api_key_row, tuple) else api_key_row
        # Şifreleri çöz
        api_key_plain = decrypt_value(api_key.encrypted_api_key)
        secret_key_plain = decrypt_value(api_key.encrypted_secret_key)
        # Binance client başlat
        client = get_binance_client(api_key_plain, secret_key_plain)
        # Örnek: Fiyat verisi çek
        symbol = bot_config.symbol
        try:
            ticker = client.get_symbol_ticker(symbol=symbol)
            price = float(ticker['price'])
        except Exception as e:
            # BotState'e hata yaz
            await session.execute(
                BotState.__table__.update().where(BotState.id == bot_config_id).values(status="error", updated_at=datetime.utcnow())
            )
            await session.commit()
            return
        # Stratejiye göre trade kararı
        strategy = getattr(bot_config, 'strategy', 'simple')
        # Son alış fiyatını bulmak için geçmiş trade'leri çek
        result = await session.execute(
            Trade.__table__.select().where(Trade.bot_config_id == bot_config_id).order_by(Trade.id.desc())
        )
        past_trades = result.fetchall()
        last_buy_price = None
        for t in past_trades:
            trade = t[0] if isinstance(t, tuple) else t
            if trade.side == "BUY":
                last_buy_price = float(trade.price)
                break
        if strategy == "simple":
            if price < 100:
                realized_pnl = None
                trade = Trade(
                    bot_config_id=bot_config_id,
                    user_id=bot_config.user_id,
                    symbol=symbol,
                    side="BUY",
                    order_type="MARKET",
                    price=price,
                    quantity_filled=1,
                    quote_quantity_filled=price,
                    commission_amount=None,
                    commission_asset=None,
                    pnl=None,
                    realized_pnl=realized_pnl
                )
                session.add(trade)
                await session.execute(
                    BotState.__table__.update().where(BotState.id == bot_config_id).values(status="running", updated_at=datetime.utcnow())
                )
                await session.commit()
            else:
                await session.execute(
                    BotState.__table__.update().where(BotState.id == bot_config_id).values(status="waiting", updated_at=datetime.utcnow())
                )
                await session.commit()
        elif strategy == "ema":
            ema_period = getattr(bot_config, 'ema_period', 9) or 9
            try:
                klines = client.get_klines(symbol=symbol, interval='1m', limit=ema_period+1)
                closes = [float(k[4]) for k in klines]
                if len(closes) < ema_period:
                    raise Exception("Yeterli veri yok")
                k = 2 / (ema_period + 1)
                ema = closes[0]
                for close in closes[1:]:
                    ema = close * k + ema * (1 - k)
                if price > ema:
                    side = "BUY"
                else:
                    side = "SELL"
                realized_pnl = None
                if side == "SELL" and last_buy_price is not None:
                    realized_pnl = price - last_buy_price
                trade = Trade(
                    bot_config_id=bot_config_id,
                    user_id=bot_config.user_id,
                    symbol=symbol,
                    side=side,
                    order_type="MARKET",
                    price=price,
                    quantity_filled=1,
                    quote_quantity_filled=price,
                    commission_amount=None,
                    commission_asset=None,
                    pnl=None,
                    realized_pnl=realized_pnl
                )
                session.add(trade)
                await session.execute(
                    BotState.__table__.update().where(BotState.id == bot_config_id).values(status="running", updated_at=datetime.utcnow())
                )
                await session.commit()
            except Exception as e:
                await session.execute(
                    BotState.__table__.update().where(BotState.id == bot_config_id).values(status="error", updated_at=datetime.utcnow())
                )
                await session.commit()
        else:
            await session.execute(
                BotState.__table__.update().where(BotState.id == bot_config_id).values(status="error", updated_at=datetime.utcnow())
            )
            await session.commit()
