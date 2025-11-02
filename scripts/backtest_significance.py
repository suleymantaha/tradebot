import asyncio
import statistics
import random
from typing import Dict, Any, List, Tuple

from app.services.backtest_service import BacktestService

# Simple Monte Carlo bootstrap and walk-forward analysis using BacktestService outputs.
# Produces CI for cumulative returns and Sharpe, plus a basic walk-forward split with small grid search.

async def run_backtest_once(symbol: str, interval: str, start_date: str, end_date: str,
                            params: Dict[str, Any], market_type: str = "spot") -> Dict[str, Any]:
    svc = BacktestService()
    res = await svc.run_backtest(symbol=symbol, interval=interval,
                                 start_date=start_date, end_date=end_date,
                                 parameters=params, market_type=market_type)
    return res

def bootstrap_daily_returns(day_returns: List[float], n_iter: int = 2000) -> Dict[str, Any]:
    # Resample with replacement over daily percentage returns
    samples_total = []
    samples_mean = []
    for _ in range(n_iter):
        sample = [random.choice(day_returns) for _ in day_returns]
        total = sum(sample)
        mean_ = statistics.mean(sample) if sample else 0.0
        samples_total.append(total)
        samples_mean.append(mean_)

    # 95% CI
    def ci95(x: List[float]) -> Tuple[float, float]:
        x_sorted = sorted(x)
        low = x_sorted[int(0.025 * len(x_sorted))]
        high = x_sorted[int(0.975 * len(x_sorted))]
        return (low, high)

    total_ci = ci95(samples_total)
    mean_ci = ci95(samples_mean)
    # p-value for positive cumulative return
    p_pos = sum(1 for t in samples_total if t > 0) / len(samples_total)

    return {
        "bootstrap_total_returns": samples_total[:50],  # preview subset
        "bootstrap_mean_returns": samples_mean[:50],    # preview subset
        "total_return_ci95": total_ci,
        "mean_return_ci95": mean_ci,
        "prob_total_positive": p_pos,
    }

async def walk_forward(symbol: str, interval: str, start_date: str, split_date: str, end_date: str,
                       base_params: Dict[str, Any], market_type: str = "spot") -> Dict[str, Any]:
    # Small grid for EMA/RSI tuning on training period
    ema_fast_grid = [8, 10, 12]
    ema_slow_grid = [21, 26, 30]
    rsi_period_grid = [7, 14]

    # Train (optimize Sharpe)
    best = None
    best_sharpe = -1e9
    for ef in ema_fast_grid:
        for es in ema_slow_grid:
            for rp in rsi_period_grid:
                params = dict(base_params)
                params.update({"ema_fast": ef, "ema_slow": es, "rsi_period": rp})
                train_res = await run_backtest_once(symbol, interval, start_date, split_date, params, market_type)
                sharpe = float(train_res.get("sharpe", 0.0))
                if sharpe > best_sharpe:
                    best_sharpe = sharpe
                    best = {"ema_fast": ef, "ema_slow": es, "rsi_period": rp, "train": train_res}

    # Test with best params
    test_params = dict(base_params)
    if best:
        test_params.update({"ema_fast": best["ema_fast"], "ema_slow": best["ema_slow"], "rsi_period": best["rsi_period"]})
    test_res = await run_backtest_once(symbol, interval, split_date, end_date, test_params, market_type)

    return {
        "train_best_params": best,
        "test_results": test_res,
    }

async def main():
    symbol = "BTCUSDT"
    interval = "15m"
    # Use same range as smoke test
    start_date = "2025-09-20"
    end_date = "2025-09-22"

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
        "leverage": 10,
    }

    # Spot analysis
    spot_res = await run_backtest_once(symbol, interval, start_date, end_date, params, "spot")
    day_returns_spot = [float(x.get("pnl_pct", 0.0)) for x in (spot_res.get("daily_results") or [])]

    mc_spot = bootstrap_daily_returns(day_returns_spot, n_iter=2000)

    # Futures analysis
    fut_res = await run_backtest_once(symbol, interval, start_date, end_date, params, "futures")
    day_returns_fut = [float(x.get("pnl_pct", 0.0)) for x in (fut_res.get("daily_results") or [])]
    mc_fut = bootstrap_daily_returns(day_returns_fut, n_iter=2000)

    # Walk-forward: choose split in the middle day (approx)
    split_date = "2025-09-21"
    wf_spot = await walk_forward(symbol, interval, start_date, split_date, end_date, params, "spot")

    print("=== Monte Carlo & Walk-Forward Summary ===")
    print("Spot total_return:", round(float(spot_res.get("total_return", 0.0)), 4))
    print("Spot Sharpe:", round(float(spot_res.get("sharpe", 0.0)), 4))
    print("Spot MC total_return 95% CI:", mc_spot["total_return_ci95"])
    print("Spot MC mean_return 95% CI:", mc_spot["mean_return_ci95"]) 
    print("Spot MC prob(total>0):", round(float(mc_spot["prob_total_positive"]), 4))

    print("Futures total_return:", round(float(fut_res.get("total_return", 0.0)), 4))
    print("Futures Sharpe:", round(float(fut_res.get("sharpe", 0.0)), 4))
    print("Futures MC total_return 95% CI:", mc_fut["total_return_ci95"]) 
    print("Futures MC mean_return 95% CI:", mc_fut["mean_return_ci95"]) 
    print("Futures MC prob(total>0):", round(float(mc_fut["prob_total_positive"]), 4))

    if wf_spot.get("train_best_params"):
        best = wf_spot["train_best_params"]
        train_sharpe = float(best.get("train", {}).get("sharpe", 0.0))
        test_sharpe = float(wf_spot["test_results"].get("sharpe", 0.0))
        print("Walk-Forward Spot: best_params:", {k: best[k] for k in ("ema_fast","ema_slow","rsi_period")})
        print("Walk-Forward Spot: train_sharpe:", round(train_sharpe, 4))
        print("Walk-Forward Spot: test_sharpe:", round(test_sharpe, 4))
        print("Walk-Forward Spot: test_total_return:", round(float(wf_spot["test_results"].get("total_return", 0.0)), 4))
    else:
        print("Walk-Forward Spot: no best params found (insufficient data)")

if __name__ == "__main__":
    asyncio.run(main())
