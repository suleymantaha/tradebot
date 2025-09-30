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
from datetime import date
import requests
from app.core.email import send_trade_notification
from app.models.user import User
from typing import Any, Optional, List, cast

# Sync database connection for Celery tasks
SYNC_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tradebot_user:baba046532@localhost/tradebot_db")
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine)

# Binance client helper

def get_binance_client(api_key: str, api_secret: str) -> BinanceClientWrapper:
    # Güvenlik: Varsayılan testnet. ENV ile canlı açılır.
    live_trading = os.getenv("LIVE_TRADING_ENABLED", "false").lower() in ["1", "true", "yes"]
    testnet = not live_trading
    return BinanceClientWrapper(api_key, api_secret, testnet=testnet)

def _handle_fund_transfer(client: BinanceClientWrapper, bot_config: BotConfig):
    """Pozisyon türüne göre fon transferi yapar"""
    if not cast(bool, bot_config.auto_transfer_funds):
        return

    try:
        # Transfer miktarını belirle
        transfer_amount_val: Optional[float] = cast(Optional[float], bot_config.transfer_amount)
        if transfer_amount_val is None:
            # Tüm bakiyeyi transfer et
            if cast(str, bot_config.position_type) == "futures":
                # Spot'tan futures'a transfer
                spot_balance = client.get_balance("USDT")
                if spot_balance is not None and spot_balance > 10:  # Minimum 10 USDT bırak
                    transfer_amount_val = spot_balance - 10
            else:
                # Futures'tan spot'a transfer
                futures_balance = client.get_futures_balance("USDT")
                if futures_balance is not None and futures_balance > 1:
                    transfer_amount_val = futures_balance - 1

        # Transfer işlemini gerçekleştir
        if transfer_amount_val is not None and transfer_amount_val > 0:
            if cast(str, bot_config.position_type) == "futures":
                result = client.transfer_to_futures("USDT", float(transfer_amount_val))
                if result:
                    print(f"{transfer_amount_val} USDT spot'tan futures'a transfer edildi")
            else:
                result = client.transfer_to_spot("USDT", float(transfer_amount_val))
                if result:
                    print(f"{transfer_amount_val} USDT futures'tan spot'a transfer edildi")

    except Exception as e:
        print(f"Fon transferi sırasında hata: {e}")

@celery_app.task(name='app.core.bot_tasks.run_bot_task_for_all')
def run_bot_task_for_all():
    """Tüm aktif botlar için run_bot_task tetikler."""
    with SyncSessionLocal() as session:
        bot_configs = session.query(BotConfig).filter(BotConfig.is_active.is_(True)).all()
        for bot_config in bot_configs:
            # Her bot için task başlat
            cast(Any, run_bot_task).delay(bot_config.id)
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
        try:
            api_key_plain = decrypt_value(cast(str, api_key.encrypted_api_key))
            secret_key_plain = decrypt_value(cast(str, api_key.encrypted_secret_key))
        except Exception as e:
            # Şifre çözme hatası - demo mode'da çalış
            print(f"API key şifre çözme hatası, demo mode aktif: {e}")
            demo_mode = True
            client = None
            api_key_plain = None
            secret_key_plain = None

        # Binance client başlat
        if api_key_plain and secret_key_plain:
            try:
                client = get_binance_client(api_key_plain, secret_key_plain)
                demo_mode = False
            except Exception as e:
                demo_mode = True
                client = None
        else:
            demo_mode = True
            client = None

        # Pozisyon türüne göre fon transferi yap
        if not demo_mode and cast(bool, bot_config.auto_transfer_funds):
            try:
                _handle_fund_transfer(cast(Any, client), bot_config)  # client None değil burada
            except Exception as e:
                print(f"Fon transferi hatası: {e}")

        # 🆕 Futures için kaldıraç ayarla
        if not demo_mode and cast(str, bot_config.position_type) == "futures" and client is not None:
            try:
                leverage = getattr(bot_config, 'leverage', 10) or 10
                result = cast(Any, client).set_leverage(cast(str, bot_config.symbol), leverage)
                if result:
                    print(f"{bot_config.symbol} için kaldıraç {leverage}x olarak ayarlandı")
                else:
                    print(f"Kaldıraç ayarlanamadı {bot_config.symbol} {leverage}x")
            except Exception as e:
                print(f"Kaldıraç ayarlama hatası: {e}")

        # Örnek: Fiyat verisi çek
        symbol = bot_config.symbol
        try:
            if not demo_mode:
                if cast(str, bot_config.position_type) == "futures":
                    ticker = cast(Any, cast(Any, client).client).futures_symbol_ticker(symbol=symbol)
                    price = float(ticker['price'])
                else:
                    current_price = cast(Any, client).get_current_price(cast(str, symbol))
                    if current_price is None:
                        raise Exception("Fiyat alınamadı")
                    price = float(current_price)
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
                cast(Any, bot_state).status = "running (demo mode)"
                cast(Any, bot_state).last_updated_at = datetime.utcnow()
                session.commit()
            # Demo mode için işlem devam etsin

        # Stratejiye göre trade kararı
        strategy = getattr(bot_config, 'strategy', 'simple')

        # Son alış fiyatını bulmak için geçmiş trade'leri çek
        past_trades = session.query(Trade).filter(Trade.bot_config_id == bot_config_id).order_by(Trade.id.desc()).all()
        last_buy_price = None
        for trade in past_trades:
            if cast(str, trade.side) == "BUY":
                last_buy_price = float(cast(Any, trade.price))
                break

        if strategy == "simple":
            if price < 100:
                side = "BUY"
                quantity = 1.0

                binance_order = None
                if not demo_mode and client is not None:
                    try:
                        if cast(str, bot_config.position_type) == "futures":
                            binance_order = cast(Any, client).place_futures_market_buy_order(cast(str, symbol), quantity)
                        else:
                            binance_order = cast(Any, client).place_market_buy_order(cast(str, symbol), quantity)
                    except Exception as e:
                        print(f"Emir hatası: {e}")

                realized_pnl = None
                trade = Trade(
                    bot_config_id=bot_config_id,
                    user_id=bot_config.user_id,
                    symbol=symbol,
                    side=side,
                    order_type="MARKET",
                    price=price,
                    quantity_filled=quantity,
                    quote_quantity_filled=price * quantity,
                    commission_amount=None,
                    commission_asset=None,
                    pnl=None,
                    realized_pnl=realized_pnl,
                    binance_order_id=(str(binance_order.get('orderId')) if binance_order else None)
                )
                session.add(trade)

                # BotState güncelle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    cast(Any, bot_state).status = "running"
                    cast(Any, bot_state).last_updated_at = datetime.utcnow()

                    # Daily PnL hesapla - bugünkü tüm trade'lerin realized_pnl'sini topla
                    today_trades = session.query(Trade).filter(
                        Trade.bot_config_id == bot_config_id,
                        Trade.realized_pnl.isnot(None)
                    ).all()

                    daily_pnl = 0.0
                    for t in today_trades:
                        if cast(Any, t.realized_pnl):
                            daily_pnl += float(cast(Any, t.realized_pnl))

                    cast(Any, bot_state).daily_pnl = daily_pnl

                    # Trade sayısını güncelle - bugünkü tüm trade'leri say
                    today = date.today()
                    today_trades_count = session.query(Trade).filter(
                        Trade.bot_config_id == bot_config_id
                    ).count()
                    cast(Any, bot_state).daily_trades_count = today_trades_count

                session.commit()

                # E-posta bildirimi (opsiyonel): Bot sahibine
                try:
                    owner_user: Optional[User] = session.query(User).filter(User.id == bot_config.user_id).first()
                    if owner_user is not None:
                        send_trade_notification(
                            to_email=cast(str, owner_user.email),
                            symbol=cast(str, symbol),
                            side=side,
                            price=float(price),
                            quantity=float(quantity),
                            order_id=cast(Optional[str], trade.binance_order_id),
                        )
                except Exception:
                    pass

                return f"BUY order placed at {price}"
            else:
                # BotState güncelle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    cast(Any, bot_state).status = "waiting"
                    cast(Any, bot_state).last_updated_at = datetime.utcnow()
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
            stop_loss = float(getattr(bot_config, 'custom_stop_loss', 0.5) or 0.5)
            take_profit = float(getattr(bot_config, 'custom_take_profit', 1.5) or 1.5)
            trailing_stop = float(getattr(bot_config, 'custom_trailing_stop', 0.3) or 0.3)

            try:
                if not demo_mode:
                    if cast(str, bot_config.position_type) == "futures":
                        klines = cast(Any, cast(Any, client).client).futures_klines(symbol=cast(str, symbol), interval='1m', limit=max(ema_slow, rsi_period)+1)
                    else:
                        klines = cast(Any, client).get_historical_klines(symbol=cast(str, symbol), interval='1m', limit=max(ema_slow, rsi_period)+1)
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
            side: str
            if ema_fast_val > ema_slow_val and rsi < rsi_overbought:
                side = "BUY"
            elif ema_fast_val < ema_slow_val and rsi > rsi_oversold:
                side = "SELL"
            else:
                # Sinyal yok, bekle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    cast(Any, bot_state).status = ("waiting (no signal)" if not demo_mode else "waiting (demo mode)")
                    cast(Any, bot_state).last_updated_at = datetime.utcnow()
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

            # Miktar: şimdilik sabit 1.0 (TODO: min qty/step size ile normalize)
            order_quantity = 1.0
            binance_order = None
            if not demo_mode and client is not None:
                try:
                    if cast(str, bot_config.position_type) == "futures":
                        if side == "BUY":
                            binance_order = cast(Any, client).place_futures_market_buy_order(cast(str, symbol), order_quantity)
                        else:
                            binance_order = cast(Any, client).place_futures_market_sell_order(cast(str, symbol), order_quantity)
                    else:
                        if side == "BUY":
                            binance_order = cast(Any, client).place_market_buy_order(cast(str, symbol), order_quantity)
                        else:
                            binance_order = cast(Any, client).place_market_sell_order(cast(str, symbol), order_quantity)
                except Exception as e:
                    print(f"Emir hatası: {e}")

            trade = Trade(
                bot_config_id=bot_config_id,
                user_id=bot_config.user_id,
                symbol=symbol,
                side=side,
                order_type="MARKET",
                price=price,
                quantity_filled=order_quantity,
                quote_quantity_filled=price * order_quantity,
                commission_amount=None,
                commission_asset=None,
                pnl=None,
                realized_pnl=realized_pnl,
                binance_order_id=(str(binance_order.get('orderId')) if binance_order else None)
            )
            session.add(trade)

            # BotState güncelle
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                cast(Any, bot_state).status = "running" if not demo_mode else "running (demo mode)"
                cast(Any, bot_state).last_updated_at = datetime.utcnow()
                if side == "BUY":
                    cast(Any, bot_state).stop_loss_price = stop_loss_price
                    cast(Any, bot_state).take_profit_price = take_profit_price

                # Daily PnL hesapla - bugünkü tüm trade'lerin realized_pnl'sini topla
                today_trades = session.query(Trade).filter(
                    Trade.bot_config_id == bot_config_id,
                    Trade.realized_pnl.isnot(None)
                ).all()

                daily_pnl = 0.0
                for t in today_trades:
                    if cast(Any, t.realized_pnl):
                        daily_pnl += float(cast(Any, t.realized_pnl))

                cast(Any, bot_state).daily_pnl = daily_pnl

                # Trade sayısını güncelle - bugünkü tüm trade'leri say
                today = date.today()
                today_trades_count = session.query(Trade).filter(
                    Trade.bot_config_id == bot_config_id
                ).count()
                cast(Any, bot_state).daily_trades_count = today_trades_count

            session.commit()

            # Basit webhook bildirimi (opsiyonel)
            try:
                webhook_url = os.getenv("TRADE_WEBHOOK_URL")
                if webhook_url:
                    payload = {
                        "bot_config_id": bot_config_id,
                        "symbol": symbol,
                        "side": side,
                        "price": price,
                        "quantity": order_quantity,
                        "order_id": trade.binance_order_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    requests.post(webhook_url, json=payload, timeout=5)
            except Exception:
                pass

            # E-posta bildirimi (opsiyonel): Bot sahibine
            try:
                owner_user_ema: Optional[User] = session.query(User).filter(User.id == bot_config.user_id).first()
                if owner_user_ema is not None and owner_user_ema.email is not None:
                    send_trade_notification(
                        to_email=cast(str, owner_user_ema.email),
                        symbol=cast(str, symbol),
                        side=cast(str, side),
                        price=float(price),
                        quantity=float(order_quantity),
                        order_id=cast(Optional[str], trade.binance_order_id),
                    )
            except Exception:
                pass

            return f"{side} order placed at {price} (EMA Fast: {ema_fast_val:.2f}, EMA Slow: {ema_slow_val:.2f}, RSI: {rsi:.2f})"

        else:
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                cast(Any, bot_state).status = "error"
                cast(Any, bot_state).last_updated_at = datetime.utcnow()
                session.commit()
            return f"Unknown strategy: {strategy}"
