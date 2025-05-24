from celery import Celery
import os
from celery.schedules import crontab

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "tradebot",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['app.core.bot_tasks']
)

# Celery Beat schedule ayarları
celery_app.conf.beat_schedule = {
    'run-all-active-bots-every-minute': {
        'task': 'app.core.bot_tasks.run_bot_task_for_all',
        'schedule': crontab(minute='*'),
    },
}

@celery_app.task
def test_celery(x, y):
    """Simple test task."""
    return x + y
