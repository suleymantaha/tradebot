import os
import asyncio

async def main():
    url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    from redis.asyncio import from_url
    r = from_url(url, encoding="utf-8", decode_responses=True)
    try:
        keys = await r.keys("rl:*")
        print("RL keys:", keys)
        for k in keys:
            v = await r.get(k)
            ttl = await r.ttl(k)
            print(f"{k} -> {v} (ttl={ttl})")
    finally:
        await r.close()

if __name__ == "__main__":
    asyncio.run(main())
