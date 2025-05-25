import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { botConfigAPI, apiKeyAPI, symbolsAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'

const BotEditPage = () => {
    const { isDark } = useTheme()
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [loadingBot, setLoadingBot] = useState(true)
    const [error, setError] = useState('')
    const [apiKey, setApiKey] = useState(null)
    const [symbols, setSymbols] = useState([])
    const [loadingSymbols, setLoadingSymbols] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    // 🆕 Searchable dropdown için state'ler
    const [searchTerm, setSearchTerm] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedSymbol, setSelectedSymbol] = useState('')

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset
    } = useForm()

    const strategy = watch('strategy')
    const positionType = watch('position_type')

    // Bot verilerini yükle
    useEffect(() => {
        const loadBot = async () => {
            try {
                const [botResponse, apiKeyResponse] = await Promise.all([
                    botConfigAPI.getById(id),
                    apiKeyAPI.getMe()
                ])

                const bot = botResponse.data
                setApiKey(apiKeyResponse.data)

                // Form verilerini doldur
                reset({
                    name: bot.name,
                    description: bot.description || '',
                    symbol: bot.symbol,
                    strategy: bot.strategy,
                    timeframe: bot.timeframe,
                    position_type: bot.position_type,
                    leverage: bot.leverage || 10,
                    is_active: bot.is_active,
                    auto_transfer_funds: bot.auto_transfer_funds || true,
                    check_interval_seconds: bot.check_interval_seconds,
                    stop_loss_perc: bot.stop_loss_perc,
                    take_profit_perc: bot.take_profit_perc,
                    trailing_stop_perc: bot.trailing_stop_perc,
                    trailing_stop_active: bot.trailing_stop_active,
                    ema_fast: bot.ema_fast,
                    ema_slow: bot.ema_slow,
                    rsi_period: bot.rsi_period,
                    rsi_oversold: bot.rsi_oversold,
                    rsi_overbought: bot.rsi_overbought,
                    max_daily_trades: bot.max_daily_trades,
                    custom_ema_fast: bot.custom_ema_fast || bot.ema_fast,
                    custom_ema_slow: bot.custom_ema_slow || bot.ema_slow,
                    custom_rsi_period: bot.custom_rsi_period || bot.rsi_period,
                    custom_rsi_oversold: bot.custom_rsi_oversold || bot.rsi_oversold,
                    custom_rsi_overbought: bot.custom_rsi_overbought || bot.rsi_overbought,
                    custom_stop_loss: bot.custom_stop_loss || bot.stop_loss_perc,
                    custom_take_profit: bot.custom_take_profit || bot.take_profit_perc,
                    custom_trailing_stop: bot.custom_trailing_stop || bot.trailing_stop_perc,
                    transfer_amount: bot.transfer_amount,
                })

                // 🆕 Mevcut symbol'ü searchable dropdown için set et
                setSearchTerm(bot.symbol || '')
                setSelectedSymbol(bot.symbol || '')

            } catch (err) {
                if (err.response?.status === 404) {
                    setError('Bot bulunamadı')
                    setTimeout(() => navigate('/dashboard'), 2000)
                } else {
                    setError('Bot bilgileri yüklenirken hata oluştu')
                }
            } finally {
                setLoadingBot(false)
            }
        }

        loadBot()
    }, [id, reset, navigate])

    useEffect(() => {
        const loadSymbols = async () => {
            if (!apiKey || !positionType) return

            setLoadingSymbols(true)
            try {
                const endpoint = positionType === 'futures' ?
                    symbolsAPI.getFuturesSymbols :
                    symbolsAPI.getSpotSymbols

                const response = await endpoint()
                if (response.data && response.data.length > 0) {
                    setSymbols(response.data)
                    console.log(`${positionType} için ${response.data.length} sembol yüklendi`)
                } else {
                    throw new Error('Boş sembol listesi döndü')
                }
            } catch (err) {
                console.error('Sembol listesi yüklenirken hata:', err)
                setError(`Sembol listesi yüklenemedi. API'ye bağlantı sorunu var. Lütfen sayfayı yenileyip tekrar deneyin.`)
                // Boş array bırakıyoruz - dropdown açılmayacak ama user bilgilendirilecek
                setSymbols([])
            } finally {
                setLoadingSymbols(false)
            }
        }

        loadSymbols()
    }, [apiKey, positionType])

    const onSubmit = async (data) => {
        setLoading(true)
        setError('')

        try {
            const botData = {
                ...data,
                api_key_id: apiKey.id,
                stop_loss_perc: parseFloat(data.stop_loss_perc),
                take_profit_perc: parseFloat(data.take_profit_perc),
                trailing_stop_perc: parseFloat(data.trailing_stop_perc),
                ema_fast: parseInt(data.ema_fast),
                ema_slow: parseInt(data.ema_slow),
                rsi_period: parseInt(data.rsi_period),
                rsi_oversold: parseInt(data.rsi_oversold),
                rsi_overbought: parseInt(data.rsi_overbought),
                max_daily_trades: data.max_daily_trades ? parseInt(data.max_daily_trades) : null,
                check_interval_seconds: parseInt(data.check_interval_seconds),
                custom_ema_fast: parseInt(data.custom_ema_fast),
                custom_ema_slow: parseInt(data.custom_ema_slow),
                custom_rsi_period: parseInt(data.custom_rsi_period),
                custom_rsi_oversold: parseInt(data.custom_rsi_oversold),
                custom_rsi_overbought: parseInt(data.custom_rsi_overbought),
                custom_stop_loss: parseFloat(data.custom_stop_loss),
                custom_take_profit: parseFloat(data.custom_take_profit),
                custom_trailing_stop: parseFloat(data.custom_trailing_stop),
                transfer_amount: data.transfer_amount ? parseFloat(data.transfer_amount) : null,
                leverage: data.leverage ? parseInt(data.leverage) : 10,
            }

            await botConfigAPI.update(id, botData)
            navigate(`/bots/${id}`)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Bot güncellenirken bir hata oluştu.'
            )
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, 4))
    }

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    if (loadingBot) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} flex items-center justify-center transition-colors duration-300`}>
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-xl transition-colors duration-300`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center`}>Bot bilgileri yükleniyor...</p>
                </div>
            </div>
        )
    }

    const steps = [
        { id: 1, name: 'Temel Bilgiler', icon: '📋' },
        { id: 2, name: 'Teknik İndikatörler', icon: '📊' },
        { id: 3, name: 'Risk Yönetimi', icon: '🛡️' },
        { id: 4, name: 'Fon Yönetimi', icon: '💰' }
    ]

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
                        Bot'u Düzenle
                    </h1>
                    <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                        Trading bot'unuzun ayarlarını güncelleyin
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-center space-x-8">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-all duration-300 ${currentStep >= step.id
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg scale-110'
                                    : `${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`
                                    }`}>
                                    {step.icon}
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-amber-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {step.name}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`ml-8 w-16 h-1 rounded-full transition-all duration-300 ${currentStep > step.id ? 'bg-gradient-to-r from-amber-600 to-orange-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className={`mb-8 px-6 py-4 rounded-2xl shadow-lg ${isDark
                        ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-800 text-red-300'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700'
                        }`}>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300`}>
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        {/* Step 1: Temel Bilgiler */}
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Temel Bot Bilgileri</h2>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bot'unuzun temel ayarlarını güncelleyin</p>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            🤖 Bot Adı *
                                        </label>
                                        <input
                                            {...register('name', {
                                                required: 'Bot adı gereklidir',
                                                minLength: { value: 3, message: 'En az 3 karakter olmalıdır' },
                                            })}
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            placeholder="örn: Gelişmiş BTC Bot"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            💼 Pozisyon Türü *
                                        </label>
                                        <select
                                            {...register('position_type', { required: 'Pozisyon türü seçimi gereklidir' })}
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white'
                                                : 'border-gray-300 bg-white text-gray-900'
                                                }`}
                                        >
                                            <option value="spot">🏦 Spot Trading</option>
                                            <option value="futures">⚡ Futures Trading</option>
                                        </select>
                                        {errors.position_type && (
                                            <p className="text-sm text-red-600 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.position_type.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* 🆕 Leverage alanı - sadece futures seçildiyse göster */}
                                    {positionType === 'futures' && (
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                ⚡ Kaldıraç (Leverage) *
                                            </label>
                                            <select
                                                {...register('leverage', {
                                                    required: positionType === 'futures' ? 'Kaldıraç seçimi gereklidir' : false,
                                                    min: { value: 1, message: 'En az 1x olmalıdır' },
                                                    max: { value: 125, message: 'En fazla 125x olabilir' }
                                                })}
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white'
                                                    : 'border-gray-300 bg-white text-gray-900'
                                                    }`}
                                            >
                                                <option value="1">1x (Güvenli)</option>
                                                <option value="2">2x</option>
                                                <option value="3">3x</option>
                                                <option value="5">5x</option>
                                                <option value="10">10x (Varsayılan)</option>
                                                <option value="20">20x (Riskli)</option>
                                                <option value="50">50x (Çok Riskli)</option>
                                                <option value="75">75x (Aşırı Riskli)</option>
                                                <option value="100">100x (Maksimum Risk)</option>
                                                <option value="125">125x (Aşırı Risk)</option>
                                            </select>
                                            <div className={`text-xs mt-1 p-2 rounded-lg ${isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'}`}>
                                                <p className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <strong>Risk Uyarısı:</strong> Yüksek kaldıraç büyük kazançlar sağlayabilir ancak aynı zamanda büyük kayıplar da yaratabilir.
                                                </p>
                                            </div>
                                            {errors.leverage && (
                                                <p className="text-sm text-red-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {errors.leverage.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        📈 Trading Çifti *
                                        {loadingSymbols && <span className="ml-2 text-xs text-amber-500">(Dinamik yükleniyor...)</span>}
                                        {!loadingSymbols && symbols.length > 20 && <span className="ml-2 text-xs text-green-500">({symbols.length} sembol yüklendi)</span>}
                                        {!loadingSymbols && symbols.length === 0 && <span className="ml-2 text-xs text-red-500">(Sembol yüklenemedi - Sayfa yenileyin)</span>}
                                    </label>

                                    {/* 🆕 Searchable Symbol Dropdown */}
                                    <div className="relative">
                                        <input
                                            {...register('symbol', { required: 'Trading çifti seçimi gereklidir' })}
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value)
                                                setIsDropdownOpen(true)
                                                setValue('symbol', e.target.value)
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            placeholder={loadingSymbols ? "Yükleniyor..." : "BTCUSDT yazın veya arayın..."}
                                            disabled={loadingSymbols}
                                            autoComplete="off"
                                        />

                                        {/* Dropdown Icon */}
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'} transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        {/* Dropdown List */}
                                        {isDropdownOpen && !loadingSymbols && symbols.length > 0 && (
                                            <div className={`absolute z-50 w-full mt-1 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-xl shadow-lg max-h-60 overflow-y-auto`}>
                                                {symbols
                                                    .filter(symbol =>
                                                        symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        symbol.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
                                                    )
                                                    .slice(0, 50) // Performance için max 50 göster
                                                    .map((symbol) => (
                                                        <div
                                                            key={symbol.symbol}
                                                            className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${isDark
                                                                ? 'hover:bg-gray-600 text-white'
                                                                : 'hover:bg-gray-50 text-gray-900'
                                                                } ${selectedSymbol === symbol.symbol ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}
                                                            onClick={() => {
                                                                setSearchTerm(symbol.symbol)
                                                                setSelectedSymbol(symbol.symbol)
                                                                setValue('symbol', symbol.symbol)
                                                                setIsDropdownOpen(false)
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium">{symbol.symbol}</span>
                                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                    {symbol.baseAsset}/{symbol.quoteAsset}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                }

                                                {/* Sonuç bulunamadı mesajı */}
                                                {symbols.filter(symbol =>
                                                    symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    symbol.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
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
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            ⏰ Zaman Dilimi *
                                        </label>
                                        <select
                                            {...register('timeframe', { required: 'Zaman dilimi seçimi gereklidir' })}
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white'
                                                : 'border-gray-300 bg-white text-gray-900'
                                                }`}
                                        >
                                            <option value="1m">1 Dakika</option>
                                            <option value="5m">5 Dakika</option>
                                            <option value="15m">15 Dakika</option>
                                            <option value="1h">1 Saat</option>
                                            <option value="4h">4 Saat</option>
                                            <option value="1d">1 Gün</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            🔄 Kontrol Aralığı (saniye) *
                                        </label>
                                        <input
                                            {...register('check_interval_seconds', {
                                                required: 'Kontrol aralığı gereklidir',
                                                min: { value: 30, message: 'En az 30 saniye olmalıdır' },
                                                max: { value: 3600, message: 'En fazla 3600 saniye olabilir' }
                                            })}
                                            type="number"
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            placeholder="60"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Teknik İndikatörler */}
                        {currentStep === 2 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Teknik İndikatör Ayarları</h2>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>EMA ve RSI parametrelerini özelleştirin</p>
                                </div>

                                <div className={`p-6 rounded-2xl mb-8 ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>📊 EMA (Exponential Moving Average)</h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                ⚡ Hızlı EMA Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_ema_fast', {
                                                    required: 'Hızlı EMA periyodu gereklidir',
                                                    min: { value: 3, message: 'En az 3 olmalıdır' },
                                                    max: { value: 50, message: 'En fazla 50 olabilir' }
                                                })}
                                                type="number"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="8"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                🐌 Yavaş EMA Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_ema_slow', {
                                                    required: 'Yavaş EMA periyodu gereklidir',
                                                    min: { value: 10, message: 'En az 10 olmalıdır' },
                                                    max: { value: 200, message: 'En fazla 200 olabilir' }
                                                })}
                                                type="number"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="21"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30' : 'bg-gradient-to-r from-purple-50 to-pink-50'}`}>
                                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>📈 RSI (Relative Strength Index)</h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                🔄 RSI Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_rsi_period', {
                                                    required: 'RSI periyodu gereklidir',
                                                    min: { value: 5, message: 'En az 5 olmalıdır' },
                                                    max: { value: 50, message: 'En fazla 50 olabilir' }
                                                })}
                                                type="number"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="7"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                📉 Aşırı Satım Seviyesi *
                                            </label>
                                            <input
                                                {...register('custom_rsi_oversold', {
                                                    required: 'RSI aşırı satım seviyesi gereklidir',
                                                    min: { value: 20, message: 'En az 20 olmalıdır' },
                                                    max: { value: 40, message: 'En fazla 40 olabilir' }
                                                })}
                                                type="number"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="35"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                📈 Aşırı Alım Seviyesi *
                                            </label>
                                            <input
                                                {...register('custom_rsi_overbought', {
                                                    required: 'RSI aşırı alım seviyesi gereklidir',
                                                    min: { value: 60, message: 'En az 60 olmalıdır' },
                                                    max: { value: 80, message: 'En fazla 80 olabilir' }
                                                })}
                                                type="number"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="65"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                                    <h4 className={`text-sm font-semibold flex items-center mb-3 ${isDark ? 'text-green-400' : 'text-green-800'}`}>
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Strateji Açıklaması
                                    </h4>
                                    <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                        Bot, hızlı EMA yavaş EMA'yı yukarı kestiğinde ve RSI aşırı alım seviyesinin altındayken alış yapar.
                                        Tersi durumda satış yapar. Daha düşük RSI seviyesi daha agresif strateji demektir.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Risk Yönetimi */}
                        {currentStep === 3 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Risk Yönetimi</h2>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Stop loss, take profit ve trailing stop ayarları</p>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30' : 'bg-gradient-to-r from-red-50 to-pink-50'}`}>
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                                                <span className="text-2xl">🛑</span>
                                            </div>
                                            <h3 className={`text-lg font-semibold ${isDark ? 'text-red-400' : 'text-red-800'}`}>Stop Loss</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Yüzde (%) *
                                            </label>
                                            <input
                                                {...register('custom_stop_loss', {
                                                    required: 'Stop loss yüzdesi gereklidir',
                                                    min: { value: 0.1, message: 'En az 0.1% olmalıdır' },
                                                    max: { value: 10, message: 'En fazla 10% olabilir' }
                                                })}
                                                type="number"
                                                step="0.1"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="0.5"
                                            />
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                                <span className="text-2xl">🎯</span>
                                            </div>
                                            <h3 className={`text-lg font-semibold ${isDark ? 'text-green-400' : 'text-green-800'}`}>Take Profit</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Yüzde (%) *
                                            </label>
                                            <input
                                                {...register('custom_take_profit', {
                                                    required: 'Take profit yüzdesi gereklidir',
                                                    min: { value: 0.1, message: 'En az 0.1% olmalıdır' },
                                                    max: { value: 20, message: 'En fazla 20% olabilir' }
                                                })}
                                                type="number"
                                                step="0.1"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="1.5"
                                            />
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                                                <span className="text-2xl">📊</span>
                                            </div>
                                            <h3 className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Trailing Stop</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Yüzde (%) *
                                            </label>
                                            <input
                                                {...register('custom_trailing_stop', {
                                                    required: 'Trailing stop yüzdesi gereklidir',
                                                    min: { value: 0.1, message: 'En az 0.1% olmalıdır' },
                                                    max: { value: 5, message: 'En fazla 5% olabilir' }
                                                })}
                                                type="number"
                                                step="0.1"
                                                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isDark
                                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`}
                                                placeholder="0.3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        🔢 Günlük Maksimum İşlem (Opsiyonel)
                                    </label>
                                    <input
                                        {...register('max_daily_trades', {
                                            min: { value: 1, message: 'En az 1 olmalıdır' },
                                            max: { value: 100, message: 'En fazla 100 olabilir' }
                                        })}
                                        type="number"
                                        className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                            }`}
                                        placeholder="10"
                                    />
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Boş bırakılırsa sınırsız işlem yapabilir
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Fon Yönetimi */}
                        {currentStep === 4 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Fon Yönetimi</h2>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Otomatik fon transferi ve bot durumu ayarları</p>
                                </div>

                                <div className={`p-8 rounded-2xl ${isDark ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30' : 'bg-gradient-to-r from-amber-50 to-orange-50'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>💸 Otomatik Fon Transferi</h3>
                                            <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                                {positionType === 'futures'
                                                    ? 'Futures trading için Spot → Futures cüzdanına otomatik transfer'
                                                    : 'Spot trading için Futures → Spot cüzdanına otomatik transfer'
                                                }
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                {...register('auto_transfer_funds')}
                                                type="checkbox"
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            💰 Transfer Miktarı (USDT - Opsiyonel)
                                        </label>
                                        <input
                                            {...register('transfer_amount', {
                                                min: { value: 10, message: 'En az 10 USDT olmalıdır' }
                                            })}
                                            type="number"
                                            step="0.01"
                                            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${isDark
                                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            placeholder="100.00"
                                        />
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Boş bırakılırsa tüm mevcut bakiye transfer edilir
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-8 rounded-2xl ${isDark ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-800'}`}>🚀 Bot Durumu</h3>
                                            <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                                Bot güncellemeden sonra aktif durumda kalacak mı?
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                {...register('is_active')}
                                                type="checkbox"
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className={`flex justify-between pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <button
                                type="button"
                                onClick={() => currentStep === 1 ? navigate(`/bots/${id}`) : prevStep()}
                                className={`flex items-center px-6 py-3 border rounded-xl shadow-sm text-sm font-medium transition-all duration-200 ${isDark
                                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                {currentStep === 1 ? 'İptal' : 'Geri'}
                            </button>

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform hover:scale-105 transition-all duration-200 font-semibold"
                                >
                                    İleri
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading || loadingSymbols}
                                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Güncelleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Bot'u Güncelle
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default BotEditPage
