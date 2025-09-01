import React, { useEffect, useRef, useState, useCallback } from 'react'
import { symbolsAPI } from '../../services/api'
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary'

const DEFAULT = { tvSymbol: 'BINANCE:BTCUSDT', base: 'BTC', quote: 'USDT' }

const presetStudies = {
    basic: ['RSI@tv-basicstudies'],
    trend: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BollingerBandsR@tv-basicstudies'],
    momentum: ['MACD@tv-basicstudies']
}

// Varsayılan küçük liste (ilk yüklemede gösterim için)
const symbolsList = [
    { label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
    { label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
    { label: 'BNB/USDT', base: 'BNB', quote: 'USDT' },
    { label: 'SOL/USDT', base: 'SOL', quote: 'USDT' },
    { label: 'ADA/USDT', base: 'ADA', quote: 'USDT' },
    { label: 'AVAX/USDT', base: 'AVAX', quote: 'USDT' },
    { label: 'DOT/USDT', base: 'DOT', quote: 'USDT' },
    { label: 'MATIC/USDT', base: 'MATIC', quote: 'USDT' },
]

const toTvSymbol = (base, quote) => `BINANCE:${base}${quote}`
const toBinanceWsPair = (base, quote) => `${base}${quote}`.toLowerCase()
const toCoinbaseProduct = (base, quote) => `${base}-${quote}`

const MarketsPage = () => {
    const containerRef = useRef(null)
    const widgetRef = useRef(null)
    const chartRef = useRef(null)
    const wsRef = useRef({})
    const retryTimeoutRef = useRef({})

    const [base, setBase] = useState(DEFAULT.base)
    const [quote, setQuote] = useState(DEFAULT.quote)
    const [interval, setInterval] = useState('60')
    const [preset, setPreset] = useState('trend')

    // Component state management
    const [componentState, setComponentState] = useState({
        loading: true,
        error: null,
        tradingViewReady: false,
        symbolsLoaded: false,
        webSocketsConnected: false,
        retryCount: 0
    })

    const [favorites, setFavorites] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_favorites')
            return raw ? JSON.parse(raw) : ['BTCUSDT', 'ETHUSDT']
        } catch { return ['BTCUSDT', 'ETHUSDT'] }
    })

    const [watchlist, setWatchlist] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_watchlist')
            return raw ? JSON.parse(raw) : symbolsList.map(s => `${s.base}${s.quote}`)
        } catch { return symbolsList.map(s => `${s.base}${s.quote}`) }
    })

    const [allSymbols, setAllSymbols] = useState([])
    const [search, setSearch] = useState('')
    const [watchOpen, setWatchOpen] = useState(true)

    // Utility function for safe API calls with retry
    const safeApiCall = useCallback(async (apiFunction, fallbackData, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await apiFunction()
                return { success: true, data: result.data || result }
            } catch (error) {
                console.warn(`API attempt ${attempt + 1} failed:`, error)

                if (attempt === maxRetries - 1) {
                    console.error('All API attempts failed, using fallback')
                    return { success: false, data: fallbackData, error }
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
            }
        }
    }, [])

    // Enhanced symbol loading with fallback
    const loadSymbols = useCallback(async () => {
        setComponentState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const result = await safeApiCall(
                () => symbolsAPI.getSpotSymbols(),
                symbolsList.map(s => ({ symbol: `${s.base}${s.quote}`, baseAsset: s.base, quoteAsset: s.quote }))
            )

            if (result.success && result.data && result.data.length > 0) {
                const mapped = result.data.map(s => ({
                    symbol: s.symbol,
                    baseAsset: s.baseAsset,
                    quoteAsset: s.quoteAsset
                }))

                setAllSymbols(mapped)
                setWatchlist(prev => prev.filter(p => mapped.find(m => m.symbol === p)))

                setComponentState(prev => ({
                    ...prev,
                    loading: false,
                    symbolsLoaded: true,
                    error: null
                }))
            } else {
                // Use fallback data
                const fallbackSymbols = symbolsList.map(s => ({
                    symbol: `${s.base}${s.quote}`,
                    baseAsset: s.base,
                    quoteAsset: s.quote
                }))

                setAllSymbols(fallbackSymbols)

                setComponentState(prev => ({
                    ...prev,
                    loading: false,
                    symbolsLoaded: true,
                    error: 'Semboller yüklendi ancak sınırlı liste kullanılıyor'
                }))
            }
        } catch (error) {
            console.error('Symbol loading failed completely:', error)

            // Use static fallback
            const fallbackSymbols = symbolsList.map(s => ({
                symbol: `${s.base}${s.quote}`,
                baseAsset: s.base,
                quoteAsset: s.quote
            }))

            setAllSymbols(fallbackSymbols)

            setComponentState(prev => ({
                ...prev,
                loading: false,
                symbolsLoaded: true,
                error: 'Sembol servisi kullanılamıyor, varsayılan liste gösteriliyor'
            }))
        }
    }, [safeApiCall])

    // Realtime states
    const [binanceTicker, setBinanceTicker] = useState(null)
    const [coinbaseTicker, setCoinbaseTicker] = useState(null)
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
    const [trades, setTrades] = useState([])

    // WebSocket connection manager
    const createWebSocket = useCallback((url, onMessage, reconnectKey) => {
        try {
            const ws = new WebSocket(url)

            ws.onopen = () => {
                console.log(`WebSocket connected: ${url}`)
                if (retryTimeoutRef.current[reconnectKey]) {
                    clearTimeout(retryTimeoutRef.current[reconnectKey])
                    delete retryTimeoutRef.current[reconnectKey]
                }
            }

            ws.onmessage = (event) => {
                try {
                    onMessage(event)
                } catch (error) {
                    console.error('WebSocket message processing error:', error)
                }
            }

            ws.onerror = (error) => {
                console.error(`WebSocket error (${reconnectKey}):`, error)
            }

            ws.onclose = () => {
                console.log(`WebSocket closed: ${url}`)
                // Auto-reconnect with exponential backoff
                if (!retryTimeoutRef.current[reconnectKey]) {
                    const delay = Math.min(5000, 1000 * Math.pow(2, (componentState.retryCount % 5)))
                    retryTimeoutRef.current[reconnectKey] = setTimeout(() => {
                        console.log(`Reconnecting WebSocket: ${reconnectKey}`)
                        setComponentState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }))
                        const newWs = createWebSocket(url, onMessage, reconnectKey)
                        if (wsRef.current) {
                            wsRef.current[reconnectKey] = newWs
                        }
                        delete retryTimeoutRef.current[reconnectKey]
                    }, delay)
                }
            }

            return ws
        } catch (error) {
            console.error(`Failed to create WebSocket for ${reconnectKey}:`, error)
            return null
        }
    }, [componentState.retryCount])

    // Load symbols on mount
    useEffect(() => {
        loadSymbols()
    }, [loadSymbols])

    // Save lists to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('markets_favorites', JSON.stringify(favorites))
        } catch (error) {
            console.warn('Failed to save favorites to localStorage:', error)
        }
    }, [favorites])

    useEffect(() => {
        try {
            localStorage.setItem('markets_watchlist', JSON.stringify(watchlist))
        } catch (error) {
            console.warn('Failed to save watchlist to localStorage:', error)
        }
    }, [watchlist])

    const tvSymbol = toTvSymbol(base, quote)
    const binancePair = toBinanceWsPair(base, quote)
    const coinbaseProduct = toCoinbaseProduct(base, quote)

    // Enhanced TradingView Widget with better error handling
    useEffect(() => {
        const initTradingView = async () => {
            try {
                setComponentState(prev => ({ ...prev, tradingViewReady: false }))

                // Clear existing container
                if (containerRef.current) {
                    containerRef.current.innerHTML = ''
                }

                const scriptId = 'tradingview-widget-script'

                const loadScript = () => new Promise((resolve, reject) => {
                    try {
                        // Check if script already exists and TradingView is available
                        if (window.TradingView) {
                            return resolve()
                        }

                        let existing = document.getElementById(scriptId)
                        if (existing) {
                            existing.remove()
                        }

                        const script = document.createElement('script')
                        script.id = scriptId
                        script.src = 'https://s3.tradingview.com/tv.js'
                        script.async = true

                        const timeout = setTimeout(() => {
                            script.remove()
                            reject(new Error('TradingView script loading timeout'))
                        }, 15000) // 15 second timeout

                        script.onload = () => {
                            clearTimeout(timeout)
                            // Wait a bit for TradingView to initialize
                            setTimeout(() => {
                                if (window.TradingView) {
                                    resolve()
                                } else {
                                    reject(new Error('TradingView object not available after script load'))
                                }
                            }, 1000)
                        }

                        script.onerror = () => {
                            clearTimeout(timeout)
                            script.remove()
                            reject(new Error('Failed to load TradingView script'))
                        }

                        document.head.appendChild(script)
                    } catch (error) {
                        reject(error)
                    }
                })

                await loadScript()

                if (!containerRef.current) {
                    throw new Error('Container ref not available')
                }

                // Create container div for TradingView widget
                const widgetContainer = document.createElement('div')
                widgetContainer.id = 'tradingview_widget_inner'
                widgetContainer.style.height = '100%'
                widgetContainer.style.width = '100%'
                containerRef.current.appendChild(widgetContainer)

                // Create widget with error handling
                const widget = new window.TradingView.widget({
                    autosize: true,
                    symbol: tvSymbol,
                    interval,
                    timezone: 'Etc/UTC',
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                    style: '1',
                    locale: 'tr',
                    toolbar_bg: 'rgba(0,0,0,0)',
                    enable_publishing: false,
                    allow_symbol_change: false,
                    container_id: 'tradingview_widget_inner',
                    withdateranges: true,
                    hide_top_toolbar: false,
                    hide_side_toolbar: false,
                    hide_legend: true,
                    disabled_features: [
                        'use_localstorage_for_settings',
                        'save_chart_properties_to_local_storage',
                        'header_saveload',
                        'study_templates'
                    ],
                    studies: []
                })

                widgetRef.current = widget

                // Mark ready and store chart reference if API is available (embed vs library differences)
                if (typeof widget.onChartReady === 'function') {
                    widget.onChartReady(() => {
                        try {
                            setComponentState(prev => ({ ...prev, tradingViewReady: true }))
                            if (typeof widget.activeChart === 'function') {
                                chartRef.current = widget.activeChart()
                                // Otomatik ölçeklemeyi kapatma girişimleri (mevcut API'ye göre güvenli)
                                try {
                                    if (typeof widget.applyOverrides === 'function') {
                                        widget.applyOverrides({
                                            'paneProperties.autoScale': false,
                                            'scalesProperties.autoScale': false,
                                        })
                                    }
                                } catch (e) { }
                                try {
                                    const chart = chartRef.current
                                    if (chart && typeof chart.setAutoScale === 'function') {
                                        chart.setAutoScale(false)
                                    }
                                    if (chart && typeof chart.getAllSeries === 'function') {
                                        const series = chart.getAllSeries()
                                        series?.forEach?.((s) => { try { s?.setAutoScale?.(false) } catch (e) { } })
                                    }
                                } catch (e) { }
                                if (chartRef.current && typeof chartRef.current.getAllStudies === 'function') {
                                    try {
                                        const studyIds = chartRef.current.getAllStudies()
                                        studyIds?.forEach?.((id) => {
                                            try { chartRef.current.removeEntity(id) } catch (e) { }
                                        })
                                    } catch (e) { }
                                }
                            }
                        } catch (error) {
                            console.error('Error getting active chart:', error)
                        }
                    })
                } else {
                    // Fallback: embed sürümünde hazır say
                    setTimeout(() => {
                        setComponentState(prev => ({ ...prev, tradingViewReady: true }))
                        try {
                            if (typeof widget.activeChart === 'function') {
                                chartRef.current = widget.activeChart()
                                // Otomatik ölçeklemeyi kapatma girişimleri (fallback)
                                try {
                                    if (typeof widget.applyOverrides === 'function') {
                                        widget.applyOverrides({
                                            'paneProperties.autoScale': false,
                                            'scalesProperties.autoScale': false,
                                        })
                                    }
                                } catch (e) { }
                                try {
                                    const chart = chartRef.current
                                    if (chart && typeof chart.setAutoScale === 'function') {
                                        chart.setAutoScale(false)
                                    }
                                    if (chart && typeof chart.getAllSeries === 'function') {
                                        const series = chart.getAllSeries()
                                        series?.forEach?.((s) => { try { s?.setAutoScale?.(false) } catch (e) { } })
                                    }
                                } catch (e) { }
                                if (chartRef.current && typeof chartRef.current.getAllStudies === 'function') {
                                    const studyIds = chartRef.current.getAllStudies()
                                    studyIds?.forEach?.((id) => {
                                        try { chartRef.current.removeEntity(id) } catch (e) { }
                                    })
                                }
                            }
                        } catch (e) { }
                    }, 700)
                }

            } catch (error) {
                console.error('TradingView init hatası:', error)

                // Show fallback UI
                if (containerRef.current) {
                    containerRef.current.innerHTML = `
                        <div class="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded">
                            <div class="text-center p-6">
                                <div class="mb-4">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Grafik Yüklenemedi</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    TradingView grafik widget'i yüklenemedi. Ağ bağlantınızı kontrol edin.
                                </p>
                                <button
                                    onclick="window.location.reload()"
                                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Yeniden Dene
                                </button>
                            </div>
                        </div>
                    `
                }

                setComponentState(prev => ({ ...prev, tradingViewReady: false }))
            }
        }

        // Add a small delay to ensure DOM is ready
        const initTimeout = setTimeout(initTradingView, 100)

        return () => {
            clearTimeout(initTimeout)
            try {
                if (chartRef.current) {
                    chartRef.current = null
                }
                if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
                    widgetRef.current.remove()
                }
                widgetRef.current = null
            } catch (error) {
                console.error('Error cleaning up TradingView widget:', error)
            }
        }
    }, [tvSymbol, interval, preset])

    // Enhanced Binance WebSockets with resilience
    useEffect(() => {
        const connectBinanceStreams = () => {
            try {
                // Clean up existing connections
                Object.keys(wsRef.current).forEach(key => {
                    if (key.startsWith('binance_')) {
                        try {
                            wsRef.current[key]?.close()
                        } catch (error) {
                            console.error(`Error closing ${key}:`, error)
                        }
                        delete wsRef.current[key]
                    }
                })

                // Ticker WebSocket
                const tickerWs = createWebSocket(
                    `wss://stream.binance.com:9443/ws/${binancePair}@ticker`,
                    (event) => {
                        try {
                            const data = JSON.parse(event.data)
                            setBinanceTicker(data)
                        } catch (error) {
                            console.error('Ticker data parsing error:', error)
                        }
                    },
                    'binance_ticker'
                )

                if (tickerWs) {
                    wsRef.current.binance_ticker = tickerWs
                }

                // Order book WebSocket
                const depthWs = createWebSocket(
                    `wss://stream.binance.com:9443/ws/${binancePair}@depth20@100ms`,
                    (event) => {
                        try {
                            const data = JSON.parse(event.data)
                            const parseSide = (arr) => arr.slice(0, 10).map(([p, q]) => ({
                                price: parseFloat(p),
                                qty: parseFloat(q)
                            }))
                            setOrderBook({
                                bids: parseSide(data.bids || data.b || []),
                                asks: parseSide(data.asks || data.a || [])
                            })
                        } catch (error) {
                            console.error('Depth data parsing error:', error)
                        }
                    },
                    'binance_depth'
                )

                if (depthWs) {
                    wsRef.current.binance_depth = depthWs
                }

                // Trades WebSocket
                const tradesWs = createWebSocket(
                    `wss://stream.binance.com:9443/ws/${binancePair}@trade`,
                    (event) => {
                        try {
                            const trade = JSON.parse(event.data)
                            setTrades(prev => {
                                const newTrade = {
                                    price: parseFloat(trade.p),
                                    qty: parseFloat(trade.q),
                                    side: trade.m ? 'sell' : 'buy',
                                    ts: trade.T
                                }
                                return [newTrade, ...prev].slice(0, 50)
                            })
                        } catch (error) {
                            console.error('Trade data parsing error:', error)
                        }
                    },
                    'binance_trades'
                )

                if (tradesWs) {
                    wsRef.current.binance_trades = tradesWs
                }

                setComponentState(prev => ({ ...prev, webSocketsConnected: true }))

            } catch (error) {
                console.error('Binance WebSocket connection error:', error)
                setComponentState(prev => ({ ...prev, webSocketsConnected: false }))
            }
        }

        connectBinanceStreams()

        return () => {
            Object.keys(wsRef.current).forEach(key => {
                if (key.startsWith('binance_')) {
                    try {
                        wsRef.current[key]?.close()
                    } catch (error) {
                        console.error(`Error closing ${key}:`, error)
                    }
                    delete wsRef.current[key]
                }
            })

            // Clear any pending reconnection timeouts
            Object.keys(retryTimeoutRef.current).forEach(key => {
                if (key.startsWith('binance_')) {
                    clearTimeout(retryTimeoutRef.current[key])
                    delete retryTimeoutRef.current[key]
                }
            })
        }
    }, [binancePair, createWebSocket])

    // Enhanced Coinbase WebSocket with resilience
    useEffect(() => {
        const connectCoinbase = () => {
            try {
                // Clean up existing connection
                if (wsRef.current.coinbase) {
                    try {
                        wsRef.current.coinbase.close()
                    } catch (error) {
                        console.error('Error closing Coinbase WebSocket:', error)
                    }
                    delete wsRef.current.coinbase
                }

                const coinbaseWs = createWebSocket(
                    'wss://ws-feed.exchange.coinbase.com',
                    (event) => {
                        try {
                            const data = JSON.parse(event.data)
                            if (data.type === 'ticker' && data.product_id === coinbaseProduct) {
                                setCoinbaseTicker(data)
                            }
                        } catch (error) {
                            console.error('Coinbase data parsing error:', error)
                        }
                    },
                    'coinbase'
                )

                if (coinbaseWs) {
                    wsRef.current.coinbase = coinbaseWs

                    // Send subscription message when connection opens
                    coinbaseWs.addEventListener('open', () => {
                        try {
                            coinbaseWs.send(JSON.stringify({
                                type: 'subscribe',
                                channels: [{ name: 'ticker', product_ids: [coinbaseProduct] }]
                            }))
                        } catch (error) {
                            console.error('Error sending Coinbase subscription:', error)
                        }
                    })
                }

            } catch (error) {
                console.error('Coinbase WebSocket connection error:', error)
            }
        }

        connectCoinbase()

        return () => {
            if (wsRef.current.coinbase) {
                try {
                    wsRef.current.coinbase.close()
                } catch (error) {
                    console.error('Error closing Coinbase WebSocket:', error)
                }
                delete wsRef.current.coinbase
            }

            if (retryTimeoutRef.current.coinbase) {
                clearTimeout(retryTimeoutRef.current.coinbase)
                delete retryTimeoutRef.current.coinbase
            }
        }
    }, [coinbaseProduct, createWebSocket])

    const setSymbol = (b, q) => { setBase(b); setQuote(q) }
    const isFav = (pair) => favorites.includes(pair)
    const toggleFav = (pair) => setFavorites(prev => isFav(pair) ? prev.filter(p => p !== pair) : [...prev, pair])

    const fmt = (v, d = 2) => (v == null ? '-' : Number(v).toLocaleString('tr-TR', { maximumFractionDigits: d }))

    const combinedPrice = () => {
        const bin = binanceTicker?.c ? parseFloat(binanceTicker.c) : null
        const cb = coinbaseTicker?.price ? parseFloat(coinbaseTicker.price) : null
        return { bin, cb }
    }

    // Loading skeleton component
    const LoadingSkeleton = ({ className = "" }) => (
        <div className={`animate-pulse ${className}`}>
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
        </div>
    )

    // Status indicator component
    const StatusIndicator = () => {
        const getStatusColor = () => {
            if (componentState.loading) return 'bg-yellow-500'
            if (componentState.error) return 'bg-red-500'
            if (componentState.symbolsLoaded && componentState.webSocketsConnected) return 'bg-green-500'
            return 'bg-orange-500'
        }

        const getStatusText = () => {
            if (componentState.loading) return 'Yüklüyor...'
            if (componentState.error) return 'Hata var'
            if (componentState.symbolsLoaded && componentState.webSocketsConnected) return 'Canlı'
            return 'Kısmi'
        }

        return (
            <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                <span className="text-gray-600 dark:text-gray-400">{getStatusText()}</span>
                {componentState.retryCount > 0 && (
                    <span className="text-orange-500">(Yeniden bağlanma: {componentState.retryCount})</span>
                )}
            </div>
        )
    }

    return (
        <ErrorBoundary
            message="Piyasalar sayfası yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."
            fallback={(error, retry) => (
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Piyasalar</h2>
                        <p className="text-sm text-red-500 dark:text-red-400">Sayfa yüklenemedi</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Piyasalar Yüklenemedi
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Piyasalar sayfası yüklenirken teknik bir sorun yaşandı. Bu genellikle ağ bağlantısı veya dış servis sorunlarından kaynaklanır.
                        </p>
                        <div className="space-x-3">
                            <button
                                onClick={retry}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Tekrar Dene
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Sayfayı Yenile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        >
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Top controls */}
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Piyasalar</h2>
                            <StatusIndicator />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Binance WS + Coinbase ticker, canlı grafik
                            {componentState.error && (
                                <span className="text-orange-500 ml-2">({componentState.error})</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={interval} onChange={(e) => setInterval(e.target.value)} className="px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            {['1', '5', '15', '30', '60', '120', '240', '1D'].map(iv => <option key={iv} value={iv}>{iv}</option>)}
                        </select>
                        {/* Preset seçimi kaldırıldı */}
                        {!componentState.symbolsLoaded && (
                            <button
                                onClick={loadSymbols}
                                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={componentState.loading}
                            >
                                {componentState.loading ? 'Yüklüyor...' : 'Yeniden Yükle'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid layout: watchlist | chart | orderbook & tape */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Watchlist + Favorites (dinamik) */}
                    <div className="col-span-12 md:col-span-2 space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-gray-800 dark:text-gray-200">Favoriler</div>
                                <button onClick={() => setFavorites([])} className="text-xs text-indigo-500">Temizle</button>
                            </div>
                            {componentState.loading ? (
                                <div className="space-y-2">
                                    <LoadingSkeleton />
                                    <LoadingSkeleton />
                                </div>
                            ) : favorites.length === 0 ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Favori yok. Yıldız ile ekleyin.</div>
                            ) : (
                                <div className="space-y-1 max-h-[24vh] overflow-y-auto">
                                    {favorites.map(pair => {
                                        const s = allSymbols.find(x => x.symbol === pair)
                                        if (!s) return null
                                        const active = `${base}${quote}` === pair
                                        return (
                                            <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                                <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className="text-sm text-yellow-400">★</button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                            <div className="flex items-center justify-between mb-2">
                                <button onClick={() => setWatchOpen(v => !v)} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <span>İzleme Listesi</span>
                                    <span className="text-xs text-gray-500">{watchOpen ? '▼' : '▲'}</span>
                                </button>
                                <button onClick={() => setWatchlist(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'])} className="text-xs text-indigo-500">Sıfırla</button>
                            </div>
                            {watchOpen && (
                                <>
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Ara: BTC, ETH, SOL..."
                                        className="w-full mb-2 px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 text-sm"
                                    />
                                    {componentState.loading ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4, 5].map(i => <LoadingSkeleton key={i} />)}
                                        </div>
                                    ) : (
                                        <div className="space-y-1 max-h-[32vh] overflow-y-auto">
                                            {[...allSymbols]
                                                .filter(s => s.symbol.endsWith('USDT'))
                                                .filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.baseAsset.toLowerCase().includes(search.toLowerCase()))
                                                .sort((a, b) => {
                                                    const fa = favorites.includes(a.symbol) ? 1 : 0
                                                    const fb = favorites.includes(b.symbol) ? 1 : 0
                                                    if (fa !== fb) return fb - fa
                                                    return a.symbol.localeCompare(b.symbol)
                                                })
                                                .slice(0, 500)
                                                .map(s => {
                                                    const pair = s.symbol
                                                    const active = `${base}${quote}` === pair
                                                    return (
                                                        <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className={`text-sm ${isFav(pair) ? 'text-yellow-400' : 'text-gray-400'}`}>★</button>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="col-span-12 md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
                            <div className="text-sm text-gray-600 dark:text-gray-300">{base}/{quote}</div>
                            <div className="flex items-center gap-4 text-sm">
                                {(() => {
                                    const p = combinedPrice(); return (
                                        <>
                                            <span className="text-gray-600 dark:text-gray-300">Binance: <b className="text-green-500">{fmt(p.bin, 6)}</b></span>
                                            <span className="text-gray-600 dark:text-gray-300">Coinbase: <b className="text-blue-500">{fmt(p.cb, 6)}</b></span>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                        <div ref={containerRef} id="tradingview_widget_container" style={{ height: '60vh' }}></div>
                    </div>

                    {/* Orderbook + Tape */}
                    <div className="col-span-12 md:col-span-3 space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                            <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">Order Book</div>
                            <div className="grid grid-cols-2 gap-0 text-xs">
                                <div className="p-2">
                                    <div className="text-gray-500 mb-1">Bids</div>
                                    <div className="space-y-1">
                                        {orderBook.bids.map((b, i) => (
                                            <div key={`b${i}`} className="flex justify-between">
                                                <span className="text-green-500">{fmt(b.price, 6)}</span>
                                                <span className="text-gray-500">{fmt(b.qty, 4)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-2">
                                    <div className="text-gray-500 mb-1">Asks</div>
                                    <div className="space-y-1">
                                        {orderBook.asks.map((a, i) => (
                                            <div key={`a${i}`} className="flex justify-between">
                                                <span className="text-red-500">{fmt(a.price, 6)}</span>
                                                <span className="text-gray-500">{fmt(a.qty, 4)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                            <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">Trade Tape</div>
                            <div className="max-h-[28vh] overflow-y-auto divide-y dark:divide-gray-700 text-xs">
                                {trades.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-3 py-1">
                                        <span className={t.side === 'buy' ? 'text-green-500' : 'text-red-500'}>{fmt(t.price, 6)}</span>
                                        <span className="text-gray-500">{fmt(t.qty, 4)}</span>
                                        <span className="text-gray-400">{new Date(t.ts).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    )
}

export default MarketsPage
