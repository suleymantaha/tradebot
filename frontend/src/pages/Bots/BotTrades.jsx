import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import apiServiceInstance from '../../services/api' // Import the ApiService instance
import useAuthStore from '../../store/authStore' // useAuthStore'u import et

const BotTrades = () => {
    const { isDark } = useTheme()
    const { id } = useParams()
    const [bot, setBot] = useState(null)
    const [trades, setTrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    console.log('[BotTrades] Component rendered, isAuthenticated from store:', isAuthenticated);

    useEffect(() => {
        console.log('[BotTrades] useEffect triggered, id:', id, 'isAuthenticated:', isAuthenticated);

        const fetchData = async () => {
            console.log('[BotTrades] fetchData called, isAuthenticated check:', isAuthenticated);
            if (!isAuthenticated) {
                console.log('[BotTrades] Not authenticated, skipping API calls.');
                setLoading(false)
                setError('Lütfen giriş yapınız.')
                setTrades([])
                return
            }
            setLoading(true)
            console.log('[BotTrades] Attempting to fetch bot and trades data...')
            try {
                const botData = await apiServiceInstance.get(`/api/v1/bot-configs/${id}`)
                console.log('[BotTrades] Bot data fetched:', botData)
                setBot(botData)

                const tradesData = await apiServiceInstance.get(`/api/v1/bots/${id}/trades`)
                console.log('[BotTrades] Trades data fetched:', tradesData)
                setTrades(tradesData || [])
                setError('')

            } catch (err) {
                console.error("[BotTrades] Error in fetchData:", err)
                setError('Trade verileri yüklenirken hata oluştu.')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, isAuthenticated])

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
                                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Trade Geçmişi</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Trade Geçmişi</h1>
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {bot?.name} bot'unun trade geçmişi
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

                    {/* Trades Table */}
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl rounded-3xl overflow-hidden transition-colors duration-300`}>
                        <div className="px-6 py-8">
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                                <span className="text-2xl mr-3">📊</span>
                                Trade Listesi
                            </h3>

                            {trades.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <tr>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    Tarih
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    Sembol
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    Taraf
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    Fiyat
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    Miktar
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                                    PnL
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                            {trades.map((trade, index) => (
                                                <tr key={index} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                                        {new Date(trade.timestamp).toLocaleString('tr-TR')}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {trade.symbol}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${trade.side === 'BUY'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {trade.side}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                                        {parseFloat(trade.price).toFixed(2)} USDT
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                                        {parseFloat(trade.quantity_filled).toFixed(4)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.realized_pnl && trade.realized_pnl > 0
                                                            ? 'text-green-600'
                                                            : trade.realized_pnl && trade.realized_pnl < 0
                                                                ? 'text-red-600'
                                                                : isDark ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                        {trade.realized_pnl ?
                                                            `${trade.realized_pnl > 0 ? '+' : ''}${parseFloat(trade.realized_pnl).toFixed(2)} USDT`
                                                            : '-'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={`p-12 text-center`}>
                                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-4xl">📊</span>
                                    </div>
                                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Henüz trade yok</h3>
                                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Bu bot henüz hiç trade yapmamış.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Back to Bot Detail Button */}
                    <div className="mt-8 text-center">
                        <Link
                            to={`/bots/${id}`}
                            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm ${
                                isDark 
                                    ? 'text-indigo-300 bg-indigo-700 hover:bg-indigo-800 focus:ring-indigo-500' 
                                    : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300`}
                        >
                            <svg className="w-5 h-5 mr-2 -ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Bot Detay Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BotTrades
