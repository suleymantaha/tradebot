import React from 'react'

const MarketInfo = ({
    symbol,
    binanceTicker,
    coinbaseTicker,
    orderBook,
    trades
}) => {
    const formatNumber = (value, decimals = 2) => {
        if (!value) return '-'
        return Number(value).toLocaleString('tr-TR', {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        })
    }

    const formatVolume = (value) => {
        if (!value) return '-'
        const num = parseFloat(value)
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
        return num.toFixed(2)
    }

    const calculateSpread = () => {
        if (!orderBook.asks?.length || !orderBook.bids?.length) return 0
        const bestAsk = parseFloat(orderBook.asks[0].price)
        const bestBid = parseFloat(orderBook.bids[0].price)
        return ((bestAsk - bestBid) / bestBid * 100).toFixed(4)
    }

    const getMarketSentiment = () => {
        if (!trades.length) return { sentiment: 'neutral', buyRatio: 50 }

        const recentTrades = trades.slice(0, 20)
        const buyTrades = recentTrades.filter(t => t.side === 'buy').length
        const buyRatio = (buyTrades / recentTrades.length) * 100

        let sentiment = 'neutral'
        if (buyRatio > 60) sentiment = 'bullish'
        else if (buyRatio < 40) sentiment = 'bearish'

        return { sentiment, buyRatio: buyRatio.toFixed(1) }
    }

    const priceChange = binanceTicker?.P ? parseFloat(binanceTicker.P) : 0
    const volume24h = binanceTicker?.v ? parseFloat(binanceTicker.v) : 0
    const quoteVolume24h = binanceTicker?.q ? parseFloat(binanceTicker.q) : 0
    const tradeCount24h = binanceTicker?.n ? parseFloat(binanceTicker.n) : 0
    const { sentiment, buyRatio } = getMarketSentiment()

    return (
        <div className="space-y-4">
            {/* Price and Change Information */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">24s Değişim</div>
                            <div className={`text-xl font-bold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </div>
                        </div>
                        <div className={`p-2 rounded-full ${priceChange >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                            <svg className={`w-6 h-6 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                {priceChange >= 0 ? (
                                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                )}
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">24s Hacim</div>
                            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {formatVolume(volume24h)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatVolume(quoteVolume24h)} USDT
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Depth and Spread */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Piyasa Derinliği</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Spread: {calculateSpread()}%
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">En İyi Alış</div>
                        <div className="text-green-500 font-mono">
                            {orderBook.bids?.length > 0 ? formatNumber(orderBook.bids[0].price, 6) : '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {orderBook.bids?.length > 0 ? formatVolume(orderBook.bids[0].qty) : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">En İyi Satış</div>
                        <div className="text-red-500 font-mono">
                            {orderBook.asks?.length > 0 ? formatNumber(orderBook.asks[0].price, 6) : '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {orderBook.asks?.length > 0 ? formatVolume(orderBook.asks[0].qty) : '-'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Sentiment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Piyasa Duyarlılığı</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentiment === 'bullish' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            sentiment === 'bearish' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {sentiment === 'bullish' ? 'Yükseliş' : sentiment === 'bearish' ? 'Düşüş' : 'Nötr'}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Alış/Satış Oranı</span>
                        <span className="text-gray-800 dark:text-gray-200">{buyRatio}% / {(100 - parseFloat(buyRatio)).toFixed(1)}%</span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${buyRatio}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>24s İşlem: {formatNumber(tradeCount24h, 0)}</span>
                        <span>Son {trades.length} işlem bazında</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketInfo
