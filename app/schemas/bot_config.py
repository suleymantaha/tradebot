from pydantic import BaseModel
from typing import Optional

class BotConfigBase(BaseModel):
    name: str
    symbol: str
    timeframe: str
    is_active: Optional[bool] = False
    initial_capital: Optional[float] = None
    daily_target_perc: Optional[float] = None
    max_daily_loss_perc: Optional[float] = None
    position_size_perc: Optional[float] = None
    position_size_fixed: Optional[float] = None
    stop_loss_perc: float
    take_profit_perc: float
    trailing_stop_perc: Optional[float] = None
    trailing_stop_active: Optional[bool] = False
    ema_fast: int
    ema_slow: int
    rsi_period: int
    rsi_oversold: int
    rsi_overbought: int
    max_daily_trades: Optional[int] = None
    check_interval_seconds: Optional[int] = 60
    api_key_id: Optional[int] = None
    strategy: str = "simple"
    ema_period: Optional[int] = None

class BotConfigCreate(BotConfigBase):
    pass

class BotConfigUpdate(BotConfigBase):
    pass

class BotConfigResponse(BotConfigBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
