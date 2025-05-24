from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class BotStateBase(BaseModel):
    status: Optional[str] = "stopped"
    in_position: Optional[bool] = False
    entry_price: Optional[float] = None
    current_position_size_coins: Optional[float] = None
    trailing_stop_price: Optional[float] = None
    max_price_since_entry: Optional[float] = None
    take_profit_price: Optional[float] = None
    stop_loss_price: Optional[float] = None
    daily_pnl: Optional[float] = 0.0
    daily_trades_count: Optional[int] = 0
    last_run_at: Optional[datetime] = None
    last_error_message: Optional[str] = None
    last_updated_at: Optional[datetime] = None

class BotStateCreate(BotStateBase):
    pass

class BotStateUpdate(BotStateBase):
    pass

class BotStateResponse(BotStateBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda dt: dt.isoformat() if dt else None
        }
    )
