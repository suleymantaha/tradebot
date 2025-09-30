import os
import sys
import asyncio

# Proje kökünü sys.path'e ekle ("app" modülünü import etmek için)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Test ortamında veritabanını SQLite'a yönlendir
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

# Test başlamadan tabloları oluştur
def pytest_sessionstart(session):
    # Tabloların metadata'sını yüklemek için modelleri import et
    import app.models  # noqa: F401
    from app.db_base import Base
    from app.database import engine

    async def _create_all():
        async with engine.begin() as conn:
            # Temiz başlangıç
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_create_all())


