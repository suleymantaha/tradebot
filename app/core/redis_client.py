import os
import json
import logging
from typing import Any, Optional

import redis

logger = logging.getLogger(__name__)


# Ortak Redis URL (Celery ile aynı env değişkenleri)
REDIS_URL = os.getenv("REDIS_URL") or os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

_redis_async: Optional[redis.asyncio.Redis] = None
_redis_sync: Optional[redis.Redis] = None


def get_redis_async() -> redis.asyncio.Redis:
    """Async Redis istemcisi (singleton)."""
    global _redis_async
    if _redis_async is None:
        _redis_async = redis.asyncio.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
        logger.info(f"Initialized async Redis client with URL: {REDIS_URL}")
    return _redis_async


def get_redis_sync() -> redis.Redis:
    """Sync Redis istemcisi (singleton)."""
    global _redis_sync
    if _redis_sync is None:
        _redis_sync = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
        logger.info(f"Initialized sync Redis client with URL: {REDIS_URL}")
    return _redis_sync


# JSON yardımcıları
async def read_json(key: str) -> Optional[Any]:
    try:
        r = get_redis_async()
        raw = await r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Redis read_json failed for {key}: {e}")
        return None


async def write_json(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    try:
        r = get_redis_async()
        data = json.dumps(value)
        if ttl_seconds and ttl_seconds > 0:
            await r.set(key, data, ex=ttl_seconds)
        else:
            await r.set(key, data)
        return True
    except Exception as e:
        logger.error(f"Redis write_json failed for {key}: {e}")
        return False


def read_json_sync(key: str) -> Optional[Any]:
    try:
        r = get_redis_sync()
        raw = r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Redis read_json_sync failed for {key}: {e}")
        return None


def write_json_sync(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    try:
        r = get_redis_sync()
        data = json.dumps(value)
        if ttl_seconds and ttl_seconds > 0:
            r.set(key, data, ex=ttl_seconds)
        else:
            r.set(key, data)
        return True
    except Exception as e:
        logger.error(f"Redis write_json_sync failed for {key}: {e}")
        return False


# Sayaç yardımcıları
async def incr(key: str, amount: int = 1) -> None:
    try:
        r = get_redis_async()
        await r.incrby(key, amount)
    except Exception as e:
        logger.warning(f"Redis incr failed for {key}: {e}")


def incr_sync(key: str, amount: int = 1) -> None:
    try:
        r = get_redis_sync()
        r.incrby(key, amount)
    except Exception as e:
        logger.warning(f"Redis incr_sync failed for {key}: {e}")


def get_int_sync(key: str) -> int:
    try:
        r = get_redis_sync()
        val = r.get(key)
        return int(val) if val is not None else 0
    except Exception:
        return 0


# Key adları
SPOT_SYMBOLS_CACHE_KEY = "cache:symbols:spot:v1"
SPOT_SYMBOLS_CACHE_LAST_GOOD_KEY = "cache:symbols:spot:last_good"
SPOT_SYMBOLS_CACHE_HIT_KEY = "metrics:cache_hit:symbols_spot"
SPOT_SYMBOLS_CACHE_MISS_KEY = "metrics:cache_miss:symbols_spot"
SPOT_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY = "metrics:spot_symbols_cache:last_refresh_ts"

# Futures cache keys
FUTURES_SYMBOLS_CACHE_KEY = "cache:symbols:futures:v1"
FUTURES_SYMBOLS_CACHE_LAST_GOOD_KEY = "cache:symbols:futures:last_good"
FUTURES_SYMBOLS_CACHE_HIT_KEY = "metrics:cache_hit:symbols_futures"
FUTURES_SYMBOLS_CACHE_MISS_KEY = "metrics:cache_miss:symbols_futures"
FUTURES_SYMBOLS_CACHE_LAST_REFRESH_TS_KEY = "metrics:futures_symbols_cache:last_refresh_ts"

