import os
import time
import logging
from typing import List

from celery.schedules import crontab

from app.core.celery_app import celery_app
from app.core.binance_client import BinanceClientWrapper
from app.core.redis_client import (
    write_json_sync,
    read_json_sync,
    incr_sync,
    SPOT_SYMBOLS_CACHE_KEY,
    SPOT_SYMBOLS_CACHE_LAST_GOOD_KEY,
    SPOT_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY,
    FUTURES_SYMBOLS_CACHE_KEY,
    FUTURES_SYMBOLS_CACHE_LAST_GOOD_KEY,
    FUTURES_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY,
)

logger = logging.getLogger(__name__)


def _prepare_spot_symbols(symbols: List[dict]) -> List[dict]:
    """USDT filtreleme ve popüler coinleri önceliklendirme."""
    usdt_symbols = [s for s in symbols if s.get('quoteAsset') == 'USDT']
    priority_symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI']
    prioritized_symbols: List[dict] = []
    other_symbols: List[dict] = []
    for symbol in usdt_symbols:
        if symbol.get('baseAsset') in priority_symbols:
            prioritized_symbols.append(symbol)
        else:
            other_symbols.append(symbol)
    prioritized_symbols.sort(key=lambda x: priority_symbols.index(x['baseAsset']) if x['baseAsset'] in priority_symbols else 999)
    other_symbols.sort(key=lambda x: x['symbol'])
    return prioritized_symbols + other_symbols


@celery_app.task(name='app.core.cache_warmup_tasks.warmup_spot_symbols_cache', autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def warmup_spot_symbols_cache():
    """Spot sembolleri public API'den çekip Redis cache'e yazar.

    Başarılı olursa son iyi değeri ve son yenileme zamanını günceller.
    """
    ttl_seconds = int(os.getenv("SPOT_SYMBOLS_CACHE_TTL_SECONDS", "300"))
    try:
        symbols = BinanceClientWrapper.get_public_symbols()
        if not symbols:
            raise Exception("Public API get_public_symbols returned empty")

        final_symbols = _prepare_spot_symbols(symbols)
        wrote = write_json_sync(SPOT_SYMBOLS_CACHE_KEY, final_symbols, ttl_seconds=ttl_seconds)
        if wrote:
            write_json_sync(SPOT_SYMBOLS_CACHE_LAST_GOOD_KEY, final_symbols)
            write_json_sync(SPOT_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY, int(time.time()))
            incr_sync("metrics:warmup_spot_symbols_cache:success")
            logger.info(f"Warm-up spot symbols cache wrote {len(final_symbols)} items, TTL={ttl_seconds}s")
            return f"WARMUP_OK:{len(final_symbols)}"
        else:
            incr_sync("metrics:warmup_spot_symbols_cache:error")
            raise Exception("Redis write failed")
    except Exception as e:
        incr_sync("metrics:warmup_spot_symbols_cache:error")
        last = read_json_sync(SPOT_SYMBOLS_CACHE_LAST_GOOD_KEY)
        logger.error(f"Warm-up spot symbols cache failed: {e}; using last_good={bool(last)}")
        raise


def _prepare_futures_symbols(symbols: List[dict]) -> List[dict]:
    """USDT filtreleme ve popüler futures coinleri önceliklendirme."""
    usdt_symbols = [s for s in symbols if s.get('quoteAsset') == 'USDT']
    priority_symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC']
    prioritized_symbols: List[dict] = []
    other_symbols: List[dict] = []
    for symbol in usdt_symbols:
        if symbol.get('baseAsset') in priority_symbols:
            prioritized_symbols.append(symbol)
        else:
            other_symbols.append(symbol)
    prioritized_symbols.sort(key=lambda x: priority_symbols.index(x['baseAsset']) if x['baseAsset'] in priority_symbols else 999)
    other_symbols.sort(key=lambda x: x['symbol'])
    return prioritized_symbols + other_symbols


@celery_app.task(name='app.core.cache_warmup_tasks.warmup_futures_symbols_cache', autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def warmup_futures_symbols_cache():
    """Futures sembolleri public API'den çekip Redis cache'e yazar.

    Başarılı olursa son iyi değeri ve son yenileme zamanını günceller.
    """
    ttl_seconds = int(os.getenv("FUTURES_SYMBOLS_CACHE_TTL_SECONDS", "300"))
    try:
        symbols = BinanceClientWrapper.get_public_futures_symbols()
        if not symbols:
            raise Exception("Public API get_public_futures_symbols returned empty")

        final_symbols = _prepare_futures_symbols(symbols)
        wrote = write_json_sync(FUTURES_SYMBOLS_CACHE_KEY, final_symbols, ttl_seconds=ttl_seconds)
        if wrote:
            write_json_sync(FUTURES_SYMBOLS_CACHE_LAST_GOOD_KEY, final_symbols)
            write_json_sync(FUTURES_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY, int(time.time()))
            incr_sync("metrics:warmup_futures_symbols_cache:success")
            logger.info(f"Warm-up futures symbols cache wrote {len(final_symbols)} items, TTL={ttl_seconds}s")
            return f"WARMUP_OK:{len(final_symbols)}"
        else:
            incr_sync("metrics:warmup_futures_symbols_cache:error")
            raise Exception("Redis write failed")
    except Exception as e:
        incr_sync("metrics:warmup_futures_symbols_cache:error")
        last = read_json_sync(FUTURES_SYMBOLS_CACHE_LAST_GOOD_KEY)
        logger.error(f"Warm-up futures symbols cache failed: {e}; using last_good={bool(last)}")
        raise


# Dinamik Celery Beat kayıt (celery_app.conf.beat_schedule'a dokunmadan)
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    spot_interval = int(os.getenv("SPOT_SYMBOLS_WARMUP_INTERVAL_SECONDS", "300"))
    futures_interval = int(os.getenv("FUTURES_SYMBOLS_WARMUP_INTERVAL_SECONDS", "300"))
    # 5 dakikada bir çalışacak varsayılan ayarlar
    sender.add_periodic_task(spot_interval, warmup_spot_symbols_cache.s(), name='warmup-spot-symbols-cache')
    sender.add_periodic_task(futures_interval, warmup_futures_symbols_cache.s(), name='warmup-futures-symbols-cache')
    logger.info(f"Periodic task registered: warmup_spot_symbols_cache every {spot_interval} seconds")
    logger.info(f"Periodic task registered: warmup_futures_symbols_cache every {futures_interval} seconds")

