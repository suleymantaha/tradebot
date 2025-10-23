import os
import asyncio

async def main():
    url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    from redis.asyncio import from_url
    r = from_url(url, encoding="utf-8", decode_responses=True)
    try:
        pong = await r.ping()
        print("PING:", pong)
        val = await r.incr("smoke:test:counter")
        print("INCR:", val)
        await r.expire("smoke:test:counter", 60)
        got = await r.get("smoke:test:counter")
        print("GET:", got)
    finally:
        await r.close()
        print("CLOSED")

if __name__ == "__main__":
    asyncio.run(main())
