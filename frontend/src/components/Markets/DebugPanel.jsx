import React, { useState } from 'react'

const DebugPanel = ({
    symbol,
    orderBook,
    trades,
    connectionStates,
    connectionStats,
    binanceTicker
}) => {
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 z-50"
            >
                Debug
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Debug Panel</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-3 text-xs">
                {/* Symbol Info */}
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Symbol</div>
                    <div className="text-gray-600 dark:text-gray-400">{symbol?.base}{symbol?.quote}</div>
                </div>

                {/* Connection States */}
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Connections</div>
                    {Object.entries(connectionStates || {}).map(([id, state]) => (
                        <div key={id} className="flex justify-between">
                            <span>{id}</span>
                            <span className={`font-mono ${state === 'connected' ? 'text-green-600' :
                                    state === 'connecting' ? 'text-yellow-600' :
                                        'text-red-600'
                                }`}>
                                {state}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Data Stats */}
                <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Data</div>
                    <div className="flex justify-between">
                        <span>Order Book</span>
                        <span className="font-mono">
                            {orderBook?.bids?.length || 0}B / {orderBook?.asks?.length || 0}A
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Trades</span>
                        <span className="font-mono">{trades?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ticker</span>
                        <span className="font-mono">{binanceTicker ? '✓' : '✗'}</span>
                    </div>
                </div>

                {/* Connection Stats */}
                {connectionStats && (
                    <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Stats</div>
                        {Object.entries(connectionStats).map(([id, stats]) => (
                            <div key={id} className="text-xs">
                                <div className="font-medium">{id}</div>
                                <div className="ml-2">
                                    <div>Attempts: {stats.attempts || 0}</div>
                                    {stats.lastError && <div className="text-red-600">Error: {stats.lastError}</div>}
                                    {stats.lastConnected && (
                                        <div>Connected: {new Date(stats.lastConnected).toLocaleTimeString()}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Order Book Preview */}
                {orderBook && (orderBook.bids?.length > 0 || orderBook.asks?.length > 0) && (
                    <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Order Book Preview</div>
                        <div className="text-xs font-mono">
                            {orderBook.asks?.slice(0, 2).reverse().map((ask, i) => (
                                <div key={i} className="text-red-600">
                                    {ask.price.toFixed(6)} | {ask.qty.toFixed(4)}
                                </div>
                            ))}
                            <div className="border-t border-gray-300 my-1"></div>
                            {orderBook.bids?.slice(0, 2).map((bid, i) => (
                                <div key={i} className="text-green-600">
                                    {bid.price.toFixed(6)} | {bid.qty.toFixed(4)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Trades */}
                {trades && trades.length > 0 && (
                    <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Recent Trades</div>
                        <div className="text-xs font-mono">
                            {trades.slice(0, 3).map((trade, i) => (
                                <div key={i} className={trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}>
                                    {trade.price.toFixed(6)} | {trade.qty.toFixed(4)} | {trade.side}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DebugPanel
