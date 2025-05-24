from pydantic import BaseModel
from typing import Optional

class TradeBase(BaseModel):
    bot_config_id: int
    user_id: int
    binance_order_id: Optional[str] = None
    symbol: str
    side: str
    order_type: str
    price: float
    quantity_filled: float
    quote_quantity_filled: float
    commission_amount: Optional[float] = None
    commission_asset: Optional[str] = None
    pnl: Optional[float] = None
    realized_pnl: Optional[float] = None
    timestamp: Optional[str] = None

class TradeCreate(TradeBase):
    pass

class TradeUpdate(TradeBase):
    pass

class TradeResponse(TradeBase):
    id: int

    model_config = {
        "from_attributes": True
    }
