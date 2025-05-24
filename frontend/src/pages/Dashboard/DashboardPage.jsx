import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { botConfigAPI, apiKeyAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'

const DashboardPage = () => {
    const { user } = useAuthStore()
    const { isDark } = useTheme()
    const [bots, setBots] = useState([])
    const [apiKey, setApiKey] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const botsResponse = await botConfigAPI.getAll()
                setBots(botsResponse.data)

                try {
                    const apiKeyResponse = await apiKeyAPI.getMe()
                    setApiKey(apiKeyResponse.data)
                } catch (err) {
                    setApiKey(null)
                }
            } catch (error) {
                console.error('Dashboard verileri yüklenirken hata:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} flex items-center justify-center transition-colors duration-300`}>
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-3xl shadow-2xl transition-colors duration-300`}>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className={`mt-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center font-medium`}>Yükleniyor...</p>
                </div>
            </div>
        )
    }

    const activeBots = bots.filter(bot => bot.is_active).length
    const totalTrades = bots.reduce((sum, bot) => sum + (bot.total_trades || 0), 0)

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-12 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6 float">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Hoş Geldiniz!
                    </h1>
                    <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                        {user?.email} • Trading botlarınızı yönetin ve performanslarını takip edin
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 card-hover transition-colors duration-300`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam Bot</p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bots.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 card-hover transition-colors duration-300`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Aktif Bot</p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeBots}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 card-hover transition-colors duration-300`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam İşlem</p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalTrades}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 card-hover transition-colors duration-300`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${apiKey ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'
                                    }`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {apiKey ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        )}
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>API Durumu</p>
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{apiKey ? 'Bağlı' : 'Bağlı Değil'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Key Section */}
                <div className="mb-12">
                    <div className={`rounded-3xl shadow-2xl overflow-hidden ${apiKey
                        ? `${isDark ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`
                        : `${isDark ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'}`
                        } transition-colors duration-300`}>
                        <div className="px-8 py-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 ${apiKey ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        }`}>
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-bold mb-2 ${apiKey
                                            ? `${isDark ? 'text-green-300' : 'text-green-800'}`
                                            : `${isDark ? 'text-amber-300' : 'text-amber-800'}`
                                            }`}>
                                            Binance API Anahtarı
                                        </h3>
                                        <p className={`text-lg ${apiKey
                                            ? `${isDark ? 'text-green-400' : 'text-green-700'}`
                                            : `${isDark ? 'text-amber-400' : 'text-amber-700'}`
                                            }`}>
                                            {apiKey
                                                ? `✅ API anahtarı başarıyla bağlandı`
                                                : '⚠️ Bot oluşturmak için API anahtarı gerekli'
                                            }
                                        </p>
                                        {apiKey && (
                                            <p className={`text-sm mt-1 ${isDark ? 'text-green-500' : 'text-green-600'}`}>
                                                Anahtar: {apiKey.api_key_masked}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    {apiKey ? (
                                        <Link
                                            to="/api-keys"
                                            className={`inline-flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                                                ? 'bg-gray-700 text-green-400 hover:bg-gray-600'
                                                : 'bg-white text-green-700 hover:bg-green-50'
                                                }`}
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Yönet
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/api-keys"
                                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-semibold hover:from-amber-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            API Anahtarı Ekle
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bots Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Trading Botları
                            </h2>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {bots.length > 0 ? `${bots.length} bot bulundu, ${activeBots} tanesi aktif` : 'Henüz bot oluşturmadınız'}
                            </p>
                        </div>
                        <Link
                            to="/bots/create"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl pulse-on-hover"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Yeni Bot Oluştur
                        </Link>
                    </div>

                    {bots.length === 0 ? (
                        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 text-center card-hover transition-colors duration-300`}>
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-100 to-purple-100'}`}>
                                <svg className={`w-12 h-12 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                İlk Botunuzu Oluşturun! 🚀
                            </h3>
                            <p className={`text-lg mb-8 max-w-md mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Gelişmiş trading botları ile otomatik alım satım yapmaya başlayın. Teknik analiz ve risk yönetimi ile profesyonel trading.
                            </p>
                            <Link
                                to="/bots/create"
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                İlk Botunuzu Oluşturun
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {bots.map((bot, index) => (
                                <div
                                    key={bot.id}
                                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden card-hover animate-fadeIn transition-colors duration-300`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bot.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                                }`}>
                                                <span className="text-2xl">🤖</span>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${bot.is_active
                                                ? `${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`
                                                : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`
                                                }`}>
                                                {bot.is_active ? '🟢 Aktif' : '⚪ Pasif'}
                                            </span>
                                        </div>

                                        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {bot.name}
                                        </h3>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>📈 Sembol:</span>
                                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} font-mono`}>{bot.symbol}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>🎯 Strateji:</span>
                                                <span className={`text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.strategy}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>⏰ Zaman Dilimi:</span>
                                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.timeframe}</span>
                                            </div>
                                            {bot.position_type && (
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>💼 Tip:</span>
                                                    <span className={`text-sm font-bold ${bot.position_type === 'futures' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                        {bot.position_type === 'futures' ? '⚡ Futures' : '🏦 Spot'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            to={`/bots/${bot.id}`}
                                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Detayları Görüntüle
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
