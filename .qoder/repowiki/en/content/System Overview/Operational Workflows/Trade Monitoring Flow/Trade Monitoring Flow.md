# Trade Monitoring Flow

<cite>
**Referenced Files in This Document**   
- [main.py](file://app/main.py)
- [bot_state.py](file://app/models/bot_state.py)
- [trade.py](file://app/models/trade.py)
- [bot_state.py](file://app/api/routes/bot_state.py)
- [trade.py](file://app/api/routes/trade.py)
- [bot_report.py](file://app/api/routes/bot_report.py)
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx)
- [BotTrades.jsx](file://frontend/src/pages/Bots/BotTrades.jsx)
- [api.js](file://frontend/src/services/api.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Real-Time Status Updates via SSE](#real-time-status-updates-via-sse)
3. [BotState and Trade Data Structures](#botstate-and-trade-data-structures)
4. [Frontend Event Subscription and UI Updates](#frontend-event-subscription-and-ui-updates)
5. [Historical Trade Polling Mechanism](#historical-trade-polling-mechanism)
6. [Latency, Buffering, and Error Recovery](#latency-buffering-and-error-recovery)
7. [Performance Metrics Interpretation](#performance-metrics-interpretation)
8. [Common Issues and Debugging Strategies](#common-issues-and-debugging-strategies)
9. [Conclusion](#conclusion)

## Introduction
This document details the trade monitoring flow in the trading bot system, focusing on real-time status updates and historical trade visualization. It explains how Server-Sent Events (SSE) stream bot state changes from the backend to the frontend, describes the data structures used for bot state and trade records, and outlines how the frontend subscribes to these events and updates UI components reactively. The document also covers the polling mechanism for fetching historical trades, latency considerations, event buffering, error recovery, performance metrics interpretation, and debugging strategies for common issues.

## Real-Time Status Updates via SSE
The system uses Server-Sent Events (SSE) to provide real-time updates of bot state changes to the frontend. The SSE endpoint is defined in `main.py` and streams updates from the `BotState` model to the frontend at a 2-second interval.

```mermaid
sequenceDiagram
participant Frontend
participant Backend
Frontend->>Backend : GET /api/v1/bots/{bot_config_id}/status-stream
loop Every 2 seconds
Backend->>Backend : Query BotState from database
alt State changed
Backend->>Frontend : Send SSE event with new state
end
end
```

**Diagram sources**
- [main.py](file://app/main.py#L73-L93)

**Section sources**
- [main.py](file://app/main.py#L73-L93)

## BotState and Trade Data Structures
The system uses two primary data models: `BotState` for tracking the current state of trading bots and `Trade` for recording completed trades.

### BotState Model
The `BotState` model contains fields that track the current operational status and performance metrics of a trading bot.

```mermaid
classDiagram
class BotState {
+int id
+str status
+bool in_position
+float entry_price
+float current_position_size_coins
+float trailing_stop_price
+float max_price_since_entry
+float take_profit_price
+float stop_loss_price
+float daily_pnl
+int daily_trades_count
+datetime last_run_at
+str last_error_message
+datetime last_updated_at
}
```

**Diagram sources**
- [bot_state.py](file://app/models/bot_state.py#L8-L21)

### Trade Model
The `Trade` model contains fields that record details of completed trades, including financial metrics like PnL.

```mermaid
classDiagram
class Trade {
+int id
+int bot_config_id
+int user_id
+str binance_order_id
+str symbol
+str side
+str order_type
+float price
+float quantity_filled
+float quote_quantity_filled
+float commission_amount
+str commission_asset
+float pnl
+float realized_pnl
+datetime timestamp
}
```

**Diagram sources**
- [trade.py](file://app/models/trade.py#L7-L23)

**Section sources**
- [bot_state.py](file://app/models/bot_state.py#L4-L22)
- [trade.py](file://app/models/trade.py#L4-L25)

## Frontend Event Subscription and UI Updates
The frontend subscribes to SSE events through the `BotDetailPage.jsx` component, which displays real-time bot state information and updates UI components reactively when new events are received.

```mermaid
sequenceDiagram
participant BotDetailPage
participant Browser
participant Server
BotDetailPage->>Browser : Create EventSource to SSE endpoint
Browser->>Server : Connect to /api/v1/bots/{id}/status-stream
loop Every 2 seconds
Server->>Browser : Send state update if changed
Browser->>BotDetailPage : Trigger onmessage event
BotDetailPage->>BotDetailPage : Update state and re-render UI
end
```

**Diagram sources**
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L7-L711)

**Section sources**
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L7-L711)

## Historical Trade Polling Mechanism
The system uses a polling mechanism in `BotTrades.jsx` to fetch historical trades via the trade.py API endpoint. The frontend makes periodic HTTP requests to retrieve trade history for display.

```mermaid
sequenceDiagram
participant BotTrades
participant API
participant Database
BotTrades->>API : GET /api/v1/bots/{id}/trades
API->>Database : Query Trade records
Database->>API : Return trade data
API->>BotTrades : Return trade data as JSON
BotTrades->>BotTrades : Update state and render trade table
```

**Diagram sources**
- [BotTrades.jsx](file://frontend/src/pages/Bots/BotTrades.jsx#L1-L335)
- [trade.py](file://app/api/routes/trade.py#L1-L35)
- [bot_report.py](file://app/api/routes/bot_report.py#L57-L90)

**Section sources**
- [BotTrades.jsx](file://frontend/src/pages/Bots/BotTrades.jsx#L1-L335)
- [trade.py](file://app/api/routes/trade.py#L1-L35)
- [bot_report.py](file://app/api/routes/bot_report.py#L57-L90)

## Latency, Buffering, and Error Recovery
The event streaming system addresses latency, buffering, and error recovery through several mechanisms. The SSE endpoint polls the database every 2 seconds, creating a maximum latency of 2 seconds for state updates. The system uses payload comparison to avoid sending duplicate events, reducing network traffic. For error recovery, the frontend should implement reconnection logic to handle temporary disconnections from the event stream.

```mermaid
flowchart TD
A[Start] --> B{Stream Connected?}
B --> |Yes| C[Receive Events]
B --> |No| D[Reconnect Attempt]
D --> E{Max Attempts?}
E --> |No| F[Wait Reconnect Delay]
F --> G[Attempt Reconnect]
G --> B
E --> |Yes| H[Show Error]
C --> I{Valid Data?}
I --> |Yes| J[Update UI]
I --> |No| K[Log Error]
J --> B
K --> B
```

**Diagram sources**
- [main.py](file://app/main.py#L73-L93)
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L7-L711)

## Performance Metrics Interpretation
The system provides several performance metrics for evaluating bot effectiveness, including win rate, average gain/loss, and drawdown. These metrics are derived from the trade history and current bot state.

### Key Performance Metrics
- **Win Rate**: Percentage of profitable trades out of total trades
- **Average Gain**: Average profit from winning trades
- **Average Loss**: Average loss from losing trades
- **Drawdown**: Maximum observed loss from a peak to a trough
- **Daily PnL**: Profit and loss for the current day
- **Total Realized PnL**: Cumulative profit and loss from closed positions

These metrics are calculated from the `Trade` model data and displayed in the bot performance dashboard. The `daily_pnl` field in `BotState` provides real-time daily performance, while historical metrics are computed from the complete trade history.

**Section sources**
- [bot_state.py](file://app/models/bot_state.py#L4-L22)
- [trade.py](file://app/models/trade.py#L4-L25)
- [bot_report.py](file://app/api/routes/bot_report.py#L27-L59)

## Common Issues and Debugging Strategies
This section addresses common issues in the trade monitoring flow and provides debugging strategies using browser developer tools and server logs.

### Disconnected Event Streams
When SSE connections are lost, the frontend may stop receiving real-time updates. To debug:
1. Check browser developer tools Network tab for SSE connection status
2. Verify the EventSource is properly created and listening
3. Examine console for JavaScript errors
4. Check server logs for SSE endpoint errors

### Stale Trade Data
When historical trade data appears stale or incomplete:
1. Verify the polling request is being made correctly
2. Check API response in browser developer tools
3. Validate database queries in server logs
4. Confirm user authentication and authorization

### Debugging Tools
- **Browser Developer Tools**: Monitor network requests, inspect SSE events, and view console errors
- **Server Logs**: Check for database query performance, API errors, and authentication issues
- **Database Queries**: Verify trade and bot state data integrity
- **API Testing**: Use tools like curl or Postman to test endpoints independently

```mermaid
flowchart TD
A[Issue Reported] --> B{Type of Issue?}
B --> |SSE Connection| C[Check Network Tab]
B --> |Stale Data| D[Check API Response]
C --> E[Inspect EventSource]
D --> F[Verify Database Query]
E --> G[Check Console Errors]
F --> H[Validate Data]
G --> I[Review Server Logs]
H --> I
I --> J[Identify Root Cause]
J --> K[Implement Fix]
```

**Diagram sources**
- [main.py](file://app/main.py#L73-L93)
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L7-L711)
- [BotTrades.jsx](file://frontend/src/pages/Bots/BotTrades.jsx#L1-L335)

**Section sources**
- [main.py](file://app/main.py#L73-L93)
- [BotDetailPage.jsx](file://frontend/src/pages/Bots/BotDetailPage.jsx#L7-L711)
- [BotTrades.jsx](file://frontend/src/pages/Bots/BotTrades.jsx#L1-L335)

## Conclusion
The trade monitoring flow in this system effectively combines real-time status updates via SSE with historical trade visualization through polling. The BotState and Trade models provide a comprehensive data structure for tracking bot performance and trade history. The frontend components reactively update UI elements based on incoming events and polled data, providing users with timely information about their trading bots. By understanding the latency characteristics, buffering mechanisms, and error recovery strategies, users can effectively monitor and debug their trading operations. The performance metrics provided enable informed decision-making about bot effectiveness and trading strategies.