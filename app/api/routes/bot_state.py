from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.bot_state import BotState
from app.schemas.bot_state import BotStateUpdate, BotStateResponse
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.models.bot_config import BotConfig

router = APIRouter(prefix="/api/v1/bot-states", tags=["bot-states"])

@router.get("/{bot_config_id}", response_model=BotStateResponse)
async def get_bot_state(bot_config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotState).join(BotConfig).where(BotState.id == bot_config_id, BotConfig.user_id == current_user.id))
    state = result.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="Bot state not found")
    return state

@router.put("/{bot_config_id}", response_model=BotStateResponse)
async def update_bot_state(bot_config_id: int, state_in: BotStateUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotState).join(BotConfig).where(BotState.id == bot_config_id, BotConfig.user_id == current_user.id))
    state = result.scalars().first()
    if not state:
        raise HTTPException(status_code=404, detail="Bot state not found")
    for field, value in state_in.dict(exclude_unset=True).items():
        setattr(state, field, value)
    await db.commit()
    await db.refresh(state)
    return state
