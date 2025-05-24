from app.core.celery_app import celery_app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.bot_state import BotState
from app.models.bot_config import BotConfig
import os
import asyncio
from app.core.crypto import decrypt_value
from app.models.api_key import ApiKey
from app.core.binance_client import BinanceClientWrapper
from app.models.trade import Trade
from datetime import datetime

# Sync database connection for Celery tasks
SYNC_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tradebot_user:baba046532@localhost/tradebot_db")
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine)

# Binance client helper

def get_binance_client(api_key: str, api_secret: str) -> BinanceClientWrapper:
    return BinanceClientWrapper(api_key, api_secret, testnet=True)

def _handle_fund_transfer(client: BinanceClientWrapper, bot_config: BotConfig):
    """Pozisyon türüne göre fon transferi yapar"""
    if not bot_config.auto_transfer_funds:
        return

    try:
        # Transfer miktarını belirle
        transfer_amount = bot_config.transfer_amount
        if not transfer_amount:
            # Tüm bakiyeyi transfer et
            if bot_config.position_type == "futures":
                # Spot'tan futures'a transfer
                spot_balance = client.get_balance("USDT")
                if spot_balance and spot_balance > 10:  # Minimum 10 USDT bırak
                    transfer_amount = spot_balance - 10
            else:
                # Futures'tan spot'a transfer
                futures_balance = client.get_futures_balance("USDT")
                if futures_balance and futures_balance > 1:
                    transfer_amount = futures_balance - 1

        # Transfer işlemini gerçekleştir
        if transfer_amount and transfer_amount > 0:
            if bot_config.position_type == "futures":
                result = client.transfer_to_futures("USDT", transfer_amount)
                if result:
                    print(f"{transfer_amount} USDT spot'tan futures'a transfer edildi")
            else:
                result = client.transfer_to_spot("USDT", transfer_amount)
                if result:
                    print(f"{transfer_amount} USDT futures'tan spot'a transfer edildi")

    except Exception as e:
        print(f"Fon transferi sırasında hata: {e}")

@celery_app.task(name='app.core.bot_tasks.run_bot_task_for_all')
def run_bot_task_for_all():
    """Tüm aktif botlar için run_bot_task tetikler."""
    with SyncSessionLocal() as session:
        bot_configs = session.query(BotConfig).filter(BotConfig.is_active == True).all()
        for bot_config in bot_configs:
            # Her bot için task başlat
            run_bot_task.delay(bot_config.id)
        return f"Started tasks for {len(bot_configs)} active bots"

@celery_app.task
def run_bot_task(bot_config_id: int):
    """Gerçek trade mantığı ile bot task'ı."""
    return _run_bot(bot_config_id)

def _run_bot(bot_config_id: int):
    with SyncSessionLocal() as session:
        # BotConfig ve ilişkili ApiKey'i çek
        bot_config = session.query(BotConfig).filter(BotConfig.id == bot_config_id).first()
        if not bot_config:
            return "Bot config not found"

        # ApiKey'i çek
        api_key = session.query(ApiKey).filter(ApiKey.id == bot_config.api_key_id).first()
        if not api_key:
            return "API key not found"

        # Şifreleri çöz
        api_key_plain = decrypt_value(api_key.encrypted_api_key)
        secret_key_plain = decrypt_value(api_key.encrypted_secret_key)

        # Binance client başlat
        try:
            client = get_binance_client(api_key_plain, secret_key_plain)
            demo_mode = False
        except Exception as e:
            demo_mode = True
            client = None

        # Pozisyon türüne göre fon transferi yap
        if not demo_mode and bot_config.auto_transfer_funds:
            try:
                _handle_fund_transfer(client, bot_config)
            except Exception as e:
                print(f"Fon transferi hatası: {e}")

        # Örnek: Fiyat verisi çek
        symbol = bot_config.symbol
        try:
            if not demo_mode:
                if bot_config.position_type == "futures":
                    ticker = client.client.futures_symbol_ticker(symbol=symbol)
                else:
                    ticker = client.get_symbol_ticker(symbol=symbol)
                price = float(ticker['price'])
            else:
                raise Exception("Demo mode")
        except Exception as e:
            # Demo amaçlı fake fiyat kullan
            import random
            price = random.uniform(50.0, 150.0)  # Fake fiyat
            demo_mode = True
            # BotState'e bilgi yaz
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                bot_state.status = "running (demo mode)"
                bot_state.updated_at = datetime.utcnow()
                session.commit()
            # Demo mode için işlem devam etsin

        # Stratejiye göre trade kararı
        strategy = getattr(bot_config, 'strategy', 'simple')

        # Son alış fiyatını bulmak için geçmiş trade'leri çek
        past_trades = session.query(Trade).filter(Trade.bot_config_id == bot_config_id).order_by(Trade.id.desc()).all()
        last_buy_price = None
        for trade in past_trades:
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

                # BotState güncelle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    bot_state.status = "running"
                    bot_state.updated_at = datetime.utcnow()

                session.commit()
                return f"BUY order placed at {price}"
            else:
                # BotState güncelle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    bot_state.status = "waiting"
                    bot_state.updated_at = datetime.utcnow()
                    session.commit()
                return f"Waiting - price {price} too high"

        elif strategy == "ema":
            # Kullanıcının özel parametrelerini kullan
            ema_fast = getattr(bot_config, 'custom_ema_fast', 8) or 8
            ema_slow = getattr(bot_config, 'custom_ema_slow', 21) or 21
            rsi_period = getattr(bot_config, 'custom_rsi_period', 7) or 7
            rsi_oversold = getattr(bot_config, 'custom_rsi_oversold', 35) or 35
            rsi_overbought = getattr(bot_config, 'custom_rsi_overbought', 65) or 65

            # Risk yönetimi parametreleri
            stop_loss = getattr(bot_config, 'custom_stop_loss', 0.5) or 0.5
            take_profit = getattr(bot_config, 'custom_take_profit', 1.5) or 1.5
            trailing_stop = getattr(bot_config, 'custom_trailing_stop', 0.3) or 0.3

            try:
                if not demo_mode:
                    if bot_config.position_type == "futures":
                        klines = client.client.futures_klines(symbol=symbol, interval='1m', limit=max(ema_slow, rsi_period)+1)
                    else:
                        klines = client.get_historical_klines(symbol=symbol, interval='1m', limit=max(ema_slow, rsi_period)+1)
                    closes = [float(k[4]) for k in klines]
                    if len(closes) < max(ema_slow, rsi_period):
                        raise Exception("Yeterli veri yok")
                else:
                    raise Exception("Demo mode")
            except Exception:
                # Demo amaçlı fake klines data oluştur
                import random
                closes = [random.uniform(50.0, 150.0) for _ in range(max(ema_slow, rsi_period) + 1)]

            # EMA hesapla
            def calculate_ema(prices, period):
                k = 2 / (period + 1)
                ema = prices[0]
                for price_val in prices[1:]:
                    ema = price_val * k + ema * (1 - k)
                return ema

            ema_fast_val = calculate_ema(closes[-ema_fast:], ema_fast)
            ema_slow_val = calculate_ema(closes[-ema_slow:], ema_slow)

            # RSI hesapla (basit versiyonu)
            def calculate_rsi(prices, period):
                if len(prices) < period + 1:
                    return 50  # Varsayılan değer

                deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
                gains = [d if d > 0 else 0 for d in deltas]
                losses = [-d if d < 0 else 0 for d in deltas]

                avg_gain = sum(gains[-period:]) / period
                avg_loss = sum(losses[-period:]) / period

                if avg_loss == 0:
                    return 100
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                return rsi

            rsi = calculate_rsi(closes, rsi_period)

            # Trading sinyali
            if ema_fast_val > ema_slow_val and rsi < rsi_overbought:
                side = "BUY"
            elif ema_fast_val < ema_slow_val and rsi > rsi_oversold:
                side = "SELL"
            else:
                # Sinyal yok, bekle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    bot_state.status = "waiting (no signal)" if not demo_mode else "waiting (demo mode)"
                    bot_state.updated_at = datetime.utcnow()
                    session.commit()
                return f"Waiting for signal - EMA Fast: {ema_fast_val:.2f}, EMA Slow: {ema_slow_val:.2f}, RSI: {rsi:.2f}"

            realized_pnl = None
            if side == "SELL" and last_buy_price is not None:
                realized_pnl = price - last_buy_price

            # Risk yönetimi hesaplamaları
            stop_loss_price = None
            take_profit_price = None
            if side == "BUY":
                stop_loss_price = price * (1 - stop_loss / 100)
                take_profit_price = price * (1 + take_profit / 100)
            elif side == "SELL":
                stop_loss_price = price * (1 + stop_loss / 100)
                take_profit_price = price * (1 - take_profit / 100)

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

            # BotState güncelle
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                bot_state.status = "running" if not demo_mode else "running (demo mode)"
                bot_state.updated_at = datetime.utcnow()
                if side == "BUY":
                    bot_state.stop_loss_price = stop_loss_price
                    bot_state.take_profit_price = take_profit_price

            session.commit()
            return f"{side} order placed at {price} (EMA Fast: {ema_fast_val:.2f}, EMA Slow: {ema_slow_val:.2f}, RSI: {rsi:.2f})"

        else:
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                bot_state.status = "error"
                bot_state.updated_at = datetime.utcnow()
                session.commit()
            return f"Unknown strategy: {strategy}"
