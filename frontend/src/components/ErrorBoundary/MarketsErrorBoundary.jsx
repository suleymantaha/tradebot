import React from 'react'

class MarketsErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            lastErrorTime: null
        }
        this.handleRetry = this.handleRetry.bind(this)
        this.handleManualRefresh = this.handleManualRefresh.bind(this)
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            lastErrorTime: Date.now()
        }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        
        // Log error details for debugging
        console.error('MarketsErrorBoundary caught an error:', error, errorInfo)
        
        // Send error to monitoring service if configured
        if (typeof this.props.onError === 'function') {
            this.props.onError(error, errorInfo)
        }

        // Auto-retry for certain recoverable errors
        this.scheduleAutoRetry(error)
    }

    scheduleAutoRetry(error) {
        const { retryCount } = this.state
        const maxAutoRetries = 2
        
        // Only auto-retry for network-related errors
        if (retryCount < maxAutoRetries && this.isRecoverableError(error)) {
            const delay = Math.min(5000, 1000 * Math.pow(2, retryCount))
            
            setTimeout(() => {
                this.handleRetry(true)
            }, delay)
        }
    }

    isRecoverableError(error) {
        if (!error) return false
        
        const message = error.message?.toLowerCase() || ''
        const stack = error.stack?.toLowerCase() || ''
        
        // Check for network, script loading, or temporary errors
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('script') ||
            message.includes('load') ||
            message.includes('timeout') ||
            stack.includes('websocket') ||
            stack.includes('tradingview')
        )
    }

    handleRetry(isAutoRetry = false) {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: isAutoRetry ? prevState.retryCount + 1 : 0,
            lastErrorTime: null
        }))
        
        if (typeof this.props.onRetry === 'function') {
            try {
                this.props.onRetry()
            } catch (error) {
                console.error('Error during retry callback:', error)
            }
        }
    }

    handleManualRefresh() {
        // Clear all state and force full page reload as last resort
        window.location.reload()
    }

    renderErrorDetails() {
        const { error, errorInfo, retryCount } = this.state
        
        if (process.env.NODE_ENV !== 'production') {
            return (
                <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Teknik Detaylar (Geliştirici Modu)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                        <div className="mb-2">
                            <strong>Hata:</strong> {error?.toString()}
                        </div>
                        {errorInfo?.componentStack && (
                            <div className="mb-2">
                                <strong>Bileşen Yığını:</strong>
                                <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                            </div>
                        )}
                        <div>
                            <strong>Yeniden Deneme Sayısı:</strong> {retryCount}
                        </div>
                    </div>
                </details>
            )
        }
        
        return null
    }

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

    renderFallbackUI() {
        const { error, retryCount } = this.state
        const errorCategory = this.getErrorCategory()
        
        const errorMessages = {
            tradingview: {
                title: 'TradingView Grafik Hatası',
                description: 'Grafik widget\'i yüklenirken bir sorun oluştu. Bu genellikle TradingView servislerindeki geçici bir aksaklıktan kaynaklanır.',
                suggestion: 'Grafik bölümü devre dışı kalacak ancak diğer özellikler çalışmaya devam edecek.'
            },
            websocket: {
                title: 'Canlı Veri Bağlantı Hatası',
                description: 'WebSocket bağlantıları kurulamadı. Canlı fiyat güncellemeleri çalışmayabilir.',
                suggestion: 'Statik veriler görüntülenecek. Ağ bağlantınızı kontrol edin.'
            },
            network: {
                title: 'Ağ Bağlantı Hatası',
                description: 'Sunucuyla bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.',
                suggestion: 'Önbelleğe alınmış veriler kullanılabilir.'
            },
            script: {
                title: 'Kaynak Yükleme Hatası',
                description: 'Gerekli JavaScript dosyaları yüklenemedi.',
                suggestion: 'Sayfayı yenilemek sorunu çözebilir.'
            },
            component: {
                title: 'Bileşen Hatası',
                description: 'Sayfa bileşeninde beklenmeyen bir hata oluştu.',
                suggestion: 'Bu genellikle geçici bir sorundur.'
            },
            unknown: {
                title: 'Bilinmeyen Hata',
                description: 'Beklenmeyen bir hata oluştu.',
                suggestion: 'Sorunu çözmek için sayfayı yenileyin.'
            }
        }
        
        const errorConfig = errorMessages[errorCategory] || errorMessages.unknown
        
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Piyasalar</h2>
                    <p className="text-sm text-red-500 dark:text-red-400">Hata Durumu</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
                    <div className="text-center">
                        {/* Error Icon */}
                        <div className="mb-6">
                            <svg 
                                className="mx-auto h-16 w-16 text-red-500" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" 
                                />
                            </svg>
                        </div>
                        
                        {/* Error Title */}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {errorConfig.title}
                        </h3>
                        
                        {/* Error Description */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {errorConfig.description}
                        </p>
                        
                        {/* Error Suggestion */}
                        <p className="text-sm text-orange-600 dark:text-orange-400 mb-6">
                            {errorConfig.suggestion}
                        </p>
                        
                        {/* Retry Information */}
                        {retryCount > 0 && (
                            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Otomatik düzeltme girişimi: {retryCount} kez denendi
                                </p>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg 
                                    className="mr-2 h-4 w-4" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                    />
                                </svg>
                                Tekrar Dene
                            </button>
                            
                            <button
                                onClick={this.handleManualRefresh}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <svg 
                                    className="mr-2 h-4 w-4" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                                    />
                                </svg>
                                Sayfayı Yenile
                            </button>
                        </div>
                        
                        {/* Error Details for Development */}
                        {this.renderErrorDetails()}
                    </div>
                </div>
            </div>
        )
    }

    render() {
        const { hasError } = this.state
        const { children, fallback } = this.props

        if (hasError) {
            // Use custom fallback if provided, otherwise use built-in
            if (typeof fallback === 'function') {
                return fallback(this.state.error, this.handleRetry, this.state)
            }
            
            return this.renderFallbackUI()
        }

        return children
    }
}

export default MarketsErrorBoundary