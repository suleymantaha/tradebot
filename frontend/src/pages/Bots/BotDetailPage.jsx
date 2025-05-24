import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { botConfigAPI, botStateAPI, botRunnerAPI, apiKeyAPI } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'

const BotDetailPage = () => {
    const { isDark } = useTheme()
    const { id } = useParams()
    const navigate = useNavigate()
    const [bot, setBot] = useState(null)
    const [botState, setBotState] = useState(null)
    const [balance, setBalance] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const fetchBotData = async () => {
        try {
            const [botResponse, stateResponse, balanceResponse] = await Promise.all([
                botConfigAPI.getById(id),
                botStateAPI.getById(id).catch(() => null), // Bot state yoksa hata verme
                apiKeyAPI.getBalance().catch(() => null), // Bakiye yoksa hata verme
            ])

            setBot(botResponse.data)
            setBotState(stateResponse?.data || null)
            setBalance(balanceResponse?.data || null)
        } catch (err) {
            if (err.response?.status === 404) {
                navigate('/dashboard')
            } else {
                setError('Bot bilgileri yüklenirken hata oluştu')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBotData()
    }, [id])

    const handleStartBot = async () => {
        setActionLoading(true)
        setError('')
        setSuccess('')

        try {
            await botRunnerAPI.start(id)
            setSuccess('Bot başarıyla başlatıldı!')
            await fetchBotData() // Verileri yenile
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Bot başlatılırken bir hata oluştu.'
            )
        } finally {
            setActionLoading(false)
        }
    }

    const handleStopBot = async () => {
        setActionLoading(true)
        setError('')
        setSuccess('')

        try {
            await botRunnerAPI.stop(id)
            setSuccess('Bot başarıyla durduruldu!')
            await fetchBotData() // Verileri yenile
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Bot durdurulurken bir hata oluştu.'
            )
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteBot = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true)
            return
        }

        setActionLoading(true)
        setError('')
        setSuccess('')

        try {
            // Önce bot'u durdur
            if (bot.is_active) {
                await botRunnerAPI.stop(id)
            }

            // Sonra sil
            await botConfigAPI.delete(id)
            setSuccess('Bot başarıyla silindi! Ana sayfaya yönlendiriliyorsunuz...')

            // 2 saniye sonra dashboard'a yönlendir
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Bot silinirken bir hata oluştu.'
            )
        } finally {
            setActionLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800'

        const statusLower = status.toLowerCase()
        if (statusLower.includes('running')) {
            return 'bg-green-100 text-green-800'
        } else if (statusLower.includes('stopped')) {
            return 'bg-gray-100 text-gray-800'
        } else if (statusLower.includes('error')) {
            return 'bg-red-100 text-red-800'
        } else if (statusLower.includes('waiting')) {
            return 'bg-yellow-100 text-yellow-800'
        } else if (statusLower.includes('pending')) {
            return 'bg-blue-100 text-blue-800'
        } else {
            return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status) => {
        if (!status) return 'Bilinmiyor'

        const statusLower = status.toLowerCase()
        if (statusLower.includes('running')) {
            if (statusLower.includes('demo')) {
                return 'Çalışıyor (Demo)'
            }
            return 'Çalışıyor'
        } else if (statusLower.includes('stopped')) {
            return 'Durdurulmuş'
        } else if (statusLower.includes('error')) {
            return 'Hata'
        } else if (statusLower.includes('waiting')) {
            if (statusLower.includes('no signal')) {
                return 'Sinyal Bekliyor'
            } else if (statusLower.includes('demo')) {
                return 'Bekliyor (Demo)'
            }
            return 'Bekliyor'
        } else if (statusLower.includes('pending')) {
            return 'Başlatılıyor'
        } else {
            return status // Orijinal status'u göster
        }
    }

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

    if (!bot) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'} transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 text-center transition-colors duration-300`}>
                        <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">❌</span>
                        </div>
                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Bot bulunamadı</h3>
                        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                            Aradığınız bot mevcut değil veya erişim izniniz bulunmuyor.
                        </p>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard'a Dön
                        </Link>
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
                        <div className="flex items-center justify-between">
                            <div>
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
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{bot.name}</span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>
                                <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.name}</h1>
                                <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {bot.description || 'Bot açıklaması yok'}
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                {bot.is_active ? (
                                    <button
                                        onClick={handleStopBot}
                                        disabled={actionLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? 'Duruyor...' : 'Botu Durdur'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartBot}
                                        disabled={actionLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? 'Başlatılıyor...' : 'Botu Başlat'}
                                    </button>
                                )}

                                <Link
                                    to={`/bots/${id}/edit`}
                                    className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Düzenle
                                </Link>

                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={actionLoading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Alert Messages */}
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

                    {success && (
                        <div className={`mb-6 px-4 py-3 rounded-2xl ${isDark
                            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800 text-green-300'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700'
                            }`}>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {success}
                            </div>
                        </div>
                    )}

                    {/* Bot Info Cards */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                        {/* Bot Configuration */}
                        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow-2xl rounded-3xl transition-colors duration-300`}>
                            <div className="px-6 py-8">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                    <span className="text-2xl mr-3">⚙️</span>
                                    Bot Konfigürasyonu
                                </h3>

                                <dl className="space-y-4">
                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>📈 Trading Çifti</dt>
                                        <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} font-mono font-bold`}>{bot.symbol}</dd>
                                    </div>

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>🎯 Strateji</dt>
                                        <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} capitalize font-bold`}>{bot.strategy}</dd>
                                    </div>

                                    {bot.ema_period && (
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>📊 EMA Periyodu</dt>
                                            <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>{bot.ema_period}</dd>
                                        </div>
                                    )}

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>🔄 Durum</dt>
                                        <dd>
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${bot.is_active
                                                    ? `${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`
                                                    : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`
                                                    }`}
                                            >
                                                {bot.is_active ? '🟢 Aktif' : '⚪ Pasif'}
                                            </span>
                                        </dd>
                                    </div>

                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>📅 Oluşturulma Tarihi</dt>
                                        <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
                                            {new Date(bot.created_at).toLocaleString('tr-TR')}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Bot State */}
                        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden shadow-2xl rounded-3xl transition-colors duration-300`}>
                            <div className="px-6 py-8">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                    <span className="text-2xl mr-3">📊</span>
                                    Bot Durumu
                                </h3>

                                {botState ? (
                                    <dl className="space-y-4">
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>⚡ Çalışma Durumu</dt>
                                            <dd>
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(botState.status)}`}
                                                >
                                                    {getStatusText(botState.status)}
                                                </span>
                                            </dd>
                                        </div>

                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>🕒 Son Güncelleme</dt>
                                            <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
                                                {botState.last_updated_at ? new Date(botState.last_updated_at).toLocaleString('tr-TR') : 'Henüz güncellenmedi'}
                                            </dd>
                                        </div>

                                        {botState.current_position && (
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>💼 Mevcut Pozisyon</dt>
                                                <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
                                                    {botState.current_position}
                                                </dd>
                                            </div>
                                        )}

                                        {botState.daily_pnl !== null && (
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>💰 Günlük PnL</dt>
                                                <dd className={`text-sm font-bold ${botState.daily_pnl >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {botState.daily_pnl >= 0 ? '+' : ''}{botState.daily_pnl} USDT
                                                </dd>
                                            </div>
                                        )}

                                        {balance && (
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>💳 Mevcut Bakiye</dt>
                                                <dd className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {balance.demo_mode && (
                                                        <div className={`mb-3 p-3 rounded-lg ${isDark
                                                            ? 'bg-yellow-900/30 border border-yellow-800 text-yellow-300'
                                                            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                                                            }`}>
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="text-xs font-semibold">DEMO VERİLER</span>
                                                            </div>
                                                            <p className="text-xs mt-1">
                                                                Gerçek API anahtarı bulunamadı. Demo bakiye gösteriliyor.
                                                            </p>
                                                            <p className="text-xs mt-1">
                                                                Gerçek bakiye için geçerli Binance API anahtarları eklemelisiniz.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {bot.position_type === 'futures' ? (
                                                        <div>
                                                            <div className="font-bold text-blue-600">
                                                                {balance.futures_balance?.toFixed(2)} USDT
                                                            </div>
                                                            <div className="text-xs mt-1">
                                                                Futures {balance.demo_mode && '(Demo)'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-purple-600">
                                                                {balance.spot_balance?.toFixed(2)} USDT
                                                            </div>
                                                            <div className="text-xs mt-1">
                                                                Spot {balance.demo_mode && '(Demo)'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Toplam: {balance.total_balance?.toFixed(2)} USDT
                                                        {balance.demo_mode && ' (Demo)'}
                                                    </div>

                                                    {balance.demo_mode && (
                                                        <div className="mt-3">
                                                            <Link
                                                                to="/api-keys"
                                                                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                                                            >
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                                Gerçek API Anahtarı Ekle
                                                            </Link>
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                ) : (
                                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}>
                                        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl">⏳</span>
                                        </div>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Bot henüz çalıştırılmamış. Bot durumu mevcut değil.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl rounded-3xl mb-8 transition-colors duration-300`}>
                        <div className="px-6 py-8">
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                <span className="text-2xl mr-3">⚡</span>
                                Hızlı İşlemler
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <Link
                                    to={`/bots/${id}/trades`}
                                    className={`inline-flex items-center justify-center px-6 py-4 border rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Trade Geçmişi
                                </Link>

                                <Link
                                    to={`/bots/${id}/performance`}
                                    className={`inline-flex items-center justify-center px-6 py-4 border rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Performans Raporu
                                </Link>

                                <button
                                    onClick={() => window.location.reload()}
                                    className={`inline-flex items-center justify-center px-6 py-4 border rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Yenile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Strategy Details */}
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl rounded-3xl transition-colors duration-300`}>
                        <div className="px-6 py-8">
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                <span className="text-2xl mr-3">🧠</span>
                                Strateji Detayları
                            </h3>

                            {bot.strategy === 'simple' && (
                                <div className={`p-6 rounded-2xl border ${isDark
                                    ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800'
                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                    }`}>
                                    <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                                        🎯 Basit Strateji
                                    </h4>
                                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Bu bot, fiyat 100 USDT'nin altına düştüğünde alış yapar.
                                        Bu basit bir örnek stratejidir ve gerçek trading için optimize edilmemiştir.
                                    </p>
                                </div>
                            )}

                            {bot.strategy === 'ema' && (
                                <div className={`p-6 rounded-2xl border ${isDark
                                    ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800'
                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                    }`}>
                                    <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                                        📈 EMA Stratejisi
                                    </h4>
                                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'} mb-4`}>
                                        Bu bot, {bot.ema_period || 9} periyotluk Exponential Moving Average (EMA) kullanarak
                                        alım-satım kararları verir. Fiyat EMA'nın üzerindeyse alış, altındaysa satış yapar.
                                    </p>

                                    {(bot.ema_fast || bot.ema_slow) && (
                                        <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/50'}`}>
                                            <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                📊 EMA Parametreleri:
                                            </h5>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {bot.ema_fast && (
                                                    <div>
                                                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hızlı EMA: </span>
                                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.ema_fast}</span>
                                                    </div>
                                                )}
                                                {bot.ema_slow && (
                                                    <div>
                                                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Yavaş EMA: </span>
                                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.ema_slow}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(bot.stop_loss_perc || bot.take_profit_perc) && (
                                <div className={`mt-6 p-6 rounded-2xl border ${isDark
                                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800'
                                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                    }`}>
                                    <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-green-400' : 'text-green-800'}`}>
                                        🛡️ Risk Yönetimi
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        {bot.stop_loss_perc && (
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/50'}`}>
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>🛑 Stop Loss: </span>
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.stop_loss_perc}%</span>
                                            </div>
                                        )}
                                        {bot.take_profit_perc && (
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/50'}`}>
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>🎯 Take Profit: </span>
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.take_profit_perc}%</span>
                                            </div>
                                        )}
                                        {bot.trailing_stop_perc && (
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/50'}`}>
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>📊 Trailing Stop: </span>
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bot.trailing_stop_perc}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full mx-4 transition-colors duration-300`}>
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className="mx-auto h-20 w-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                                    Bot'u Sil
                                </h3>
                                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
                                    <strong className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{bot?.name}</strong> adlı bot'u kalıcı olarak silmek istediğinizden emin misiniz?
                                </p>
                                <p className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                                    Bu işlem geri alınamaz. Bot'un tüm verileri silinecektir.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={actionLoading}
                                    className={`flex-1 px-6 py-3 border rounded-2xl font-semibold transition-all duration-200 ${isDark
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDeleteBot}
                                    disabled={actionLoading}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-red-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Siliniyor...
                                        </div>
                                    ) : (
                                        'Evet, Sil'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BotDetailPage
