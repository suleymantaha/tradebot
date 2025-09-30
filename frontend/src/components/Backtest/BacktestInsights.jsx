import React, { useMemo } from 'react'

const formatPct = (v) => `${(v ?? 0).toFixed(2)}%`

const computeInsights = (results) => {
    if (!results) return { bullets: [], summary: '' }

    const totalReturn = results.total_return ?? 0
    const winRate = results.win_rate ?? 0
    const totalTrades = results.total_trades ?? 0
    const winning = results.winning_trades ?? 0
    const losing = results.losing_trades ?? 0
    const marketType = results.market_type
    const leverage = results.leverage

    const monthly = results.monthly_results || {}
    const months = Object.keys(monthly)
    const monthPnls = months.map((m) => monthly[m]?.pnl ?? 0)
    const posMonths = monthPnls.filter((x) => x >= 0).length
    const negMonths = monthPnls.filter((x) => x < 0).length
    const bestIdx = monthPnls.length ? monthPnls.indexOf(Math.max(...monthPnls)) : -1
    const worstIdx = monthPnls.length ? monthPnls.indexOf(Math.min(...monthPnls)) : -1
    const bestMonth = bestIdx >= 0 ? { name: months[bestIdx], pnl: monthPnls[bestIdx] } : null
    const worstMonth = worstIdx >= 0 ? { name: months[worstIdx], pnl: monthPnls[worstIdx] } : null

    const last3 = monthPnls.slice(-3)
    const last3Avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : 0
    const volatility = monthPnls.length > 1
        ? Math.sqrt(
            monthPnls
                .map((x) => x - (monthPnls.reduce((a, b) => a + b, 0) / monthPnls.length))
                .map((x) => x * x)
                .reduce((a, b) => a + b, 0) / (monthPnls.length - 1)
        )
        : 0

    const bullets = []

    // Genel performans
    bullets.push(`Toplam getiri: ${formatPct(totalReturn)}, Kazanma oranı: ${formatPct(winRate)} (${winning}/${totalTrades})`)
    if (posMonths + negMonths > 0) {
        bullets.push(`Aylık dağılım: ${posMonths} pozitif, ${negMonths} negatif`)
    }
    if (bestMonth) bullets.push(`En iyi ay: ${bestMonth.name} (${formatPct(bestMonth.pnl)})`)
    if (worstMonth) bullets.push(`En kötü ay: ${worstMonth.name} (${formatPct(worstMonth.pnl)})`)
    bullets.push(`Son 3 ay ortalaması: ${formatPct(last3Avg)}${last3Avg >= 0 ? ' (momentum pozitif)' : ' (momentum zayıf)'}`)

    // Volatilite yorumu (grafik okuma benzeri)
    if (volatility > 8) {
        bullets.push('Aylık performans volatilitesi yüksek; risk yönetimini sıkılaştırın (SL/TP ayarlarını gözden geçirin).')
    } else if (volatility > 4) {
        bullets.push('Orta volatilite; parametre iyileştirmeleri ile stabilite artırılabilir.')
    } else if (monthPnls.length > 0) {
        bullets.push('Volatilite düşük; strateji kararlılığı iyi görünüyor.')
    }

    // Strateji önerileri (heuristic)
    if (winRate < 45 && totalReturn <= 0) {
        bullets.push('Öneri: Hızlı/Yavaş EMA farkını artırın veya RSI eşiklerini (oversold daha düşük, overbought daha yüksek) deneyin.')
    } else if (winRate >= 60 && totalReturn > 0) {
        bullets.push('Öneri: Kademeli kar alma (partial TP) eklemeyi ve trailing stop’u hafif artırmayı değerlendirin.')
    }
    if (marketType === 'futures' && leverage) {
        bullets.push(`Futures ${leverage}x: Kaldıraç riski yüksek; stop seviyelerini daraltmayı düşünün.`)
    }

    const summary = [
        totalReturn >= 0 ? 'Genel eğilim yukarı' : 'Genel eğilim aşağı',
        last3Avg >= 0 ? 'kısa vadede momentum pozitif' : 'kısa vadede momentum zayıf',
        volatility > 8 ? 'yüksek volatilite' : (volatility > 4 ? 'orta volatilite' : 'düşük volatilite')
    ].join(', ')

    return { bullets, summary }
}

const Badge = ({ children, tone = 'neutral' }) => {
    const map = {
        positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${map[tone]}`}>
            {children}
        </span>
    )
}

const BacktestInsights = ({ results }) => {
    const { bullets, summary } = useMemo(() => computeInsights(results), [results])

    if (!results) return null

    const tone = results.total_return >= 0 ? 'positive' : 'negative'

    return (
        <div className="mt-6 p-4 rounded-2xl border bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    🧠 Yapay Zeka Özeti (Heuristik)
                </h3>
                <Badge tone={tone}>
                    {results.total_return >= 0 ? 'Olumlu' : 'Dikkat Gerekiyor'}
                </Badge>
            </div>
            <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                {summary}
            </p>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                ))}
            </ul>
        </div>
    )
}

export default BacktestInsights


