from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.models.bot_config import BotConfig
from app.models.bot_state import BotState
from app.core.bot_tasks import run_bot_task
from sqlalchemy import text

router = APIRouter(prefix="/api/v1/bots", tags=["bot-runner"])

@router.post("/{bot_config_id}/start")
async def start_bot(bot_config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.id == bot_config_id, BotConfig.user_id == current_user.id))
    bot_config = result.scalars().first()
    if not bot_config:
        raise HTTPException(status_code=404, detail="Bot config not found")

    # BotConfig'in is_active field'ını güncelle
    bot_config.is_active = True

    # BotState oluşturulmamışsa oluştur
    result = await db.execute(select(BotState).where(BotState.id == bot_config_id))
    bot_state = result.scalars().first()
    if not bot_state:
        bot_state = BotState(id=bot_config_id, status="pending")
        db.add(bot_state)
    else:
        bot_state.status = "pending"

    await db.commit()

    # Celery task'ını başlat
    run_bot_task.delay(bot_config_id)
    return {"message": "Bot started", "bot_config_id": bot_config_id}

@router.post("/{bot_config_id}/stop")
async def stop_bot(bot_config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.id == bot_config_id, BotConfig.user_id == current_user.id))
    bot_config = result.scalars().first()
    if not bot_config:
        raise HTTPException(status_code=404, detail="Bot config not found")

    # BotConfig'in is_active field'ını güncelle
    bot_config.is_active = False

    # BotState'i güncelle
    result = await db.execute(select(BotState).where(BotState.id == bot_config_id))
    bot_state = result.scalars().first()
    if bot_state:
        bot_state.status = "stopped"

    await db.commit()
    return {"message": "Bot stopped", "bot_config_id": bot_config_id}
