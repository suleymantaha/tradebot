from fastapi import APIRouter, HTTPException, Depends, Response
from typing import Dict, Any, List
from pydantic import BaseModel
import os
import io
import csv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    market_type: str = "spot"  # Default to spot
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
            parameters=request.parameters,
            market_type=request.market_type
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
        print(f"🔍 Cache info requested by user: {current_user.email}")
        backtest_service = BacktestService()
        cache_info = backtest_service.cache.get_cache_info()

        print(f"📊 Returning cache info: {cache_info}")

        return {
            "status": "success",
            "data": cache_info
        }

    except Exception as e:
        print(f"❌ Cache info error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache info: {str(e)}"
        )

@router.post("/cache/clear")
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

@router.get("/symbols/{market_type}")
async def get_symbols(market_type: str, current_user = Depends(get_current_user)):
    """
    Get available symbols for spot or futures trading
    """
    try:
        if market_type.lower() not in ['spot', 'futures']:
            raise HTTPException(status_code=400, detail="Market type must be 'spot' or 'futures'")

        print(f"📊 Symbols requested for {market_type} by user: {current_user.email}")
        backtest_service = BacktestService()
        symbols = await backtest_service.get_available_symbols(market_type)

        return {
            "status": "success",
            "data": {
                "market_type": market_type.lower(),
                "symbols": symbols,
                "count": len(symbols)
            }
        }

    except Exception as e:
        print(f"❌ Symbols fetch error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch symbols: {str(e)}"
        )

@router.get("/download/{backtest_id}/daily.csv")
async def download_backtest_daily_csv(backtest_id: int, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Belirli bir backtest için günlük sonuçları CSV olarak indir
    Kolonlar: date, pnl, trades, capital
    """
    try:
        backtest_service = BacktestService()
        detail = await backtest_service.get_backtest_detail(backtest_id, current_user.id, db)

        daily_results = detail.get('daily_results') or []

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["date", "pnl", "trades", "capital"])
        for row in daily_results:
            writer.writerow([
                row.get("date"),
                row.get("pnl", 0),
                row.get("trades", 0),
                row.get("capital", 0)
            ])

        csv_data = output.getvalue()
        symbol = str(detail.get('symbol', 'SYMBOL'))
        safe_symbol = ''.join([c if c.isalnum() else '_' for c in symbol])
        headers = {
            "Content-Disposition": f"attachment; filename=backtest_{backtest_id}_{safe_symbol}_daily.csv"
        }
        return Response(content=csv_data, media_type="text/csv", headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Daily CSV export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export daily CSV: {str(e)}")

@router.get("/download/{backtest_id}/monthly.csv")
async def download_backtest_monthly_csv(backtest_id: int, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Belirli bir backtest için aylık özet sonuçları CSV olarak indir
    Kolonlar: month, pnl, trades
    """
    try:
        backtest_service = BacktestService()
        detail = await backtest_service.get_backtest_detail(backtest_id, current_user.id, db)

        monthly_results = detail.get('monthly_results') or {}

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["month", "pnl", "trades"])
        for month in sorted(monthly_results.keys()):
            vals = monthly_results.get(month) or {}
            writer.writerow([
                month,
                vals.get("pnl", 0),
                vals.get("trades", 0)
            ])

        csv_data = output.getvalue()
        symbol = str(detail.get('symbol', 'SYMBOL'))
        safe_symbol = ''.join([c if c.isalnum() else '_' for c in symbol])
        headers = {
            "Content-Disposition": f"attachment; filename=backtest_{backtest_id}_{safe_symbol}_monthly.csv"
        }
        return Response(content=csv_data, media_type="text/csv", headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Monthly CSV export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export monthly CSV: {str(e)}")

@router.get("/download/{backtest_id}/trades.csv")
async def download_backtest_trades_csv(backtest_id: int, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Belirli bir backtest için trade-by-trade CSV indir.
    Bu, aynı parametrelerle simülasyonu yeniden çalıştırarak trade log üretir.
    Kolonlar: date, side, entry_time, exit_time, entry_price, exit_price, units, pnl_usdt, pnl_pct, fees_entry, fees_exit, capital_after, leverage, exit_reason
    """
    try:
        backtest_service = BacktestService()
        detail = await backtest_service.get_backtest_detail(backtest_id, current_user.id, db)

        trade_log = await backtest_service.generate_trade_log(
            symbol=detail['symbol'],
            interval=detail['interval'],
            start_date=detail['start_date'],
            end_date=detail['end_date'],
            parameters=detail['parameters'],
            market_type=str(detail.get('market_type', 'spot')).lower()
        )

        output = io.StringIO()
        writer = csv.writer(output)
        headers_row = [
            "date", "side", "entry_time", "exit_time", "entry_price", "exit_price",
            "units", "pnl_usdt", "pnl_pct", "fees_entry", "fees_exit", "capital_after", "leverage", "exit_reason"
        ]
        writer.writerow(headers_row)
        for row in trade_log:
            writer.writerow([
                row.get("date"),
                row.get("side", "LONG"),
                row.get("entry_time"),
                row.get("exit_time"),
                row.get("entry_price", 0),
                row.get("exit_price", 0),
                row.get("units", 0),
                row.get("pnl_usdt", 0),
                row.get("pnl_pct", 0),
                row.get("fees_entry", 0),
                row.get("fees_exit", 0),
                row.get("capital_after", 0),
                row.get("leverage", 1),
                row.get("exit_reason", "EOD")
            ])

        csv_data = output.getvalue()
        symbol = str(detail.get('symbol', 'SYMBOL'))
        safe_symbol = ''.join([c if c.isalnum() else '_' for c in symbol])
        headers = {
            "Content-Disposition": f"attachment; filename=backtest_{backtest_id}_{safe_symbol}_trades.csv"
        }
        return Response(content=csv_data, media_type="text/csv", headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Trades CSV export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export trades CSV: {str(e)}")
