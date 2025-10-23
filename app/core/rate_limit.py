import os
from typing import Optional
from fastapi import HTTPException, Request
from redis.asyncio import from_url, Redis

_redis: Optional[Redis] = None

async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis = from_url(url, encoding="utf-8", decode_responses=True)
    return _redis

async def _hit_rate_limit_counter(key: str, window_seconds: int) -> int:
    r = await get_redis()
    count = await r.incr(key)
    if count == 1:
        await r.expire(key, window_seconds)
    return count

async def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Increment counter and raise 429 if limit exceeded. If Redis is unavailable, degrade gracefully."""
    try:
        count = await _hit_rate_limit_counter(key, window_seconds)
        if count > limit:
            raise HTTPException(status_code=429, detail="Çok fazla deneme. Lütfen daha sonra tekrar deneyin.")
    except HTTPException:
        # Propagate HTTP errors (e.g., 429) to FastAPI
        raise
    except Exception:
        # Graceful degrade: no rate limit enforcement if Redis not reachable
        return

def get_client_ip(request: Request) -> str:
    """Best-effort client IP extraction, considering reverse proxy headers."""
    # X-Forwarded-For may contain a list: client, proxy1, proxy2...
    xff = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"