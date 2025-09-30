import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import apiService, { symbolsAPI } from '../../services/api'
import BacktestInsights from '../../components/Backtest/BacktestInsights'
import BacktestHistory from '../../components/Backtest/BacktestHistory'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

const BacktestPage = () => {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { isAuthenticated, token, user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('new') // 'new' or 'history'
    const [isLoading, setIsLoading] = useState(false)
    const [symbol, setSymbol] = useState('BNBUSDT')
    const [interval, setInterval] = useState('15m')
    const [marketType, setMarketType] = useState('spot') // spot or futures
    const [symbols, setSymbols] = useState([])
    const [symbolsLoading, setSymbolsLoading] = useState(false)
    // 🆕 Searchable dropdown için state'ler
    const [searchTerm, setSearchTerm] = useState('BNBUSDT')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedSymbol, setSelectedSymbol] = useState('BNBUSDT')

    // Tarih aralığı
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)

    // Temel parametreler
    const [parameters, setParameters] = useState({
        initial_capital: 1000,
        daily_target: 3.0,
        max_daily_loss: 1.0,
        stop_loss: 0.5,
        take_profit: 1.5,
        trailing_stop: 0.3,
        risk_per_trade: 2.0,
        leverage: 10  // 🆕 Kaldıraç parametresi
    })

    // Teknik indikatör parametreleri
    const [technicalParams, setTechnicalParams] = useState({
        ema_fast: 8,
        ema_slow: 21,
        rsi_period: 7,
        rsi_oversold: 35,
        rsi_overbought: 65
    })

    const [results, setResults] = useState(null)
    const [progress, setProgress] = useState(0)
    const [cacheInfo, setCacheInfo] = useState(null)
    const [showCacheInfo, setShowCacheInfo] = useState(false)

    const intervals = [
        { value: '5m', label: '5 Dakika' },
        { value: '15m', label: '15 Dakika' },
        { value: '30m', label: '30 Dakika' },
        { value: '1h', label: '1 Saat' },
        { value: '4h', label: '4 Saat' },
        { value: '1d', label: '1 Gün' }
    ]

    // Auth kontrolü
    useEffect(() => {
        console.log('🔐 Auth Status:', { isAuthenticated, hasToken: !!token, user: user?.email })
        if (!isAuthenticated || !token) {
            console.warn('⚠️ Not authenticated, redirecting to login')
            navigate('/login')
        } else {
            // Set dynamic default dates when component loads
            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(today.getMonth() - 6)

            setEndDate(today)
            setStartDate(sixMonthsAgo)
        }
    }, [isAuthenticated, token, navigate])

    const handleParameterChange = (key, value) => {
        setParameters(prev => ({ ...prev, [key]: parseFloat(value) }))
    }

    const handleTechnicalParamChange = (key, value) => {
        setTechnicalParams(prev => ({ ...prev, [key]: parseFloat(value) }))
    }

    const fetchCacheInfo = async () => {
        try {
            console.log('🔄 Fetching cache info...')
            const response = await apiService.getCacheInfo()
            console.log('📡 Cache info response:', response)

            if (response.status === 'success' && response.data) {
                setCacheInfo(response.data)
                console.log('✅ Cache info updated:', response.data)
            } else {
                console.warn('⚠️ Invalid cache info response:', response)
                setCacheInfo(null)
            }
        } catch (error) {
            console.error('❌ Cache info hatası:', error)
            setCacheInfo(null)
        }
    }

    const clearCache = async () => {
        if (!confirm('Tüm cache\'lenmiş data silinecek. Emin misiniz?')) {
            return
        }

        try {
            await apiService.clearCache()
            setCacheInfo(null)
            alert('Cache temizlendi!')
        } catch (error) {
            console.error('Cache temizleme hatası:', error)
            alert('Cache temizlenirken hata oluştu')
        }
    }

    // Load cache info on component mount
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCacheInfo()
            // 🆕 İlk yüklemede sembolleri de getir
            fetchSymbols(marketType)
        }
    }, [isAuthenticated, token])

    const fetchSymbols = async (marketType) => {
        try {
            setSymbolsLoading(true)
            console.log(`🔄 Fetching ${marketType} symbols...`)

            const endpoint = marketType === 'futures' ?
                symbolsAPI.getFuturesSymbols :
                symbolsAPI.getSpotSymbols

            const response = await endpoint()
            if (response.data && response.data.length > 0) {
                setSymbols(response.data)
                console.log(`✅ Loaded ${response.data.length} ${marketType} symbols`)

                // Mevcut symbol yeni listede yoksa ilkini seç
                const symbolExists = response.data.some(s => s.symbol === symbol)
                if (!symbolExists && response.data.length > 0) {
                    const newSymbol = response.data[0].symbol
                    setSymbol(newSymbol)
                    setSearchTerm(newSymbol)
                    setSelectedSymbol(newSymbol)
                }
            } else {
                throw new Error('Boş sembol listesi döndü')
            }
        } catch (error) {
            console.error('❌ Error fetching symbols:', error)
            // Fallback symbols
            const fallbackSymbols = [
                { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
                { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
                { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
                { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
                { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' }
            ]
            setSymbols(fallbackSymbols)
        } finally {
            setSymbolsLoading(false)
        }
    }

    // Market type değiştiğinde symbols'ları fetch et
    useEffect(() => {
        fetchSymbols(marketType)
    }, [marketType])

    const runBacktest = async () => {
        setIsLoading(true)
        setProgress(0)
        setResults(null)

        try {
            const requestData = {
                symbol,
                interval,
                start_date: startDate?.toISOString().split('T')[0],
                end_date: endDate?.toISOString().split('T')[0],
                market_type: marketType,
                parameters: {
                    ...parameters,
                    ...technicalParams
                }
            }

            console.log('Sending backtest request:', requestData)

            const data = await apiService.runBacktest(requestData)
            setResults(data.data)

            console.log('Backtest results:', data)
        } catch (error) {
            console.error('Backtest hatası:', error)
            alert('Backtest çalıştırılırken hata oluştu: ' + error.message)
        } finally {
            setIsLoading(false)
            setProgress(0)
        }
    }

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        📊 Backtest
                    </h1>
                    <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Trading stratejilerinizi test edin ve analiz edin
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <nav className={`flex space-x-8 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'new'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            🆕 Yeni Backtest
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            📚 Geçmiş Backtest'ler
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'new' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cache Bilgileri */}
                        <div className="lg:col-span-3 mb-6">
                            <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        🗄️ Cache Durumu
                                    </h2>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={fetchCacheInfo}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                        >
                                            🔄 Yenile
                                        </button>
                                        <button
                                            onClick={() => setShowCacheInfo(!showCacheInfo)}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                                        >
                                            {showCacheInfo ? '👁️ Gizle' : '👁️ Göster'}
                                        </button>
                                        <button
                                            onClick={clearCache}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                                        >
                                            🗑️ Temizle
                                        </button>
                                    </div>
                                </div>

                                {cacheInfo && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="text-2xl mb-1">📊</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam Cache</div>
                                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {cacheInfo.total_files}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="text-2xl mb-1">💽</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Boyut</div>
                                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {cacheInfo.total_size_mb} MB
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="text-2xl mb-1">🪙</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coin Sayısı</div>
                                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {cacheInfo.cached_symbols?.length || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="text-2xl mb-1">⚡</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Durum</div>
                                            <div className={`text-lg font-bold ${cacheInfo.total_files > 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {cacheInfo.total_files > 0 ? 'Aktif' : 'Boş'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showCacheInfo && cacheInfo && cacheInfo.cache_entries && (
                                    <div className="mt-4">
                                        <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            📋 Cache Detayları
                                        </h3>
                                        <div className="max-h-64 overflow-y-auto">
                                            <div className="space-y-2">
                                                {cacheInfo.cache_entries.map((entry, index) => (
                                                    <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {entry.symbol} - {entry.interval}
                                                                </div>
                                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {entry.start_date} → {entry.end_date}
                                                                </div>
                                                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                    {entry.rows} satır, {new Date(entry.cached_at).toLocaleString('tr-TR')}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-green-500 font-medium">
                                                                ✅ Cache'li
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!cacheInfo && (
                                    <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Cache bilgileri yükleniyor...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ayarlar Paneli */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Temel Ayarlar */}
                            <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    🎛️ Temel Ayarlar
                                </h2>

                                {/* Market Type Seçimi */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        📈 Market Türü
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setMarketType('spot')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${marketType === 'spot'
                                                ? 'bg-indigo-600 text-white'
                                                : isDark
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            💰 Spot
                                        </button>
                                        <button
                                            onClick={() => setMarketType('futures')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${marketType === 'futures'
                                                ? 'bg-indigo-600 text-white'
                                                : isDark
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            ⚡ Futures
                                        </button>
                                    </div>
                                </div>

                                {/* İşlem Çifti */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        💱 İşlem Çifti
                                        {symbolsLoading && <span className="ml-2 text-xs text-indigo-500">(Yükleniyor...)</span>}
                                        {!symbolsLoading && symbols.length > 20 && <span className="ml-2 text-xs text-green-500">({symbols.length} sembol yüklendi)</span>}
                                    </label>

                                    {/* 🆕 Searchable Symbol Dropdown */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value)
                                                setIsDropdownOpen(true)
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            className={`w-full px-4 py-2 rounded-xl border transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${isDark
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                } ${symbolsLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                            placeholder={symbolsLoading ? "Yükleniyor..." : "BTCUSDT yazın veya arayın..."}
                                            disabled={symbolsLoading}
                                            autoComplete="off"
                                        />

                                        {/* Dropdown Icon */}
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            {symbolsLoading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                                            ) : (
                                                <svg className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'} transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Dropdown List */}
                                        {isDropdownOpen && !symbolsLoading && symbols.length > 0 && (
                                            <div className={`absolute z-50 w-full mt-1 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-xl shadow-lg max-h-60 overflow-y-auto`}>
                                                {symbols
                                                    .filter(sym =>
                                                        sym.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        (sym.baseAsset && sym.baseAsset.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    )
                                                    .slice(0, 50) // Performance için max 50 göster
                                                    .map((sym) => (
                                                        <div
                                                            key={sym.symbol}
                                                            className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${isDark
                                                                ? 'hover:bg-gray-600 text-white'
                                                                : 'hover:bg-gray-50 text-gray-900'
                                                                } ${selectedSymbol === sym.symbol ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                                            onClick={() => {
                                                                setSymbol(sym.symbol)
                                                                setSearchTerm(sym.symbol)
                                                                setSelectedSymbol(sym.symbol)
                                                                setIsDropdownOpen(false)
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium">{sym.symbol}</span>
                                                                {sym.baseAsset && sym.quoteAsset && (
                                                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                        {sym.baseAsset}/{sym.quoteAsset}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                }

                                                {/* Sonuç bulunamadı mesajı */}
                                                {symbols.filter(sym =>
                                                    sym.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    (sym.baseAsset && sym.baseAsset.toLowerCase().includes(searchTerm.toLowerCase()))
                                                ).length === 0 && searchTerm.length > 0 && (
                                                        <div className={`px-4 py-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                            <p>"{searchTerm}" için sonuç bulunamadı</p>
                                                            <p className="text-xs mt-1">Farklı bir arama terimi deneyin</p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Click outside to close dropdown */}
                                    {isDropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsDropdownOpen(false)}
                                        ></div>
                                    )}

                                    {/* Bilgi mesajı */}
                                    {symbols.length > 0 && (
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {symbols.length} {marketType} çifti mevcut • Dinamik yükleme aktif ✅
                                        </p>
                                    )}
                                </div>

                                {/* Zaman Dilimi */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Zaman Dilimi
                                    </label>
                                    <select
                                        value={interval}
                                        onChange={(e) => setInterval(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                    >
                                        {intervals.map(int => (
                                            <option key={int.value} value={int.value}>{int.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tarih Aralığı */}
                                <div className="space-y-4">
                                    {/* Hızlı Tarih Seçimleri */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            📅 Hızlı Seçim
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: '1 Ay', months: 1 },
                                                { label: '3 Ay', months: 3 },
                                                { label: '6 Ay', months: 6 }
                                            ].map(({ label, months }) => (
                                                <button
                                                    key={label}
                                                    onClick={() => {
                                                        const today = new Date()
                                                        const startDate = new Date()
                                                        startDate.setMonth(today.getMonth() - months)
                                                        setStartDate(startDate)
                                                        setEndDate(today)
                                                    }}
                                                    className={`px-3 py-2 text-xs rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date Picker'lar */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Başlangıç Tarihi
                                            </label>
                                            <DatePicker
                                                selected={startDate}
                                                onChange={(date) => setStartDate(date)}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Başlangıç tarihi seçin"
                                                className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                                wrapperClassName="w-full"
                                                calendarClassName={isDark ? 'dark-calendar' : ''}
                                                showPopperArrow={false}
                                                maxDate={endDate || new Date()}
                                                todayButton="Bugün"
                                                showYearDropdown
                                                yearDropdownItemNumber={5}
                                                scrollableYearDropdown
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Bitiş Tarihi
                                            </label>
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date) => setEndDate(date)}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Bitiş tarihi seçin"
                                                className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                                wrapperClassName="w-full"
                                                calendarClassName={isDark ? 'dark-calendar' : ''}
                                                showPopperArrow={false}
                                                minDate={startDate}
                                                maxDate={new Date()}
                                                todayButton="Bugün"
                                                showYearDropdown
                                                yearDropdownItemNumber={5}
                                                scrollableYearDropdown
                                            />
                                        </div>
                                    </div>

                                    {/* Seçilen Aralık Bilgisi */}
                                    {startDate && endDate && (
                                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg">📊</span>
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Seçilen Aralık: <strong>{Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} gün</strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Risk Yönetimi Parametreleri */}
                            <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    ⚖️ Risk Yönetimi
                                </h2>

                                <div className="space-y-4">
                                    {Object.entries(parameters).map(([key, value]) => {
                                        // Kaldıraç sadece futures işlemlerinde gösterilsin
                                        if (key === 'leverage' && marketType !== 'futures') {
                                            return null;
                                        }

                                        return (
                                            <div key={key}>
                                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {key === 'initial_capital' && 'Başlangıç Sermayesi (USDT)'}
                                                    {key === 'daily_target' && 'Günlük Hedef (%)'}
                                                    {key === 'max_daily_loss' && 'Maks. Günlük Kayıp (%)'}
                                                    {key === 'stop_loss' && 'Stop Loss (%)'}
                                                    {key === 'take_profit' && 'Take Profit (%)'}
                                                    {key === 'trailing_stop' && 'Trailing Stop (%)'}
                                                    {key === 'risk_per_trade' && 'Risk Per Trade (%)'}
                                                    {key === 'leverage' && '⚡ Kaldıraç (Futures)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step={key === 'leverage' ? "1" : "0.1"}
                                                    min={key === 'leverage' ? "1" : undefined}
                                                    max={key === 'leverage' ? "125" : undefined}
                                                    value={value}
                                                    onChange={(e) => handleParameterChange(key, e.target.value)}
                                                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                                />
                                                {key === 'leverage' && marketType === 'futures' && (
                                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        1x - 125x arası kaldıraç (Risk dikkat!)
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Teknik İndikatör Parametreleri */}
                            <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    📊 Teknik İndikatörler
                                </h2>

                                <div className="space-y-4">
                                    {Object.entries(technicalParams).map(([key, value]) => (
                                        <div key={key}>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {key === 'ema_fast' && 'Hızlı EMA Periyodu'}
                                                {key === 'ema_slow' && 'Yavaş EMA Periyodu'}
                                                {key === 'rsi_period' && 'RSI Periyodu'}
                                                {key === 'rsi_oversold' && 'RSI Aşırı Satım'}
                                                {key === 'rsi_overbought' && 'RSI Aşırı Alım'}
                                            </label>
                                            <input
                                                type="number"
                                                step={key.includes('rsi_') && !key.includes('period') ? "1" : "1"}
                                                value={value}
                                                onChange={(e) => handleTechnicalParamChange(key, e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Çalıştır Butonu */}
                            <button
                                onClick={runBacktest}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Backtest Çalışıyor...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>🚀</span>
                                        <span>Backtest Başlat</span>
                                    </div>
                                )}
                            </button>

                            {/* Progress Bar */}
                            {isLoading && (
                                <div className="mt-4">
                                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className={`text-sm text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        İlerleme: %{progress.toFixed(0)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sonuçlar Paneli */}
                        <div className="lg:col-span-2">
                            <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    📊 Backtest Sonuçları
                                </h2>

                                {!results && !isLoading && (
                                    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <div className="text-6xl mb-4">📈</div>
                                        <p className="text-lg">Backtest sonuçları burada görünecek</p>
                                        <p className="text-sm mt-2">Yukarıdan parametreleri ayarlayıp "Backtest Başlat" butonuna tıklayın</p>
                                    </div>
                                )}

                                {results && (
                                    <div className="space-y-6">
                                        {/* CSV İndirme Butonları (Yeni backtest sonucu için) */}
                                        {results.id && (
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => apiService.downloadBacktestDaily(results.id)}
                                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
                                                >
                                                    ⬇️ Günlük CSV
                                                </button>
                                                <button
                                                    onClick={() => apiService.downloadBacktestMonthly(results.id)}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                                                >
                                                    ⬇️ Aylık CSV
                                                </button>
                                                <button
                                                    onClick={() => apiService.downloadBacktestTrades(results.id)}
                                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg"
                                                >
                                                    ⬇️ İşlemler CSV
                                                </button>
                                            </div>
                                        )}
                                        {/* Özet Kartları */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                                                <div className="text-2xl mb-2">💰</div>
                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam Getiri</div>
                                                <div className={`text-xl font-bold ${results.total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    %{results.total_return?.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                                                <div className="text-2xl mb-2">🎯</div>
                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kazanç Oranı</div>
                                                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    %{results.win_rate?.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-purple-50'}`}>
                                                <div className="text-2xl mb-2">📊</div>
                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam İşlem</div>
                                                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {results.total_trades}
                                                </div>
                                            </div>

                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}>
                                                <div className="text-2xl mb-2">💵</div>
                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Final Sermaye</div>
                                                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {results.final_capital?.toFixed(2)} USDT
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detaylı Sonuçlar */}
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                📋 Detaylı İstatistikler
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Başlangıç Sermayesi:</span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {results.initial_capital} USDT
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam Komisyon:</span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {results.total_fees?.toFixed(2)} USDT
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kazanan İşlem:</span>
                                                    <span className={`ml-2 font-medium text-green-500`}>
                                                        {results.winning_trades}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kaybeden İşlem:</span>
                                                    <span className={`ml-2 font-medium text-red-500`}>
                                                        {results.losing_trades}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Test Aralığı:</span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Strateji:</span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        EMA({technicalParams.ema_fast}/{technicalParams.ema_slow}) + RSI({technicalParams.rsi_period})
                                                    </span>
                                                </div>
                                                {/* Kaldıraç bilgisi sadece futures için göster */}
                                                {results.market_type === 'futures' && (
                                                    <div>
                                                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kaldıraç:</span>
                                                        <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {results.leverage}x
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Market Türü:</span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {results.market_type === 'futures' ? '⚡ Futures' : '💰 Spot'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI benzeri özet ve grafik okuma (heuristik) */}
                                        <BacktestInsights results={results} />

                                        {/* Aylık Performans */}
                                        {results.monthly_results && Object.keys(results.monthly_results).length > 0 && (
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    📅 Aylık Performans
                                                </h3>
                                                <div className="space-y-2">
                                                    {Object.entries(results.monthly_results).map(([month, data]) => (
                                                        <div key={month} className="flex justify-between items-center">
                                                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {month}
                                                            </span>
                                                            <div className="flex space-x-4">
                                                                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {data.trades} işlem
                                                                </span>
                                                                <span className={`text-sm font-medium ${data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                    %{data.pnl?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <BacktestHistory />
                )}
            </div>
        </div>
    )
}

export default BacktestPage
