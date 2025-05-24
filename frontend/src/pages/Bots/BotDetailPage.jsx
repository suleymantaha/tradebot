import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { botConfigAPI, botStateAPI, botRunnerAPI } from '../../services/api'

const BotDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [bot, setBot] = useState(null)
    const [botState, setBotState] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchBotData = async () => {
        try {
            const [botResponse, stateResponse] = await Promise.all([
                botConfigAPI.getById(id),
                botStateAPI.getById(id).catch(() => null), // Bot state yoksa hata verme
            ])

            setBot(botResponse.data)
            setBotState(stateResponse?.data || null)
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'running':
                return 'bg-green-100 text-green-800'
            case 'stopped':
                return 'bg-gray-100 text-gray-800'
            case 'error':
                return 'bg-red-100 text-red-800'
            case 'waiting':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'running':
                return 'Çalışıyor'
            case 'stopped':
                return 'Durdurulmuş'
            case 'error':
                return 'Hata'
            case 'waiting':
                return 'Bekliyor'
            default:
                return 'Bilinmiyor'
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    if (!bot) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">Bot bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aradığınız bot mevcut değil veya erişim izniniz bulunmuyor.
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Dashboard'a Dön
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                    <li>
                                        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-gray-500">{bot.name}</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                            <h1 className="mt-2 text-3xl font-bold text-gray-900">{bot.name}</h1>
                            <p className="mt-1 text-sm text-gray-600">
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
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Düzenle
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                {/* Bot Info Cards */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                    {/* Bot Configuration */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Bot Konfigürasyonu
                            </h3>

                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Trading Çifti</dt>
                                    <dd className="text-sm text-gray-900 font-mono">{bot.symbol}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Strateji</dt>
                                    <dd className="text-sm text-gray-900 capitalize">{bot.strategy}</dd>
                                </div>

                                {bot.ema_period && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">EMA Periyodu</dt>
                                        <dd className="text-sm text-gray-900">{bot.ema_period}</dd>
                                    </div>
                                )}

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Durum</dt>
                                    <dd>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {bot.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                                    <dd className="text-sm text-gray-900">
                                        {new Date(bot.created_at).toLocaleString('tr-TR')}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Bot State */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Bot Durumu
                            </h3>

                            {botState ? (
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Çalışma Durumu</dt>
                                        <dd>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(botState.status)}`}
                                            >
                                                {getStatusText(botState.status)}
                                            </span>
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Son Güncelleme</dt>
                                        <dd className="text-sm text-gray-900">
                                            {new Date(botState.updated_at).toLocaleString('tr-TR')}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Bot henüz çalıştırılmamış. Bot durumu mevcut değil.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Hızlı İşlemler
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Link
                                to={`/bots/${id}/trades`}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Trade Geçmişi
                            </Link>

                            <Link
                                to={`/bots/${id}/performance`}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Performans Raporu
                            </Link>

                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Yenile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Strategy Details */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Strateji Detayları
                        </h3>

                        {bot.strategy === 'simple' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="text-sm font-medium text-blue-800">Basit Strateji</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                    Bu bot, fiyat 100 USDT'nin altına düştüğünde alış yapar.
                                    Bu basit bir örnek stratejidir ve gerçek trading için optimize edilmemiştir.
                                </p>
                            </div>
                        )}

                        {bot.strategy === 'ema' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="text-sm font-medium text-blue-800">EMA Stratejisi</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                    Bu bot, {bot.ema_period || 9} periyotluk Exponential Moving Average (EMA) kullanarak
                                    alım-satım kararları verir. Fiyat EMA'nın üzerindeyse alış, altındaysa satış yapar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BotDetailPage
