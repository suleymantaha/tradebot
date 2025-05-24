import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { botConfigAPI, apiKeyAPI, symbolsAPI } from '../../services/api'

const BotCreatePage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [apiKey, setApiKey] = useState(null)
    const [checkingApiKey, setCheckingApiKey] = useState(true)
    const [symbols, setSymbols] = useState([])
    const [loadingSymbols, setLoadingSymbols] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            strategy: 'ema',
            is_active: false,
            position_type: 'spot',
            auto_transfer_funds: true,
            timeframe: '1m',
            stop_loss_perc: 2.0,
            take_profit_perc: 3.0,
            trailing_stop_perc: 0.5,
            trailing_stop_active: false,
            ema_fast: 12,
            ema_slow: 26,
            rsi_period: 14,
            rsi_oversold: 30,
            rsi_overbought: 70,
            max_daily_trades: 10,
            check_interval_seconds: 60,
            custom_ema_fast: 8,
            custom_ema_slow: 21,
            custom_rsi_period: 7,
            custom_rsi_oversold: 35,
            custom_rsi_overbought: 65,
            custom_stop_loss: 0.5,
            custom_take_profit: 1.5,
            custom_trailing_stop: 0.3,
        },
    })

    const strategy = watch('strategy')
    const positionType = watch('position_type')

    useEffect(() => {
        const checkApiKey = async () => {
            try {
                const response = await apiKeyAPI.getMe()
                setApiKey(response.data)
            } catch (err) {
                setApiKey(null)
                if (err.response?.status === 404) {
                    setError('Bot oluşturmak için önce API anahtarı eklemelisiniz.')
                }
            } finally {
                setCheckingApiKey(false)
            }
        }

        checkApiKey()
    }, [])

    useEffect(() => {
        const loadSymbols = async () => {
            if (!apiKey) return

            setLoadingSymbols(true)
            try {
                const endpoint = positionType === 'futures' ?
                    symbolsAPI.getFuturesSymbols :
                    symbolsAPI.getSpotSymbols

                const response = await endpoint()
                setSymbols(response.data || [])
            } catch (err) {
                console.warn('Sembol listesi yüklenemedi, varsayılan listesi kullanılıyor')
                setSymbols([
                    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
                    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
                    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
                    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
                ])
            } finally {
                setLoadingSymbols(false)
            }
        }

        loadSymbols()
    }, [apiKey, positionType])

    const onSubmit = async (data) => {
        if (!apiKey) {
            setError('API anahtarı gereklidir.')
            return
        }

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
            }

            const response = await botConfigAPI.create(botData)
            navigate(`/bots/${response.data.id}`)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Bot oluşturulurken bir hata oluştu.'
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

    if (checkingApiKey) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-center">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (!apiKey) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-8 py-10">
                            <div className="text-center mb-8">
                                <div className="mx-auto h-20 w-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">API Anahtarı Gerekli</h3>
                                <p className="text-gray-600">Bot oluşturmak için önce Binance API anahtarınızı eklemelisiniz.</p>
                            </div>
                            <button
                                onClick={() => navigate('/api-keys')}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                            >
                                API Anahtarı Ekle
                            </button>
                        </div>
                    </div>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        İleri Seviye Trading Bot
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Gelişmiş teknik indikatörler ve risk yönetimi ile profesyonel trading botunuzu oluşturun
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-center space-x-8">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-all duration-300 ${currentStep >= step.id
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step.icon}
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        {step.name}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`ml-8 w-16 h-1 rounded-full transition-all duration-300 ${currentStep > step.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        {/* Step 1: Temel Bilgiler */}
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Temel Bot Bilgileri</h2>
                                    <p className="text-gray-600">Bot'unuzun temel ayarlarını yapılandırın</p>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            🤖 Bot Adı *
                                        </label>
                                        <input
                                            {...register('name', {
                                                required: 'Bot adı gereklidir',
                                                minLength: { value: 3, message: 'En az 3 karakter olmalıdır' },
                                            })}
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                                        <label className="block text-sm font-semibold text-gray-700">
                                            💼 Pozisyon Türü *
                                        </label>
                                        <select
                                            {...register('position_type', { required: 'Pozisyon türü seçimi gereklidir' })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value="spot">🏦 Spot Trading</option>
                                            <option value="futures">⚡ Futures Trading</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        📈 Trading Çifti *
                                        {loadingSymbols && <span className="ml-2 text-xs text-indigo-500">(Yükleniyor...)</span>}
                                    </label>
                                    <select
                                        {...register('symbol', { required: 'Trading çifti seçimi gereklidir' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        disabled={loadingSymbols}
                                    >
                                        <option value="">Trading çifti seçin</option>
                                        {symbols.map((symbol) => (
                                            <option key={symbol.symbol} value={symbol.symbol}>
                                                {symbol.symbol} ({symbol.baseAsset}/{symbol.quoteAsset})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            ⏰ Zaman Dilimi *
                                        </label>
                                        <select
                                            {...register('timeframe', { required: 'Zaman dilimi seçimi gereklidir' })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                                        <label className="block text-sm font-semibold text-gray-700">
                                            🔄 Kontrol Aralığı (saniye) *
                                        </label>
                                        <input
                                            {...register('check_interval_seconds', {
                                                required: 'Kontrol aralığı gereklidir',
                                                min: { value: 30, message: 'En az 30 saniye olmalıdır' },
                                                max: { value: 3600, message: 'En fazla 3600 saniye olabilir' }
                                            })}
                                            type="number"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Teknik İndikatör Ayarları</h2>
                                    <p className="text-gray-600">EMA ve RSI parametrelerini özelleştirin</p>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8">
                                    <h3 className="text-lg font-semibold text-indigo-800 mb-3">📊 EMA (Exponential Moving Average)</h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                ⚡ Hızlı EMA Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_ema_fast', {
                                                    required: 'Hızlı EMA periyodu gereklidir',
                                                    min: { value: 3, message: 'En az 3 olmalıdır' },
                                                    max: { value: 50, message: 'En fazla 50 olabilir' }
                                                })}
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="8"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                🐌 Yavaş EMA Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_ema_slow', {
                                                    required: 'Yavaş EMA periyodu gereklidir',
                                                    min: { value: 10, message: 'En az 10 olmalıdır' },
                                                    max: { value: 200, message: 'En fazla 200 olabilir' }
                                                })}
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="21"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                                    <h3 className="text-lg font-semibold text-purple-800 mb-3">📈 RSI (Relative Strength Index)</h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                🔄 RSI Periyodu *
                                            </label>
                                            <input
                                                {...register('custom_rsi_period', {
                                                    required: 'RSI periyodu gereklidir',
                                                    min: { value: 5, message: 'En az 5 olmalıdır' },
                                                    max: { value: 50, message: 'En fazla 50 olabilir' }
                                                })}
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="7"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                📉 Aşırı Satım Seviyesi *
                                            </label>
                                            <input
                                                {...register('custom_rsi_oversold', {
                                                    required: 'RSI aşırı satım seviyesi gereklidir',
                                                    min: { value: 20, message: 'En az 20 olmalıdır' },
                                                    max: { value: 40, message: 'En fazla 40 olabilir' }
                                                })}
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="35"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                📈 Aşırı Alım Seviyesi *
                                            </label>
                                            <input
                                                {...register('custom_rsi_overbought', {
                                                    required: 'RSI aşırı alım seviyesi gereklidir',
                                                    min: { value: 60, message: 'En az 60 olmalıdır' },
                                                    max: { value: 80, message: 'En fazla 80 olabilir' }
                                                })}
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="65"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl">
                                    <h4 className="text-sm font-semibold text-green-800 flex items-center mb-3">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Strateji Açıklaması
                                    </h4>
                                    <p className="text-sm text-green-700">
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
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Yönetimi</h2>
                                    <p className="text-gray-600">Stop loss, take profit ve trailing stop ayarları</p>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl">
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                                                <span className="text-2xl">🛑</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-red-800">Stop Loss</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl">
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                                <span className="text-2xl">🎯</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-green-800">Take Profit</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                placeholder="1.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                                        <div className="text-center mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                                                <span className="text-2xl">📊</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-blue-800">Trailing Stop</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0.3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        🔢 Günlük Maksimum İşlem (Opsiyonel)
                                    </label>
                                    <input
                                        {...register('max_daily_trades', {
                                            min: { value: 1, message: 'En az 1 olmalıdır' },
                                            max: { value: 100, message: 'En fazla 100 olabilir' }
                                        })}
                                        type="number"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="10"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Boş bırakılırsa sınırsız işlem yapabilir
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Fon Yönetimi */}
                        {currentStep === 4 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Fon Yönetimi</h2>
                                    <p className="text-gray-600">Otomatik fon transferi ve bot durumu ayarları</p>
                                </div>

                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-amber-800 mb-2">💸 Otomatik Fon Transferi</h3>
                                            <p className="text-sm text-amber-700">
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
                                        <label className="block text-sm font-semibold text-gray-700">
                                            💰 Transfer Miktarı (USDT - Opsiyonel)
                                        </label>
                                        <input
                                            {...register('transfer_amount', {
                                                min: { value: 10, message: 'En az 10 USDT olmalıdır' }
                                            })}
                                            type="number"
                                            step="0.01"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                            placeholder="100.00"
                                        />
                                        <p className="text-sm text-gray-500">
                                            Boş bırakılırsa tüm mevcut bakiye transfer edilir
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-800 mb-2">🚀 Bot Durumu</h3>
                                            <p className="text-sm text-green-700">
                                                Botu oluşturulduktan sonra hemen çalışmaya başlasın mı?
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
                        <div className="flex justify-between pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => currentStep === 1 ? navigate('/dashboard') : prevStep()}
                                className="flex items-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
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
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all duration-200 font-semibold"
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
                                            Oluşturuluyor...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Bot'u Oluştur
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

export default BotCreatePage
