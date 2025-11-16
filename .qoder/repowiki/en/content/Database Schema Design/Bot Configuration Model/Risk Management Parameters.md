# Risk Management Parameters

<cite>
**Referenced Files in This Document**   
- [bot_config.py](file://app/models/bot_config.py)
- [bot_tasks.py](file://app/core/bot_tasks.py)
- [bot_state.py](file://app/models/bot_state.py)
- [bot_config.py](file://app/schemas/bot_config.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Risk Parameters](#core-risk-parameters)
3. [Daily Risk Controls](#daily-risk-controls)
4. [Position Sizing Options](#position-sizing-options)
5. [Custom Risk Overrides](#custom-risk-overrides)
6. [Real-World Scenarios](#real-world-scenarios)
7. [Validation Rules and Default Values](#validation-rules-and-default-values)
8. [Daily Loss Limit Enforcement](#daily-loss-limit-enforcement)

## Introduction
This document provides a comprehensive overview of the risk management parameters implemented in the BotConfig model of the trading bot system. These parameters are designed to protect capital, manage exposure, and ensure disciplined trading behavior. The system incorporates both basic and advanced risk controls, allowing users to define stop-loss, take-profit, trailing stop, daily loss limits, position sizing, and strategy-specific overrides. The parameters are enforced during bot execution and are critical for maintaining sustainable trading performance.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L1-L59)

## Core Risk Parameters

### Stop-Loss Percentage (stop_loss_perc)
The `stop_loss_perc` parameter defines the maximum allowable loss on a single trade as a percentage of entry price. When the market price reaches this threshold, the position is automatically closed to prevent further losses. This parameter is mandatory and must be set for every bot configuration.

For example, with `stop_loss_perc = 2.0`, a long position opened at $100 will be closed if the price drops to $98. Similarly, a short position at $100 would be closed at $102.

### Take-Profit Percentage (take_profit_perc)
The `take_profit_perc` parameter sets the profit target for a trade as a percentage of entry price. Once the market price reaches this level, the position is automatically closed to secure profits. This parameter is also mandatory and works in conjunction with stop-loss to define the risk-reward ratio.

For instance, with `take_profit_perc = 4.0`, a long position at $100 will be closed at $104, while a short position will be closed at $96.

### Trailing Stop Percentage (trailing_stop_perc)
The `trailing_stop_perc` parameter enables a dynamic stop-loss mechanism that follows the market price as it moves favorably. This allows traders to lock in profits while still allowing room for the trade to develop. The trailing stop is only activated when `trailing_stop_active` is set to true.

For example, with `trailing_stop_perc = 1.5`, if a long position rises from $100 to $110, the stop-loss level will move from $98.50 to $108.35 (1.5% below the peak price).

### Trailing Stop Activation (trailing_stop_active)
The `trailing_stop_active` boolean flag controls whether the trailing stop functionality is enabled. When set to `true`, the system monitors price movements and adjusts the stop-loss level accordingly. When `false`, only the static stop-loss is enforced.

This flag provides flexibility to use trailing stops selectively based on market conditions or trading strategy requirements.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L19-L22)
- [bot_tasks.py](file://app/core/bot_tasks.py#L260-L263)

## Daily Risk Controls

### Maximum Daily Loss Percentage (max_daily_loss_perc)
The `max_daily_loss_perc` parameter sets a hard limit on daily losses as a percentage of initial capital. If the cumulative daily PnL (Profit and Loss) reaches this negative threshold, the bot is automatically paused to prevent further drawdown.

For example, with `initial_capital = 1000` and `max_daily_loss_perc = 5.0`, if the daily PnL reaches -$50, the bot will be deactivated with status "paused (max_daily_loss reached)".

### Daily Target Percentage (daily_target_perc)
The `daily_target_perc` parameter defines a profit goal for the trading day. When the cumulative daily PnL reaches this positive threshold, the bot is automatically paused to lock in gains.

For instance, with `initial_capital = 1000` and `daily_target_perc = 3.0`, once the daily PnL reaches $30, the bot will be paused with status "paused (daily target reached)".

### Maximum Daily Trades (max_daily_trades)
The `max_daily_trades` parameter limits the number of trades executed per day. This helps prevent over-trading and excessive transaction costs. When the daily trade count reaches this limit, the bot is paused.

For example, with `max_daily_trades = 10`, after the 10th trade of the day, the bot will be paused with status "paused (max_daily_trades reached)".

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L15-L16)
- [bot_tasks.py](file://app/core/bot_tasks.py#L378-L397)
- [bot_state.py](file://app/models/bot_state.py#L17-L18)

## Position Sizing Options

### Position Size Percentage (position_size_perc)
The `position_size_perc` parameter determines the trade size as a percentage of available capital. This allows for dynamic position sizing based on account balance.

For example, with `position_size_perc = 10.0`, each trade will use 10% of the current capital, adjusting automatically as the account balance changes.

### Fixed Position Size (position_size_fixed)
The `position_size_fixed` parameter sets a fixed monetary amount for each trade, regardless of account size. This provides consistent position sizing across different account balances.

For instance, with `position_size_fixed = 100`, each trade will be executed with exactly $100 worth of the trading pair.

When both parameters are specified, the system prioritizes the fixed size. If neither is set, the system uses a default notional value of $25 for trade sizing.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L17-L18)
- [bot_tasks.py](file://app/core/bot_tasks.py#L340-L345)

## Custom Risk Overrides

### Strategy-Specific Risk Parameters
The system provides custom risk parameters that allow strategy-specific overrides of the default risk settings. These parameters are particularly useful when running multiple strategies with different risk profiles.

#### Custom Stop-Loss (custom_stop_loss)
The `custom_stop_loss` parameter allows a strategy to define its own stop-loss percentage, overriding the default `stop_loss_perc`. This enables fine-tuning risk parameters for specific market conditions or trading approaches.

#### Custom Take-Profit (custom_take_profit)
The `custom_take_profit` parameter enables a strategy to set its own profit target, independent of the default `take_profit_perc`. This allows for optimized risk-reward ratios tailored to specific strategies.

#### Custom Trailing Stop (custom_trailing_stop)
The `custom_trailing_stop` parameter lets a strategy define its own trailing stop distance, providing flexibility in profit protection mechanisms.

These custom parameters have default values of 0.5%, 1.5%, and 0.3% respectively, but can be adjusted based on strategy requirements.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L42-L44)
- [bot_tasks.py](file://app/core/bot_tasks.py#L260-L263)

## Real-World Scenarios

### Volatile Market Conditions
During periods of high volatility, the interaction between these risk parameters becomes critical. Consider a scenario with the following configuration:

- `stop_loss_perc = 2.0`
- `take_profit_perc = 4.0`
- `trailing_stop_active = true`
- `trailing_stop_perc = 1.5`
- `max_daily_loss_perc = 5.0`
- `daily_target_perc = 3.0`

In a volatile market, a long position might experience rapid price swings. The initial stop-loss at 2% below entry provides basic protection. As the price rises, the trailing stop activates, locking in profits. If the market reverses sharply, the trailing stop may trigger before the static stop-loss, potentially resulting in a profitable exit.

However, if multiple losing trades occur in succession, the daily loss limit acts as a circuit breaker. Once cumulative losses reach 5% of initial capital, the bot pauses, preventing catastrophic drawdown during adverse market conditions.

### High-Frequency Trading Scenario
For a high-frequency strategy with `max_daily_trades = 50`, the system ensures disciplined execution. Even if individual trades have favorable risk-reward ratios, the daily trade limit prevents over-trading. This is particularly important during news events or market anomalies when trading signals might be unreliable.

The combination of daily trade limits and profit/loss targets creates a balanced approach: the bot can capitalize on opportunities but is constrained by predefined risk parameters.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L15-L22)
- [bot_tasks.py](file://app/core/bot_tasks.py#L370-L397)

## Validation Rules and Default Values

### Parameter Validation
The system enforces validation rules to ensure parameter integrity:

- `stop_loss_perc` and `take_profit_perc` are required fields
- Percentage values must be positive numbers
- `max_daily_loss_perc` and `daily_target_perc` are optional but must be positive if specified
- `max_daily_trades` must be a positive integer if set
- `trailing_stop_perc` must be positive when `trailing_stop_active` is true

### Default Values
The system provides sensible defaults for optional parameters:

- `trailing_stop_active = false` (trailing stop disabled by default)
- `check_interval_seconds = 60` (bot checks for signals every minute)
- `strategy = "simple"` (default trading strategy)
- `position_type = "spot"` (default to spot trading)
- `auto_transfer_funds = true` (enable automatic fund transfers)

Custom risk parameters have the following defaults:
- `custom_stop_loss = 0.5`
- `custom_take_profit = 1.5`
- `custom_trailing_stop = 0.3`

These defaults provide a conservative starting point that can be adjusted based on user preferences and risk tolerance.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L21-L22)
- [bot_config.py](file://app/models/bot_config.py#L42-L44)
- [bot_config.py](file://app/schemas/bot_config.py#L9-L40)

## Daily Loss Limit Enforcement

### Automatic Bot Deactivation
When the daily loss limit is exceeded, the system automatically deactivates the bot to prevent further losses. This enforcement mechanism is implemented in the `_run_bot` function within `bot_tasks.py`.

The process works as follows:
1. Calculate the loss threshold: `-(max_daily_loss_perc / 100) * initial_capital`
2. Compare current daily PnL against the threshold
3. If PnL is below threshold, update bot status to "paused (max_daily_loss reached)"
4. Commit changes to database
5. Return control without executing further trades

### Daily Reset Mechanism
The system includes a daily reset task (`reactivate_bots_after_reset`) that runs at midnight UTC. This task:
- Resets daily trade counters to zero
- Resets daily PnL to zero
- Clears last error messages
- Reactivates any paused bots

This ensures that bots start each trading day with a clean slate, allowing them to resume trading after being paused due to daily limits.

The automatic deactivation and daily reset create a robust risk management cycle that protects capital while allowing for continued operation on subsequent days.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py#L378-L387)
- [bot_tasks.py](file://app/core/bot_tasks.py#L79-L109)
- [bot_state.py](file://app/models/bot_state.py#L17-L18)