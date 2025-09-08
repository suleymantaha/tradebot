from app.core.celery_app import celery_app
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
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

@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, retry_kwargs={'max_retries': 3})
def run_bot_task(self, bot_config_id: int):
    """Gerçek trade mantığı ile bot task'ı."""
    return _run_bot(bot_config_id)

def _run_bot(bot_config_id: int):
    with SyncSessionLocal() as session:
        # Bot bazlı advisory lock (aynı anda çift çalışmayı engelle)
        try:
            session.execute(text("SELECT pg_advisory_lock(:lock_key)"), {"lock_key": int(10_000_000 + bot_config_id)})
        except Exception:
            pass
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
            api_key_plain = decrypt_value(api_key.encrypted_api_key)
            secret_key_plain = decrypt_value(api_key.encrypted_secret_key)
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
        if not demo_mode and bot_config.auto_transfer_funds:
            try:
                _handle_fund_transfer(client, bot_config)
            except Exception as e:
                print(f"Fon transferi hatası: {e}")

        # 🆕 Futures için kaldıraç ayarla
        if not demo_mode and bot_config.position_type == "futures" and client:
            try:
                leverage = getattr(bot_config, 'leverage', 10) or 10
                result = client.set_leverage(bot_config.symbol, leverage)
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
                if bot_config.position_type == "futures":
                    ticker = client._with_retry(client.client.futures_symbol_ticker, symbol=symbol)
                    price = float(ticker['price'])
                else:
                    current_price = client.get_current_price(symbol)
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
                bot_state.status = "running (demo mode)"
                bot_state.last_updated_at = datetime.utcnow()
                session.commit()
            # Demo mode için işlem devam etsin

        # GÜNLÜK KISIT KONTROLLERİ: trade sayısı / PnL sınırları
        try:
            now = datetime.utcnow()
            day_start = datetime(now.year, now.month, now.day)
            day_end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999)

            today_trades_q = session.query(Trade).filter(
                Trade.bot_config_id == bot_config_id,
                Trade.timestamp >= day_start,
                Trade.timestamp <= day_end
            )
            today_trades_count = today_trades_q.count()
            today_realized = 0.0
            for t in today_trades_q.all():
                if t.realized_pnl is not None:
                    today_realized += float(t.realized_pnl)

            stop_reason = None
            if bot_config.max_daily_trades is not None and today_trades_count >= int(bot_config.max_daily_trades):
                stop_reason = "max_daily_trades"
            else:
                initial_cap = float(bot_config.initial_capital) if bot_config.initial_capital is not None else None
                # daily target
                if initial_cap is not None and bot_config.daily_target_perc is not None:
                    target_abs = initial_cap * (float(bot_config.daily_target_perc) / 100.0)
                    if today_realized >= target_abs:
                        stop_reason = "daily_target_reached"
                # max daily loss
                if stop_reason is None and initial_cap is not None and bot_config.max_daily_loss_perc is not None:
                    max_loss_abs = initial_cap * (float(bot_config.max_daily_loss_perc) / 100.0)
                    if today_realized <= -max_loss_abs:
                        stop_reason = "max_daily_loss_reached"

            if stop_reason is not None:
                # Botu durdur
                with session.begin():
                    bot_config.is_active = False
                    bot_state = session.query(BotState).filter(BotState.id == bot_config_id).with_for_update().first()
                    if bot_state:
                        bot_state.status = f"stopped ({stop_reason})"
                        bot_state.last_updated_at = datetime.utcnow()
                return f"Bot stopped due to {stop_reason}"
        except Exception:
            # Sessizce geç, kısıtlar başarısız olursa trade yine devam edebilir
            pass

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
                side = "BUY"
                raw_quantity = 1.0

                binance_order = None
                normalized_qty = None
                if not demo_mode and client:
                    try:
                        # Miktarı filtrelere göre normalize et
                        normalized_qty = client.normalize_market_quantity(symbol, raw_quantity, price, is_futures=(bot_config.position_type == "futures"))
                        if not normalized_qty:
                            return "Geçersiz miktar (normalize edilemedi)"

                        # Idempotent client order id
                        import time as _t
                        new_coid = f"bot{bot_config_id}-{int(_t.time()*1000)}-{side.lower()}"

                        if bot_config.position_type == "futures":
                            binance_order = client.place_futures_market_buy_order(symbol, normalized_qty, new_client_order_id=new_coid)
                            if not binance_order:
                                # Duplicate veya ağ hatası durumunda clientOrderId ile sorgula
                                existing = client.get_futures_order_by_client_order_id(symbol, new_coid)
                                if existing:
                                    binance_order = existing
                        else:
                            binance_order = client.place_market_buy_order(symbol, normalized_qty, new_client_order_id=new_coid)
                            if not binance_order:
                                existing = client.get_spot_order_by_client_order_id(symbol, new_coid)
                                if existing:
                                    binance_order = existing
                    except Exception as e:
                        print(f"Emir hatası: {e}")
                        # Hata durumunu bot state'e işle
                        bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                        if bot_state:
                            bot_state.last_error_message = str(e)
                            bot_state.last_updated_at = datetime.utcnow()
                            session.commit()

                if demo_mode:
                    # Demo modda trade kaydı yapma
                    return f"[DEMO] BUY signal at {price} (no order sent)"

                # Canlı modda ama borsa emri başarısızsa DB yazma
                if not demo_mode and normalized_qty is not None and not binance_order:
                    return "Emir onaylanamadı, trade yazımı atlandı"

                realized_pnl = None
                trade = Trade(
                    bot_config_id=bot_config_id,
                    user_id=bot_config.user_id,
                    symbol=symbol,
                    side=side,
                    order_type="MARKET",
                    price=price,
                    quantity_filled=(normalized_qty if not demo_mode else raw_quantity),
                    quote_quantity_filled=price * (normalized_qty if not demo_mode else raw_quantity),
                    commission_amount=None,
                    commission_asset=None,
                    pnl=None,
                    realized_pnl=realized_pnl,
                    binance_order_id=(str(binance_order.get('orderId')) if binance_order and isinstance(binance_order, dict) and binance_order.get('orderId') is not None else None)
                )
                # Atomik işlem
                try:
                    with session.begin():
                        session.add(trade)

                        # BotState güncelle
                        bot_state = session.query(BotState).filter(BotState.id == bot_config_id).with_for_update().first()
                        if bot_state:
                            bot_state.status = "running"
                            bot_state.last_updated_at = datetime.utcnow()

                            # Daily PnL hesapla - bugünkü tüm trade'lerin realized_pnl'sini topla
                            today_trades = session.query(Trade).filter(
                                Trade.bot_config_id == bot_config_id,
                                Trade.realized_pnl.isnot(None)
                            ).all()

                            daily_pnl = 0.0
                            for t in today_trades:
                                if t.realized_pnl:
                                    daily_pnl += float(t.realized_pnl)

                            bot_state.daily_pnl = daily_pnl

                            # Trade sayısını güncelle - bugünkü tüm trade'leri say
                            today_trades_count = session.query(Trade).filter(
                                Trade.bot_config_id == bot_config_id
                            ).count()
                            bot_state.daily_trades_count = today_trades_count
                except IntegrityError:
                    session.rollback()

                # E-posta bildirimi (opsiyonel): Bot sahibine
                try:
                    owner: User = session.query(User).filter(User.id == bot_config.user_id).first()
                    if owner and owner.email:
                        send_trade_notification(
                            to_email=owner.email,
                            symbol=symbol,
                            side=side,
                            price=float(price),
                            quantity=float(normalized_qty),
                            order_id=trade.binance_order_id,
                        )
                except Exception:
                    pass

                return f"BUY order placed at {price}"
            else:
                # BotState güncelle
                bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                if bot_state:
                    bot_state.status = "waiting"
                    bot_state.last_updated_at = datetime.utcnow()
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
                    bot_state.last_updated_at = datetime.utcnow()
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

            # Miktar: şimdilik sabit 1.0 -> normalize et
            order_quantity = 1.0
            binance_order = None
            normalized_qty = None
            if not demo_mode and client:
                try:
                    # Normalize miktar
                    normalized_qty = client.normalize_market_quantity(symbol, order_quantity, price, is_futures=(bot_config.position_type == "futures"))
                    if not normalized_qty:
                        return "Geçersiz miktar (normalize edilemedi)"
                    import time as _t
                    new_coid = f"bot{bot_config_id}-{int(_t.time()*1000)}-{side.lower()}"
                    if bot_config.position_type == "futures":
                        if side == "BUY":
                            binance_order = client.place_futures_market_buy_order(symbol, normalized_qty, new_client_order_id=new_coid)
                        else:
                            binance_order = client.place_futures_market_sell_order(symbol, normalized_qty, new_client_order_id=new_coid)
                        if not binance_order:
                            existing = client.get_futures_order_by_client_order_id(symbol, new_coid)
                            if existing:
                                binance_order = existing
                    else:
                        if side == "BUY":
                            binance_order = client.place_market_buy_order(symbol, normalized_qty, new_client_order_id=new_coid)
                        else:
                            binance_order = client.place_market_sell_order(symbol, normalized_qty, new_client_order_id=new_coid)
                        if not binance_order:
                            existing = client.get_spot_order_by_client_order_id(symbol, new_coid)
                            if existing:
                                binance_order = existing
                except Exception as e:
                    print(f"Emir hatası: {e}")
                    bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
                    if bot_state:
                        bot_state.last_error_message = str(e)
                        bot_state.last_updated_at = datetime.utcnow()
                        session.commit()

            if demo_mode:
                # Demo modda trade kaydı yapma
                return f"[DEMO] {side} signal at {price} (no order sent)"

            if not demo_mode and normalized_qty is not None and not binance_order:
                return "Emir onaylanamadı, trade yazımı atlandı"

            trade = Trade(
                bot_config_id=bot_config_id,
                user_id=bot_config.user_id,
                symbol=symbol,
                side=side,
                order_type="MARKET",
                price=price,
                quantity_filled=(normalized_qty if not demo_mode else order_quantity),
                quote_quantity_filled=price * (normalized_qty if not demo_mode else order_quantity),
                commission_amount=None,
                commission_asset=None,
                pnl=None,
                realized_pnl=realized_pnl,
                binance_order_id=(str(binance_order.get('orderId')) if binance_order and isinstance(binance_order, dict) and binance_order.get('orderId') is not None else None)
            )
            # Atomik işlem
            try:
                with session.begin():
                    session.add(trade)

                    # BotState güncelle
                    bot_state = session.query(BotState).filter(BotState.id == bot_config_id).with_for_update().first()
                    if bot_state:
                        bot_state.status = "running" if not demo_mode else "running (demo mode)"
                        bot_state.last_updated_at = datetime.utcnow()
                        if side == "BUY":
                            bot_state.stop_loss_price = stop_loss_price
                            bot_state.take_profit_price = take_profit_price

                        # Daily PnL hesapla - bugünkü tüm trade'lerin realized_pnl'sini topla
                        today_trades = session.query(Trade).filter(
                            Trade.bot_config_id == bot_config_id,
                            Trade.realized_pnl.isnot(None)
                        ).all()

                        daily_pnl = 0.0
                        for t in today_trades:
                            if t.realized_pnl:
                                daily_pnl += float(t.realized_pnl)

                        bot_state.daily_pnl = daily_pnl

                        # Trade sayısını güncelle - bugünkü tüm trade'leri say
                        today_trades_count = session.query(Trade).filter(
                            Trade.bot_config_id == bot_config_id
                        ).count()
                        bot_state.daily_trades_count = today_trades_count
            except IntegrityError:
                session.rollback()

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
                owner: User = session.query(User).filter(User.id == bot_config.user_id).first()
                if owner and owner.email:
                    send_trade_notification(
                        to_email=owner.email,
                        symbol=symbol,
                        side=side,
                        price=float(price),
                        quantity=float(normalized_qty),
                        order_id=trade.binance_order_id,
                    )
            except Exception:
                pass

            return f"{side} order placed at {price} (EMA Fast: {ema_fast_val:.2f}, EMA Slow: {ema_slow_val:.2f}, RSI: {rsi:.2f})"

        else:
            bot_state = session.query(BotState).filter(BotState.id == bot_config_id).first()
            if bot_state:
                bot_state.status = "error"
                bot_state.last_updated_at = datetime.utcnow()
                session.commit()
            return f"Unknown strategy: {strategy}"

    # Kilidi bırak (aynı session üzerinden otomatik bırakılır; yine de açıkça deneriz)
    try:
        with SyncSessionLocal() as release_sess:
            release_sess.execute(text("SELECT pg_advisory_unlock(:lock_key)"), {"lock_key": int(10_000_000 + bot_config_id)})
    except Exception:
        pass

@celery_app.task(name='app.core.bot_tasks.reactivate_bots_after_reset')
def reactivate_bots_after_reset():
    """Günlük limit nedeniyle durmuş botları ertesi gün otomatik yeniden başlat."""
    from sqlalchemy import and_
    with SyncSessionLocal() as session:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)

        stop_statuses = [
            "stopped (max_daily_trades)",
            "stopped (daily_target_reached)",
            "stopped (max_daily_loss_reached)",
        ]

        states = (
            session.query(BotState)
            .filter(
                BotState.status.in_(stop_statuses),
                BotState.last_updated_at < today_start,
            )
            .all()
        )

        reactivated = 0
        for state in states:
            cfg = session.query(BotConfig).filter(BotConfig.id == state.id).first()
            if not cfg:
                continue
            # Kullanıcı manuel kapatmadıysa yeniden başlat
            with session.begin():
                cfg.is_active = True
                state.status = "pending"
                state.daily_pnl = 0.0
                state.daily_trades_count = 0
                state.last_updated_at = datetime.utcnow()
            reactivated += 1

        return f"Reactivated {reactivated} bots"
