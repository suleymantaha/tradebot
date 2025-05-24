import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { botConfigAPI, apiKeyAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'

const BotsPage = () => {
    const { isDark } = useTheme()
    const [bots, setBots] = useState([])
    const [apiKey, setApiKey] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
    const [sortBy, setSortBy] = useState('name') // name, created_at, symbol

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
                console.error('Botlar yüklenirken hata:', error)
                setError('Botlar yüklenirken bir hata oluştu')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredAndSortedBots = bots
        .filter(bot => {
            if (filterStatus === 'active') return bot.is_active
            if (filterStatus === 'inactive') return !bot.is_active
            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at)
                case 'symbol':
                    return a.symbol.localeCompare(b.symbol)
                case 'name':
                default:
                    return a.name.localeCompare(b.name)
            }
        })

    const activeBots = bots.filter(bot => bot.is_active).length
    const totalTrades = bots.reduce((sum, bot) => sum + (bot.total_trades || 0), 0)

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

    if (!apiKey) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
                <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 text-center transition-colors duration-300`}>
                        <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🔑</span>
                        </div>
                        <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                            API Anahtarı Gerekli
                        </h3>
                        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-md mx-auto`}>
                            Bot oluşturmak için öncelikle Binance API anahtarınızı eklemeniz gerekmektedir.
                        </p>
                        <Link
                            to="/api-keys"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            API Anahtarı Ekle
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6 float">
                        <span className="text-4xl">🤖</span>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Trading Botları
                    </h1>
                    <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                        Otomatik trading botlarınızı yönetin ve performanslarını takip edin
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl shadow-lg animate-fadeIn">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
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
                                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pasif Bot</p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bots.length - activeBots}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Bot Listesi
                            </h2>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {filteredAndSortedBots.length > 0
                                    ? `${filteredAndSortedBots.length} bot bulundu, ${activeBots} tanesi aktif`
                                    : 'Henüz bot oluşturmadınız'
                                }
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

                    {/* Filters and Sort */}
                    {bots.length > 0 && (
                        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-8 transition-colors duration-300`}>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                        Durum Filtresi
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500'
                                            : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                                            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200`}
                                    >
                                        <option value="all">Tüm Botlar</option>
                                        <option value="active">Aktif Botlar</option>
                                        <option value="inactive">Pasif Botlar</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                        Sıralama
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500'
                                            : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                                            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200`}
                                    >
                                        <option value="name">İsme Göre</option>
                                        <option value="created_at">Tarihe Göre</option>
                                        <option value="symbol">Trading Çiftine Göre</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bots Grid */}
                {filteredAndSortedBots.length === 0 ? (
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 text-center card-hover transition-colors duration-300`}>
                        <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🤖</span>
                        </div>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                            {bots.length === 0 ? 'İlk Botunuzu Oluşturun! 🚀' : 'Filtreye Uygun Bot Bulunamadı'}
                        </h3>
                        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-md mx-auto`}>
                            {bots.length === 0
                                ? 'Gelişmiş trading botları ile otomatik alım satım yapmaya başlayın. Teknik analiz ve risk yönetimi ile profesyonel trading.'
                                : 'Mevcut filtre ayarlarına uygun bot bulunamadı. Filtre ayarlarınızı değiştirmeyi deneyin.'
                            }
                        </p>
                        {bots.length === 0 && (
                            <Link
                                to="/bots/create"
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                İlk Botunuzu Oluşturun
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedBots.map((bot, index) => (
                            <div
                                key={bot.id}
                                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden card-hover animate-fadeIn transition-colors duration-300`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bot.is_active
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                            }`}>
                                            <span className="text-2xl">🤖</span>
                                        </div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${bot.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {bot.is_active ? '🟢 Aktif' : '⚪ Pasif'}
                                        </span>
                                    </div>

                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                                        {bot.name}
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Trading Çifti:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} font-mono`}>{bot.symbol}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Strateji:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>{bot.strategy}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zaman Dilimi:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.timeframe}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Oluşturma:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {new Date(bot.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
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
    )
}

export default BotsPage
