import React, { useRef, useEffect, useCallback, useState } from 'react'
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useComponentState } from './ComponentStateManager'

// WebSocket configuration
const WEBSOCKET_CONFIG = {
    binance: {
        baseUrl: 'wss://stream.binance.com:9443/ws',
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000 // 30 seconds
    },
    coinbase: {
        baseUrl: 'wss://ws-feed.exchange.coinbase.com',
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000
    }
}

// Throttle/buffer configuration for smoother UI updates
const ORDERBOOK_LEVELS = 15
const ORDERBOOK_THROTTLE_MS = 120
const TRADES_THROTTLE_MS = 80
const MAX_TRADES_BUFFER = 200

const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
}

const WebSocketManager = ({
    symbol,
    onTickerUpdate = () => { },
    onDepthUpdate = () => { },
    onTradeUpdate = () => { },
    onConnectionChange = () => { },
    onError = () => { },
    children
}) => {
    const { state, actions, computed } = useComponentState()
    const connectionsRef = useRef({})
    const reconnectTimeoutsRef = useRef({})
    const heartbeatIntervalsRef = useRef({})

    // Local buffers and throttlers
    const depthBufferRef = useRef(null)
    const depthThrottleRef = useRef({ timer: null, lastEmit: 0 })
    const tradesBufferRef = useRef([])
    const tradesThrottleRef = useRef({ timer: null, lastEmit: 0 })

    const [connectionStates, setConnectionStates] = useState({
        binance_ticker: CONNECTION_STATES.DISCONNECTED,
        binance_depth: CONNECTION_STATES.DISCONNECTED,
        binance_trades: CONNECTION_STATES.DISCONNECTED,
        coinbase_ticker: CONNECTION_STATES.DISCONNECTED
    })

    const [connectionStats, setConnectionStats] = useState({
        binance_ticker: { attempts: 0, lastError: null, lastConnected: null },
        binance_depth: { attempts: 0, lastError: null, lastConnected: null },
        binance_trades: { attempts: 0, lastError: null, lastConnected: null },
        coinbase_ticker: { attempts: 0, lastError: null, lastConnected: null }
    })

    // Update connection state
    const updateConnectionState = useCallback((connectionId, state) => {
        setConnectionStates(prev => ({
            ...prev,
            [connectionId]: state
        }))

        // Update global state
        const connectedCount = Object.values({
            ...connectionStates,
            [connectionId]: state
        }).filter(s => s === CONNECTION_STATES.CONNECTED).length

        const totalConnections = Object.keys(connectionStates).length

        if (connectedCount === 0) {
            actions.setFeatureStatus('webSocket', 'disconnected')
        } else if (connectedCount === totalConnections) {
            actions.setFeatureStatus('webSocket', 'connected')
            actions.recordSuccess('webSocket')
        } else {
            actions.setFeatureStatus('webSocket', 'connecting')
        }

        onConnectionChange(connectionId, state, {
            connected: connectedCount,
            total: totalConnections
        })
    }, [connectionStates, actions, onConnectionChange])

    // Update connection stats
    const updateConnectionStats = useCallback((connectionId, updates) => {
        setConnectionStats(prev => ({
            ...prev,
            [connectionId]: {
                ...prev[connectionId],
                ...updates
            }
        }))
    }, [])

    // Normalize and limit order book snapshot
    const normalizeOrderBook = useCallback((data) => {
        const rawBids = Array.isArray(data?.bids) ? data.bids : []
        const rawAsks = Array.isArray(data?.asks) ? data.asks : []

        const bids = rawBids
            .map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }))
            .filter(l => Number.isFinite(l.price) && Number.isFinite(l.qty) && l.qty > 0)
            .sort((a, b) => b.price - a.price)
            .slice(0, ORDERBOOK_LEVELS)

        const asks = rawAsks
            .map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }))
            .filter(l => Number.isFinite(l.price) && Number.isFinite(l.qty) && l.qty > 0)
            .sort((a, b) => a.price - b.price)
            .slice(0, ORDERBOOK_LEVELS)

        return { bids, asks }
    }, [])

    // Throttled emitter for order book updates
    const scheduleDepthEmit = useCallback((rawData) => {
        depthBufferRef.current = rawData
        const now = Date.now()
        const timeSinceLast = now - (depthThrottleRef.current.lastEmit || 0)

        // If enough time has passed, emit immediately
        if (timeSinceLast >= ORDERBOOK_THROTTLE_MS) {
            depthThrottleRef.current.lastEmit = now
            const ob = normalizeOrderBook(depthBufferRef.current)
            onDepthUpdate('binance', ob)
            return
        }

        // Otherwise schedule a single emit
        if (!depthThrottleRef.current.timer) {
            const delay = Math.max(16, ORDERBOOK_THROTTLE_MS - timeSinceLast)
            depthThrottleRef.current.timer = setTimeout(() => {
                depthThrottleRef.current.timer = null
                depthThrottleRef.current.lastEmit = Date.now()
                if (depthBufferRef.current) {
                    const ob = normalizeOrderBook(depthBufferRef.current)
                    onDepthUpdate('binance', ob)
                }
            }, delay)
        }
    }, [normalizeOrderBook, onDepthUpdate])

    // Batched emitter for trades (relies on React 18 automatic batching)
    const flushTrades = useCallback(() => {
        const buffer = tradesBufferRef.current
        tradesBufferRef.current = []
        if (!buffer.length) return
        buffer.forEach(t => onTradeUpdate('binance', t))
    }, [onTradeUpdate])

    const scheduleTradesEmit = useCallback((trade) => {
        tradesBufferRef.current.push(trade)
        if (tradesBufferRef.current.length > MAX_TRADES_BUFFER) {
            tradesBufferRef.current.splice(0, tradesBufferRef.current.length - MAX_TRADES_BUFFER)
        }
        if (tradesThrottleRef.current.timer) return
        tradesThrottleRef.current.timer = setTimeout(() => {
            tradesThrottleRef.current.timer = null
            tradesThrottleRef.current.lastEmit = Date.now()
            flushTrades()
        }, TRADES_THROTTLE_MS)
    }, [flushTrades])

    // Cleanup connection resources
    const cleanupConnection = useCallback((connectionId) => {
        // Close WebSocket
        if (connectionsRef.current[connectionId]) {
            try {
                connectionsRef.current[connectionId].close()
            } catch (error) {
                console.warn(`Error closing WebSocket ${connectionId}:`, error)
            }
            delete connectionsRef.current[connectionId]
        }

        // Clear reconnect timeout
        if (reconnectTimeoutsRef.current[connectionId]) {
            clearTimeout(reconnectTimeoutsRef.current[connectionId])
            delete reconnectTimeoutsRef.current[connectionId]
        }

        // Clear heartbeat interval
        if (heartbeatIntervalsRef.current[connectionId]) {
            clearInterval(heartbeatIntervalsRef.current[connectionId])
            delete heartbeatIntervalsRef.current[connectionId]
        }
    }, [])

    // Get connection URL
    const getConnectionUrl = useCallback((connectionId, symbol) => {
        const [provider, stream] = connectionId.split('_')

        if (provider === 'binance') {
            const pair = `${symbol.base}${symbol.quote}`.toLowerCase()
            const streamMap = {
                ticker: `${pair}@ticker`,
                depth: `${pair}@depth20@100ms`,
                trades: `${pair}@trade`
            }
            return `${WEBSOCKET_CONFIG.binance.baseUrl}/${streamMap[stream]}`
        }

        if (provider === 'coinbase') {
            return WEBSOCKET_CONFIG.coinbase.baseUrl
        }

        throw new Error(`Unknown provider: ${provider}`)
    }, [])

    // Create WebSocket connection
    const createConnection = useCallback((connectionId, symbol, attempt = 0) => {
        try {
            // Check circuit breaker
            if (!computed.canRetry('webSocket')) {
                console.log(`Circuit breaker open for WebSocket, skipping ${connectionId}`)
                return
            }

            // Cleanup existing connection
            cleanupConnection(connectionId)

            // Update state
            updateConnectionState(connectionId, CONNECTION_STATES.CONNECTING)
            updateConnectionStats(connectionId, {
                attempts: attempt + 1,
                lastError: null
            })

            // Get connection URL
            const url = getConnectionUrl(connectionId, symbol)

            // Create WebSocket
            const ws = new WebSocket(url)
            connectionsRef.current[connectionId] = ws

            // Connection opened
            ws.onopen = () => {
                console.log(`WebSocket connected: ${connectionId}`)

                updateConnectionState(connectionId, CONNECTION_STATES.CONNECTED)
                updateConnectionStats(connectionId, {
                    lastConnected: Date.now(),
                    lastError: null
                })

                // Send subscription for Coinbase
                if (connectionId === 'coinbase_ticker') {
                    try {
                        const product = `${symbol.base}-${symbol.quote}`
                        ws.send(JSON.stringify({
                            type: 'subscribe',
                            channels: [{
                                name: 'ticker',
                                product_ids: [product]
                            }]
                        }))
                    } catch (error) {
                        console.error('Error sending Coinbase subscription:', error)
                    }
                }

                // Setup heartbeat
                if (WEBSOCKET_CONFIG.binance.heartbeatInterval > 0) {
                    heartbeatIntervalsRef.current[connectionId] = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            // For Binance, we don't need to send ping as streams are already active
                            // For Coinbase, the server handles ping/pong automatically
                        }
                    }, WEBSOCKET_CONFIG.binance.heartbeatInterval)
                }
            }

            // Message received
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    // Route message based on connection type
                    const [provider, stream] = connectionId.split('_')

                    if (provider === 'binance') {
                        if (stream === 'ticker') {
                            onTickerUpdate('binance', data)
                        } else if (stream === 'depth') {
                            // Coalesce high-frequency depth updates
                            scheduleDepthEmit(data)
                        } else if (stream === 'trades') {
                            const trade = {
                                price: parseFloat(data.p),
                                qty: parseFloat(data.q),
                                side: data.m ? 'sell' : 'buy',
                                ts: data.T
                            }
                            // Buffer trades and emit in small batches
                            scheduleTradesEmit(trade)
                        }
                    } else if (provider === 'coinbase') {
                        if (data.type === 'ticker') {
                            onTickerUpdate('coinbase', data)
                        }
                    }
                } catch (error) {
                    console.error(`Error processing ${connectionId} message:`, error)
                }
            }

            // Connection error
            ws.onerror = (error) => {
                console.error(`WebSocket error ${connectionId}:`, error)

                updateConnectionStats(connectionId, {
                    lastError: error.message || 'Connection error'
                })

                onError(connectionId, error)
                actions.recordFailure('webSocket')
            }

            // Connection closed
            ws.onclose = (event) => {
                console.log(`WebSocket closed ${connectionId}:`, event.code, event.reason)

                updateConnectionState(connectionId, CONNECTION_STATES.DISCONNECTED)

                // Cleanup heartbeat
                if (heartbeatIntervalsRef.current[connectionId]) {
                    clearInterval(heartbeatIntervalsRef.current[connectionId])
                    delete heartbeatIntervalsRef.current[connectionId]
                }

                // Schedule reconnection if not intentionally closed
                if (event.code !== 1000 && event.code !== 1001) {
                    scheduleReconnection(connectionId, symbol, attempt)
                }
            }

        } catch (error) {
            console.error(`Error creating WebSocket connection ${connectionId}:`, error)

            updateConnectionState(connectionId, CONNECTION_STATES.FAILED)
            updateConnectionStats(connectionId, {
                lastError: error.message
            })

            onError(connectionId, error)
            actions.recordFailure('webSocket')

            // Schedule retry
            scheduleReconnection(connectionId, symbol, attempt)
        }
    }, [
        computed,
        cleanupConnection,
        updateConnectionState,
        updateConnectionStats,
        getConnectionUrl,
        onTickerUpdate,
        onDepthUpdate,
        onTradeUpdate,
        onError,
        actions
    ])

    // Schedule reconnection with exponential backoff
    const scheduleReconnection = useCallback((connectionId, symbol, attempt) => {
        const [provider] = connectionId.split('_')
        const config = WEBSOCKET_CONFIG[provider]

        if (attempt >= config.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached for ${connectionId}`)
            updateConnectionState(connectionId, CONNECTION_STATES.FAILED)
            actions.recordFailure('webSocket')
            return
        }

        const delay = Math.min(
            config.reconnectDelay * Math.pow(2, attempt),
            30000 // Max 30 seconds
        )

        console.log(`Scheduling reconnection for ${connectionId} in ${delay}ms (attempt ${attempt + 1})`)

        updateConnectionState(connectionId, CONNECTION_STATES.RECONNECTING)

        reconnectTimeoutsRef.current[connectionId] = setTimeout(() => {
            createConnection(connectionId, symbol, attempt + 1)
        }, delay)
    }, [updateConnectionState, createConnection, actions])

    // Initialize all connections
    const initializeConnections = useCallback((symbol) => {
        const connections = [
            'binance_ticker',
            'binance_depth',
            'binance_trades',
            'coinbase_ticker'
        ]

        connections.forEach(connectionId => {
            createConnection(connectionId, symbol, 0)
        })
    }, [createConnection])

    // Cleanup all connections
    const cleanupAllConnections = useCallback(() => {
        Object.keys(connectionsRef.current).forEach(connectionId => {
            cleanupConnection(connectionId)
        })

        setConnectionStates(prev => {
            const newStates = {}
            Object.keys(prev).forEach(id => {
                newStates[id] = CONNECTION_STATES.DISCONNECTED
            })
            return newStates
        })

        // Clear local buffers and throttlers
        if (depthThrottleRef.current.timer) {
            clearTimeout(depthThrottleRef.current.timer)
            depthThrottleRef.current.timer = null
        }
        depthBufferRef.current = null
        if (tradesThrottleRef.current.timer) {
            clearTimeout(tradesThrottleRef.current.timer)
            tradesThrottleRef.current.timer = null
        }
        tradesBufferRef.current = []
    }, [cleanupConnection])

    // Manual retry function
    const retryAllConnections = useCallback(() => {
        cleanupAllConnections()
        actions.resetRetry()

        setTimeout(() => {
            initializeConnections(symbol)
        }, 1000)
    }, [cleanupAllConnections, actions, initializeConnections, symbol])

    // Initialize connections when symbol changes
    useEffect(() => {
        if (symbol && symbol.base && symbol.quote) {
            initializeConnections(symbol)
        }

        return cleanupAllConnections
    }, [symbol?.base, symbol?.quote, initializeConnections, cleanupAllConnections])

    // Cleanup on unmount
    useEffect(() => {
        return cleanupAllConnections
    }, [cleanupAllConnections])

    // Get overall connection status
    const getOverallStatus = useCallback(() => {
        const states = Object.values(connectionStates)
        const connectedCount = states.filter(s => s === CONNECTION_STATES.CONNECTED).length
        const connectingCount = states.filter(s => s === CONNECTION_STATES.CONNECTING || s === CONNECTION_STATES.RECONNECTING).length
        const failedCount = states.filter(s => s === CONNECTION_STATES.FAILED).length

        if (connectedCount === states.length) return 'connected'
        if (failedCount === states.length) return 'failed'
        if (connectingCount > 0) return 'connecting'
        return 'partial'
    }, [connectionStates])

    // Render connection status indicator
    const renderStatusIndicator = () => {
        const status = getOverallStatus()
        const connectedCount = Object.values(connectionStates).filter(
            s => s === CONNECTION_STATES.CONNECTED
        ).length
        const totalCount = Object.keys(connectionStates).length

        const statusConfig = {
            connected: { color: 'green', text: 'Bağlı' },
            partial: { color: 'yellow', text: 'Kısmi' },
            connecting: { color: 'blue', text: 'Bağlanıyor' },
            failed: { color: 'red', text: 'Bağlantı Yok' }
        }

        const config = statusConfig[status] || statusConfig.failed

        return (
            <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full bg-${config.color}-500`}></div>
                <span className="text-gray-600 dark:text-gray-400">
                    WebSocket: {config.text} ({connectedCount}/{totalCount})
                </span>
            </div>
        )
    }

    // Render detailed connection status
    const renderDetailedStatus = () => {
        return (
            <div className="space-y-2">
                {Object.entries(connectionStates).map(([connectionId, state]) => {
                    const stats = connectionStats[connectionId]
                    const isConnected = state === CONNECTION_STATES.CONNECTED
                    const hasError = state === CONNECTION_STATES.FAILED || stats?.lastError

                    return (
                        <div key={connectionId} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                                {connectionId.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' :
                                    hasError ? 'bg-red-500' :
                                        'bg-yellow-500'
                                    }`}></div>
                                <span className={
                                    isConnected ? 'text-green-600 dark:text-green-400' :
                                        hasError ? 'text-red-600 dark:text-red-400' :
                                            'text-yellow-600 dark:text-yellow-400'
                                }>
                                    {state}
                                </span>
                                {stats?.attempts > 1 && (
                                    <span className="text-gray-500">
                                        ({stats.attempts})
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Pass connection data to children
    const childProps = {
        connectionStates,
        connectionStats,
        overallStatus: getOverallStatus(),
        retryConnection: retryAllConnections,
        statusIndicator: renderStatusIndicator(),
        detailedStatus: renderDetailedStatus()
    }

    return (
        <>
            {typeof children === 'function' ? children(childProps) : children}
        </>
    )
}

export default WebSocketManager
