# Leverage Control

<cite>
**Referenced Files in This Document**   
- [bot_config.py](file://app/models/bot_config.py)
- [bot_config.py](file://app/schemas/bot_config.py)
- [bot_tasks.py](file://app/core/bot_tasks.py)
- [binance_client.py](file://app/core/binance_client.py)
- [BotCreatePage.jsx](file://frontend/src/pages/Bots/BotCreatePage.jsx)
- [BotEditPage.jsx](file://frontend/src/pages/Bots/BotEditPage.jsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Leverage Configuration in BotConfig Model](#leverage-configuration-in-botconfig-model)
3. [Frontend Implementation and Validation](#frontend-implementation-and-validation)
4. [Trading Logic Enforcement in bot_tasks.py](#trading-logic-enforcement-in-bot_taskspy)
5. [Binance Client Integration for Futures Leverage](#binance-client-integration-for-futures-leverage)
6. [Domain Model of Leverage Parameters](#domain-model-of-leverage-parameters)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive analysis of the leverage control sub-feature within TradeBot's futures trading risk management system. It details the implementation of leverage configuration, validation, and enforcement across the application stack. The leverage parameter is a critical risk management tool that amplifies both potential gains and losses in futures trading. This document explains how leverage is stored in the BotConfig model with validation between 1-125x, enforced in the trading logic within bot_tasks.py, and applied to Binance futures positions through the BinanceClientWrapper. The content is designed to be accessible to beginners while providing sufficient technical depth for experienced developers regarding the implementation of leverage controls in automated futures trading systems.

## Leverage Configuration in BotConfig Model
The leverage parameter is a fundamental component of the BotConfig model, specifically designed for futures trading risk management. The model includes a dedicated leverage field that stores the user-configured leverage multiplier as an integer value. This field is defined with a nullable constraint and a default value of 10, representing a moderate leverage setting that balances risk and potential return. The leverage field is only applicable when the position_type is set to "futures", as spot trading does not utilize leverage.

The implementation includes comprehensive validation to ensure the leverage value remains within safe operational limits. The validation enforces a range of 1-125x, which aligns with Binance's futures trading limits. Values outside this range are automatically adjusted to the default of 10x to prevent configuration errors that could lead to excessive risk exposure. This validation is implemented at both the database schema level and the Pydantic model level, providing redundant safety checks.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L4-L57)
- [bot_config.py](file://app/schemas/bot_config.py#L4-L61)

## Frontend Implementation and Validation
The frontend implementation provides a user-friendly interface for configuring leverage settings, with contextual visibility based on the selected position type. When users select "futures" as their position type, the leverage configuration field becomes visible, allowing them to choose from a predefined set of leverage options ranging from 1x (safe) to 125x (extreme risk). The dropdown options are carefully curated to guide users toward reasonable leverage levels, with descriptive labels indicating the risk profile of each option.

Client-side validation is implemented using React Hook Form with comprehensive validation rules. The leverage field requires a value when futures trading is selected and enforces the 1-125x range constraint. If users enter an invalid value, descriptive error messages are displayed, such as "En az 1x olmalıdır" (Must be at least 1x) or "En fazla 125x olabilir" (Can be at most 125x). Additionally, a prominent risk warning is displayed when high leverage options are selected, emphasizing that "Yüksek kaldıraç büyük kazançlar sağlayabilir ancak aynı zamanda büyük kayıplar da yaratabilir" (High leverage can provide large gains but can also create large losses).

**Section sources**
- [BotCreatePage.jsx](file://frontend/src/pages/Bots/BotCreatePage.jsx#L340-L397)
- [BotEditPage.jsx](file://frontend/src/pages/Bots/BotEditPage.jsx#L305-L365)

## Trading Logic Enforcement in bot_tasks.py
The trading logic in bot_tasks.py implements a robust enforcement mechanism for leverage settings during bot execution. When a bot task runs, it first checks if the position type is set to "futures" and if the bot is not operating in demo mode. If these conditions are met, the system retrieves the leverage value from the bot configuration, with a fallback to the default value of 10 if no value is specified.

The leverage enforcement includes an additional safety layer that prevents excessively high leverage values from being applied, even if they pass initial validation. Specifically, if the configured leverage exceeds 50x, it is automatically reduced to 50x as an additional risk mitigation measure. This secondary validation acts as a circuit breaker to prevent catastrophic losses that could result from extremely high leverage settings.

The system then calls the Binance client wrapper to set the leverage on the specified trading pair. The result of this operation is logged, with success messages indicating that leverage has been set and error messages capturing any failures in the leverage configuration process. This logging provides transparency into the leverage application process and aids in troubleshooting.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py#L193-L220)

## Binance Client Integration for Futures Leverage
The BinanceClientWrapper class provides the critical integration layer between TradeBot and Binance's futures API for leverage management. The `set_leverage` method is responsible for configuring the leverage multiplier on a specific trading pair. This method includes built-in validation to ensure the leverage value is within the acceptable range of 1-125x, consistent with Binance's API requirements.

When the `set_leverage` method is called, it first validates the input leverage value. If the value is outside the 1-125x range, it automatically defaults to 10x to prevent invalid API calls. The method then uses Binance's `futures_change_leverage` API endpoint to apply the leverage setting to the specified symbol. The operation is wrapped in a retry mechanism to handle transient network issues or rate limiting, ensuring reliable execution.

The wrapper also provides a `get_leverage` method to retrieve the current leverage setting for a trading pair, allowing the system to verify the applied leverage or make decisions based on existing leverage configuration. These methods abstract the complexity of Binance's API interactions, providing a clean interface for the rest of the application to manage leverage settings.

**Section sources**
- [binance_client.py](file://app/core/binance_client.py#L484-L517)

## Domain Model of Leverage Parameters
The domain model for leverage parameters in TradeBot is designed to balance user flexibility with risk management constraints. Leverage is treated as a core parameter in the futures trading configuration, intrinsically linked to the position_type field. When position_type is "spot", leverage is effectively ignored or set to 1x, reflecting the nature of spot trading without margin. When position_type is "futures", leverage becomes an active parameter that directly influences the risk exposure of trading operations.

The model incorporates multiple layers of validation to ensure data integrity and risk mitigation. At the database level, the leverage field is defined as an integer with a nullable constraint, allowing for optional configuration while maintaining data type integrity. At the application level, Pydantic validators enforce the 1-125x range, providing immediate feedback to users and API clients. At the execution level, additional runtime checks prevent excessively high leverage values from being applied, creating a defense-in-depth approach to risk management.

This multi-layered validation strategy ensures that leverage settings are consistent, valid, and safe across the entire application lifecycle, from configuration through execution. The model also supports backtesting scenarios, where leverage settings are applied consistently to simulate real trading conditions and evaluate strategy performance under different risk profiles.

**Section sources**
- [bot_config.py](file://app/models/bot_config.py#L4-L57)
- [bot_config.py](file://app/schemas/bot_config.py#L4-L61)

## Common Issues and Solutions
Several common issues related to leverage configuration and enforcement have been identified and addressed in the TradeBot implementation. The most frequent issue is users attempting to set leverage values outside the permissible 1-125x range. This is mitigated through comprehensive validation at multiple levels, with clear error messages guiding users to correct values.

Another common issue is the risk of excessive leverage leading to rapid account depletion during adverse market movements. This is addressed through the secondary validation in the trading logic that caps leverage at 50x, even if higher values are configured. This safety mechanism prevents users from inadvertently exposing themselves to catastrophic risk levels.

Network-related issues during leverage configuration are handled through the retry mechanism in the Binance client wrapper. This ensures that temporary connectivity problems or API rate limiting do not prevent the proper configuration of leverage settings. Additionally, comprehensive logging provides visibility into leverage operations, aiding in troubleshooting and audit.

The system also addresses the issue of inconsistent leverage states between the application and exchange by providing methods to retrieve the current leverage setting, allowing the system to reconcile any discrepancies and ensure alignment between configured and actual leverage values.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py#L193-L220)
- [binance_client.py](file://app/core/binance_client.py#L484-L517)

## Conclusion
The leverage control implementation in TradeBot provides a robust and secure framework for managing risk in futures trading. By integrating validation at multiple levels—from the frontend interface through the application logic to the exchange API—the system ensures that leverage settings are safe, consistent, and properly enforced. The multi-layered approach to validation and the inclusion of safety mechanisms like leverage capping demonstrate a thoughtful design that prioritizes user protection while maintaining flexibility for different trading strategies. This comprehensive implementation enables users to effectively manage their risk exposure in futures trading while minimizing the potential for configuration errors or excessive risk taking.