from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.models.bot_config import BotConfig
from app.models.trade import Trade
from app.models.bot_state import BotState
from typing import List, Optional, cast
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/bots", tags=["bot-report"])

@router.get("/{bot_config_id}/performance")
async def get_bot_performance(bot_config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Bot doğrulama
    result = await db.execute(select(BotConfig).where(BotConfig.id == bot_config_id, BotConfig.user_id == current_user.id))
    bot_config = result.scalars().first()
    if not bot_config:
        raise HTTPException(status_code=404, detail="Bot config not found")
    # Trade geçmişi
    result = await db.execute(select(Trade).where(Trade.bot_config_id == bot_config_id))
    trades = result.scalars().all()
    total_trades = len(trades)
    total_buy = sum(1 for t in trades if cast(str, t.side) == "BUY")
    total_sell = sum(1 for t in trades if cast(str, t.side) == "SELL")
    total_pnl = sum((t.price if cast(str, t.side) == "SELL" else -t.price) for t in trades)
    total_realized_pnl = sum(t.realized_pnl for t in trades if t.realized_pnl is not None)
    last_trade = trades[-1].timestamp if trades else None
    return {
        "bot_config_id": bot_config_id,
        "total_trades": total_trades,
        "total_buy": total_buy,
        "total_sell": total_sell,
        "total_pnl": total_pnl,
        "total_realized_pnl": total_realized_pnl,
        "last_trade": last_trade
    }

@router.get("/{bot_config_id}/trades")
async def get_bot_trades(
    bot_config_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    side: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    # Bot doğrulama
    result = await db.execute(select(BotConfig).where(BotConfig.id == bot_config_id, BotConfig.user_id == current_user.id))
    bot_config = result.scalars().first()
    if not bot_config:
        raise HTTPException(status_code=404, detail="Bot config not found")
    # Filtreli trade sorgusu
    query = select(Trade).where(Trade.bot_config_id == bot_config_id)
    if side:
        query = query.where(Trade.side == side)
    if start_date:
        query = query.where(Trade.timestamp >= start_date)
    if end_date:
        query = query.where(Trade.timestamp <= end_date)
    query = query.order_by(Trade.timestamp.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    trades = result.scalars().all()
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "side": t.side,
            "order_type": t.order_type,
            "price": t.price,
            "quantity_filled": t.quantity_filled,
            "quote_quantity_filled": t.quote_quantity_filled,
            "realized_pnl": t.realized_pnl,
            "timestamp": t.timestamp
        } for t in trades
    ]

@router.get("/summary")
async def get_all_bots_summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Kullanıcının tüm botlarını çek
    result = await db.execute(select(BotConfig).where(BotConfig.user_id == current_user.id))
    bot_configs = result.scalars().all()
    summary = []
    for bot in bot_configs:
        # Her bot için trade geçmişi
        result = await db.execute(select(Trade).where(Trade.bot_config_id == bot.id))
        trades = result.scalars().all()
        total_trades = len(trades)
        total_buy = sum(1 for t in trades if cast(str, t.side) == "BUY")
        total_sell = sum(1 for t in trades if cast(str, t.side) == "SELL")
        total_pnl = sum((t.price if cast(str, t.side) == "SELL" else -t.price) for t in trades)
        total_realized_pnl = sum(t.realized_pnl for t in trades if t.realized_pnl is not None)
        last_trade = trades[-1].timestamp if trades else None
        summary.append({
            "bot_config_id": bot.id,
            "name": bot.name,
            "symbol": bot.symbol,
            "strategy": getattr(bot, "strategy", "simple"),
            "total_trades": total_trades,
            "total_buy": total_buy,
            "total_sell": total_sell,
            "total_pnl": total_pnl,
            "total_realized_pnl": total_realized_pnl,
            "last_trade": last_trade
        })
    return summary
