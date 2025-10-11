import asyncio
from typing import Dict, Any

from app.services.backtest_service import BacktestService


async def run_single(symbol: str, interval: str, start_date: str, end_date: str,
                     parameters: Dict[str, Any], market_type: str) -> Dict[str, Any]:
    service = BacktestService()
    result = await service.run_backtest(
        symbol=symbol,
        interval=interval,
        start_date=start_date,
        end_date=end_date,
        parameters=parameters,
        market_type=market_type,
    )

    # Cache doğrulaması
    cached = service.cache.is_cached(symbol, interval, start_date, end_date, market_type)

    # Trade log örneği (yalnızca spot için hızlı kontrol)
    trade_log_len = None
    if market_type == "spot":
        log = await service.generate_trade_log(
            symbol=symbol,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
            parameters=parameters,
            market_type=market_type,
        )
        trade_log_len = len(log)

    summary = {
        "market_type": market_type,
        "symbol": result.get("symbol"),
        "interval": result.get("interval"),
        "total_trades": result.get("total_trades"),
        "win_rate": round(float(result.get("win_rate", 0.0)), 2),
        "total_return": round(float(result.get("total_return", 0.0)), 2),
        "fees": round(float(result.get("total_fees", 0.0)), 6),
        "daily_count": len(result.get("daily_results", []) or []),
        "monthly_count": len(result.get("monthly_results", {}) or {}),
        "test_mode": result.get("test_mode"),
        "cache_hit_after_run": bool(cached),
        "trade_log_len": trade_log_len,
    }
    return summary


async def main():
    params: Dict[str, Any] = {
        "initial_capital": 1000,
        "daily_target": 3.0,
        "max_daily_loss": 1.0,
        "stop_loss": 0.5,
        "take_profit": 1.5,
        "trailing_stop": 0.3,
        "ema_fast": 8,
        "ema_slow": 21,
        "rsi_period": 7,
        "rsi_oversold": 35,
        "rsi_overbought": 65,
        "risk_per_trade": 2.0,
        # leverage sadece futures'ta etkili; burada belirtmek opsiyonel
        "leverage": 10,
    }

    # Kısa tarih aralığı (yaklaşık 2 gün)
    symbol = "BTCUSDT"
    interval = "15m"
    start_date = "2025-09-20"
    end_date = "2025-09-22"

    spot_summary = await run_single(symbol, interval, start_date, end_date, params, "spot")
    futures_summary = await run_single(symbol, interval, start_date, end_date, params, "futures")

    # Ek test: ETHUSDT 1h ile kısa aralık
    eth_summary = await run_single("ETHUSDT", "1h", "2025-09-20", "2025-09-23", params, "spot")

    # Sembol listeleri
    svc = BacktestService()
    spot_syms = await svc.get_available_symbols("spot")
    fut_syms = await svc.get_available_symbols("futures")

    print("=== Smoke Test Summary ===")
    print("SPOT:", spot_summary)
    print("FUTURES:", futures_summary)
    print("ETH SPOT 1h:", eth_summary)
    print("Symbols (spot,futures):", len(spot_syms), len(fut_syms))


if __name__ == "__main__":
    asyncio.run(main())


