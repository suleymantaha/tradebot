# Performance Metrics

<cite>
**Referenced Files in This Document**   
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx)
- [bot_state.py](file://app/models/bot_state.py)
- [main.py](file://app/main.py)
- [bot_tasks.py](file://app/core/bot_tasks.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [BotState Model and Performance Metrics Storage](#botstate-model-and-performance-metrics-storage)
3. [Real-Time Data Streaming via SSE](#real-time-data-streaming-via-sse)
4. [Frontend Rendering and User Interface](#frontend-rendering-and-user-interface)
5. [Trading Engine Integration and Metric Updates](#trading-engine-integration-and-metric-updates)
6. [Domain Model and Risk Management Relationship](#domain-model-and-risk-management-relationship)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive analysis of the real-time performance metrics system in the trading bot application. It details how key performance indicators such as daily PnL, daily trades count, entry price, and position status are stored, updated, and displayed to users. The system leverages a combination of database modeling, server-sent events (SSE) for real-time updates, and responsive frontend rendering to provide users with up-to-date information about their trading bots. The documentation is designed to be accessible to beginners while providing sufficient technical depth for experienced developers working with real-time performance monitoring in trading systems.

## BotState Model and Performance Metrics Storage
The BotState model serves as the central repository for storing real-time performance metrics of trading bots. This model is implemented as a database table that maintains the current state of each bot, including critical performance indicators that are updated in real-time as trading activities occur.

The model contains several key fields for performance tracking:
- **daily_pnl**: Stores the daily profit and loss value as a Numeric type with a default value of 0.0
- **daily_trades_count**: Tracks the number of trades executed during the current day as an Integer with a default value of 0
- **entry_price**: Records the price at which the current position was entered, stored as a nullable Numeric field
- **status**: Maintains the current operational status of the bot as a String field with a default value of "stopped"
- **in_position**: A Boolean flag indicating whether the bot currently holds an active position

The BotState model is linked to the BotConfig model through a one-to-one relationship, ensuring that each bot configuration has exactly one corresponding state record. This relationship is established using a foreign key constraint where the BotState.id references the BotConfig.id. The model also includes a last_updated_at timestamp field that automatically updates whenever any state information changes, providing an audit trail for when metrics were last modified.

**Section sources**
- [bot_state.py](file://app/models/bot_state.py#L4-L22)

## Real-Time Data Streaming via SSE
The system implements real-time performance monitoring through Server-Sent Events (SSE), which enables continuous streaming of bot state updates from the server to the client without requiring repeated HTTP requests. This approach provides a low-latency, efficient mechanism for delivering real-time performance data to the user interface.

The SSE endpoint is exposed at `/api/v1/bots/{bot_config_id}/status-stream` and operates by creating an infinite event generator that periodically checks the database for updates to the bot's state. The implementation follows these key steps:
1. Establishes a persistent connection with the client
2. Queries the BotState table for the specified bot configuration
3. Constructs a JSON payload containing the current performance metrics
4. Compares the new payload with the previous one to detect changes
5. Sends the payload to the client only when changes are detected
6. Waits for 2 seconds before checking for updates again

The payload includes essential performance metrics such as status, in_position flag, entry_price, daily_pnl, daily_trades_count, and the last_updated_at timestamp. By only sending data when the payload has changed, the system minimizes network traffic while ensuring users receive timely updates. The 2-second polling interval strikes a balance between real-time responsiveness and server resource utilization.

**Section sources**
- [main.py](file://app/main.py#L73-L93)

## Frontend Rendering and User Interface
The frontend implementation in BotDetailPage.jsx processes the real-time performance metrics received through the SSE stream and renders them in the 'Bot Durumu' (Bot Status) section with appropriate visual styling based on the metric values. The component uses React's useState and useEffect hooks to manage the bot state data and handle real-time updates.

Key aspects of the frontend rendering logic include:
- **Status Display**: The getStatusText function transforms raw status values into user-friendly text representations. For example, "running" becomes "Çalışıyor" (Running), "stopped" becomes "Durdurulmuş" (Stopped), and "error" becomes "Hata" (Error). This function also handles special cases like demo mode and pending states.
- **Color Coding**: The getStatusColor function assigns appropriate color classes based on the bot's status. Running bots are displayed with green background (bg-green-100), stopped bots with gray (bg-gray-100), error states with red (bg-red-100), waiting states with yellow (bg-yellow-100), and pending states with blue (bg-blue-100).
- **PnL Visualization**: The daily PnL value is displayed with conditional styling where positive values appear in green text (text-green-600) and negative values in red text (text-red-600), providing immediate visual feedback on the bot's performance.
- **Real-time Updates**: The component establishes a connection to the SSE endpoint and updates the UI whenever new data is received, ensuring the displayed metrics are always current.

The UI organizes performance metrics in a clean, card-based layout with clear labels and appropriate icons, making it easy for users to quickly assess their bot's performance at a glance.

**Section sources**
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L118-L162)

## Trading Engine Integration and Metric Updates
The trading engine updates performance metrics in the BotState model whenever trading activities occur, ensuring that the displayed values accurately reflect the bot's current performance. This integration occurs within the bot execution workflow, specifically when trade execution is confirmed.

When a trade is executed, the system performs the following steps to update performance metrics:
1. Creates a new Trade record in the database with details of the executed trade
2. Retrieves the current BotState record for the associated bot configuration
3. Calculates the updated daily PnL by summing the realized PnL from all trades executed during the current day
4. Counts the total number of trades executed during the current day
5. Updates the BotState record with the new daily_pnl and daily_trades_count values
6. Commits the changes to the database

The update process is implemented in the bot_tasks.py file, where after a successful trade execution, the system queries all trades for the current bot configuration and recalculates the daily performance metrics. This approach ensures that the metrics are always accurate and consistent with the actual trading activity. The entry_price field is also updated when a new position is opened, reflecting the average entry price of the current position.

**Section sources**
- [bot_tasks.py](file://app/core/bot_tasks.py#L444-L472)

## Domain Model and Risk Management Relationship
The performance metrics system is closely integrated with the risk management framework, creating a cohesive domain model that supports both performance monitoring and risk control. This relationship is evident in several aspects of the system design:

The BotState model contains fields that serve both performance tracking and risk management purposes. For example, the stop_loss_price and take_profit_price fields are updated when a position is opened and are used to monitor risk parameters in real-time. These values are displayed in the UI alongside performance metrics, allowing users to see both their current performance and risk exposure simultaneously.

The daily_pnl metric plays a crucial role in risk management by providing a daily performance benchmark. This metric can be used in conjunction with risk rules such as daily loss limits, where the system could automatically stop the bot if losses exceed a predefined threshold. Similarly, the daily_trades_count metric helps enforce trading frequency limits, preventing excessive trading that could increase risk exposure.

The status field serves as a bridge between performance and risk management, with status values like "error" triggering risk mitigation procedures and "stopped" indicating that risk controls have been activated. The in_position flag provides immediate visibility into whether the bot is currently exposed to market risk.

This integrated approach ensures that performance monitoring and risk management are not separate concerns but are instead tightly coupled aspects of the overall trading system, providing users with a comprehensive view of both their bot's performance and risk profile.

**Section sources**
- [bot_state.py](file://app/models/bot_state.py#L4-L22)
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L378-L501)

## Common Issues and Solutions
The real-time performance metrics system addresses several common challenges in trading applications through thoughtful design and implementation:

**Metric Synchronization Delays**: One potential issue is the delay between when a trade occurs and when the performance metrics are updated in the UI. This is mitigated by the 2-second polling interval in the SSE implementation, which provides near real-time updates while balancing server load. The system also includes logic to only send updates when the payload has changed, reducing unnecessary network traffic.

**Data Accuracy Concerns**: Ensuring the accuracy of performance metrics is critical. The system addresses this by recalculating daily PnL and trade counts from the source trade records each time an update is needed, rather than maintaining running totals that could become inconsistent. This approach guarantees that the displayed metrics are always consistent with the actual trading history.

**Race Conditions**: When multiple trades occur in quick succession, there is a potential for race conditions in updating the BotState record. This is prevented by using database transactions to ensure atomic updates and by leveraging the ORM's session management to coordinate access to the state record.

**Connection Stability**: The SSE implementation includes error handling and reconnection logic in the frontend to maintain a stable connection even under poor network conditions. If the connection is lost, the client automatically attempts to reconnect, ensuring that users continue to receive updates.

**Scalability**: For users with multiple bots, the system efficiently handles multiple SSE connections by using asynchronous database queries and non-blocking I/O operations, preventing performance degradation as the number of monitored bots increases.

**Section sources**
- [main.py](file://app/main.py#L73-L93)
- [bot_tasks.py](file://app/core/bot_tasks.py#L444-L472)

## Conclusion
The real-time performance metrics system in the trading bot application provides a robust and efficient solution for monitoring bot performance. By leveraging the BotState model for data storage, Server-Sent Events for real-time updates, and a well-designed frontend interface for visualization, the system delivers accurate, up-to-date performance information to users with minimal latency. The integration with risk management features creates a comprehensive monitoring solution that supports both performance evaluation and risk control. The implementation demonstrates best practices in real-time data streaming, state management, and user interface design, making it a reliable foundation for trading bot monitoring.