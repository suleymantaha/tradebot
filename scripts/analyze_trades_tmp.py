import csv, sys, math
from collections import Counter

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\\Users\\Suley\\Downloads\\backtest_1_BNBUSDT_trades.csv"
rows = []
with open(path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        rows.append(r)

n = len(rows)
wins = sum(1 for r in rows if float(r['pnl_usdt']) > 0)
sum_pnl = sum(float(r['pnl_usdt']) for r in rows)
sum_fees = sum(float(r['fees_entry']) + float(r['fees_exit']) for r in rows)
sides = Counter(r['side'].strip().upper() for r in rows)
reasons = Counter(r['exit_reason'].strip() for r in rows)

# entry_time must be <= exit_time for each trade
bad_time = sum(1 for r in rows if r['entry_time'] > r['exit_time'])

# validation functions

def check_row(r):
    side = r['side'].strip().upper()
    ep = float(r['entry_price'])
    xp = float(r['exit_price'])
    u = float(r['units'])
    fe = float(r['fees_entry'])
    fx = float(r['fees_exit'])
    pnl = float(r['pnl_usdt'])
    pct = float(r['pnl_pct'])
    if side == 'LONG':
        gross = (xp - ep) * u
        pct_calc = (xp - ep) / ep * 100
    else:
        gross = (ep - xp) * u
        pct_calc = (ep - xp) / ep * 100
    expected = gross - (fe + fx)
    ok_pnl = math.isclose(pnl, expected, rel_tol=1e-5, abs_tol=1e-3)
    ok_pct = math.isclose(pct, pct_calc, rel_tol=1e-4, abs_tol=1e-3)
    return ok_pnl, ok_pct, expected, pct_calc

errors = []
for i, r in enumerate(rows):
    ok_pnl, ok_pct, exp_pnl, calc_pct = check_row(r)
    if not ok_pnl or not ok_pct:
        errors.append((i, ok_pnl, ok_pct, r['date'], r['side'], r['entry_time'], r['exit_time'], r['pnl_usdt'], f"{exp_pnl:.6f}", r['pnl_pct'], f"{calc_pct:.6f}"))

# capital_after progression check: delta should match pnl_usdt
cap_errors = 0
caps = [float(r['capital_after']) for r in rows]
if caps:
    for i in range(1, n):
        delta = caps[i] - caps[i - 1]
        if not math.isclose(delta, float(rows[i]['pnl_usdt']), rel_tol=1e-5, abs_tol=1e-3):
            cap_errors += 1

print(f"rows={n}")
print(f"wins={wins} win_rate={wins/n*100:.2f}%")
print(f"sum_pnl_usdt={sum_pnl:.6f}")
print(f"sum_fees_usdt={sum_fees:.6f}")
print("sides:", dict(sides))
print("exit_reasons:", dict(reasons))
print(f"time_order_issues={bad_time}")
print(f"capital_progress_errors={cap_errors}")
print(f"validation_errors={len(errors)}")
if errors:
    print("first_errors:")
    for e in errors[:5]:
        print(e)
