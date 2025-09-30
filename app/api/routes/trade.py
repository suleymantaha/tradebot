from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeResponse
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/trades", tags=["trades"])

@router.post("/", response_model=TradeResponse, status_code=201)
async def create_trade(trade_in: TradeCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Güvenlik: user_id'yi her zaman current_user.id olarak zorla
    payload = trade_in.dict()
    payload["user_id"] = current_user.id
    new_trade = Trade(**payload)
    db.add(new_trade)
    await db.commit()
    await db.refresh(new_trade)
    return TradeResponse.model_validate(new_trade, from_attributes=True)

@router.get("/", response_model=list[TradeResponse])
async def list_trades(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(Trade).where(Trade.user_id == current_user.id))
    trades = result.scalars().all()
    return [TradeResponse.model_validate(t, from_attributes=True) for t in trades]

@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(trade_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    result = await db.execute(select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id))
    trade = result.scalars().first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return TradeResponse.model_validate(trade, from_attributes=True)
