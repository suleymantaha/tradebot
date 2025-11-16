# Troubleshooting Guide

<cite>
**Referenced Files in This Document**   
- [start_tradebot.sh](file://start_tradebot.sh)
- [stop_tradebot.sh](file://stop_tradebot.sh)
- [db_connect.sh](file://scripts/db_connect.sh)
- [README.md](file://README.md)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md)
- [SETUP.md](file://SETUP.md)
- [docker-compose.yml](file://docker-compose.yml)
- [app/core/bot_tasks.py](file://app/core/bot_tasks.py)
- [app/api/routes/api_key.py](file://app/api/routes/api_key.py)
- [frontend/src/components/Markets/WebSocketManager.jsx](file://frontend/src/components/Markets/WebSocketManager.jsx)
- [frontend/src/components/ErrorBoundary/MarketsErrorBoundary.jsx](file://frontend/src/components/ErrorBoundary/MarketsErrorBoundary.jsx)
- [scripts/tradebotctl.py](file://scripts/tradebotctl.py)
- [scripts/db_monitor.py](file://scripts/db_monitor.py)
- [scripts/smoke_backtest.py](file://scripts/smoke_backtest.py)
- [scripts/smoke_rate_limit.py](file://scripts/smoke_rate_limit.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Docker Issues](#docker-issues)
3. [Database Connection Errors](#database-connection-errors)
4. [API Authentication Problems](#api-authentication-problems)
5. [Trading Bot Malfunctions](#trading-bot-malfunctions)
6. [Frontend and WebSocket Issues](#frontend-and-websocket-issues)
7. [System Monitoring and Debugging Scripts](#system-monitoring-and-debugging-scripts)
8. [Performance Issues and Optimization](#performance-issues-and-optimization)
9. [Conclusion](#conclusion)

## Introduction

This troubleshooting guide provides comprehensive solutions for diagnosing and resolving common issues in the TradeBot system. The guide covers problems across all system components, including Docker container management, database connectivity, API authentication, trading bot operations, and frontend functionality. Each section includes practical examples of common issues with step-by-step solutions, making the content accessible to beginners while providing sufficient technical depth for experienced developers. The guide also covers the use of diagnostic tools and scripts for system monitoring and debugging.

## Docker Issues

### Docker Startup Failures

Docker startup failures are one of the most common issues encountered when running the TradeBot system. The system includes automated scripts to detect and resolve these issues across different operating systems.

When starting TradeBot, the `start_tradebot.sh` script automatically checks if Docker is running and attempts to start it if necessary. On macOS, the script uses the `open -a Docker` command to launch Docker Desktop and waits up to 60 seconds for it to become available. On Linux systems, the script attempts to start the Docker service using `sudo systemctl start docker`. If Docker fails to start within the timeout period, the script provides clear error messages and instructions for manual intervention.

```bash
# Check Docker status
docker info

# Start Docker on Linux
sudo systemctl start docker

# Add user to Docker group to avoid sudo requirement
sudo usermod -aG docker $USER
```

### Port Conflicts and Permission Issues

Port conflicts can prevent Docker containers from starting properly. Common ports used by TradeBot include 3000 (frontend), 8000 (backend), 5432 (PostgreSQL), and 5050 (pgAdmin). To diagnose port conflicts, use the `lsof` command:

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check if port 8000 is in use
sudo lsof -i :8000

# Check if port 5432 is in use
sudo lsof -i :5432

# Check if port 5050 is in use
sudo lsof -i :5050
```

If a port conflict is detected, either terminate the conflicting process using `sudo kill -9 PID_NUMBER` or modify the port mappings in the `docker-compose.yml` file.

Permission issues can occur when the current user is not part of the Docker group. Adding the user to the Docker group resolves this issue:

```bash
# Add current user to Docker group
sudo usermod -aG docker $USER

# Restart terminal session for changes to take effect
newgrp docker
```

**Section sources**
- [start_tradebot.sh](file://start_tradebot.sh#L21-L85)
- [docker-compose.yml](file://docker-compose.yml#L16-L18)
- [README.md](file://README.md#L533-L544)

## Database Connection Errors

### PostgreSQL Connection Issues

Database connection errors are typically related to PostgreSQL container status, network configuration, or authentication problems. The first step in diagnosing database issues is to verify that the PostgreSQL container is running:

```bash
# Check if PostgreSQL container is running
docker ps | grep tradebot-postgres

# View PostgreSQL container logs
docker-compose logs postgres
```

The `db_connect.sh` script provides a convenient way to connect to the PostgreSQL database and includes built-in checks to ensure the container is running before attempting a connection. If the container is not running, the script provides specific instructions to start it:

```bash
# Connect to PostgreSQL database
./scripts/db_connect.sh

# Start PostgreSQL container if not running
docker-compose up -d postgres
```

### Database Migration Problems

Database migration issues can occur when the database schema is out of sync with the application code. The TradeBot system uses Alembic for database migrations. To resolve migration issues:

```bash
# Apply pending migrations
docker exec -it tradebot-backend alembic upgrade head

# Check migration status
docker exec -it tradebot-backend alembic current

# Generate new migration after model changes
docker-compose exec backend alembic revision --autogenerate -m "migration description"
```

If migration problems persist, a complete database reset may be necessary. This should be done with caution as it will remove all data:

```bash
# Stop and remove containers with volumes (deletes all data)
docker-compose down -v

# Recreate containers and apply migrations
docker-compose up -d
```

### Database Monitoring and Debugging

The `db_monitor.py` script provides real-time monitoring of database performance and health. This script can help identify slow queries, connection pool issues, and other database performance problems. Additionally, the `scripts/db_connect.sh` script includes helpful PostgreSQL commands for debugging:

```bash
# List all tables
\dt

# Show users table structure
\d users

# Show bot_configs table structure
\d bot_configs

# Exit PostgreSQL prompt
\q
```

For production environments, the system can be configured to log all SQL queries by setting `SQLALCHEMY_ECHO=true` in the `.env` file, which helps in identifying inefficient queries.

**Section sources**
- [db_connect.sh](file://scripts/db_connect.sh#L1-L26)
- [docker-compose.yml](file://docker-compose.yml#L3-L27)
- [README.md](file://README.md#L560-L569)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L38)
- [scripts/db_monitor.py](file://scripts/db_monitor.py)

## API Authentication Problems

### API Key Encryption and Validation

API authentication issues often stem from problems with API key encryption or validation. The TradeBot system uses Fernet encryption to securely store Binance API keys. If encryption errors occur, verify that the `FERNET_KEY` is properly set in the `.env` file:

```bash
# Generate a new Fernet key
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Verify Fernet key format (should be 44 characters, URL-safe base64)
echo ${FERNET_KEY} | wc -c
```

The system validates API credentials when they are added. If validation fails, check the following:

1. Ensure the API key is active in your Binance account
2. Verify that IP whitelisting is correctly configured if enabled
3. Confirm that the API key has the necessary permissions for trading

### JWT Authentication and Token Management

The backend uses JWT (JSON Web Tokens) for user authentication. Common issues include expired tokens or incorrect secret keys. The `SECRET_KEY` in the `.env` file must be consistent across all services. If authentication fails with 401 or 403 errors:

```bash
# Verify SECRET_KEY is set
echo ${SECRET_KEY}

# Check token expiration settings
echo ${ACCESS_TOKEN_EXPIRE_MINUTES}
```

For debugging API authentication, enable debug mode to get more detailed error messages:

```bash
# Start backend in debug mode
LOG_LEVEL=DEBUG docker-compose up -d backend
```

The system also supports testing with demo API keys during development. In demo mode, the bot can operate without valid API credentials, using simulated market data instead.

**Section sources**
- [app/api/routes/api_key.py](file://app/api/routes/api_key.py#L1-L27)
- [app/core/bot_tasks.py](file://app/core/bot_tasks.py#L143-L172)
- [README.md](file://README.md#L547-L556)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L60-L61)

## Trading Bot Malfunctions

### Bot State and Error Handling

Trading bot malfunctions can occur due to various reasons, including strategy errors, market data issues, or configuration problems. The system tracks bot state in the database, with various status codes that indicate the current condition:

- `running`: Bot is actively trading
- `paused (max_daily_trades reached)`: Daily trade limit reached
- `paused (max_daily_loss reached)`: Daily loss limit reached
- `paused (daily target reached)`: Daily profit target reached
- `error`: General error condition
- `error (price fetch)`: Unable to fetch market price
- `error (api key decrypt failed)`: API key decryption failed

To diagnose bot issues, check the bot state and last error message in the database:

```bash
# Connect to database and check bot state
./scripts/db_connect.sh
SELECT id, status, last_error_message, last_updated_at FROM bot_states WHERE id = 'your-bot-id';
```

### Strategy-Specific Issues

Different trading strategies may encounter specific issues. For EMA (Exponential Moving Average) strategies, ensure that the EMA fast and slow periods are properly configured. For RSI (Relative Strength Index) strategies, verify that the oversold and overbought thresholds are set correctly.

The system implements various risk management controls that can pause bot operations:

```python
# Daily trade limit check
if max_daily_trades is not None and current_daily_trades >= int(max_daily_trades):
    # Bot paused with status "paused (max_daily_trades reached)"
    pass

# Daily loss limit check
if max_daily_loss_perc is not None and initial_capital > 0:
    loss_threshold = - (float(max_daily_loss_perc) / 100.0) * initial_capital
    if current_daily_pnl <= loss_threshold:
        # Bot paused with status "paused (max_daily_loss reached)"
        pass

# Daily profit target check
if daily_target_perc is not None and initial_capital > 0:
    target_threshold = (float(daily_target_perc) / 100.0) * initial_capital
    if current_daily_pnl >= target_threshold:
        # Bot paused with status "paused (daily target reached)"
        pass
```

### Order Execution Problems

Order execution issues can occur due to insufficient balance, invalid order quantities, or exchange connectivity problems. The system checks order quantity filters before placing trades:

```python
if order_quantity is None or order_quantity <= 0:
    # Bot enters "waiting (qty below filters)" status
    return "Quantity does not meet filters"
```

To resolve order execution problems:

1. Verify that the trading account has sufficient balance
2. Check that the order quantity meets the exchange's minimum requirements
3. Ensure that the API key has trading permissions enabled
4. Confirm that the symbol is available for trading on the selected exchange

**Section sources**
- [app/core/bot_tasks.py](file://app/core/bot_tasks.py#L351-L398)
- [app/core/bot_tasks.py](file://app/core/bot_tasks.py#L219-L246)
- [app/core/bot_tasks.py](file://app/core/bot_tasks.py#L143-L172)

## Frontend and WebSocket Issues

### WebSocket Connection Problems

WebSocket connection issues can affect real-time market data updates and trading functionality. The frontend includes a retry mechanism with exponential backoff to handle temporary connection failures:

```javascript
// Retry configurations
const RETRY_CONFIGS = {
    websocket: { maxAttempts: Infinity, baseDelay: 5000, backoffMultiplier: 1.5, maxDelay: 30000 }
}
```

When WebSocket connections fail, the system automatically attempts to reconnect. For manual intervention:

```bash
# Restart frontend service
docker-compose restart frontend

# Check frontend logs for WebSocket errors
docker-compose logs -f frontend
```

### CORS and API Connectivity Issues

Cross-Origin Resource Sharing (CORS) issues can prevent the frontend from communicating with the backend API. The backend is configured to allow requests from the frontend origin:

```python
# CORS middleware configuration
allowed_origins = ["*"] if ENVIRONMENT != "production" else [_frontend_url]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
```

If API connectivity issues occur, verify the `VITE_API_URL` environment variable in the frontend configuration:

```bash
# Check API URL configuration
grep VITE_API_URL .env
```

### Frontend Error Boundaries

The frontend implements error boundaries to gracefully handle component failures. The `MarketsErrorBoundary.jsx` component categorizes errors and provides appropriate recovery strategies:

```javascript
getErrorCategory() {
    const { error } = this.state
    if (!error) return 'unknown'
    
    const message = error.message?.toLowerCase() || ''
    const stack = error.stack?.toLowerCase() || ''
    
    if (message.includes('tradingview') || stack.includes('tradingview')) {
        return 'tradingview'
    }
    if (message.includes('websocket') || stack.includes('websocket')) {
        return 'websocket'
    }
    if (message.includes('network') || message.includes('fetch')) {
        return 'network'
    }
    if (message.includes('script') || message.includes('load')) {
        return 'script'
    }
    
    return 'component'
}
```

For debugging frontend issues, the system includes a debug panel that displays real-time market data, connection states, and error information.

**Section sources**
- [frontend/src/components/Markets/WebSocketManager.jsx](file://frontend/src/components/Markets/WebSocketManager.jsx#L457-L497)
- [frontend/src/components/ErrorBoundary/MarketsErrorBoundary.jsx](file://frontend/src/components/ErrorBoundary/MarketsErrorBoundary.jsx#L112-L154)
- [app/main.py](file://app/main.py#L1-L37)

## System Monitoring and Debugging Scripts

### Diagnostic Scripts Overview

The TradeBot system includes several scripts in the `scripts/` directory for monitoring and debugging:

- `db_connect.sh`: Connect to PostgreSQL database
- `db_monitor.py`: Monitor database performance
- `redis_ping.py`: Test Redis connectivity
- `redis_list_rl.py`: List Redis rate limiting keys
- `smoke_backtest.py`: Run smoke test for backtesting
- `smoke_rate_limit.py`: Test rate limiting functionality
- `tradebotctl.py`: Main control script for system operations

### Using Monitoring Scripts

The monitoring scripts provide valuable insights into system health and performance:

```bash
# Monitor database performance
python3 scripts/db_monitor.py

# Test Redis connectivity
python3 scripts/redis_ping.py

# List rate limiting keys in Redis
python3 scripts/redis_list_rl.py

# Run backtesting smoke test
python3 scripts/smoke_backtest.py

# Test rate limiting functionality
python3 scripts/smoke_rate_limit.py
```

The `tradebotctl.py` script serves as the main control interface for system operations, including updating, repairing, and managing the installation:

```bash
# Print ignore patterns
python3 scripts/tradebotctl.py print-ignore

# Update from package
python3 scripts/tradebotctl.py update --package dist/tradebot-YYYYMMDD-HHMMSS.tar.gz

# Update from source directory
python3 scripts/tradebotctl.py update --source /path/to/source --manifest /path/to/source/tradebot.manifest.json

# Dry run (show changes without applying)
python3 scripts/tradebotctl.py update --package dist/tradebot-YYYYMMDD-HHMMSS.tar.gz --dry-run
```

### Log Analysis and Debug Mode

Comprehensive logging is essential for diagnosing system issues. The system provides several ways to access and analyze logs:

```bash
# View all service logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# View last 100 lines of backend logs
docker-compose logs --tail=100 backend
```

For detailed debugging, enable debug mode to increase log verbosity:

```bash
# Start backend in debug mode
LOG_LEVEL=DEBUG docker-compose up -d backend

# Enable SQL query logging
# Add to .env file: SQLALCHEMY_ECHO=true
```

**Section sources**
- [scripts/db_connect.sh](file://scripts/db_connect.sh)
- [scripts/db_monitor.py](file://scripts/db_monitor.py)
- [scripts/redis_ping.py](file://scripts/redis_ping.py)
- [scripts/redis_list_rl.py](file://scripts/redis_list_rl.py)
- [scripts/smoke_backtest.py](file://scripts/smoke_backtest.py)
- [scripts/smoke_rate_limit.py](file://scripts/smoke_rate_limit.py)
- [scripts/tradebotctl.py](file://scripts/tradebotctl.py)
- [README.md](file://README.md#L587-L612)

## Performance Issues and Optimization

### Resource Monitoring

Performance issues can stem from insufficient system resources or inefficient code. Monitor system resources using Docker's built-in tools:

```bash
# Monitor container resource usage
docker stats

# Check system resource usage
htop
```

The recommended system requirements are 8GB RAM and 10GB disk space. Insufficient resources can lead to container crashes or degraded performance.

### Database Optimization

Database performance can be optimized through proper indexing, query optimization, and connection pooling. The system uses SQLAlchemy with connection pooling to manage database connections efficiently.

To identify slow queries, enable SQL query logging:

```bash
# Enable SQL query logging in .env file
SQLALCHEMY_ECHO=true
```

Regularly monitor database performance using the `db_monitor.py` script and address any slow queries or connection pool exhaustion issues.

### Caching Strategy

The system uses Redis for caching to improve performance. The cache stores frequently accessed data such as market symbols, trading pairs, and rate limiting information. Ensure Redis is properly configured and has sufficient memory:

```bash
# Check Redis memory usage
docker exec -it tradebot-redis redis-cli info memory

# Monitor Redis performance
docker exec -it tradebot-redis redis-cli --stat
```

### Rate Limiting and API Throttling

The system implements rate limiting to prevent API abuse and ensure fair usage. The `smoke_rate_limit.py` script can be used to test rate limiting functionality and ensure it is working correctly.

For production deployments, consider the following performance optimizations:

1. Use a reverse proxy like NGINX for static file serving and SSL termination
2. Implement proper load balancing for high-traffic scenarios
3. Use a dedicated database server instead of containerized PostgreSQL
4. Implement horizontal scaling for the backend services
5. Use a CDN for frontend assets

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [scripts/db_monitor.py](file://scripts/db_monitor.py)
- [scripts/smoke_rate_limit.py](file://scripts/smoke_rate_limit.py)
- [SECURE_INSTALL.md](file://SECURE_INSTALL.md#L49)

## Conclusion

This troubleshooting guide provides comprehensive solutions for diagnosing and resolving common issues in the TradeBot system. By following the step-by-step solutions outlined in this guide, users can effectively identify and fix problems across all system components. The guide covers Docker container management, database connectivity, API authentication, trading bot operations, and frontend functionality, making it accessible to users of all skill levels.

For ongoing maintenance, regularly monitor system logs, update dependencies, and perform security audits. When encountering issues not covered in this guide, consult the detailed documentation in the README.md, SECURE_INSTALL.md, and SETUP.md files. For persistent problems, consider reaching out to the community through GitHub issues with detailed reproduction steps and system information.