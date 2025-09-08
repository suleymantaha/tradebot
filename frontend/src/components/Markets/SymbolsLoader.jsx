import React, { useEffect, useCallback, useState } from 'react'
import { symbolsAPI } from '../../services/api'
import { useComponentState } from './ComponentStateManager'

// Static fallback symbols
const STATIC_SYMBOLS = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT' },
    { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
    { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT' },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' }
]

// Cache configuration
const CACHE_KEY = 'markets_symbols_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_BASE = 1000 // 1 second

const SymbolsLoader = ({
    onSymbolsLoaded = () => { },
    onError = () => { },
    children
}) => {
    const { state, actions, computed } = useComponentState()
    const [symbols, setSymbols] = useState([])
    const [loadingState, setLoadingState] = useState({
        isLoading: true,
        error: null,
        retryCount: 0,
        lastAttempt: null,
        dataSource: null // 'api' | 'cache' | 'static'
    })

    // Cache management functions
    const getCachedSymbols = useCallback(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            if (!cached) return null

            const { data, timestamp } = JSON.parse(cached)
            const isExpired = Date.now() - timestamp > CACHE_DURATION

            if (isExpired) {
                localStorage.removeItem(CACHE_KEY)
                return null
            }

            return data
        } catch (error) {
            console.warn('Error reading symbols cache:', error)
            localStorage.removeItem(CACHE_KEY)
            return null
        }
    }, [])

    const setCachedSymbols = useCallback((symbols) => {
        try {
            const cacheData = {
                data: symbols,
                timestamp: Date.now()
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
        } catch (error) {
            console.warn('Error caching symbols:', error)
        }
    }, [])

    // Validate symbols data
    const validateSymbols = useCallback((data) => {
        if (!Array.isArray(data)) return false
        if (data.length === 0) return false

        // Check if symbols have required fields
        return data.every(symbol =>
            symbol &&
            typeof symbol.symbol === 'string' &&
            typeof symbol.baseAsset === 'string' &&
            typeof symbol.quoteAsset === 'string'
        )
    }, [])

    // API call with retry logic
    const fetchSymbolsFromAPI = useCallback(async (retryCount = 0) => {
        try {
            setLoadingState(prev => ({
                ...prev,
                isLoading: true,
                lastAttempt: Date.now()
            }))

            const response = await symbolsAPI.getSpotSymbols()
            const symbolsData = response.data || response

            if (!validateSymbols(symbolsData)) {
                throw new Error('Invalid symbols data received from API')
            }

            // Transform symbols to consistent format
            const normalizedSymbols = symbolsData.map(symbol => ({
                symbol: symbol.symbol,
                baseAsset: symbol.baseAsset,
                quoteAsset: symbol.quoteAsset
            }))

            // Cache the successful result
            setCachedSymbols(normalizedSymbols)

            // Update state
            setSymbols(normalizedSymbols)
            setLoadingState(prev => ({
                ...prev,
                isLoading: false,
                error: null,
                dataSource: 'api',
                retryCount: 0
            }))

            // Update global state
            actions.setFeatureStatus('symbols', 'loaded')
            actions.recordSuccess('symbols')
            actions.setFallbackData('symbolsCache', normalizedSymbols)

            onSymbolsLoaded(normalizedSymbols, 'api')

            return normalizedSymbols

        } catch (error) {
            console.error(`Symbols API call failed (attempt ${retryCount + 1}):`, error)

            setLoadingState(prev => ({
                ...prev,
                error: error.message,
                retryCount: retryCount + 1
            }))

            actions.recordFailure('symbols')

            // Retry with exponential backoff
            if (retryCount < RETRY_ATTEMPTS - 1) {
                const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount)

                setTimeout(() => {
                    fetchSymbolsFromAPI(retryCount + 1)
                }, delay)

                return null
            }

            // All retries failed
            throw error
        }
    }, [validateSymbols, setCachedSymbols, actions, onSymbolsLoaded])

    // Load symbols with fallback strategy
    const loadSymbols = useCallback(async () => {
        try {
            setLoadingState(prev => ({ ...prev, isLoading: true, error: null }))
            actions.setFeatureStatus('symbols', 'loading')

            // Check circuit breaker
            if (!computed.canRetry('symbols')) {
                throw new Error('Circuit breaker is open for symbols service')
            }

            // Strategy 1: Try API first
            try {
                const apiSymbols = await fetchSymbolsFromAPI()
                if (apiSymbols) return
            } catch (apiError) {
                console.warn('API fetch failed, trying fallbacks:', apiError)
            }

            // Strategy 2: Use cached data
            const cachedSymbols = getCachedSymbols()
            if (cachedSymbols && validateSymbols(cachedSymbols)) {
                setSymbols(cachedSymbols)
                setLoadingState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Using cached data (API unavailable)',
                    dataSource: 'cache'
                }))

                actions.setFeatureStatus('symbols', 'cached')
                actions.setFallbackData('symbolsCache', cachedSymbols)

                onSymbolsLoaded(cachedSymbols, 'cache')
                return
            }

            // Strategy 3: Use static fallback
            setSymbols(STATIC_SYMBOLS)
            setLoadingState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Using static symbols (API and cache unavailable)',
                dataSource: 'static'
            }))

            actions.setFeatureStatus('symbols', 'static')
            actions.setFallbackData('symbolsCache', STATIC_SYMBOLS)

            onSymbolsLoaded(STATIC_SYMBOLS, 'static')

        } catch (error) {
            console.error('All symbol loading strategies failed:', error)

            setLoadingState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message,
                dataSource: null
            }))

            actions.setFeatureStatus('symbols', 'failed')
            onError(error)
        }
    }, [
        actions,
        computed,
        fetchSymbolsFromAPI,
        getCachedSymbols,
        validateSymbols,
        onSymbolsLoaded,
        onError
    ])

    // Manual retry function
    const handleRetry = useCallback(() => {
        setLoadingState(prev => ({ ...prev, retryCount: 0 }))
        actions.resetRetry()
        loadSymbols()
    }, [actions, loadSymbols])

    // Auto-reload function for cache expiry
    const scheduleReload = useCallback(() => {
        // Only schedule if we're using cached data
        if (loadingState.dataSource === 'cache') {
            const cached = getCachedSymbols()
            if (cached) {
                const cacheTimestamp = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}').timestamp
                const timeToExpiry = CACHE_DURATION - (Date.now() - cacheTimestamp)

                if (timeToExpiry > 0) {
                    setTimeout(() => {
                        console.log('Cache expired, reloading symbols...')
                        loadSymbols()
                    }, timeToExpiry)
                }
            }
        }
    }, [loadingState.dataSource, getCachedSymbols, loadSymbols])

    // Load symbols on mount
    useEffect(() => {
        loadSymbols()
    }, [loadSymbols])

    // Schedule cache reload
    useEffect(() => {
        scheduleReload()
    }, [scheduleReload])

    // Render loading state
    const renderLoadingState = () => {
        if (!loadingState.isLoading) return null

        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Semboller yükleniyor...</span>
                {loadingState.retryCount > 0 && (
                    <span className="text-orange-500">
                        (Deneme {loadingState.retryCount}/{RETRY_ATTEMPTS})
                    </span>
                )}
            </div>
        )
    }

    // Render error state
    const renderErrorState = () => {
        if (loadingState.isLoading || !loadingState.error) return null

        const canRetry = computed.canRetry('symbols')
        const circuit = state.recovery.circuitBreaker.symbols

        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <div className="flex items-start gap-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Sembol Yükleme Uyarısı
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            {loadingState.error}
                        </p>

                        {circuit?.failures > 0 && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                Başarısız deneme sayısı: {circuit.failures}
                            </p>
                        )}

                        <div className="mt-2 flex gap-2">
                            {canRetry && (
                                <button
                                    onClick={handleRetry}
                                    className="text-xs bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-md font-medium"
                                >
                                    Yeniden Dene
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Render status indicator
    const renderStatusIndicator = () => {
        if (loadingState.isLoading) return null

        const statusConfig = {
            api: { color: 'green', text: 'Canlı' },
            cache: { color: 'yellow', text: 'Önbellek' },
            static: { color: 'orange', text: 'Statik' },
            null: { color: 'red', text: 'Hata' }
        }

        const config = statusConfig[loadingState.dataSource] || statusConfig.null

        return (
            <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full bg-${config.color}-500`}></div>
                <span className="text-gray-600 dark:text-gray-400">
                    Semboller: {config.text}
                </span>
                {symbols.length > 0 && (
                    <span className="text-gray-500">
                        ({symbols.length} adet)
                    </span>
                )}
            </div>
        )
    }

    // Pass symbols and loading state to children
    const childProps = {
        symbols,
        loading: loadingState.isLoading,
        error: loadingState.error,
        dataSource: loadingState.dataSource,
        retryCount: loadingState.retryCount,
        onRetry: handleRetry,
        statusIndicator: renderStatusIndicator(),
        loadingIndicator: renderLoadingState(),
        errorIndicator: renderErrorState()
    }

    return (
        <>
            {typeof children === 'function' ? children(childProps) : children}
        </>
    )
}

export default SymbolsLoader
