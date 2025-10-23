import os
import sys
import asyncio
from pathlib import Path
from httpx import AsyncClient, ASGITransport

# Ensure project root is on sys.path and configure DB BEFORE importing app
sys.path.append(str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./smoke_test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from app.main import app as fastapi_app

async def run():
    # Configure SQLite DB for standalone smoke test (mirror pytest setup)
    os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./smoke_test.db")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

    # Prepare DB schema like tests do
    import importlib
    importlib.import_module("app.models")
    from app.db_base import Base
    from app.database import engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Ensure user exists
        await ac.post("/api/v1/auth/register", json={"email": "ratetest@example.com", "password": "Str0ngP@ssword!"})
        status_codes = []
        # Attempt 7 wrong password logins in quick succession
        for i in range(7):
            resp = await ac.post("/api/v1/auth/login", json={"email": "ratetest@example.com", "password": "WrongPass123!"})
            status_codes.append(resp.status_code)
        print("Login attempt status codes:", status_codes)
        if 429 in status_codes:
            print("Rate limit enforced (Redis active).")
        else:
            print("No 429 detected — likely running without Redis (graceful degrade).")

if __name__ == "__main__":
    asyncio.run(run())
