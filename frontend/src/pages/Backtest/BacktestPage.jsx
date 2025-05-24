import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import apiService from '../../services/api'

const BacktestPage = () => {
    const { isDark } = useTheme()
    const [loading, setLoading] = useState(false)
    const [symbol, setSymbol] = useState('BNBUSDT')
    const [interval, setInterval] = useState('15m')

    // Tarih aralığı
    const [startDate, setStartDate] = useState('2025-01-01')
    const [endDate, setEndDate] = useState('2025-04-04')

    // Temel parametreler
    const [parameters, setParameters] = useState({
        initial_capital: 1000,
        daily_target: 3.0,
        max_daily_loss: 1.0,
        stop_loss: 0.5,
        take_profit: 1.5,
        trailing_stop: 0.3
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

    const symbols = [
        'BNBUSDT', 'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT',
        'XRPUSDT', 'LTCUSDT', 'BCHUSDT', 'LINKUSDT', 'XLMUSDT'
    ]

    const intervals = [
        { value: '5m', label: '5 Dakika' },
        { value: '15m', label: '15 Dakika' },
        { value: '30m', label: '30 Dakika' },
        { value: '1h', label: '1 Saat' },
        { value: '4h', label: '4 Saat' },
        { value: '1d', label: '1 Gün' }
    ]

    const handleParameterChange = (key, value) => {
        setParameters(prev => ({ ...prev, [key]: parseFloat(value) }))
    }

    const handleTechnicalParamChange = (key, value) => {
        setTechnicalParams(prev => ({ ...prev, [key]: parseFloat(value) }))
    }

    const runBacktest = async () => {
        setLoading(true)
        setProgress(0)
        setResults(null)

        try {
            const requestData = {
                symbol,
                interval,
                start_date: startDate,
                end_date: endDate,
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
            setLoading(false)
            setProgress(0)
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        📈 Backtest Sistemi
                    </h1>
                    <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Trading stratejinizi geçmiş verilerle test edin
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ayarlar Paneli */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Temel Ayarlar */}
                        <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                            <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                🎛️ Temel Ayarlar
                            </h2>

                            {/* İşlem Çifti */}
                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    İşlem Çifti
                                </label>
                                <select
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                >
                                    {symbols.map(sym => (
                                        <option key={sym} value={sym}>{sym}</option>
                                    ))}
                                </select>
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
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Başlangıç Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Bitiş Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Risk Yönetimi Parametreleri */}
                        <div className={`rounded-2xl shadow-xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                            <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                ⚖️ Risk Yönetimi
                            </h2>

                            <div className="space-y-4">
                                {Object.entries(parameters).map(([key, value]) => (
                                    <div key={key}>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {key === 'initial_capital' && 'Başlangıç Sermayesi (USDT)'}
                                            {key === 'daily_target' && 'Günlük Hedef (%)'}
                                            {key === 'max_daily_loss' && 'Maks. Günlük Kayıp (%)'}
                                            {key === 'stop_loss' && 'Stop Loss (%)'}
                                            {key === 'take_profit' && 'Take Profit (%)'}
                                            {key === 'trailing_stop' && 'Trailing Stop (%)'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={value}
                                            onChange={(e) => handleParameterChange(key, e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500`}
                                        />
                                    </div>
                                ))}
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
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
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
                        {loading && (
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

                            {!results && !loading && (
                                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <div className="text-6xl mb-4">📈</div>
                                    <p className="text-lg">Backtest sonuçları burada görünecek</p>
                                    <p className="text-sm mt-2">Yukarıdan parametreleri ayarlayıp "Backtest Başlat" butonuna tıklayın</p>
                                </div>
                            )}

                            {results && (
                                <div className="space-y-6">
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
                                                    {startDate} - {endDate}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Strateji:</span>
                                                <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    EMA({technicalParams.ema_fast}/{technicalParams.ema_slow}) + RSI({technicalParams.rsi_period})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

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
            </div>
        </div>
    )
}

export default BacktestPage
