from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime

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

    # İleri seviye teknik indikatör parametreleri
    custom_ema_fast: Optional[int] = 8
    custom_ema_slow: Optional[int] = 21
    custom_rsi_period: Optional[int] = 7
    custom_rsi_oversold: Optional[int] = 35
    custom_rsi_overbought: Optional[int] = 65

    # İleri seviye risk yönetimi
    custom_stop_loss: Optional[float] = 0.5
    custom_take_profit: Optional[float] = 1.5
    custom_trailing_stop: Optional[float] = 0.3

    # Pozisyon ve fon yönetimi
    position_type: Optional[str] = "spot"  # "spot" veya "futures"
    transfer_amount: Optional[float] = None  # Belirli miktar, None ise tüm bakiye
    auto_transfer_funds: Optional[bool] = True  # Otomatik fon transferi

class BotConfigCreate(BotConfigBase):
    pass

class BotConfigUpdate(BotConfigBase):
    pass

class BotConfigResponse(BotConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else ""

    model_config = {
        "from_attributes": True
    }
