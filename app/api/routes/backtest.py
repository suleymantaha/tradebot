from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from pydantic import BaseModel
import os

from app.services.backtest_service import BacktestService
from app.dependencies.auth import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/backtest", tags=["backtest"])

class BacktestRequest(BaseModel):
    symbol: str
    interval: str
    start_date: str
    end_date: str
    parameters: Dict[str, Any]

@router.post("/run")
async def run_backtest(
    request: BacktestRequest,
    # current_user = Depends(get_current_user),  # Temporarily disabled for testing
    # db: AsyncSession = Depends(get_db)
):
    """
    Run a backtest with the given parameters
    """
    try:
        # Validate symbol
        valid_symbols = [
            'BNBUSDT', 'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT',
            'XRPUSDT', 'LTCUSDT', 'BCHUSDT', 'LINKUSDT', 'XLMUSDT'
        ]

        if request.symbol not in valid_symbols:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid symbol. Must be one of: {', '.join(valid_symbols)}"
            )

        # Validate interval
        valid_intervals = ['5m', '15m', '30m', '1h', '4h', '1d']
        if request.interval not in valid_intervals:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval. Must be one of: {', '.join(valid_intervals)}"
            )

        # Validate required parameters
        required_params = [
            'initial_capital', 'daily_target', 'max_daily_loss',
            'stop_loss', 'take_profit', 'trailing_stop',
            'ema_fast', 'ema_slow', 'rsi_period',
            'rsi_oversold', 'rsi_overbought'
        ]

        missing_params = [param for param in required_params if param not in request.parameters]
        if missing_params:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required parameters: {', '.join(missing_params)}"
            )

        # Initialize backtest service in test mode (no auth required)
        backtest_service = BacktestService()  # No user_id, will use test mode

        # Run backtest
        results = await backtest_service.run_backtest(
            symbol=request.symbol,
            interval=request.interval,
            start_date=request.start_date,
            end_date=request.end_date,
            parameters=request.parameters
        )

        return {
            "status": "success",
            "message": "Backtest completed successfully",
            "data": results
        }

    except Exception as e:
        print(f"❌ Backtest API error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Backtest failed: {str(e)}"
        )

@router.get("/cache/info")
async def get_cache_info(current_user = Depends(get_current_user)):
    """
    Get information about cached data
    """
    try:
        backtest_service = BacktestService()
        cache_info = backtest_service.cache.get_cache_info()

        return {
            "status": "success",
            "data": cache_info
        }

    except Exception as e:
        print(f"❌ Cache info error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache info: {str(e)}"
        )

@router.delete("/cache/clear")
async def clear_cache(current_user = Depends(get_current_user)):
    """
    Clear all cached data
    """
    try:
        backtest_service = BacktestService()
        backtest_service.cache.clear_cache()

        return {
            "status": "success",
            "message": "Cache cleared successfully"
        }

    except Exception as e:
        print(f"❌ Cache clear error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )
