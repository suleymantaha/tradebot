import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiServiceInstance from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'

const BotPerformance = () => {
    const { isDark } = useTheme()
    const { id } = useParams()
    const [bot, setBot] = useState(null)
    const [performance, setPerformance] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                // Bot bilgilerini al
                const botResponse = await apiServiceInstance.get(`/api/v1/bot-configs/${id}`)
                setBot(botResponse)

                // Performans verilerini al
                const performanceData = await apiServiceInstance.get(`/api/v1/bots/${id}/performance`)
                setPerformance(performanceData)
            } catch (err) {
                console.error("Error fetching bot performance data:", err)
                setError('Performans verileri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyiniz.')
                setPerformance(null)
                setBot(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-64">
                        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-3xl shadow-2xl transition-colors duration-300`}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className={`mt-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center font-medium`}>Yükleniyor...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Header */}
                    <div className="mb-8">
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li>
                                    <Link to="/dashboard" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                                        Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className={`flex-shrink-0 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <Link to={`/bots/${id}`} className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                                            {bot?.name}
                                        </Link>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className={`flex-shrink-0 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Performans Raporu</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Performans Raporu</h1>
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {bot?.name} bot'unun performans analizi
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-6 px-4 py-3 rounded-2xl ${isDark
                            ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-800 text-red-300'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700'
                            }`}>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Performance Stats */}
                    {performance ? (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
                            {/* Toplam Trade */}
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow-2xl rounded-3xl transition-colors duration-300`}>
                                <div className="px-6 py-8">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                                <span className="text-3xl">📊</span>
                                            </div>
                                        </div>
                                        <div className="ml-6">
                                            <dl>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Toplam Trade
                                                </dt>
                                                <dd className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {performance.total_trades}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gerçekleşen PnL */}
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow-2xl rounded-3xl transition-colors duration-300`}>
                                <div className="px-6 py-8">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`w-16 h-16 ${performance.total_realized_pnl >= 0
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-red-500 to-pink-500'
                                                } rounded-full flex items-center justify-center`}>
                                                <span className="text-3xl">{performance.total_realized_pnl >= 0 ? '📈' : '📉'}</span>
                                            </div>
                                        </div>
                                        <div className="ml-6">
                                            <dl>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Gerçekleşen PnL
                                                </dt>
                                                <dd className={`text-3xl font-bold ${performance.total_realized_pnl >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {performance.total_realized_pnl >= 0 ? '+' : ''}{performance.total_realized_pnl.toFixed(2)} USDT
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Başarı Oranı */}
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow-2xl rounded-3xl transition-colors duration-300`}>
                                <div className="px-6 py-8">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                                                <span className="text-3xl">🎯</span>
                                            </div>
                                        </div>
                                        <div className="ml-6">
                                            <dl>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Başarı Oranı
                                                </dt>
                                                <dd className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {performance.total_trades > 0
                                                        ? ((performance.total_sell / performance.total_trades) * 100).toFixed(1)
                                                        : 0
                                                    }%
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Detaylı İstatistikler */}
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl rounded-3xl transition-colors duration-300`}>
                        <div className="px-6 py-8">
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                <span className="text-2xl mr-3">📋</span>
                                Detaylı İstatistikler
                            </h3>

                            {performance ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                            🟢 Toplam Alış
                                        </dt>
                                        <dd className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {performance.total_buy}
                                        </dd>
                                    </div>

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                            🔴 Toplam Satış
                                        </dt>
                                        <dd className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {performance.total_sell}
                                        </dd>
                                    </div>

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                            💼 Toplam Volume
                                        </dt>
                                        <dd className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {performance.total_pnl?.toFixed(2)} USDT
                                        </dd>
                                    </div>

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                            📅 Son Trade
                                        </dt>
                                        <dd className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {performance.last_trade
                                                ? new Date(performance.last_trade).toLocaleDateString('tr-TR')
                                                : 'Henüz yok'
                                            }
                                        </dd>
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-12 text-center`}>
                                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-4xl">📊</span>
                                    </div>
                                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Henüz performans verisi yok</h3>
                                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Bu bot henüz hiç trade yapmamış, bu nedenle performans analizi mevcut değil.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Geri Dön */}
                    <div className="mt-8">
                        <Link
                            to={`/bots/${id}`}
                            className={`inline-flex items-center px-6 py-3 border rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${isDark
                                ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Bot Detayına Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BotPerformance
