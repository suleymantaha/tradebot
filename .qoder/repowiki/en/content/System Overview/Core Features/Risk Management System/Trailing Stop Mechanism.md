# Trailing Stop Mechanism

<cite>
**Referenced Files in This Document**   
- [bot_config.py](file://app/models/bot_config.py)
- [bot_state.py](file://app/models/bot_state.py)
- [bot_tasks.py](file://app/core/bot_tasks.py)
- [backtest_service.py](file://app/services/backtest_service.py)
- [bot_config.py](file://app/schemas/bot_config.py)
- [bot_config.py](file://app/api/routes/bot_config.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Configuration in BotConfig Model](#configuration-in-botconfig-model)
3. [Schema Validation and Frontend Exposure](#schema-validation-and-frontend-exposure)
4. [Usage in Trade Protection Logic](#usage-in-trade-protection-logic)
5. [Current Implementation Status](#current-implementation-status)
6. [Common Issues and Expected Behavior](#common-issues-and-expected-behavior)
7. [Conclusion](#conclusion)

## Introduction
The trailing stop mechanism is a risk management feature designed to protect profits by automatically adjusting the stop-loss level as the market price moves favorably. This document focuses on the implementation and usage of the `custom_trailing_stop` and `trailing_stop_active` parameters within the trading bot system. These parameters are configured in the `BotConfig` model, validated through Pydantic schemas, and exposed in the frontend for user configuration. While these parameters are defined and passed through various components, the actual execution logic for trailing stops may not be fully implemented in the core bot task processor (`bot_tasks.py`). This document analyzes the current state of implementation, highlights where trailing stop values are defined and used, and provides guidance on expected functionality versus actual implementation.

## Configuration in BotConfig Model
The `custom_trailing_stop` and `trailing_stop_active` parameters are defined within the `BotConfig` model, which represents the configuration for each trading bot instance. The `custom_trailing_stop` field is a numeric value that specifies the percentage distance from the highest price that the trailing stop should follow. It is stored as a `Numeric` type in the database with a default value of 0.3, indicating a 0.3% trailing distance. The `trailing_stop_active` field is a boolean flag that determines whether the trailing stop functionality is enabled for the bot. By default, this flag is set to `False`, meaning the trailing stop is disabled unless explicitly activated by the user.

These fields are part of the advanced risk management parameters in the `BotConfig` model and are mapped to the `bot_configs` database table. They are accessible through the ORM relationship and can be queried or updated via the API. The presence of these fields in the model allows them to be persisted in the database and retrieved when the bot configuration is loaded for execution.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L43)
- [bot_config.py](file://app/models/bot_config.py#L21)

## Schema Validation and Frontend Exposure
The `custom_trailing_stop` and `trailing_stop_active` parameters are validated and exposed through the Pydantic schema defined in `bot_config.py` within the `schemas` module. The schema ensures that `custom_trailing_stop` is an optional float with a default value of 0.3, while `trailing_stop_active` is an optional boolean with a default value of `False`. This schema is used for request validation when creating or updating bot configurations via the API, ensuring that only valid data types and ranges are accepted.

The API routes in `api/routes/bot_config.py` utilize this schema to handle CRUD operations for bot configurations. When a user creates or updates a bot configuration through the frontend, the request payload is validated against the schema before being persisted to the database. This ensures data integrity and consistency across the system. The frontend components, such as the bot creation and editing pages, expose these parameters as form fields, allowing users to configure the trailing stop settings directly. The values entered by the user are then sent to the backend via API calls, where they are validated and stored in the `BotConfig` model.

**Section sources**
- [bot_config.py](file://app/schemas/bot_config.py#L39)
- [bot_config.py](file://app/schemas/bot_config.py#L17)
- [bot_config.py](file://app/api/routes/bot_config.py)

## Usage in Trade Protection Logic
The trailing stop parameters are intended to be used in the trade protection logic to dynamically adjust the stop-loss level based on price movements. In the `bot_tasks.py` file, the `custom_trailing_stop` value is retrieved from the `bot_config` object and used to calculate the trailing stop price. This value is passed to the trading strategy logic, where it is used to determine the exit conditions for a trade. For example, if the price reaches a new high, the trailing stop price is updated to a percentage below this new high, as defined by the `custom_trailing_stop` value.

The `trailing_stop_active` flag is used to conditionally enable or disable the trailing stop logic. If the flag is set to `True`, the bot will monitor the price movement and adjust the stop-loss level accordingly. If the flag is `False`, the trailing stop logic is bypassed, and the trade is managed using fixed stop-loss and take-profit levels. This allows users to toggle the trailing stop functionality on or off based on their trading strategy.

Additionally, the `backtest_service.py` file includes logic for simulating trailing stop behavior during backtesting. The `calculate_daily_pnl` method uses the `trailing_stop` parameter to calculate the trailing stop price and evaluate exit conditions. This ensures that the backtesting results accurately reflect the behavior of the trailing stop mechanism, providing users with reliable performance metrics.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py#L261)
- [backtest_service.py](file://app/services/backtest_service.py#L642)
- [backtest_service.py](file://app/services/backtest_service.py#L709)

## Current Implementation Status
While the `custom_trailing_stop` and `trailing_stop_active` parameters are defined in the `BotConfig` model and exposed in the frontend, the actual execution logic for trailing stops may not be fully implemented in the `bot_tasks.py` file. The code in `bot_tasks.py` retrieves the `custom_trailing_stop` value and uses it in the trading strategy logic, but there is no explicit implementation of the trailing stop adjustment mechanism. This means that while the parameter is passed through the system, the bot may not be actively monitoring price movements and updating the stop-loss level as expected.

The absence of trailing stop execution logic in `bot_tasks.py` suggests that the feature is either incomplete or relies on external systems or services to manage the trailing stop. This could lead to discrepancies between the expected behavior and the actual behavior of the bot. For example, users may configure a trailing stop in the frontend, but the bot may not execute the stop-loss order when the price moves unfavorably, resulting in larger losses than anticipated.

Despite this limitation, the trailing stop parameters are used in the backtesting service, where the logic is fully implemented. This allows users to simulate the behavior of the trailing stop and evaluate its effectiveness in historical data. However, the lack of implementation in the live trading logic means that the feature is not yet functional in production.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py)
- [backtest_service.py](file://app/services/backtest_service.py)

## Common Issues and Expected Behavior
A common issue with the trailing stop mechanism is the misunderstanding of its behavior. Users may expect the trailing stop to be automatically executed by the bot when the price moves unfavorably, but in the current implementation, this may not be the case. The `trailing_stop_active` flag may not have any effect on the live trading logic, leading to confusion and potential losses. Users should be aware that the trailing stop functionality is currently limited to backtesting and may not be active in live trading.

The expected behavior of the trailing stop is to protect profits by adjusting the stop-loss level as the price moves in a favorable direction. For example, if a user sets a `custom_trailing_stop` value of 0.3, the stop-loss level should be updated to 0.3% below the highest price reached during the trade. If the price then reverses and falls to this level, the stop-loss order should be executed, closing the position and locking in profits. However, in the current implementation, this behavior may not occur in live trading, as the logic to update the stop-loss level is not present in the `bot_tasks.py` file.

To address this issue, users should rely on the backtesting results to evaluate the effectiveness of the trailing stop and consider alternative risk management strategies for live trading. Developers should prioritize the implementation of the trailing stop execution logic in the core bot task processor to ensure that the feature works as expected in production.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py)
- [backtest_service.py](file://app/services/backtest_service.py)

## Conclusion
The `custom_trailing_stop` and `trailing_stop_active` parameters are essential components of the trading bot's risk management system, allowing users to configure dynamic stop-loss levels to protect profits. These parameters are defined in the `BotConfig` model, validated through Pydantic schemas, and exposed in the frontend for user configuration. While the parameters are used in the backtesting service to simulate trailing stop behavior, the actual execution logic may not be fully implemented in the live trading logic. This discrepancy between expected and actual behavior can lead to confusion and potential losses for users. To ensure the reliability and effectiveness of the trailing stop mechanism, developers should implement the missing execution logic in the core bot task processor and provide clear documentation on the current state of the feature.