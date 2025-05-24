from pydantic import BaseModel
from typing import Optional

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
    last_run_at: Optional[str] = None
    last_error_message: Optional[str] = None
    last_updated_at: Optional[str] = None

class BotStateCreate(BotStateBase):
    pass

class BotStateUpdate(BotStateBase):
    pass

class BotStateResponse(BotStateBase):
    id: int

    model_config = {
        "from_attributes": True
    }
