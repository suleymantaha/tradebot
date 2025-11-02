import React, { useEffect, useRef, useState } from 'react'
import { symbolsAPI } from '../../services/api'

const DEFAULT = { tvSymbol: 'BINANCE:BTCUSDT', base: 'BTC', quote: 'USDT' }

const presetStudies = {
    basic: ['RSI@tv-basicstudies'],
    trend: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BollingerBandsR@tv-basicstudies'],
    momentum: ['MACD@tv-basicstudies']
}

// Varsayılan küçük liste (ilk yüklemede gösterim için)
const symbolsList = [
    { label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
    { label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
    { label: 'BNB/USDT', base: 'BNB', quote: 'USDT' },
    { label: 'SOL/USDT', base: 'SOL', quote: 'USDT' },
]

const toTvSymbol = (base, quote) => `BINANCE:${base}${quote}`
const toBinanceWsPair = (base, quote) => `${base}${quote}`.toLowerCase()
const toCoinbaseProduct = (base, quote) => `${base}-${quote}`

const MarketsPage = () => {
    const containerRef = useRef(null)
    const widgetRef = useRef(null)
    const chartRef = useRef(null)
    const [base, setBase] = useState(DEFAULT.base)
    const [quote, setQuote] = useState(DEFAULT.quote)
    const [interval, setInterval] = useState('60')
    const [preset, setPreset] = useState('trend')
    const [favorites, setFavorites] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_favorites')
            return raw ? JSON.parse(raw) : ['BTCUSDT', 'ETHUSDT']
        } catch { return ['BTCUSDT', 'ETHUSDT'] }
    })
    const [watchlist, setWatchlist] = useState(() => {
        try {
            const raw = localStorage.getItem('markets_watchlist')
            return raw ? JSON.parse(raw) : symbolsList.map(s => `${s.base}${s.quote}`)
        } catch { return symbolsList.map(s => `${s.base}${s.quote}`) }
    })
    const [allSymbols, setAllSymbols] = useState([]) // {symbol, baseAsset, quoteAsset}
    const [search, setSearch] = useState('')
    const [watchOpen, setWatchOpen] = useState(true)

    // Realtime states
    const [binanceTicker, setBinanceTicker] = useState(null)
    const [coinbaseTicker, setCoinbaseTicker] = useState(null)
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
    const [trades, setTrades] = useState([])

    // Save lists
    useEffect(() => {
        localStorage.setItem('markets_favorites', JSON.stringify(favorites))
    }, [favorites])
    useEffect(() => {
        localStorage.setItem('markets_watchlist', JSON.stringify(watchlist))
    }, [watchlist])

    const tvSymbol = toTvSymbol(base, quote)
    const binancePair = toBinanceWsPair(base, quote)
    const coinbaseProduct = toCoinbaseProduct(base, quote)

    // Dinamik semboller - backend üzerinden Binance
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data } = await symbolsAPI.getSpotSymbols()
                if (cancelled) return
                const mapped = (data || []).map(s => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }))
                setAllSymbols(mapped)
                // Watchlist'i mevcut sembollerle kesiştir
                setWatchlist(prev => prev.filter(p => mapped.find(m => m.symbol === p)))
            } catch (e) {
                console.error('Sembol yükleme hatası', e)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    // TradingView Widget
    useEffect(() => {
        const ensureScript = () => new Promise((resolve) => {
            // If already loaded via index.html or previous init
            if (window.TradingView) return resolve()

            const existingBySrc = document.querySelector('script[src*="tradingview.com/tv.js"]')
            if (existingBySrc) {
                const check = setInterval(() => {
                    if (window.TradingView) {
                        clearInterval(check)
                        resolve()
                    }
                }, 50)
                setTimeout(() => { clearInterval(check); resolve() }, 5000)
                return
            }

            const script = document.createElement('script')
            script.src = 'https://s3.tradingview.com/tv.js'
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => resolve()
            document.head.appendChild(script)
        })

        const createWidget = async () => {
            await ensureScript()
            if (!window.TradingView) return
            if (!containerRef.current) return
            // Clear previous content to avoid duplicate widgets
            try { containerRef.current.innerHTML = '' } catch { /* noop */ }
            widgetRef.current = new window.TradingView.widget({
                autosize: true,
                symbol: tvSymbol,
                interval,
                timezone: 'Etc/UTC',
                theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                style: '1',
                locale: 'tr',
                toolbar_bg: 'rgba(0,0,0,0)',
                enable_publishing: false,
                allow_symbol_change: false,
                container_id: 'tradingview_widget_container',
                withdateranges: true,
                hide_top_toolbar: false,
                hide_side_toolbar: false,
                studies: [],
            })

            widgetRef.current.onChartReady(() => {
                chartRef.current = widgetRef.current.activeChart()
            })
        }

        createWidget()
        return () => {
            chartRef.current = null
            widgetRef.current = null
            try { if (containerRef.current) containerRef.current.innerHTML = '' } catch { /* noop */ }
        }
    }, [tvSymbol, interval, preset])

    // Binance WebSockets: ticker, partial depth, trades
    useEffect(() => {
        const sockets = []
        // Ticker
        const wsTicker = new WebSocket(`wss://stream.binance.com:9443/ws/${binancePair}@ticker`)
        wsTicker.onmessage = (e) => {
            try { setBinanceTicker(JSON.parse(e.data)) } catch { }
        }
        sockets.push(wsTicker)
        // Partial depth top 20
        const wsDepth = new WebSocket(`wss://stream.binance.com:9443/ws/${binancePair}@depth20@100ms`)
        wsDepth.onmessage = (e) => {
            try {
                const d = JSON.parse(e.data)
                const parseSide = (arr) => arr.slice(0, 10).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }))
                setOrderBook({ bids: parseSide(d.bids || d.b || []), asks: parseSide(d.asks || d.a || []) })
            } catch { }
        }
        sockets.push(wsDepth)
        // Trades stream
        const wsTrades = new WebSocket(`wss://stream.binance.com:9443/ws/${binancePair}@trade`)
        wsTrades.onmessage = (e) => {
            try {
                const t = JSON.parse(e.data)
                setTrades(prev => {
                    const next = [{ price: parseFloat(t.p), qty: parseFloat(t.q), side: t.m ? 'sell' : 'buy', ts: t.T }, ...prev]
                    return next.slice(0, 50)
                })
            } catch { }
        }
        sockets.push(wsTrades)

        return () => sockets.forEach(s => { try { s.close() } catch { } })
    }, [binancePair])

    // Coinbase WebSocket: ticker
    useEffect(() => {
        const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: [{ name: 'ticker', product_ids: [coinbaseProduct] }]
            }))
        }
        ws.onmessage = (e) => {
            try {
                const d = JSON.parse(e.data)
                if (d.type === 'ticker' && d.product_id === coinbaseProduct) {
                    setCoinbaseTicker(d)
                }
            } catch { }
        }
        return () => { try { ws.close() } catch { } }
    }, [coinbaseProduct])

    const setSymbol = (b, q) => { setBase(b); setQuote(q) }
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
            {/* Top controls */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Piyasalar</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Binance WS + Coinbase ticker, canlı grafik</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={interval} onChange={(e) => setInterval(e.target.value)} className="px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                        {['1', '5', '15', '30', '60', '120', '240', '1D'].map(iv => <option key={iv} value={iv}>{iv}</option>)}
                    </select>
                    <select value={preset} onChange={(e) => setPreset(e.target.value)} className="px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                        <option value="basic">Temel</option>
                        <option value="trend">Trend</option>
                        <option value="momentum">Momentum</option>
                    </select>
                </div>
            </div>

            {/* Grid layout: watchlist | chart | orderbook & tape */}
            <div className="grid grid-cols-12 gap-4">
                {/* Watchlist + Favorites (dinamik) */}
                <div className="col-span-12 md:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">Favoriler</div>
                            <button onClick={() => setFavorites([])} className="text-xs text-indigo-500">Temizle</button>
                        </div>
                        {favorites.length === 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Favori yok. Yıldız ile ekleyin.</div>
                        ) : (
                            <div className="space-y-1 max-h-[24vh] overflow-y-auto">
                                {favorites.map(pair => {
                                    const s = allSymbols.find(x => x.symbol === pair)
                                    if (!s) return null
                                    const active = `${base}${quote}` === pair
                                    return (
                                        <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className="text-sm text-yellow-400">★</button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
                        <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setWatchOpen(v => !v)} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span>İzleme Listesi</span>
                                <span className="text-xs text-gray-500">{watchOpen ? '▼' : '▲'}</span>
                            </button>
                            <button onClick={() => setWatchlist(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'])} className="text-xs text-indigo-500">Sıfırla</button>
                        </div>
                        {watchOpen && (
                            <>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Ara: BTC, ETH, SOL..."
                                    className="w-full mb-2 px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 text-sm"
                                />
                                <div className="space-y-1 max-h-[32vh] overflow-y-auto">
                                    {[...allSymbols]
                                        .filter(s => s.symbol.endsWith('USDT'))
                                        .filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.baseAsset.toLowerCase().includes(search.toLowerCase()))
                                        .sort((a, b) => {
                                            const fa = favorites.includes(a.symbol) ? 1 : 0
                                            const fb = favorites.includes(b.symbol) ? 1 : 0
                                            if (fa !== fb) return fb - fa
                                            return a.symbol.localeCompare(b.symbol)
                                        })
                                        .slice(0, 500)
                                        .map(s => {
                                            const pair = s.symbol
                                            const active = `${base}${quote}` === pair
                                            return (
                                                <div key={pair} className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setSymbol(s.baseAsset, s.quoteAsset)}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-800 dark:text-gray-200">{s.baseAsset}/{s.quoteAsset}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleFav(pair) }} className={`text-sm ${isFav(pair) ? 'text-yellow-400' : 'text-gray-400'}`}>★</button>
                                                </div>
                                            )
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Chart */}
                <div className="col-span-12 md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{base}/{quote}</div>
                        <div className="flex items-center gap-4 text-sm">
                            {(() => {
                                const p = combinedPrice(); return (
                                    <>
                                        <span className="text-gray-600 dark:text-gray-300">Binance: <b className="text-green-500">{fmt(p.bin, 6)}</b></span>
                                        <span className="text-gray-600 dark:text-gray-300">Coinbase: <b className="text-blue-500">{fmt(p.cb, 6)}</b></span>
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                    <div ref={containerRef} id="tradingview_widget_container" style={{ height: '60vh' }} />
                </div>

                {/* Orderbook + Tape */}
                <div className="col-span-12 md:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                        <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">Order Book</div>
                        <div className="grid grid-cols-2 gap-0 text-xs">
                            <div className="p-2">
                                <div className="text-gray-500 mb-1">Bids</div>
                                <div className="space-y-1">
                                    {orderBook.bids.map((b, i) => (
                                        <div key={`b${i}`} className="flex justify-between">
                                            <span className="text-green-500">{fmt(b.price, 6)}</span>
                                            <span className="text-gray-500">{fmt(b.qty, 4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-2">
                                <div className="text-gray-500 mb-1">Asks</div>
                                <div className="space-y-1">
                                    {orderBook.asks.map((a, i) => (
                                        <div key={`a${i}`} className="flex justify-between">
                                            <span className="text-red-500">{fmt(a.price, 6)}</span>
                                            <span className="text-gray-500">{fmt(a.qty, 4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                        <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">Trade Tape</div>
                        <div className="max-h-[28vh] overflow-y-auto divide-y dark:divide-gray-700 text-xs">
                            {trades.map((t, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-1">
                                    <span className={t.side === 'buy' ? 'text-green-500' : 'text-red-500'}>{fmt(t.price, 6)}</span>
                                    <span className="text-gray-500">{fmt(t.qty, 4)}</span>
                                    <span className="text-gray-400">{new Date(t.ts).toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketsPage
