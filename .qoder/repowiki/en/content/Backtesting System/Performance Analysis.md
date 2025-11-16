# Performance Analysis

<cite>
**Referenced Files in This Document**   
- [backtest_service.py](file://app/services/backtest_service.py)
- [BacktestHistory.jsx](file://frontend/src/components/Backtest/BacktestHistory.jsx)
- [BacktestReportPage.jsx](file://frontend/src/pages/Backtest/BacktestReportPage.jsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Performance Metrics Calculation](#performance-metrics-calculation)
3. [Equity Curve and P&L Aggregation](#equity-curve-and-pnl-aggregation)
4. [Backend to Frontend Workflow](#backend-to-frontend-workflow)
5. [Domain Model of Performance Analysis](#domain-model-of-performance-analysis)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Conclusion](#conclusion)

## Introduction
The performance analysis feature in the trading bot system evaluates backtest results through a comprehensive set of quantitative metrics. These metrics are calculated from simulated trade data and presented to users through a frontend interface. The system computes key performance indicators such as total return, win rate, profit factor, Sharpe ratio, Sortino ratio, maximum drawdown, and CAGR. This document explains the implementation details of these calculations, the workflow from backend computation to frontend visualization, and the domain model that connects trade logs, equity progression, and statistical metrics.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L829-L1021)
- [BacktestHistory.jsx](file://frontend/src/components/Backtest/BacktestHistory.jsx#L268-L284)

## Performance Metrics Calculation
The performance metrics are calculated in the backend using the `BacktestService` class. The main method `run_backtest` orchestrates the calculation of various metrics after simulating trades. The metrics are computed using specific helper methods that are designed to handle edge cases and ensure numerical stability.

### Total Return
The total return is calculated as the percentage change in capital from the initial to the final amount. The formula used is:
```
total_return = (current_capital - initial_capital) / initial_capital * 100
```
This calculation is performed in the `run_backtest` method after all trades have been simulated.

### Win Rate
The win rate is the percentage of winning trades out of the total number of trades. It is calculated as:
```
win_rate = (winning_trades / total_trades) * 100
```
The counts of winning and losing trades are accumulated during the daily P&L calculation.

### Profit Factor
The profit factor is calculated using the `_compute_profit_factor` method, which takes a list of trade P&L percentages. The method sums the gains (positive P&Ls) and losses (negative P&Ls, converted to positive values) and returns their ratio:
```python
gains = sum(p for p in trade_pnls if p > 0)
losses = -sum(p for p in trade_pnls if p < 0)
if losses == 0:
    return float('inf') if gains > 0 else 0.0
return float(gains / losses)
```

### Sharpe Ratio
The Sharpe ratio is computed using the `_compute_sharpe` method, which takes daily returns as input. The method converts percentage returns to decimal form, calculates the mean and standard deviation, and applies the Sharpe formula with an annualization factor:
```python
rets = np.array(returns_pct, dtype=float) / 100.0
mu = np.mean(rets)
sigma = np.std(rets, ddof=1) if len(rets) > 1 else 0.0
if sigma == 0:
    return 0.0
sharpe = (mu * periods_per_year) / (sigma * np.sqrt(periods_per_year))
```

### Sortino Ratio
The Sortino ratio is similar to the Sharpe ratio but uses downside deviation instead of total standard deviation. The `_compute_sortino` method filters returns to include only negative values for calculating the downside risk:
```python
downside = rets[rets < 0]
ds_sigma = np.std(downside, ddof=1) if len(downside) > 1 else 0.0
mu = np.mean(rets)
if ds_sigma == 0:
    return 0.0
sortino = (mu * periods_per_year) / (ds_sigma * np.sqrt(periods_per_year))
```

### Maximum Drawdown
The maximum drawdown is calculated by tracking the peak equity value and computing the percentage decline from that peak. The `_compute_max_drawdown` method iterates through the equity curve to find the largest drawdown:
```python
peak = equity_curve[0]
max_dd = 0.0
for val in equity_curve:
    if val > peak:
        peak = val
    drawdown = (val - peak) / peak * 100.0
    if drawdown < max_dd:
        max_dd = drawdown
```

### CAGR
The Compound Annual Growth Rate (CAGR) is calculated using the `_compute_cagr` method, which takes the initial and final capital along with the start and end dates. The method computes the number of years between the dates and applies the CAGR formula:
```python
start = datetime.strptime(start_date, "%Y-%m-%d")
end = datetime.strptime(end_date, "%Y-%m-%d")
days = max((end - start).days, 1)
years = days / 365.25
if initial_capital <= 0 or years <= 0:
    return 0.0
cagr = (final_capital / initial_capital) ** (1 / years) - 1
return float(cagr * 100.0)
```

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L444-L510)

## Equity Curve and P&L Aggregation
The equity curve is constructed from daily P&L results, which are aggregated during the backtest simulation. The `calculate_daily_pnl` method processes trades on a daily basis, applying risk management rules and accumulating P&L data.

### Daily P&L Calculation
The daily P&L calculation is performed in the `calculate_daily_pnl` method, which iterates through grouped daily data. For each day, it processes trades until either the maximum number of daily trades is reached or the maximum daily loss threshold is exceeded. The method accumulates the following data for each day:
- Daily P&L percentage
- Number of trades
- Capital after the day's trading

This data is stored in the `daily_results` list, which is used to construct the equity curve.

### Monthly Aggregation
Monthly results are aggregated by grouping daily results by month. The `calculate_daily_pnl` method maintains a `monthly_results` dictionary that accumulates P&L percentages and trade counts for each month:
```python
month = pd.to_datetime(str(date)).strftime('%Y-%m')
if month not in monthly_results:
    monthly_results[month] = {'pnl_pct': 0.0, 'trades': 0}
monthly_results[month]['pnl_pct'] += daily_pnl_pct
monthly_results[month]['trades'] += daily_trades
```

### Equity Curve Construction
The equity curve is built from the daily results by extracting the capital value for each day:
```python
equity_curve = [float(x.get('capital', current_capital)) for x in daily_results] if daily_results else [float(current_capital)]
```
This equity curve is then used for calculating risk-adjusted return metrics such as maximum drawdown, Sharpe ratio, and Sortino ratio.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L619-L827)

## Backend to Frontend Workflow
The workflow from backend calculation to frontend visualization involves several steps, starting with the execution of the backtest and ending with the display of metrics in the user interface.

### Backend Calculation
The backtest is initiated through the `run_backtest` method, which orchestrates the entire process:
1. Setup of the Binance client and retrieval of historical data
2. Preparation of technical indicators
3. Simulation of trades using the `calculate_daily_pnl` method
4. Calculation of performance metrics using specialized methods
5. Construction of the results dictionary containing all metrics

The results are then saved to the database using the `save_backtest_result` method and made available through the API.

### API Endpoints
The backend exposes several API endpoints for accessing backtest results:
- `GET /api/v1/backtest/list` - Returns a list of backtests with basic metrics
- `GET /api/v1/backtest/detail/{id}` - Returns detailed backtest results including daily and monthly P&L
- `GET /api/v1/backtest/trades/{id}` - Returns the trade log for a specific backtest

### Frontend Visualization
The frontend components retrieve and display the performance metrics in several ways:

#### Backtest History
The `BacktestHistory` component displays a table of backtest results, showing key metrics such as total return and win rate:
```jsx
<div className={`text-lg font-semibold ${getReturnColor(selectedBacktest.total_return)}`}>
    {selectedBacktest.total_return > 0 ? '+' : ''}{selectedBacktest.total_return.toFixed(2)}%
</div>
<div className={`text-lg font-semibold ${getWinRateColor(selectedBacktest.win_rate)}`}>
    {selectedBacktest.win_rate.toFixed(2)}%
</div>
```

#### Backtest Report
The `BacktestReportPage` component provides a detailed view of backtest results, including charts for daily P&L, daily trades, and TP/SL statistics. The component uses Chart.js to render interactive charts that allow users to zoom and pan through the data.

The component also provides CSV export functionality for the summary, daily results, and TP/SL statistics, allowing users to perform further analysis in external tools.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L829-L1021)
- [BacktestHistory.jsx](file://frontend/src/components/Backtest/BacktestHistory.jsx#L268-L284)
- [BacktestReportPage.jsx](file://frontend/src/pages/Backtest/BacktestReportPage.jsx#L548-L652)

## Domain Model of Performance Analysis
The domain model of performance analysis connects trade logs, equity progression, and statistical metrics through a well-defined data structure.

### Trade Logs
Trade logs are generated during the backtest simulation and contain detailed information about each trade, including:
- Entry and exit times and prices
- Number of units traded
- P&L in USDT and percentage
- Fees incurred
- Capital after the trade
- Exit reason (TP, SL, or EOD)

These logs are used to reconstruct the equity curve and verify the accuracy of aggregated metrics.

### Equity Progression
The equity progression is represented by the equity curve, which shows the capital level at the end of each trading day. This curve is fundamental to the calculation of risk-adjusted return metrics and provides a visual representation of the strategy's performance over time.

### Statistical Metrics
The statistical metrics are derived from the trade logs and equity curve through mathematical formulas. The metrics are organized into categories:
- **Return Metrics**: Total return, CAGR, average profit per trade
- **Risk Metrics**: Maximum drawdown, volatility
- **Risk-Adjusted Return Metrics**: Sharpe ratio, Sortino ratio, profit factor
- **Efficiency Metrics**: Win rate, average trades per day, fee-to-P&L ratio

These metrics provide a comprehensive view of the strategy's performance, allowing users to evaluate its profitability, consistency, and risk profile.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L829-L1021)
- [BacktestReportPage.jsx](file://frontend/src/pages/Backtest/BacktestReportPage.jsx#L325-L463)

## Common Issues and Solutions
Several common issues can affect the reliability of performance indicators, and the system includes solutions to address these issues.

### Short Backtest Periods
Short backtest periods can lead to misleading performance indicators due to insufficient data. The system addresses this issue by:
- Defaulting to a 6-month backtest period when no dates are specified
- Providing warnings when the backtest period is less than a certain threshold
- Including the backtest duration in the results to provide context for the metrics

### Survivorship Bias
Survivorship bias occurs when backtests are performed on assets that have survived to the present day, excluding those that have failed. The system mitigates this bias by:
- Using historical data from the Binance API, which includes delisted symbols
- Allowing users to specify custom date ranges to test performance during different market conditions
- Providing the ability to test on multiple symbols to assess strategy robustness

### Overfitting
Overfitting occurs when a strategy is excessively optimized for historical data and performs poorly on new data. The system addresses overfitting by:
- Implementing walk-forward analysis in the `backtest_significance.py` script
- Providing Monte Carlo simulation to assess the robustness of results
- Encouraging users to test strategies on out-of-sample data

### Data Quality Issues
Data quality issues such as missing values or outliers can affect performance calculations. The system handles these issues by:
- Using robust statistical methods that are less sensitive to outliers
- Implementing data validation and cleaning routines
- Providing fallback mechanisms for missing data

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L829-L1021)
- [backtest_significance.py](file://scripts/backtest_significance.py#L1-L33)

## Conclusion
The performance analysis system in the trading bot provides a comprehensive evaluation of backtest results through a wide range of quantitative metrics. The system calculates key performance indicators such as total return, win rate, profit factor, Sharpe ratio, Sortino ratio, maximum drawdown, and CAGR using robust mathematical formulas. The workflow from backend calculation to frontend visualization is well-defined, with the backend computing metrics and the frontend presenting them in an accessible format. The domain model connects trade logs, equity progression, and statistical metrics, providing a complete picture of strategy performance. The system also addresses common issues such as short backtest periods and survivorship bias, ensuring that performance indicators are reliable and meaningful. This comprehensive approach enables users to make informed decisions about their trading strategies based on rigorous quantitative analysis.