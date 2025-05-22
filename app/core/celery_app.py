from celery import Celery
import os
from celery.schedules import crontab
from app.models.bot_config import BotConfig
from app.core.bot_tasks import run_bot_task
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import DATABASE_URL
import asyncio

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "tradebot",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Celery Beat schedule ayarları
def get_active_bot_ids():
    """Tüm aktif botların id'lerini döndürür."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async def fetch():
        async with SessionLocal() as session:
            result = await session.execute(BotConfig.__table__.select().where(BotConfig.is_active == True))
            return [row.id for row in result]
    return asyncio.run(fetch())

celery_app.conf.beat_schedule = {
    'run-all-active-bots-every-minute': {
        'task': 'app.core.bot_tasks.run_bot_task_for_all',
        'schedule': crontab(minute='*'),
    },
}

@celery_app.task(name='app.core.bot_tasks.run_bot_task_for_all')
def run_bot_task_for_all():
    """Tüm aktif botlar için run_bot_task tetikler."""
    bot_ids = get_active_bot_ids()
    for bot_id in bot_ids:
        run_bot_task.delay(bot_id)

@celery_app.task
def test_celery(x, y):
    """Simple test task."""
    return x + y
