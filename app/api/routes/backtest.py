from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.services.backtest_service import BacktestService
from app.dependencies.auth import get_current_user, get_db
from app.models.backtest import Backtest
from app.schemas.backtest import BacktestSummary, BacktestDetail

router = APIRouter(prefix="/api/v1/backtest", tags=["backtest"])

class BacktestRequest(BaseModel):
    symbol: str
    interval: str
    start_date: str
    end_date: str
    parameters: Dict[str, Any]

@router.post("/run")
async def run_backtest(request: BacktestRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Run a backtest for a trading strategy
    """
    try:
        print(f"🚀 Starting backtest for {current_user.email}")

        # Create backtest service instance with user context
        backtest_service = BacktestService(user_id=current_user.id, db_session=db)

        # Run the backtest
        results = await backtest_service.run_backtest(
            symbol=request.symbol,
            interval=request.interval,
            start_date=request.start_date,
            end_date=request.end_date,
            parameters=request.parameters
        )

        # Save results to database
        backtest_id = await backtest_service.save_backtest_result(results)
        if backtest_id:
            results['id'] = backtest_id

        return {
            "status": "success",
            "data": results
        }

    except Exception as e:
        print(f"❌ Backtest error: {e}")
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

@router.get("/list")
async def get_backtest_list(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Get a list of user's backtests
    """
    try:
        backtest_service = BacktestService()
        backtests = await backtest_service.get_backtest_list(current_user.id, db)

        return {
            "status": "success",
            "data": backtests
        }

    except Exception as e:
        print(f"❌ Backtest list error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get backtest list: {str(e)}"
        )

@router.get("/detail/{backtest_id}")
async def get_backtest_detail(backtest_id: int, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Get details of a specific backtest
    """
    try:
        backtest_service = BacktestService()
        backtest = await backtest_service.get_backtest_detail(backtest_id, current_user.id, db)

        return {
            "status": "success",
            "data": backtest
        }

    except Exception as e:
        print(f"❌ Backtest detail error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get backtest detail: {str(e)}"
        )

@router.delete("/delete/{backtest_id}")
async def delete_backtest(backtest_id: int, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Delete a specific backtest
    """
    try:
        backtest_service = BacktestService()
        await backtest_service.delete_backtest(backtest_id, current_user.id, db)

        return {
            "status": "success",
            "message": "Backtest deleted successfully"
        }

    except Exception as e:
        print(f"❌ Backtest delete error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete backtest: {str(e)}"
        )
