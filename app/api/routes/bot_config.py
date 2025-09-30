from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.bot_config import BotConfig
from app.schemas.bot_config import BotConfigCreate, BotConfigUpdate, BotConfigResponse
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/bot-configs", tags=["bot-configs"])

@router.post("/", response_model=BotConfigResponse, status_code=201)
async def create_bot_config(config_in: BotConfigCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    new_config = BotConfig(user_id=current_user.id, **config_in.dict())
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    return new_config

@router.get("/", response_model=list[BotConfigResponse])
async def list_bot_configs(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.user_id == current_user.id))
    configs = result.scalars().all()
    return configs

@router.get("/{config_id}", response_model=BotConfigResponse)
async def get_bot_config(config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.id == config_id, BotConfig.user_id == current_user.id))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Bot config not found")
    return config

@router.put("/{config_id}", response_model=BotConfigResponse)
async def update_bot_config(config_id: int, config_in: BotConfigUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.id == config_id, BotConfig.user_id == current_user.id))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Bot config not found")
    for field, value in config_in.dict(exclude_unset=True).items():
        setattr(config, field, value)
    await db.commit()
    await db.refresh(config)
    return config

@router.delete("/{config_id}", status_code=204)
async def delete_bot_config(config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(BotConfig).where(BotConfig.id == config_id, BotConfig.user_id == current_user.id))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Bot config not found")
    await db.delete(config)
    await db.commit()
    return None
