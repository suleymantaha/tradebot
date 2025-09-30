from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class BacktestBase(BaseModel):
    symbol: str
    interval: str
    start_date: str
    end_date: str
    parameters: Dict[str, Any]

class BacktestCreate(BacktestBase):
    pass

class BacktestSummary(BaseModel):
    id: int
    symbol: str
    interval: str
    start_date: str
    end_date: str
    total_return: float
    win_rate: float
    total_trades: int
    test_mode: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class BacktestDetail(BacktestSummary):
    parameters: Dict[str, Any]
    initial_capital: float
    final_capital: float
    winning_trades: int
    losing_trades: int
    total_fees: float
    avg_profit: float
    daily_results: Optional[List[Dict[str, Any]]] = None
    monthly_results: Optional[Dict[str, Any]] = None

    model_config = {
        "from_attributes": True
    }
