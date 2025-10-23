from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.db_base import Base
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_database_url = os.getenv("DATABASE_URL")
if ENVIRONMENT == "production" and not _database_url:
    raise RuntimeError("DATABASE_URL production ortamında zorunludur")

DATABASE_URL = _database_url or "postgresql+asyncpg://tradebot_user:baba046532@localhost/tradebot_db"
SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() in ("1", "true", "yes")

engine = create_async_engine(DATABASE_URL, echo=SQLALCHEMY_ECHO)
# Pyright tip desteği için generics ile açıkça belirt (SQLAlchemy 2.0 async API)
SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)
"""
Do not declare Base here to avoid import-time engine side effects in tooling like Alembic.
Base is provided by app.db_base and imported by models/alembic.
"""
