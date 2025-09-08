import React from 'react'

// Loading skeleton component
export const LoadingSkeleton = ({ className = "", rows = 3, height = "h-4" }) => (
    <div className={`animate-pulse space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${
                index === 0 ? 'w-3/4' : 
                index === rows - 1 ? 'w-1/2' : 'w-full'
            }`}></div>
        ))}
    </div>
)

// Status indicator component
export const StatusIndicator = ({ 
    status = 'unknown', 
    label = 'Status',
    retryCount = 0,
    className = ""
}) => {
    const statusConfig = {
        loading: { color: 'bg-yellow-500', text: 'Yüklüyor' },
        ready: { color: 'bg-green-500', text: 'Hazır' },
        connected: { color: 'bg-green-500', text: 'Bağlı' },
        error: { color: 'bg-red-500', text: 'Hata' },
        failed: { color: 'bg-red-500', text: 'Başarısız' },
        partial: { color: 'bg-orange-500', text: 'Kısmi' },
        cached: { color: 'bg-blue-500', text: 'Önbellek' },
        static: { color: 'bg-gray-500', text: 'Statik' },
        disabled: { color: 'bg-gray-400', text: 'Devre Dışı' },
        unknown: { color: 'bg-gray-400', text: 'Bilinmiyor' }
    }
    
    const config = statusConfig[status] || statusConfig.unknown
    
    return (
        <div className={`flex items-center gap-2 text-xs ${className}`}>
            <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
            <span className="text-gray-600 dark:text-gray-400">
                {label}: {config.text}
            </span>
            {retryCount > 0 && (
                <span className="text-orange-500">(Deneme: {retryCount})</span>
            )}
        </div>
    )
}

// Error alert component
export const ErrorAlert = ({ 
    title = 'Hata', 
    message, 
    type = 'error',
    onRetry,
    onDismiss,
    showRetry = true,
    className = ""
}) => {
    const typeConfig = {
        error: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-400',
            title: 'text-red-800 dark:text-red-200',
            message: 'text-red-700 dark:text-red-300'
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            icon: 'text-yellow-400',
            title: 'text-yellow-800 dark:text-yellow-200',
            message: 'text-yellow-700 dark:text-yellow-300'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-400',
            title: 'text-blue-800 dark:text-blue-200',
            message: 'text-blue-700 dark:text-blue-300'
        }
    }
    
    const config = typeConfig[type] || typeConfig.error
    
    const getIcon = () => {
        switch (type) {
            case 'warning':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )
            case 'info':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )
            default:
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )
        }
    }
    
    return (
        <div className={`rounded-md border p-4 ${config.bg} ${config.border} ${className}`}>
            <div className="flex items-start gap-3">
                <svg className={`flex-shrink-0 h-5 w-5 ${config.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getIcon()}
                </svg>
                
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${config.title}`}>
                        {title}
                    </h4>
                    {message && (
                        <p className={`text-sm mt-1 ${config.message}`}>
                            {message}
                        </p>
                    )}
                    
                    {(onRetry || onDismiss) && (
                        <div className="mt-3 flex gap-2">
                            {onRetry && showRetry && (
                                <button
                                    onClick={onRetry}
                                    className={`text-xs font-medium px-3 py-1 rounded-md ${
                                        type === 'error' ? 'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200' :
                                        type === 'warning' ? 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200' :
                                        'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200'
                                    }`}
                                >
                                    Yeniden Dene
                                </button>
                            )}
                            {onDismiss && (
                                <button
                                    onClick={onDismiss}
                                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    Kapat
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Chart placeholder component
export const ChartPlaceholder = ({ 
    onRetry,
    error,
    isLoading = false,
    className = "" 
}) => (
    <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded ${className}`}>
        <div className="text-center p-6 max-w-md">
            <div className="mb-4">
                {isLoading ? (
                    <svg className="mx-auto h-12 w-12 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ) : (
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isLoading ? 'Grafik Yükleniyor' : 'Grafik Yüklenemedi'}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isLoading ? 
                    'TradingView grafik widget\'i hazırlanıyor...' :
                    error || 'Grafik widget\'i yüklenemedi. Lütfen tekrar deneyin.'
                }
            </p>
            
            {!isLoading && onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                    Yeniden Dene
                </button>
            )}
        </div>
    </div>
)

// Data placeholder component
export const DataPlaceholder = ({ 
    title = 'Veri Yok',
    message = 'Görüntülenecek veri bulunmuyor.',
    icon: Icon,
    className = ""
}) => (
    <div className={`flex flex-col items-center justify-center h-full p-6 text-center ${className}`}>
        {Icon ? (
            <Icon className="h-12 w-12 text-gray-400 mb-4" />
        ) : (
            <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
            </svg>
        )}
        
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
        </p>
    </div>
)

// Connection status component
export const ConnectionStatus = ({ 
    connections = {},
    onRetry,
    className = ""
}) => {
    const getOverallStatus = () => {
        const states = Object.values(connections)
        if (states.length === 0) return 'unknown'
        
        const connectedCount = states.filter(s => s === 'connected').length
        const totalCount = states.length
        
        if (connectedCount === totalCount) return 'connected'
        if (connectedCount === 0) return 'disconnected'
        return 'partial'
    }
    
    const overallStatus = getOverallStatus()
    const statusConfig = {
        connected: { color: 'text-green-600', bg: 'bg-green-100', icon: '🟢' },
        partial: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🟡' },
        disconnected: { color: 'text-red-600', bg: 'bg-red-100', icon: '🔴' },
        unknown: { color: 'text-gray-600', bg: 'bg-gray-100', icon: '⚪' }
    }
    
    const config = statusConfig[overallStatus]
    
    return (
        <div className={`p-3 rounded-lg ${config.bg} ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${config.color}`}>
                    {config.icon} Bağlantı Durumu
                </h4>
                {onRetry && overallStatus !== 'connected' && (
                    <button
                        onClick={onRetry}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded shadow hover:shadow-md transition-shadow"
                    >
                        Yeniden Bağlan
                    </button>
                )}
            </div>
            
            <div className="space-y-1">
                {Object.entries(connections).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 dark:text-gray-300">
                            {name.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={
                            status === 'connected' ? 'text-green-600' :
                            status === 'connecting' ? 'text-yellow-600' :
                            'text-red-600'
                        }>
                            {status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Retry button component
export const RetryButton = ({ 
    onRetry,
    loading = false,
    disabled = false,
    size = 'sm',
    variant = 'primary',
    className = ""
}) => {
    const sizeConfig = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    }
    
    const variantConfig = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200'
    }
    
    return (
        <button
            onClick={onRetry}
            disabled={disabled || loading}
            className={`
                inline-flex items-center font-medium rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizeConfig[size]}
                ${variantConfig[variant]}
                ${className}
            `}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Deneniyor...
                </>
            ) : (
                <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Yeniden Dene
                </>
            )}
        </button>
    )
}

// Progress indicator component
export const ProgressIndicator = ({ 
    current = 0,
    total = 100,
    label,
    showPercentage = true,
    className = ""
}) => {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100))
    
    return (
        <div className={`w-full ${className}`}>
            {(label || showPercentage) && (
                <div className="flex justify-between mb-2">
                    {label && (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    )
}

export default {
    LoadingSkeleton,
    StatusIndicator,
    ErrorAlert,
    ChartPlaceholder,
    DataPlaceholder,
    ConnectionStatus,
    RetryButton,
    ProgressIndicator
}