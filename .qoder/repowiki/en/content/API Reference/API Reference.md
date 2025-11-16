# API Reference

<cite>
**Referenced Files in This Document**   
- [main.py](file://app/main.py)
- [auth.py](file://app/api/routes/auth.py)
- [api_key.py](file://app/api/routes/api_key.py)
- [bot_config.py](file://app/api/routes/bot_config.py)
- [bot_state.py](file://app/api/routes/bot_state.py)
- [trade.py](file://app/api/routes/trade.py)
- [backtest.py](file://app/api/routes/backtest.py)
- [health.py](file://app/api/routes/health.py)
- [user.py](file://app/schemas/user.py)
- [token.py](file://app/schemas/token.py)
- [api_key.py](file://app/schemas/api_key.py)
- [bot_config.py](file://app/schemas/bot_config.py)
- [bot_state.py](file://app/schemas/bot_state.py)
- [trade.py](file://app/schemas/trade.py)
- [backtest.py](file://app/schemas/backtest.py)
- [jwt.py](file://app/core/jwt.py)
- [rate_limit.py](file://app/core/rate_limit.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Key Management](#api-key-management)
4. [Bot Configuration](#bot-configuration)
5. [Bot State](#bot-state)
6. [Trading](#trading)
7. [Backtesting](#backtesting)
8. [Health Checks](#health-checks)
9. [Security Considerations](#security-considerations)
10. [Client Implementation Guidelines](#client-implementation-guidelines)

## Introduction
The TradeBot API provides a comprehensive interface for managing automated trading bots, executing trades, performing backtesting, and monitoring bot performance. The API follows RESTful principles and uses JWT for authentication. All endpoints are versioned with the `/api/v1/` prefix.

The API supports two main trading modes: spot and futures, with configurable leverage for futures trading. Users can create and manage multiple bot configurations, each with its own trading strategy and risk parameters. The backtesting system allows users to evaluate strategies against historical market data before deploying them in live trading.

**Section sources**
- [main.py](file://app/main.py#L1-L94)

## Authentication
The TradeBot API uses JWT (JSON Web Token) for authentication. Users must first register or log in to obtain an access token, which must be included in the Authorization header of subsequent requests.

### Registration
`POST /api/v1/auth/register`

Registers a new user account.

**Request Schema**
```json
{
  "email": "string (email format)",
  "password": "string (12+ characters with uppercase, lowercase, digit, special character)"
}
```

**Response Schema**
```json
{
  "id": "integer",
  "email": "string",
  "is_active": "boolean"
}
```

**Error Codes**
- `409 Conflict`: Email already registered

### Login
`POST /api/v1/auth/login`

Authenticates a user and returns a JWT access token.

**Request Schema**
```json
{
  "email": "string",
  "password": "string",
  "remember_me": "boolean (optional)"
}
```

**Response Schema**
```json
{
  "access_token": "string",
  "token_type": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "is_active": "boolean"
  }
}
```

The access token expiration depends on the `remember_me` parameter:
- `remember_me=true`: 30 days
- `remember_me=false`: 7 days

**Error Codes**
- `401 Unauthorized`: Incorrect email or password
- `400 Bad Request`: Inactive user

### User Profile
`GET /api/v1/auth/me`

Retrieves the authenticated user's profile information.

**Response Schema**
```json
{
  "id": "integer",
  "email": "string",
  "is_active": "boolean"
}
```

**Authentication**: Required (JWT Bearer token)

### Password Reset
The API provides a password reset flow consisting of two endpoints:

1. `POST /api/v1/auth/forgot-password`: Initiates password reset by sending a reset link to the user's email
2. `POST /api/v1/auth/reset-password`: Completes password reset using the reset token

**Section sources**
- [auth.py](file://app/api/routes/auth.py#L1-L177)
- [user.py](file://app/schemas/user.py#L1-L54)
- [token.py](file://app/schemas/token.py#L1-L12)
- [jwt.py](file://app/core/jwt.py#L1-L44)

## API Key Management
The API key endpoints allow users to manage their Binance API credentials, which are required for trading and balance retrieval.

### Create API Key
`POST /api/v1/api-keys/`

Creates a new API key configuration after validating the credentials with Binance.

**Request Schema**
```json
{
  "api_key": "string",
  "secret_key": "string",
  "label": "string (optional)"
}
```

The API key and secret key are validated against Binance's API. The validation can be performed against testnet or mainnet based on the `VALIDATE_API_ON_TESTNET` environment variable.

**Response Schema**
```json
{
  "id": "integer",
  "label": "string",
  "api_key_masked": "string (first 4 and last 4 characters visible)",
  "is_valid": "boolean",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Codes**
- `400 Bad Request`: API key already exists or credentials are invalid
- `400 Bad Request`: Validation failed

### Get API Key
`GET /api/v1/api-keys/me`

Retrieves the user's API key configuration.

**Response Schema**
Same as Create API Key response.

**Error Codes**
- `404 Not Found`: No API key configured

### Delete API Key
`DELETE /api/v1/api-keys/me`

Deletes the user's API key configuration. This also deletes all bot configurations associated with this API key.

**Error Codes**
- `404 Not Found`: No API key configured

### Get Balance
`GET /api/v1/api-keys/balance`

Retrieves the user's Binance account balance for both spot and futures accounts.

**Response Schema**
```json
{
  "spot_balance": "number",
  "futures_balance": "number",
  "total_balance": "number",
  "currency": "string"
}
```

**Authentication**: Required (JWT Bearer token)

**Section sources**
- [api_key.py](file://app/api/routes/api_key.py#L1-L152)
- [api_key.py](file://app/schemas/api_key.py#L1-L45)

## Bot Configuration
The bot configuration endpoints allow users to create, retrieve, update, and delete trading bot configurations.

### Create Bot Configuration
`POST /api/v1/bot-configs/`

Creates a new bot configuration.

**Request Schema**
```json
{
  "name": "string",
  "symbol": "string (e.g., BTCUSDT)",
  "timeframe": "string (e.g., 1h, 4h)",
  "is_active": "boolean",
  "initial_capital": "number",
  "daily_target_perc": "number",
  "max_daily_loss_perc": "number",
  "position_size_perc": "number",
  "position_size_fixed": "number",
  "stop_loss_perc": "number",
  "take_profit_perc": "number",
  "trailing_stop_perc": "number",
  "trailing_stop_active": "boolean",
  "ema_fast": "integer",
  "ema_slow": "integer",
  "rsi_period": "integer",
  "rsi_oversold": "integer",
  "rsi_overbought": "integer",
  "max_daily_trades": "integer",
  "check_interval_seconds": "integer",
  "api_key_id": "integer",
  "strategy": "string",
  "ema_period": "integer",
  "custom_ema_fast": "integer",
  "custom_ema_slow": "integer",
  "custom_rsi_period": "integer",
  "custom_rsi_oversold": "integer",
  "custom_rsi_overbought": "integer",
  "custom_stop_loss": "number",
  "custom_take_profit": "number",
  "custom_trailing_stop": "number",
  "position_type": "string (spot|futures)",
  "transfer_amount": "number",
  "auto_transfer_funds": "boolean",
  "leverage": "integer (1-125)"
}
```

**Response Schema**
Same as request schema with additional fields:
```json
{
  "id": "integer",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

### List Bot Configurations
`GET /api/v1/bot-configs/`

Retrieves a list of all bot configurations for the authenticated user.

**Response Schema**
Array of bot configuration objects (same structure as single bot response).

### Get Bot Configuration
`GET /api/v1/bot-configs/{config_id}`

Retrieves a specific bot configuration by ID.

**Path Parameters**
- `config_id`: Integer, required

**Response Schema**
Single bot configuration object.

**Error Codes**
- `404 Not Found`: Bot configuration not found

### Update Bot Configuration
`PUT /api/v1/bot-configs/{config_id}`

Updates an existing bot configuration.

**Path Parameters**
- `config_id`: Integer, required

**Request Schema**
Same as create bot configuration, but all fields are optional.

**Response Schema**
Updated bot configuration object.

**Error Codes**
- `404 Not Found`: Bot configuration not found

### Delete Bot Configuration
`DELETE /api/v1/bot-configs/{config_id}`

Deletes a bot configuration.

**Path Parameters**
- `config_id`: Integer, required

**Error Codes**
- `404 Not Found`: Bot configuration not found

**Section sources**
- [bot_config.py](file://app/api/routes/bot_config.py#L1-L54)
- [bot_config.py](file://app/schemas/bot_config.py#L1-L82)

## Bot State
The bot state endpoints allow users to retrieve and update the runtime state of their trading bots.

### Get Bot State
`GET /api/v1/bot-states/{bot_config_id}`

Retrieves the current state of a bot.

**Path Parameters**
- `bot_config_id`: Integer, required

**Response Schema**
```json
{
  "id": "integer",
  "status": "string (stopped|running|pending|waiting|paused)",
  "in_position": "boolean",
  "entry_price": "number",
  "current_position_size_coins": "number",
  "trailing_stop_price": "number",
  "max_price_since_entry": "number",
  "take_profit_price": "number",
  "stop_loss_price": "number",
  "daily_pnl": "number",
  "daily_trades_count": "integer",
  "last_run_at": "string (ISO 8601)",
  "last_error_message": "string",
  "last_updated_at": "string (ISO 8601)"
}
```

**Error Codes**
- `404 Not Found`: Bot state not found

### Update Bot State
`PUT /api/v1/bot-states/{bot_config_id}`

Updates the state of a bot.

**Path Parameters**
- `bot_config_id`: Integer, required

**Request Schema**
All fields from the response schema are optional.

**Response Schema**
Updated bot state object.

**Error Codes**
- `404 Not Found`: Bot state not found

**Section sources**
- [bot_state.py](file://app/api/routes/bot_state.py#L1-L31)
- [bot_state.py](file://app/schemas/bot_state.py#L1-L35)

## Trading
The trading endpoints allow users to create and retrieve trade records.

### Create Trade
`POST /api/v1/trades/`

Creates a new trade record.

**Request Schema**
```json
{
  "bot_config_id": "integer",
  "binance_order_id": "string",
  "symbol": "string",
  "side": "string (BUY|SELL)",
  "order_type": "string",
  "price": "number",
  "quantity_filled": "number",
  "quote_quantity_filled": "number",
  "commission_amount": "number",
  "commission_asset": "string",
  "pnl": "number",
  "realized_pnl": "number",
  "timestamp": "string (ISO 8601)"
}
```

**Response Schema**
```json
{
  "id": "integer",
  "bot_config_id": "integer",
  "user_id": "integer",
  "binance_order_id": "string",
  "symbol": "string",
  "side": "string",
  "order_type": "string",
  "price": "number",
  "quantity_filled": "number",
  "quote_quantity_filled": "number",
  "commission_amount": "number",
  "commission_asset": "string",
  "pnl": "number",
  "realized_pnl": "number",
  "timestamp": "string (ISO 8601)"
}
```

### List Trades
`GET /api/v1/trades/`

Retrieves a list of trades for the authenticated user.

**Response Schema**
Array of trade objects.

### Get Trade
`GET /api/v1/trades/{trade_id}`

Retrieves a specific trade by ID.

**Path Parameters**
- `trade_id`: Integer, required

**Response Schema**
Single trade object.

**Error Codes**
- `404 Not Found`: Trade not found

**Section sources**
- [trade.py](file://app/api/routes/trade.py#L1-L35)
- [trade.py](file://app/schemas/trade.py#L1-L33)

## Backtesting
The backtesting endpoints provide a comprehensive system for testing trading strategies against historical market data.

### Run Backtest
`POST /api/v1/backtest/run`

Executes a backtest for a trading strategy.

**Request Schema**
```json
{
  "symbol": "string",
  "interval": "string",
  "start_date": "string (YYYY-MM-DD)",
  "end_date": "string (YYYY-MM-DD)",
  "market_type": "string (spot|futures, default: spot)",
  "parameters": {
    "max_daily_trades": "integer (1-50, default: 5)",
    "leverage": "integer (1-125, default: 1 for spot, 10 for futures)",
    "position_size_perc": "number",
    "stop_loss_perc": "number",
    "take_profit_perc": "number",
    "ema_fast": "integer",
    "ema_slow": "integer",
    "rsi_period": "integer",
    "rsi_oversold": "integer",
    "rsi_overbought": "integer"
  }
}
```

**Response Schema**
```json
{
  "status": "success",
  "data": {
    "id": "integer",
    "symbol": "string",
    "interval": "string",
    "start_date": "string",
    "end_date": "string",
    "parameters": "object",
    "initial_capital": "number",
    "final_capital": "number",
    "total_return": "number",
    "total_trades": "integer",
    "winning_trades": "integer",
    "losing_trades": "integer",
    "win_rate": "number",
    "total_fees": "number",
    "avg_profit": "number",
    "daily_results": "array",
    "monthly_results": "object",
    "test_mode": "string",
    "market_type": "string",
    "leverage": "integer",
    "created_at": "string (ISO 8601)"
  }
}
```

### List Backtests
`GET /api/v1/backtest/list`

Retrieves a list of completed backtests.

**Response Schema**
```json
{
  "status": "success",
  "data": [
    {
      "id": "integer",
      "symbol": "string",
      "interval": "string",
      "start_date": "string",
      "end_date": "string",
      "total_return": "number",
      "win_rate": "number",
      "total_trades": "integer",
      "test_mode": "string",
      "created_at": "string (ISO 8601)"
    }
  ]
}
```

### Get Backtest Detail
`GET /api/v1/backtest/detail/{backtest_id}`

Retrieves detailed results of a specific backtest.

**Path Parameters**
- `backtest_id`: Integer, required

**Response Schema**
Same as run backtest response data object.

### Delete Backtest
`DELETE /api/v1/backtest/delete/{backtest_id}`

Deletes a backtest result.

**Path Parameters**
- `backtest_id`: Integer, required

**Response Schema**
```json
{
  "status": "success",
  "message": "Backtest deleted successfully"
}
```

### Get Available Symbols
`GET /api/v1/backtest/symbols/{market_type}`

Retrieves available trading symbols for a market type.

**Path Parameters**
- `market_type`: String (spot|futures), required

**Response Schema**
```json
{
  "status": "success",
  "data": {
    "market_type": "string",
    "symbols": "array",
    "count": "integer"
  }
}
```

### Download Backtest Results
The API provides CSV downloads for backtest results:

- `GET /api/v1/backtest/download/{backtest_id}/daily.csv`: Daily results
- `GET /api/v1/backtest/download/{backtest_id}/monthly.csv`: Monthly summary
- `GET /api/v1/backtest/download/{backtest_id}/trades.csv`: Trade-by-trade details

**Section sources**
- [backtest.py](file://app/api/routes/backtest.py#L1-L352)
- [backtest.py](file://app/schemas/backtest.py#L1-L45)
- [backtest_service.py](file://app/services/backtest_service.py#L799-L1171)

## Health Checks
The health check endpoint provides a simple way to verify the API is operational.

### Health Check
`GET /health`

Returns the health status of the service.

**Response Schema**
```json
{
  "status": "healthy",
  "service": "tradebot-backend"
}
```

This endpoint is accessible without authentication and is intended for monitoring and load balancing purposes.

**Section sources**
- [health.py](file://app/api/routes/health.py#L1-L9)

## Security Considerations
The TradeBot API implements several security measures to protect user data and prevent abuse.

### Authentication and Authorization
The API uses JWT tokens for authentication, with configurable expiration times. All endpoints except the health check require authentication. The system implements proper authorization checks to ensure users can only access their own data.

### Rate Limiting
The API implements rate limiting using Redis to prevent brute force attacks and abuse:

- Login attempts: 5 attempts per minute per IP, 10 attempts per hour per email
- Password reset requests: 5 attempts per minute per IP, 3 attempts per hour per email

When Redis is unavailable, the system degrades gracefully without enforcing rate limits.

### Input Validation
All endpoints perform thorough input validation:

- Passwords must be at least 12 characters with uppercase, lowercase, digit, and special character
- Bot configuration parameters are validated for appropriate ranges
- Backtest parameters are validated for correctness

### Data Protection
Sensitive data such as API keys and secrets are encrypted at rest using Fernet symmetric encryption. The API returns masked versions of API keys (first 4 and last 4 characters visible) to minimize exposure.

### Error Handling
The API follows security best practices in error handling by avoiding information leakage. For example, the forgot password endpoint returns the same response regardless of whether the email exists to prevent user enumeration attacks.

**Section sources**
- [auth.py](file://app/api/routes/auth.py#L1-L177)
- [rate_limit.py](file://app/core/rate_limit.py#L1-L36)
- [crypto.py](file://app/core/crypto.py)
- [security.py](file://app/core/security.py)

## Client Implementation Guidelines
This section provides guidance for implementing clients that integrate with the TradeBot API.

### Authentication Flow
Clients should implement the following authentication flow:

1. Register a new user or log in with existing credentials
2. Store the JWT access token securely (e.g., in secure storage)
3. Include the token in the Authorization header of all subsequent requests: `Authorization: Bearer <token>`
4. Handle token expiration by prompting the user to log in again

### Error Handling
Clients should handle the following common error codes:

- `401 Unauthorized`: Token is invalid or expired; prompt user to log in again
- `403 Forbidden`: Insufficient permissions; this should not occur with proper authentication
- `404 Not Found`: Resource does not exist; handle gracefully
- `429 Too Many Requests`: Rate limit exceeded; implement exponential backoff
- `500 Internal Server Error`: Server error; retry with backoff or notify user

### Performance Optimization
To optimize API usage:

- Cache responses when appropriate, especially for relatively static data like available symbols
- Use batch operations when available
- Implement pagination for endpoints that return lists
- Minimize the frequency of polling by using server-sent events when available

### Migration Notes
The current API is version 1 (v1). Future versions will maintain backward compatibility for at least six months after release. Breaking changes will be introduced in new major versions with adequate notice.

**Section sources**
- [main.py](file://app/main.py#L1-L94)
- [auth.py](file://app/api/routes/auth.py#L1-L177)
- [api_key.py](file://app/api/routes/api_key.py#L1-L152)