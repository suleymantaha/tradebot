import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useComponentState } from './ComponentStateManager'

const TRADINGVIEW_SCRIPT_URL = 'https://s3.tradingview.com/tv.js'
const SCRIPT_LOAD_TIMEOUT = 15000 // 15 seconds
const WIDGET_INIT_TIMEOUT = 5000  // 5 seconds

const TradingViewLoader = ({
    symbol,
    interval,
    theme = 'light',
    onReady = () => { },
    onError = () => { },
    className = ""
}) => {
    const containerRef = useRef(null)
    const widgetRef = useRef(null)
    const chartRef = useRef(null)
    const timeoutRef = useRef({})

    const { state, actions, computed } = useComponentState()
    const [localState, setLocalState] = useState({
        scriptLoaded: false,
        widgetInitialized: false,
        manualRetryCount: 0
    })

    // Cleanup function
    const cleanup = useCallback(() => {
        // Clear timeouts
        Object.values(timeoutRef.current).forEach(timeout => {
            if (timeout) clearTimeout(timeout)
        })
        timeoutRef.current = {}

        // Remove widget
        try {
            if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
                widgetRef.current.remove()
            }
        } catch (error) {
            console.warn('Error removing TradingView widget:', error)
        }

        // Clear container
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }

        // Reset refs
        widgetRef.current = null
        chartRef.current = null
    }, [])

    // Check if TradingView script is available
    const isTradingViewAvailable = useCallback(() => {
        return !!(window.TradingView && typeof window.TradingView.widget === 'function')
    }, [])

    // Load TradingView script
    const loadTradingViewScript = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                // Check if already available
                if (isTradingViewAvailable()) {
                    setLocalState(prev => ({ ...prev, scriptLoaded: true }))
                    return resolve()
                }

                // Remove existing script if any
                const existingScript = document.getElementById('tradingview-widget-script')
                if (existingScript) {
                    existingScript.remove()
                }

                // Create new script element
                const script = document.createElement('script')
                script.id = 'tradingview-widget-script'
                script.src = TRADINGVIEW_SCRIPT_URL
                script.async = true

                // Set up timeout
                const timeoutId = setTimeout(() => {
                    script.remove()
                    reject(new Error('TradingView script loading timeout'))
                }, SCRIPT_LOAD_TIMEOUT)

                // Handle script load success
                script.onload = () => {
                    clearTimeout(timeoutId)

                    // Give TradingView time to initialize
                    setTimeout(() => {
                        if (isTradingViewAvailable()) {
                            setLocalState(prev => ({ ...prev, scriptLoaded: true }))
                            resolve()
                        } else {
                            reject(new Error('TradingView object not available after script load'))
                        }
                    }, 1000)
                }

                // Handle script load error
                script.onerror = () => {
                    clearTimeout(timeoutId)
                    script.remove()
                    reject(new Error('Failed to load TradingView script'))
                }

                // Append script to head
                document.head.appendChild(script)

            } catch (error) {
                reject(error)
            }
        })
    }, [isTradingViewAvailable])

    // Initialize TradingView widget
    const initializeWidget = useCallback(async () => {
        try {
            if (!containerRef.current) {
                throw new Error('Container ref not available')
            }

            if (!isTradingViewAvailable()) {
                throw new Error('TradingView not available')
            }

            // Clear container
            containerRef.current.innerHTML = ''

            // Create widget container
            const widgetContainer = document.createElement('div')
            widgetContainer.id = `tradingview_${Date.now()}`
            widgetContainer.style.height = '100%'
            widgetContainer.style.width = '100%'
            containerRef.current.appendChild(widgetContainer)

            // Widget configuration
            const widgetConfig = {
                autosize: true,
                symbol: symbol,
                interval: interval,
                timezone: 'Etc/UTC',
                theme: theme,
                style: '1',
                locale: 'tr',
                toolbar_bg: 'rgba(0,0,0,0)',
                enable_publishing: false,
                allow_symbol_change: false,
                container_id: widgetContainer.id,
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
            }

            // Create widget
            const widget = new window.TradingView.widget(widgetConfig)
            widgetRef.current = widget

            // Set up widget ready timeout
            const widgetTimeout = setTimeout(() => {
                throw new Error('Widget initialization timeout')
            }, WIDGET_INIT_TIMEOUT)

            // Handle widget ready
            const handleWidgetReady = () => {
                clearTimeout(widgetTimeout)

                try {
                    // Get chart reference if available
                    if (typeof widget.activeChart === 'function') {
                        chartRef.current = widget.activeChart()

                        // Apply chart configuration
                        try {
                            if (typeof widget.applyOverrides === 'function') {
                                widget.applyOverrides({
                                    'paneProperties.autoScale': false,
                                    'scalesProperties.autoScale': false,
                                })
                            }
                        } catch (error) {
                            console.warn('Error applying widget overrides:', error)
                        }
                    }

                    setLocalState(prev => ({ ...prev, widgetInitialized: true }))
                    actions.enableFeature('tradingView')
                    actions.recordSuccess('tradingView')
                    onReady(widget, chartRef.current)

                } catch (error) {
                    console.error('Error in widget ready handler:', error)
                    onError(error)
                }
            }

            // Check for onChartReady method
            if (typeof widget.onChartReady === 'function') {
                widget.onChartReady(handleWidgetReady)
            } else {
                // Fallback for embed version
                setTimeout(handleWidgetReady, 2000)
            }

        } catch (error) {
            console.error('Widget initialization error:', error)
            actions.recordFailure('tradingView')
            actions.disableFeature('tradingView')
            onError(error)
            throw error
        }
    }, [symbol, interval, theme, isTradingViewAvailable, actions, onReady, onError])

    // Main initialization function
    const initializeTradingView = useCallback(async () => {
        try {
            actions.setFeatureStatus('tradingView', 'loading')

            // Check circuit breaker
            if (!computed.canRetry('tradingView')) {
                const timeSinceLastFailure = Date.now() - (state.recovery.circuitBreaker.tradingView?.lastFailure || 0)
                const remainingTime = Math.ceil((30000 - timeSinceLastFailure) / 1000)
                throw new Error(`Circuit breaker open. Retry in ${remainingTime} seconds.`)
            }

            // Cleanup previous instances
            cleanup()

            // Load script if needed
            if (!localState.scriptLoaded) {
                await loadTradingViewScript()
            }

            // Initialize widget
            await initializeWidget()

        } catch (error) {
            console.error('TradingView initialization failed:', error)
            actions.setFeatureStatus('tradingView', 'failed')
            actions.recordFailure('tradingView')
            onError(error)
        }
    }, [
        actions,
        computed,
        state.recovery.circuitBreaker.tradingView,
        cleanup,
        localState.scriptLoaded,
        loadTradingViewScript,
        initializeWidget,
        onError
    ])

    // Manual retry function
    const handleManualRetry = useCallback(() => {
        setLocalState(prev => ({
            ...prev,
            manualRetryCount: prev.manualRetryCount + 1,
            scriptLoaded: false,
            widgetInitialized: false
        }))
        actions.resetRetry()
        initializeTradingView()
    }, [actions, initializeTradingView])

    // Effect to initialize on mount and symbol/interval changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            initializeTradingView()
        }, 100)

        return () => {
            clearTimeout(timeoutId)
            cleanup()
        }
    }, [symbol, interval, theme])

    // Cleanup on unmount
    useEffect(() => {
        return cleanup
    }, [cleanup])

    // Render fallback UI when TradingView fails
    const renderFallback = () => {
        const circuit = state.recovery.circuitBreaker.tradingView
        const canRetry = computed.canRetry('tradingView')
        const isLoading = state.features.tradingView === 'loading'

        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-center p-6 max-w-md">
                    {/* Icon */}
                    <div className="mb-4">
                        {isLoading ? (
                            <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : (
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {isLoading ? 'Grafik Yükleniyor' : 'Grafik Yüklenemedi'}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {isLoading ? (
                            'TradingView grafik widget\'i hazırlanıyor...'
                        ) : circuit?.isOpen ? (
                            'Grafik servisi geçici olarak devre dışı. Kısa bir süre sonra otomatik olarak yeniden denenecek.'
                        ) : (
                            'TradingView grafik widget\'i yüklenemedi. Ağ bağlantınızı kontrol edin.'
                        )}
                    </p>

                    {/* Status info */}
                    {(circuit?.failures > 0 || localState.manualRetryCount > 0) && (
                        <div className="mb-4 text-xs text-orange-600 dark:text-orange-400">
                            {circuit?.failures > 0 && `Başarısız deneme: ${circuit.failures}`}
                            {localState.manualRetryCount > 0 && ` | Manuel deneme: ${localState.manualRetryCount}`}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="space-y-2">
                        {!isLoading && canRetry && (
                            <button
                                onClick={handleManualRetry}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            >
                                Yeniden Dene
                            </button>
                        )}

                        {!isLoading && !canRetry && (
                            <div className="text-xs text-orange-500">
                                {(() => {
                                    const timeSinceLastFailure = Date.now() - (circuit?.lastFailure || 0)
                                    const remainingTime = Math.ceil((30000 - timeSinceLastFailure) / 1000)
                                    return `${remainingTime} saniye sonra yeniden denenebilir`
                                })()}
                            </div>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Grafik olmadan da piyasa verileri görüntülenebilir
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Render loading state
    const renderLoading = () => (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded">
            <div className="text-center p-6">
                <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Grafik Hazırlanıyor
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    TradingView widget\'i yükleniyor...
                </p>
            </div>
        </div>
    )

    const featureStatus = state.features.tradingView
    const shouldShowFallback = featureStatus === 'failed' || featureStatus === 'disabled'
    const shouldShowLoading = featureStatus === 'loading' || !localState.scriptLoaded || !localState.widgetInitialized

    return (
        <div className={`tradingview-container relative ${className}`}>
            {/* Main container for TradingView widget */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{
                    display: shouldShowFallback || shouldShowLoading ? 'none' : 'block'
                }}
            />

            {/* Loading state */}
            {shouldShowLoading && renderLoading()}

            {/* Fallback UI */}
            {shouldShowFallback && renderFallback()}
        </div>
    )
}

export default TradingViewLoader
