# Performance and Scaling Bottlenecks

<cite>
**Referenced Files in This Document**   
- [rate_limit.py](file://app/core/rate_limit.py)
- [redis_list_rl.py](file://scripts/redis_list_rl.py)
- [WebSocketManager.jsx](file://frontend/src/components/Markets/WebSocketManager.jsx)
- [nginx.conf](file://nginx.conf)
- [docker-compose.yml](file://docker-compose.yml)
</cite>

## Table of Contents
1. [Rate Limiting Implementation](#rate-limiting-implementation)
2. [Cache Inefficiencies and Redis Management](#cache-inefficiencies-and-redis-management)
3. [WebSocket Congestion and Frontend Real-Time Updates](#websocket-congestion-and-frontend-real-time-updates)
4. [Resource Exhaustion Under Load](#resource-exhaustion-under-load)
5. [Nginx Integration for Request Buffering and Timeouts](#nginx-integration-for-request-buffering-and-timeouts)
6. [Optimization Strategies](#optimization-strategies)
7. [Conclusion](#conclusion)

## Rate Limiting Implementation

The TradeBot platform implements rate limiting through Redis-based tracking to prevent abuse of API endpoints such as authentication and bot control. The core logic resides in `rate_limit.py`, which uses Redis to track request counts per client IP within a time window. When a limit is exceeded, a 429 HTTP error is returned with a Turkish message indicating "Too many attempts. Please try again later." This mechanism gracefully degrades if Redis is unavailable, allowing requests to proceed without enforcement.

Rate limiting keys follow the pattern `rl:<endpoint>:<ip>`, and are monitored using the `redis_list_rl.py` script, which lists all rate-limit keys, their current values, and TTLs. For example, login attempts are tracked under `rl:login:<client_ip>`. The system supports configurable limits and windows, with default settings enforced across critical endpoints like `/api/v1/auth/login`.

The implementation includes a circuit breaker pattern that prevents repeated connection attempts to Redis in case of failure, ensuring system stability during transient outages. Diagnostic scripts like `smoke_rate_limit.py` validate this behavior by simulating multiple failed login attempts and checking for 429 responses.

**Section sources**
- [rate_limit.py](file://app/core/rate_limit.py#L1-L43)
- [redis_list_rl.py](file://scripts/redis_list_rl.py#L1-L20)

## Cache Inefficiencies and Redis Management

Redis serves as the primary caching layer for both data and rate limiting in TradeBot. However, inefficiencies arise from suboptimal TTL settings and unbounded key growth. The `redis_client.py` module provides synchronous and asynchronous Redis clients used across the application, including for caching market symbols and bot states.

Cache keys such as `cache:symbols:spot:v1` and `cache:symbols:futures:v1` store large datasets that can consume significant memory if not properly expired. The current TTL configuration may lead to stale data or excessive memory usage, especially during high-frequency trading operations where symbol lists are frequently accessed.

Additionally, metrics keys like `metrics:cache_hit:symbols_spot` and `metrics:cache_miss:symbols_futures` indicate potential inefficiencies in cache hit ratios. Without proper monitoring and tuning, these can degrade dashboard rendering performance and increase database load due to repeated cache misses.

**Section sources**
- [redis_client.py](file://app/core/redis_client.py#L1-L129)
- [redis_list_rl.py](file://scripts/redis_list_rl.py#L1-L20)

## WebSocket Congestion and Frontend Real-Time Updates

The `WebSocketManager.jsx` component manages real-time market data feeds from Binance and Coinbase via WebSocket connections. It establishes four concurrent connections per symbol: ticker, depth, trades for Binance, and ticker for Coinbase. These connections are prone to congestion under high load due to unthrottled message rates, particularly from Binance's depth and trade streams.

To mitigate UI performance issues, the component implements throttling and buffering:
- Order book updates are coalesced using `ORDERBOOK_THROTTLE_MS` (120ms) to reduce render frequency
- Trade messages are batched with `TRADES_THROTTLE_MS` (80ms) and limited to `MAX_TRADES_BUFFER` (200 entries)
- Invalid or malformed messages are filtered before processing

Despite these measures, backpressure can occur when the frontend cannot process incoming messages fast enough, leading to delayed bot updates and jittery UI elements. The exponential backoff reconnect strategy (up to 10 attempts with 5s base delay) helps maintain connectivity but may not prevent prolonged disconnections during network instability.

**Section sources**
- [WebSocketManager.jsx](file://frontend/src/components/Markets/WebSocketManager.jsx#L1-L625)

## Resource Exhaustion Under Load

Under heavy load, TradeBot experiences resource exhaustion primarily in memory and CPU usage. Celery workers, responsible for executing bot tasks, are configured with `worker_prefetch_multiplier=1` to prevent overloading, but long-running tasks can still accumulate and exhaust available resources.

The `docker-compose.yml` file defines resource limits for each service:
- PostgreSQL and Redis containers expose ports and mount persistent volumes
- Backend and Celery services run in read-only mode with dropped privileges for security
- Health checks ensure service readiness before routing traffic

However, insufficient memory allocation or unbounded task queues can lead to worker crashes and message loss. High memory usage is exacerbated by unoptimized database queries and lack of indexing on frequently accessed fields like `bot_config_id` in the `trade` table.

**Section sources**
- [celery_app.py](file://app/core/celery_app.py#L1-L44)
- [docker-compose.yml](file://docker-compose.yml#L1-L276)

## Nginx Integration for Request Buffering and Timeouts

Nginx acts as a reverse proxy in front of the TradeBot services, routing requests to the appropriate backend or frontend containers. The `nginx.conf` configuration defines upstream servers for `backend` (port 8000) and `frontend` (port 80), with proxy headers preserving client information.

Key performance-related settings include:
- `worker_connections 1024` – limits concurrent connections per worker
- Proxy buffering and timeout handling are implicitly managed by default Nginx behavior
- Health checks on `/health` endpoint ensure only healthy backends receive traffic

While the current configuration provides basic load balancing and SSL termination, it lacks explicit timeout, buffer size, and rate limiting directives at the Nginx level. This places full responsibility for request throttling on the application layer, increasing vulnerability to sudden traffic spikes.

**Section sources**
- [nginx.conf](file://nginx.conf#L1-L46)
- [docker-compose.yml](file://docker-compose.yml#L220-L244)

## Optimization Strategies

### Redis TTL Tuning
Adjust TTL values for cache entries based on volatility:
- Short-lived data (e.g., order books): 30–60 seconds
- Stable data (e.g., symbol lists): 5–10 minutes
- Rate limit counters: aligned with enforcement window (e.g., 60 seconds for 10 attempts)

### Celery Worker Scaling
Scale Celery workers horizontally based on queue depth:
- Use `celery -A app.core.celery_app.celery_app worker -c N` to control concurrency
- Monitor task processing time and adjust `task_time_limit` accordingly
- Implement autoscaling in production environments using orchestration tools

### Database Indexing
Add indexes to frequently queried fields:
- `bot_config_id` on `trade` and `bot_state` tables
- `user_id` on `bot_config` and `api_key` tables
- Composite indexes on time-range queries (e.g., `created_at` + `bot_config_id`)

### WebSocket Optimization
Enhance `WebSocketManager.jsx` with:
- Dynamic throttling based on connection quality
- Selective subscription (only active symbols)
- Binary message compression (if supported by exchange)

### Nginx Enhancements
Add explicit performance directives:
```nginx
proxy_buffering on;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
client_max_body_size 10M;
```

**Section sources**
- [rate_limit.py](file://app/core/rate_limit.py#L1-L43)
- [WebSocketManager.jsx](file://frontend/src/components/Markets/WebSocketManager.jsx#L1-L625)
- [nginx.conf](file://nginx.conf#L1-L46)
- [docker-compose.yml](file://docker-compose.yml#L1-L276)

## Conclusion

The TradeBot platform exhibits several performance and scaling bottlenecks related to rate limiting, caching, WebSocket management, and resource allocation. While the current architecture provides solid foundations with Redis-backed rate limiting and Celery-based task processing, optimization opportunities exist in TTL tuning, database indexing, and Nginx-level request management. Addressing these issues will improve responsiveness under load, reduce memory footprint, and enhance reliability for high-frequency trading scenarios.