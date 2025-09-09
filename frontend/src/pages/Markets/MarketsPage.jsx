import React, { useEffect, useRef, useState, useCallback } from 'react'
import { symbolsAPI } from '../../services/api'
import MarketsErrorBoundary from '../../components/ErrorBoundary/MarketsErrorBoundary'
import { ComponentStateProvider, useComponentState } from '../../components/Markets/ComponentStateManager'
import TradingViewLoader from '../../components/Markets/TradingViewLoader'
import SymbolsLoader from '../../components/Markets/SymbolsLoader'
import WebSocketManager from '../../components/Markets/WebSocketManager'
import MarketInfo from '../../components/Markets/MarketInfo'
import DebugPanel from '../../components/Markets/DebugPanel'
import {
    LoadingSkeleton,
    StatusIndicator,
    ErrorAlert,
    ChartPlaceholder,
    DataPlaceholder,
    ConnectionStatus,
    RetryButton
} from '../../components/Markets/FallbackComponents'

const DEFAULT = { tvSymbol: 'BINANCE:BTCUSDT', base: 'BTC', quote: 'USDT' }

// Enhanced Markets Page Component with Error Resilience
const MarketsPageContent = () => {
    const { state, actions, computed } = useComponentState()

    // Core page state
    const [base, setBase] = useState(DEFAULT.base)
    const [quote, setQuote] = useState(DEFAULT.quote)
    const [interval, setInterval] = useState('60')

    // Data state
    const [allSymbols, setAllSymbols] = useState([])
    const [search, setSearch] = useState('')
    const [watchOpen, setWatchOpen] = useState(true)

    // Real-time data state
    const [binanceTicker, setBinanceTicker] = useState(null)
    const [coinbaseTicker, setCoinbaseTicker] = useState(null)
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
    const [trades, setTrades] = useState([])

    // Debug state
    const [debugConnectionStates, setDebugConnectionStates] = useState({})
    const [debugConnectionStats, setDebugConnectionStats] = useState({})

    // UI state
    const [favorites, setFavorites] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_favorites')
            return raw ? JSON.parse(raw) : ['BTCUSDT', 'ETHUSDT']
        } catch { return ['BTCUSDT', 'ETHUSDT'] }
    })

    const [watchlist, setWatchlist] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_watchlist')
            return raw ? JSON.parse(raw) : []
        } catch { return [] }
    })

    // Event handlers for real-time data
    const handleTickerUpdate = useCallback((provider, data) => {
        if (provider === 'binance') {
            setBinanceTicker(data)
        } else if (provider === 'coinbase') {
            setCoinbaseTicker(data)
        }
    }, [])

    const handleDepthUpdate = useCallback((provider, data) => {
        if (provider === 'binance') {
            // Validate data structure before setting
            if (data && typeof data === 'object' && Array.isArray(data.bids) && Array.isArray(data.asks)) {
                setOrderBook(data)
            } else {
                console.warn('Invalid order book data received:', data)
            }
        }
    }, [])

    const handleTradeUpdate = useCallback((provider, trade) => {
        if (provider === 'binance') {
            // Validate trade structure
            if (trade && typeof trade === 'object' &&
                Number.isFinite(trade.price) && Number.isFinite(trade.qty) &&
                trade.side && Number.isFinite(trade.ts)) {
                setTrades(prev => {
                    const newTrades = [trade, ...prev].slice(0, 50)
                    return newTrades
                })
            } else {
                console.warn('Invalid trade data received:', trade)
            }
        }
    }, [])

    const handleConnectionChange = useCallback((connectionId, state, stats) => {
        console.log(`Connection ${connectionId} changed to ${state}`, stats)

        // Log current data state for debugging
        if (state === 'connected') {
            console.log(`Data state when ${connectionId} connected:`, {
                orderBookSize: `${orderBook.bids.length} bids, ${orderBook.asks.length} asks`,
                tradesCount: trades.length,
                symbol: `${base}${quote}`
            })
        }
    }, [orderBook, trades, base, quote])

    // Symbol management
    const handleSymbolsLoaded = useCallback((symbols, source) => {
        setAllSymbols(symbols)
        console.log(`Symbols loaded from ${source}:`, symbols.length)
    }, [])

    const handleSymbolsError = useCallback((error) => {
        console.error('Symbols loading error:', error)
    }, [])

    // Save lists to localStorage with error handling
    useEffect(() => {
        try {
            localStorage.setItem('markets_favorites', JSON.stringify(favorites))
        } catch (error) {
            console.warn('Failed to save favorites to localStorage:', error)
        }
    }, [favorites])

    useEffect(() => {
        try {
            localStorage.setItem('markets_watchlist', JSON.stringify(watchlist))
        } catch (error) {
            console.warn('Failed to save watchlist to localStorage:', error)
        }
    }, [watchlist])

    // Utility functions
    const toTvSymbol = (base, quote) => `BINANCE:${base}${quote}`

    // Symbol selection function - THIS IS THE KEY FIX
    const setSymbol = useCallback((newBase, newQuote) => {
        console.log(`Switching to symbol: ${newBase}/${newQuote}`)
        setBase(newBase)
        setQuote(newQuote)

        // Clear existing real-time data when switching symbols
        setBinanceTicker(null)
        setCoinbaseTicker(null)
        setOrderBook({ bids: [], asks: [] })
        setTrades([])
    }, [])

    const isFav = (pair) => favorites.includes(pair)
    const toggleFav = (pair) => setFavorites(prev => isFav(pair) ? prev.filter(p => p !== pair) : [...prev, pair])
    const fmt = (v, d = 2) => (v == null ? '-' : Number(v).toLocaleString('tr-TR', { maximumFractionDigits: d }))

    const combinedPrice = () => {
        const bin = binanceTicker?.c ? parseFloat(binanceTicker.c) : null
        const cb = coinbaseTicker?.price ? parseFloat(coinbaseTicker.price) : null
        return { bin, cb }
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <SymbolsLoader
                onSymbolsLoaded={handleSymbolsLoaded}
                onError={handleSymbolsError}
            >
                {({ symbols, loading, error, dataSource, statusIndicator, errorIndicator }) => (
                    <>
                        {/* Top controls with enhanced status */}
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Piyasalar</h2>
                                    <StatusIndicator
                                        status={computed.getOverallStatus()}
                                        label="Durum"
                                        retryCount={state.ui.retryCount}
                                    />
                                    {statusIndicator}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Gelişmiş hata toleranslı piyasa verileri
                                    {error && <span className="text-orange-500 ml-2">({error})</span>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    className="px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                >
                                    {['1', '5', '15', '30', '60', '120', '240', '1D'].map(iv => (
                                        <option key={iv} value={iv}>{iv}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {errorIndicator}

                        {/* Enhanced Grid with resilient components */}
                        <div className="grid grid-cols-12 gap-4">
                            {/* Watchlist Column */}
                            <div className="col-span-12 md:col-span-2 space-y-4">
                                {/* Favorites */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-gray-800 dark:text-gray-200">Favoriler</div>
                                        <button onClick={() => setFavorites([])} className="text-xs text-indigo-500">Temizle</button>
                                    </div>
                                    {loading ? (
                                        <LoadingSkeleton rows={2} />
                                    ) : favorites.length === 0 ? (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Favori yok.</div>
                                    ) : (
                                        <div className="space-y-1 max-h-[24vh] overflow-y-auto">
                                            {favorites.map(pair => {
                                                const s = symbols.find(x => x.symbol === pair)
                                                if (!s) return null
                                                const active = `${base}${quote}` === pair
                                                return (
                                                    <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                                        <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className="text-sm text-yellow-400">★</button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Watchlist */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <button onClick={() => setWatchOpen(v => !v)} className="font-semibold text-gray-800 dark:text-gray-200">
                                            İzleme Listesi {watchOpen ? '▼' : '▲'}
                                        </button>
                                    </div>
                                    {watchOpen && (
                                        <>
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Ara..."
                                                className="w-full mb-2 px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 text-sm"
                                            />
                                            {loading ? (
                                                <LoadingSkeleton rows={5} />
                                            ) : (
                                                <div className="space-y-1 max-h-[32vh] overflow-y-auto">
                                                    {symbols
                                                        .filter(s => s.symbol.endsWith('USDT'))
                                                        .filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()))
                                                        .slice(0, 100)
                                                        .map(s => {
                                                            const pair = s.symbol
                                                            const active = `${base}${quote}` === pair
                                                            return (
                                                                <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                    }`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                                                    <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className={`text-sm ${isFav(pair) ? 'text-yellow-400' : 'text-gray-400'}`}>★</button>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Chart Section with Information Panel */}
                            <div className="col-span-12 md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                                {/* Chart Header with Symbol Info */}
                                <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{base}/{quote}</div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {(() => {
                                                const p = combinedPrice()
                                                const binancePrice = p.bin
                                                const coinbasePrice = p.cb
                                                const change24h = binanceTicker?.P ? parseFloat(binanceTicker.P) : 0
                                                return (
                                                    <>
                                                        <span className="text-gray-600 dark:text-gray-300">
                                                            Fiyat: <b className={change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                                {fmt(binancePrice || coinbasePrice, 6)}
                                                            </b>
                                                        </span>
                                                        {change24h !== 0 && (
                                                            <span className={`text-sm px-2 py-1 rounded ${change24h >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                }`}>
                                                                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        {(() => {
                                            const p = combinedPrice()
                                            return (
                                                <>
                                                    <span className="text-gray-600 dark:text-gray-300">Binance: <b className="text-green-500">{fmt(p.bin, 6)}</b></span>
                                                    <span className="text-gray-600 dark:text-gray-300">Coinbase: <b className="text-blue-500">{fmt(p.cb, 6)}</b></span>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Market Information Panel */}
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {/* 24h High/Low */}
                                        <div className="space-y-1">
                                            <div className="text-gray-500 dark:text-gray-400">24s Yüksek/Düşük</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 dark:text-green-400">
                                                    {binanceTicker?.h ? fmt(parseFloat(binanceTicker.h), 6) : '-'}
                                                </span>
                                                <span className="text-gray-400">/</span>
                                                <span className="text-red-600 dark:text-red-400">
                                                    {binanceTicker?.l ? fmt(parseFloat(binanceTicker.l), 6) : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 24h Volume */}
                                        <div className="space-y-1">
                                            <div className="text-gray-500 dark:text-gray-400">24s Hacim</div>
                                            <div className="text-gray-800 dark:text-gray-200">
                                                {binanceTicker?.v ? fmt(parseFloat(binanceTicker.v), 0) + ' ' + base : '-'}
                                            </div>
                                        </div>

                                        {/* Quote Volume */}
                                        <div className="space-y-1">
                                            <div className="text-gray-500 dark:text-gray-400">24s Hacim ({quote})</div>
                                            <div className="text-gray-800 dark:text-gray-200">
                                                {binanceTicker?.q ? fmt(parseFloat(binanceTicker.q), 0) + ' ' + quote : '-'}
                                            </div>
                                        </div>

                                        {/* Number of Trades */}
                                        <div className="space-y-1">
                                            <div className="text-gray-500 dark:text-gray-400">24s İşlem</div>
                                            <div className="text-gray-800 dark:text-gray-200">
                                                {binanceTicker?.n ? fmt(parseFloat(binanceTicker.n), 0) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Container */}
                                <div style={{ height: '55vh' }}>
                                    <TradingViewLoader
                                        symbol={toTvSymbol(base, quote)}
                                        interval={interval}
                                        className="h-full w-full"
                                        key={`${base}${quote}-${interval}`}
                                    />
                                </div>

                                {/* Quick Trading Stats */}
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Spread: {orderBook.asks.length > 0 && orderBook.bids.length > 0 ?
                                                    fmt(parseFloat(orderBook.asks[0]?.price || 0) - parseFloat(orderBook.bids[0]?.price || 0), 8) :
                                                    '-'
                                                }
                                            </span>
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Son İşlem: {trades.length > 0 ? new Date(trades[0].ts).toLocaleTimeString('tr-TR') : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${binanceTicker ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {binanceTicker ? 'Canlı' : 'Bağlantı Bekleniyor'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced OrderBook, Trades and Market Info */}
                            <div className="col-span-12 md:col-span-3 space-y-4">
                                <WebSocketManager
                                    symbol={{ base, quote }}
                                    onTickerUpdate={handleTickerUpdate}
                                    onDepthUpdate={handleDepthUpdate}
                                    onTradeUpdate={handleTradeUpdate}
                                    onConnectionChange={handleConnectionChange}
                                    key={`${base}${quote}`}
                                >
                                    {({ statusIndicator, retryConnection, connectionStates, connectionStats }) => {
                                        // Update debug states
                                        setDebugConnectionStates(connectionStates || {})
                                        setDebugConnectionStats(connectionStats || {})

                                        return (
                                            <>
                                                {/* Connection Status */}
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">Bağlantı</span>
                                                        <RetryButton onRetry={retryConnection} size="xs" variant="outline" />
                                                    </div>
                                                    {statusIndicator}
                                                </div>

                                                {/* Market Information Panel */}
                                                <MarketInfo
                                                    symbol={`${base}${quote}`}
                                                    binanceTicker={binanceTicker}
                                                    coinbaseTicker={coinbaseTicker}
                                                    orderBook={orderBook}
                                                    trades={trades}
                                                />

                                                {/* Order Book */}
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                                                    <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">
                                                        Order Book
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({orderBook.bids.length + orderBook.asks.length} levels)
                                                        </span>
                                                    </div>
                                                    {orderBook.bids.length > 0 || orderBook.asks.length > 0 ? (
                                                        <div className="grid grid-cols-2 gap-0 text-xs">
                                                            <div className="p-2">
                                                                <div className="text-gray-500 mb-1 flex justify-between">
                                                                    <span>Bids</span>
                                                                    <span className="text-green-600">({orderBook.bids.length})</span>
                                                                </div>
                                                                {orderBook.bids.length > 0 ? (
                                                                    orderBook.bids.slice(0, 5).map((b, i) => (
                                                                        <div key={i} className="flex justify-between hover:bg-green-50 dark:hover:bg-green-900/20 px-1 py-0.5 rounded">
                                                                            <span className="text-green-500 font-mono">{fmt(b.price, 6)}</span>
                                                                            <span className="text-gray-500 font-mono">{fmt(b.qty, 4)}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-gray-400 text-center py-2">No bids</div>
                                                                )}
                                                            </div>
                                                            <div className="p-2">
                                                                <div className="text-gray-500 mb-1 flex justify-between">
                                                                    <span>Asks</span>
                                                                    <span className="text-red-600">({orderBook.asks.length})</span>
                                                                </div>
                                                                {orderBook.asks.length > 0 ? (
                                                                    orderBook.asks.slice(0, 5).map((a, i) => (
                                                                        <div key={i} className="flex justify-between hover:bg-red-50 dark:hover:bg-red-900/20 px-1 py-0.5 rounded">
                                                                            <span className="text-red-500 font-mono">{fmt(a.price, 6)}</span>
                                                                            <span className="text-gray-500 font-mono">{fmt(a.qty, 4)}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-gray-400 text-center py-2">No asks</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <DataPlaceholder title="Order Book Yükleniyor" className="h-32" />
                                                    )}
                                                </div>

                                                {/* Trade Tape */}
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                                                    <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">
                                                        Trade Tape
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({trades.length} trades)
                                                        </span>
                                                    </div>
                                                    {trades.length > 0 ? (
                                                        <div className="max-h-[20vh] overflow-y-auto text-xs">
                                                            {trades.slice(0, 20).map((t, idx) => {
                                                                const timeStr = new Date(t.ts).toLocaleTimeString('tr-TR', {
                                                                    hour12: false,
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit'
                                                                })
                                                                return (
                                                                    <div key={idx} className={`flex justify-between px-3 py-1 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${t.side === 'buy' ? 'hover:bg-green-50 dark:hover:bg-green-900/20' : 'hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                                                                        <span className={`font-mono ${t.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                                                            {fmt(t.price, 6)}
                                                                        </span>
                                                                        <span className="text-gray-500 font-mono">{fmt(t.qty, 4)}</span>
                                                                        <span className="text-gray-400 text-xs">{timeStr}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <DataPlaceholder title="Trades Yükleniyor" className="h-32" />
                                                    )}
                                                </div>
                                            </>
                                        )
                                    }}
                                </WebSocketManager>
                            </div>
                        </div>
                    </>
                )}
            </SymbolsLoader>

            {/* Debug Panel */}
            <DebugPanel
                symbol={{ base, quote }}
                orderBook={orderBook}
                trades={trades}
                binanceTicker={binanceTicker}
                connectionStates={debugConnectionStates}
                connectionStats={debugConnectionStats}
            />
        </div>
    )
}

// Main MarketsPage with providers
const MarketsPage = () => {
    return (
        <MarketsErrorBoundary>
            <ComponentStateProvider>
                <MarketsPageContent />
            </ComponentStateProvider>
        </MarketsErrorBoundary>
    )
}

export default MarketsPage
