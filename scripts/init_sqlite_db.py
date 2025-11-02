import os
import asyncio
import importlib

# Ensure development defaults for local setup
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./dev.db")

# Import models to populate Base.metadata
importlib.import_module("app.models")

from app.db_base import Base
from app.database import engine


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
    print("Initialized SQLite database schema at ./dev.db")

