# Backtesting API

<cite>
**Referenced Files in This Document**   
- [backtest.py](file://app/api/routes/backtest.py)
- [backtest_service.py](file://app/services/backtest_service.py)
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx)
- [backtest.py](file://app/schemas/backtest.py)
- [backtest.py](file://app/models/backtest.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The Backtesting API enables users to simulate trading strategies using historical market data from Binance without executing real trades. This document details the endpoints for creating, retrieving, and deleting backtests, along with request and response schemas, supported parameters, and integration with frontend components. The system leverages cached historical klines to improve performance and supports both spot and futures market types.

## Project Structure
The backtesting functionality is organized across backend and frontend components. The backend resides in the `app` directory with dedicated modules for routes, services, models, and schemas. The frontend implementation is located in the `frontend` directory, specifically within the Backtest page components.

```mermaid
graph TB
subgraph Backend
A[app/api/routes/backtest.py]
B[app/services/backtest_service.py]
C[app/schemas/backtest.py]
D[app/models/backtest.py]
end
subgraph Frontend
E[frontend/src/pages/Backtest/BacktestPage.jsx]
end
A --> B
B --> C
B --> D
E --> A
```

**Diagram sources**
- [backtest.py](file://app/api/routes/backtest.py)
- [backtest_service.py](file://app/services/backtest_service.py)
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx)

**Section sources**
- [backtest.py](file://app/api/routes/backtest.py)
- [backtest_service.py](file://app/services/backtest_service.py)
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx)

## Core Components
The core components of the Backtesting API include the route handler, service layer, data models, and frontend interface. These components work together to process backtest requests, execute simulations using historical data, and return performance metrics.

**Section sources**
- [backtest.py](file://app/api/routes/backtest.py#L1-L352)
- [backtest_service.py](file://app/services/backtest_service.py#L1-L800)
- [backtest.py](file://app/schemas/backtest.py#L1-L45)

## Architecture Overview
The Backtesting API follows a layered architecture with clear separation between presentation, business logic, and data access layers. The frontend initiates requests through API calls, which are handled by FastAPI routes. These routes delegate to the BacktestService, which orchestrates data retrieval, strategy execution, and result persistence.

```mermaid
sequenceDiagram
participant Frontend as BacktestPage.jsx
participant API as backtest.py
participant Service as BacktestService
participant Cache as DataCache
participant Database as PostgreSQL
participant Binance as Binance API
Frontend->>API : POST /api/v1/backtest/run
API->>Service : run_backtest()
Service->>Cache : get_cached_data()
alt Cache Hit
Cache-->>Service : Return cached DataFrame
else Cache Miss
Service->>Binance : Fetch klines (public or authenticated)
Binance-->>Service : Historical data
Service->>Cache : cache_data()
end
Service->>Service : prepare_indicators()
Service->>Service : calculate_daily_pnl()
Service->>Database : save_backtest_result()
Database-->>Service : backtest_id
Service-->>API : results with id
API-->>Frontend : {status : "success", data : results}
```

**Diagram sources**
- [backtest.py](file://app/api/routes/backtest.py#L26-L74)
- [backtest_service.py](file://app/services/backtest_service.py#L24-L800)
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx#L231-L262)

## Detailed Component Analysis

### Backtest Request Processing
The backtest request processing flow handles validation, simulation execution, and result persistence. It supports various strategy parameters and market conditions.

#### Request Schema
```mermaid
classDiagram
class BacktestRequest {
+string symbol
+string interval
+string start_date
+string end_date
+string market_type
+Dict[str, Any] parameters
}
```

**Diagram sources**
- [backtest.py](file://app/api/routes/backtest.py#L18-L25)

#### Response Schema
```mermaid
classDiagram
class BacktestSummary {
+int id
+string symbol
+string interval
+string start_date
+string end_date
+float total_return
+float win_rate
+int total_trades
+string test_mode
+datetime created_at
}
class BacktestDetail {
+Dict[str, Any] parameters
+float initial_capital
+float final_capital
+int winning_trades
+int losing_trades
+float total_fees
+float avg_profit
+List[Dict[str, Any]] daily_results
+Dict[str, Any] monthly_results
}
BacktestSummary <|-- BacktestDetail
```

**Diagram sources**
- [backtest.py](file://app/schemas/backtest.py#L15-L45)

### Strategy Execution Engine
The strategy execution engine processes historical data, applies technical indicators, and simulates trades based on entry signals.

#### Technical Indicators Processing
```mermaid
flowchart TD
Start([Start]) --> LoadData["Load Historical Data"]
LoadData --> CheckCache{"Cache Available?"}
CheckCache --> |Yes| UseCache["Use Cached Data"]
CheckCache --> |No| FetchData["Fetch from Binance API"]
FetchData --> CacheData["Cache Data"]
CacheData --> AddIndicators["Add Technical Indicators"]
AddIndicators --> EMA["Calculate EMA Fast/Slow"]
AddIndicators --> RSI["Calculate RSI"]
AddIndicators --> MACD["Calculate MACD"]
AddIndicators --> BB["Calculate Bollinger Bands"]
AddIndicators --> Volume["Calculate Volume MA"]
AddIndicators --> Volatility["Calculate Volatility"]
AddIndicators --> CleanNaN["Clean NaN Values"]
CleanNaN --> SimulateTrades["Simulate Trades"]
SimulateTrades --> CalculateMetrics["Calculate Performance Metrics"]
CalculateMetrics --> End([End])
```

**Diagram sources**
- [backtest_service.py](file://app/services/backtest_service.py#L346-L443)

### Performance Metrics Calculation
The system calculates various performance metrics to evaluate strategy effectiveness.

```mermaid
classDiagram
class BacktestService {
+_compute_max_drawdown(equity_curve)
+_compute_sharpe(returns_pct)
+_compute_sortino(returns_pct)
+_compute_profit_factor(trade_pnls)
+_compute_cagr(initial_capital, final_capital, start_date, end_date)
}
```

**Diagram sources**
- [backtest_service.py](file://app/services/backtest_service.py#L444-L512)

### Frontend Integration
The frontend component provides a user interface for configuring and launching backtests.

```mermaid
sequenceDiagram
participant User
participant BacktestPage
participant ApiService
participant API
User->>BacktestPage : Configure parameters
BacktestPage->>BacktestPage : Validate inputs
User->>BacktestPage : Click "Run Backtest"
BacktestPage->>ApiService : runBacktest(requestData)
ApiService->>API : POST /api/v1/backtest/run
API-->>ApiService : Response
ApiService-->>BacktestPage : Process results
BacktestPage-->>User : Display results
```

**Diagram sources**
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx#L231-L262)

**Section sources**
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx#L1-L800)
- [backtest.py](file://app/api/routes/backtest.py#L26-L74)

## Dependency Analysis
The Backtesting API has well-defined dependencies between components, ensuring loose coupling and high cohesion.

```mermaid
graph TD
BacktestPage --> ApiService
ApiService --> backtest_route
backtest_route --> BacktestService
BacktestService --> DataCache
BacktestService --> BinanceClient
BacktestService --> Database
BacktestService --> backtest_model
backtest_model --> User
```

**Diagram sources**
- [backtest.py](file://app/api/routes/backtest.py)
- [backtest_service.py](file://app/services/backtest_service.py)
- [BacktestPage.jsx](file://frontend/src/pages/Backtest/BacktestPage.jsx)

**Section sources**
- [backtest.py](file://app/api/routes/backtest.py#L11-L15)
- [backtest_service.py](file://app/services/backtest_service.py#L19-L23)

## Performance Considerations
The Backtesting API implements several performance optimizations:

1. **Caching**: Historical klines are cached to avoid repeated API calls
2. **Rate Limiting**: Public API requests include delays to comply with rate limits
3. **Data Processing**: Pandas and NumPy are used for efficient data manipulation
4. **Memory Management**: Large datasets are processed in chunks when possible

The system also provides cache management endpoints to clear or inspect cached data, allowing users to control resource usage.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L27-L40)
- [backtest.py](file://app/api/routes/backtest.py#L76-L121)

## Troubleshooting Guide
Common issues and their solutions:

1. **Cache Misses**: Ensure the cache directory exists and is writable
2. **API Rate Limits**: The system automatically handles rate limiting with delays
3. **Missing Data**: The system falls back to sample data generation when Binance API is unavailable
4. **Authentication Issues**: Verify API keys are properly configured in the database

The system logs detailed information about each operation, including cache status, data source, and processing progress.

**Section sources**
- [backtest_service.py](file://app/services/backtest_service.py#L262-L269)
- [backtest.py](file://app/api/routes/backtest.py#L69-L74)

## Conclusion
The Backtesting API provides a comprehensive solution for simulating trading strategies using historical market data. It supports both spot and futures markets, offers detailed performance metrics, and integrates seamlessly with the frontend interface. The architecture emphasizes performance through caching and efficient data processing, while maintaining flexibility for various strategy configurations.