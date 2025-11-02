import csv
import os
import sys
from collections import defaultdict, Counter


def parse_float(val):
    try:
        return float(str(val).strip())
    except Exception:
        return 0.0


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def symbol_from_path(path):
    base = os.path.basename(path)
    # Try common pattern: backtest_1_SYMBOL_trades.csv
    if "backtest_" in base and "_trades" in base:
        head = base.split("_trades")[0]
        parts = head.split("_")
        if parts:
            return parts[-1]
    # Fallback: filename without extension
    return os.path.splitext(base)[0]


def read_rows(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows


def write_csv(path, headers, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for row in rows:
            w.writerow(row)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_trade_report.py <trades_csv_path> [output_dir]")
        sys.exit(1)

    trades_csv = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) >= 3 else os.path.join("scripts", "reports")
    ensure_dir(output_dir)

    rows = read_rows(trades_csv)
    n = len(rows)
    if n == 0:
        print("No rows found in CSV")
        sys.exit(0)

    symbol = symbol_from_path(trades_csv)

    # Basic aggregates
    wins = sum(1 for r in rows if parse_float(r.get("pnl_usdt", 0)) > 0)
    losses = n - wins
    sum_pnl = sum(parse_float(r.get("pnl_usdt", 0)) for r in rows)
    sum_fees = sum(parse_float(r.get("fees_entry", 0)) + parse_float(r.get("fees_exit", 0)) for r in rows)
    avg_fee_per_trade = sum_fees / n if n else 0.0

    # Capital progression to infer initial capital and total return
    caps = [parse_float(r.get("capital_after", 0)) for r in rows]
    first_pnl = parse_float(rows[0].get("pnl_usdt", 0))
    initial_capital = (caps[0] - first_pnl) if caps else 0.0
    last_capital = caps[-1] if caps else 0.0
    total_return_pct = ((last_capital - initial_capital) / initial_capital * 100) if initial_capital else 0.0
    fees_to_abs_pnl_pct = (sum_fees / abs(sum_pnl) * 100) if sum_pnl != 0 else 0.0

    # Exit reason stats
    reasons = defaultdict(lambda: {"count": 0, "sum_pnl": 0.0})
    for r in rows:
        reason = str(r.get("exit_reason", "")).strip()
        reasons[reason]["count"] += 1
        reasons[reason]["sum_pnl"] += parse_float(r.get("pnl_usdt", 0))

    # Daily aggregates
    daily = defaultdict(lambda: {
        "trade_count": 0,
        "wins": 0,
        "losses": 0,
        "tp_count": 0,
        "sl_count": 0,
        "daily_pnl": 0.0,
        "daily_fees": 0.0,
        "last_capital": 0.0,
    })

    for r in rows:
        d = str(r.get("date", "")).strip()
        pnl = parse_float(r.get("pnl_usdt", 0))
        fee = parse_float(r.get("fees_entry", 0)) + parse_float(r.get("fees_exit", 0))
        reason = str(r.get("exit_reason", "")).strip().upper()
        cap_after = parse_float(r.get("capital_after", 0))

        agg = daily[d]
        agg["trade_count"] += 1
        agg["wins"] += 1 if pnl > 0 else 0
        agg["losses"] += 1 if pnl <= 0 else 0
        agg["daily_pnl"] += pnl
        agg["daily_fees"] += fee
        if reason == "TP":
            agg["tp_count"] += 1
        elif reason == "SL":
            agg["sl_count"] += 1
        agg["last_capital"] = cap_after

    days_sorted = sorted(daily.keys())
    num_days = len(days_sorted)
    avg_daily_trades = (n / num_days) if num_days else 0.0

    # Best/Worst day by daily PnL
    best_day, best_day_pnl = None, None
    worst_day, worst_day_pnl = None, None
    for d in days_sorted:
        pnl_d = daily[d]["daily_pnl"]
        if best_day_pnl is None or pnl_d > best_day_pnl:
            best_day, best_day_pnl = d, pnl_d
        if worst_day_pnl is None or pnl_d < worst_day_pnl:
            worst_day, worst_day_pnl = d, pnl_d

    # Write summary.csv
    summary_headers = [
        "symbol",
        "total_trades",
        "wins",
        "losses",
        "win_rate_pct",
        "sum_pnl_usdt",
        "sum_fees_usdt",
        "avg_fee_per_trade_usdt",
        "initial_capital",
        "last_capital",
        "total_return_pct",
        "fees_to_abs_pnl_pct",
        "avg_daily_trades",
        "best_day",
        "best_day_pnl_usdt",
        "worst_day",
        "worst_day_pnl_usdt",
    ]
    summary_rows = [[
        symbol,
        n,
        wins,
        losses,
        round(wins / n * 100, 4) if n else 0.0,
        round(sum_pnl, 6),
        round(sum_fees, 6),
        round(avg_fee_per_trade, 6),
        round(initial_capital, 6),
        round(last_capital, 6),
        round(total_return_pct, 6),
        round(fees_to_abs_pnl_pct, 6),
        round(avg_daily_trades, 6),
        best_day or "",
        round(best_day_pnl or 0.0, 6),
        worst_day or "",
        round(worst_day_pnl or 0.0, 6),
    ]]
    write_csv(os.path.join(output_dir, "summary.csv"), summary_headers, summary_rows)

    # Write tp_sl_stats.csv
    tp_sl_headers = ["exit_reason", "count", "sum_pnl_usdt", "avg_pnl_usdt"]
    tp_sl_rows = []
    for reason, stats in reasons.items():
        count = stats["count"]
        sum_r = stats["sum_pnl"]
        avg_r = (sum_r / count) if count else 0.0
        tp_sl_rows.append([reason, count, round(sum_r, 6), round(avg_r, 6)])
    write_csv(os.path.join(output_dir, "tp_sl_stats.csv"), tp_sl_headers, tp_sl_rows)

    # Write daily_results.csv
    daily_headers = [
        "date",
        "trade_count",
        "wins",
        "losses",
        "tp_count",
        "sl_count",
        "daily_pnl_usdt",
        "daily_fees_usdt",
        "last_capital_usdt",
    ]
    daily_rows = []
    for d in days_sorted:
        agg = daily[d]
        daily_rows.append([
            d,
            agg["trade_count"],
            agg["wins"],
            agg["losses"],
            agg["tp_count"],
            agg["sl_count"],
            round(agg["daily_pnl"], 6),
            round(agg["daily_fees"], 6),
            round(agg["last_capital"], 6),
        ])
    write_csv(os.path.join(output_dir, "daily_results.csv"), daily_headers, daily_rows)

    # Write fees.csv (overall fees summary)
    fees_headers = [
        "sum_fees_usdt",
        "avg_fee_per_trade_usdt",
        "fees_to_abs_pnl_pct",
        "total_trades",
    ]
    fees_rows = [[
        round(sum_fees, 6),
        round(avg_fee_per_trade, 6),
        round(fees_to_abs_pnl_pct, 6),
        n,
    ]]
    write_csv(os.path.join(output_dir, "fees.csv"), fees_headers, fees_rows)

    print(f"Report generated for {symbol} => {output_dir}")


if __name__ == "__main__":
    main()

