import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { useTheme } from '../../contexts/ThemeContext'
import useAuthStore from '../../store/authStore'
import apiService from '../../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Simple CSV parser for comma-separated values (no complex quoting handling)
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = line.split(',')
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : ''
    })
    rows.push(obj)
  }
  return rows
}

function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

function formatDate(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// Number formatting helpers
const LOCALE = 'tr-TR'
function formatNumber(val, decimals = 2) {
  const n = toNumber(val)
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n)
}

function padFixedWidth(str, width = 18, align = 'left') {
  const s = String(str ?? '')
  if (s.length >= width) return s
  const padLen = width - s.length
  if (align === 'right') return ' '.repeat(padLen) + s
  return s + ' '.repeat(padLen)
}

// Register plugins once
Chart.register(zoomPlugin)

// Symbol to cache lower-case key lookups per record
const aliasCacheSymbol = Symbol('aliasCache')

// Safe getter for multiple alias field names (case-insensitive)
function getField(obj, aliases, fallback = undefined) {
  if (!obj || typeof obj !== 'object') return fallback
  let cache = obj[aliasCacheSymbol]
  if (!cache) {
    cache = new Map()
    Object.keys(obj).forEach(k => cache.set(k.toLowerCase(), k))
    obj[aliasCacheSymbol] = cache
  }
  for (const key of aliases) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
    const lowerKey = String(key).toLowerCase()
    const actualKey = cache.get(lowerKey)
    if (actualKey !== undefined) {
      const val = obj[actualKey]
      if (val !== undefined && val !== null && val !== '') return val
    }
  }
  return fallback
}

const VIRTUAL_ROW_HEIGHT = 56
const VIRTUAL_BUFFER = 6
const VIRTUAL_THRESHOLD = 400
const VIRTUAL_MAX_HEIGHT = 520

const BacktestReportPage = () => {
  const { isDark } = useTheme()
  const { isAuthenticated, token } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialIdParam = searchParams.get('id')
  const initialSelectedId = initialIdParam && !Number.isNaN(Number(initialIdParam)) ? Number(initialIdParam) : null
  const [backtestList, setBacktestList] = useState([])
  const [selectedBacktestId, setSelectedBacktestId] = useState(initialSelectedId)
  const [backtestDetail, setBacktestDetail] = useState(null)
  const [trades, setTrades] = useState([])
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
    showTP: true,
    showSL: true,
    side: 'ALL', // ALL | LONG | SHORT
  })
  const [daily, setDaily] = useState([])
  const [activeChartTab, setActiveChartTab] = useState('dailyPnl')
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tradesLoading, setTradesLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [tradeError, setTradeError] = useState('')


  const dailyChartRef = useRef(null)
  const dailyTradesChartRef = useRef(null)
  const tpSlChartRef = useRef(null)
  const charts = useRef({})
  const tradesScrollRef = useRef(null)
  const [tradesRange, setTradesRange] = useState({ start: 0, end: 0 })

  const isAutoLoading = detailLoading || tradesLoading

  const handleSelectBacktest = useCallback((id) => {
    const numericId = Number(id)
    if (!numericId || Number.isNaN(numericId) || numericId <= 0) return
    if (selectedBacktestId !== numericId) {
      setSelectedBacktestId(numericId)
    }
    setSearchParams({ id: String(numericId) })
  }, [selectedBacktestId, setSearchParams])

  const fetchBacktestList = useCallback(async () => {
    try {
      setListLoading(true)
      setListError('')
      const response = await apiService.getBacktestList()
      const list = Array.isArray(response?.data) ? response.data : []
      setBacktestList(list)
    } catch (err) {
      console.error('Backtest list fetch error:', err)
      setListError(err?.message || 'Backtest listesi yüklenemedi')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadBacktestData = useCallback(async (backtestId) => {
    setDetailLoading(true)
    setTradesLoading(true)
    setDetailError('')
    setTradeError('')

    const [detailResult, tradesResult] = await Promise.allSettled([
      apiService.get(`/api/v1/backtest/detail/${backtestId}`),
      apiService.fetchBacktestTradesText(backtestId)
    ])

    let detailData = null
    let safeStart = null
    let safeEnd = null
    let detailErrorMessage = ''

    if (detailResult.status === 'fulfilled') {
      detailData = detailResult.value?.data || null
      if (detailData) {
        const start = detailData.start_date ? new Date(detailData.start_date) : null
        const end = detailData.end_date ? new Date(detailData.end_date) : null
        safeStart = start && !Number.isNaN(start.getTime()) ? start : null
        safeEnd = end && !Number.isNaN(end.getTime()) ? end : null
      } else {
        detailErrorMessage = 'Backtest detayı bulunamadı'
      }
    } else {
      console.error('Backtest detail fetch error:', detailResult.reason)
      detailErrorMessage = detailResult.reason?.message || 'Backtest detayı yüklenemedi'
    }

    let parsedTrades = []
    let tradesErrorMessage = ''

    if (tradesResult.status === 'fulfilled') {
      try {
        parsedTrades = parseCSV(tradesResult.value)
      } catch (err) {
        console.error('Backtest trades parse error:', err)
        tradesErrorMessage = err?.message || 'Backtest işlemleri çözümlenemedi'
      }
    } else {
      console.error('Backtest trades fetch error:', tradesResult.reason)
      tradesErrorMessage = tradesResult.reason?.message || 'Backtest işlemleri yüklenemedi'
    }

    unstable_batchedUpdates(() => {
      if (detailData) {
        setBacktestDetail(detailData)
        setFilter(prev => {
          const prevStart = prev.startDate ? prev.startDate.getTime() : null
          const prevEnd = prev.endDate ? prev.endDate.getTime() : null
          const nextStart = safeStart ? safeStart.getTime() : null
          const nextEnd = safeEnd ? safeEnd.getTime() : null
          if (prevStart === nextStart && prevEnd === nextEnd) {
            return prev
          }
          return {
            ...prev,
            startDate: safeStart,
            endDate: safeEnd,
          }
        })
        setDetailError('')
      } else {
        setBacktestDetail(null)
        if (detailErrorMessage) {
          setDetailError(detailErrorMessage)
        }
      }

      if (tradesErrorMessage) {
        setTrades([])
        setTradeError(tradesErrorMessage)
      } else {
        setTrades(parsedTrades)
        setTradeError('')
      }

      setDetailLoading(false)
      setTradesLoading(false)
    })
  }, [])

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login')
    }
  }, [isAuthenticated, token, navigate])

  useEffect(() => {
    const paramId = searchParams.get('id')
    if (!paramId) return
    const numericId = Number(paramId)
    if (!numericId || Number.isNaN(numericId) || numericId <= 0) return
    if (selectedBacktestId !== numericId) {
      setSelectedBacktestId(numericId)
    }
  }, [searchParams, selectedBacktestId])

  useEffect(() => {
    if (!isAuthenticated || !token) return
    fetchBacktestList()
  }, [fetchBacktestList, isAuthenticated, token])

  useEffect(() => {
    if (!selectedBacktestId && backtestList.length > 0) {
      const fallback = backtestList[0]
      if (fallback?.id) {
        handleSelectBacktest(fallback.id)
      }
    }
  }, [backtestList, handleSelectBacktest, selectedBacktestId])

  useEffect(() => {
    if (!isAuthenticated || !token) return
    if (!selectedBacktestId) return
    loadBacktestData(selectedBacktestId)
  }, [isAuthenticated, loadBacktestData, selectedBacktestId, token])

  const { filteredTrades, tpSlStats } = useMemo(() => {
    if (!trades.length) {
      return {
        filteredTrades: [],
        tpSlStats: { tpCount: 0, slCount: 0, otherCount: 0 },
      }
    }

    const filteredList = []
    let tpCount = 0
    let slCount = 0
    let otherCount = 0

    trades.forEach((trade) => {
      const exitRaw = getField(trade, ['exit_time', 'exitTime', 'exit'])
      const exitDate = exitRaw ? new Date(exitRaw) : null
      const hasValidExit = exitDate && !Number.isNaN(exitDate.getTime())

      if (filter.startDate) {
        if (!hasValidExit || exitDate < filter.startDate) return
      }
      if (filter.endDate) {
        if (!hasValidExit || exitDate > filter.endDate) return
      }

      const reason = String(getField(trade, ['exit_reason', 'reason', 'exitReason'], '')).toUpperCase()
      const side = String(getField(trade, ['side', 'direction'], '')).toUpperCase()

      const isTP = reason.includes('TP') || reason.includes('TAKE') || reason.includes('PROFIT')
      const isSL = reason.includes('SL') || reason.includes('STOP')
      if (!filter.showTP && isTP) return
      if (!filter.showSL && isSL) return

      if (filter.side !== 'ALL') {
        if (filter.side === 'LONG' && side !== 'LONG') return
        if (filter.side === 'SHORT' && side !== 'SHORT') return
      }

      filteredList.push(trade)
      if (isTP) tpCount += 1
      else if (isSL) slCount += 1
      else otherCount += 1
    })

    return {
      filteredTrades: filteredList,
      tpSlStats: { tpCount, slCount, otherCount },
    }
  }, [filter, trades])

  const summary = useMemo(() => {
    const base = {
      totalPnL: 0,
      totalReturnPct: 0,
      winRate: 0,
      loseRate: 0,
      totalTrades: 0,
      totalFees: 0,
      avgFeePerTrade: 0,
      feeToPnLRatio: 0,
      initialCapital: 0,
      finalCapital: 0,
      avgPnLPerTrade: 0,
      avgTradesPerDay: 0,
    }

    const detail = backtestDetail
    const filteredCount = filteredTrades.length

    if (!detail && filteredCount === 0) {
      return base
    }

    let initialCapital = detail ? toNumber(detail.initial_capital) : 0
    let finalCapital = detail ? toNumber(detail.final_capital) : initialCapital
    let totalTrades = detail ? toNumber(detail.total_trades) : 0
    let wins = detail ? toNumber(detail.winning_trades) : 0
    let losses = detail ? toNumber(detail.losing_trades) : 0
    let totalFees = detail ? toNumber(detail.total_fees) : 0
    let totalReturnPct = detail ? toNumber(detail.total_return) : 0
    let avgPnLPerTrade = detail ? toNumber(detail.avg_profit) : 0

    let aggregatePnL = 0
    let aggregateFees = 0
    let aggregateWins = 0
    let aggregateLosses = 0
    let lastCapitalAfter = null

    if (filteredCount > 0) {
      filteredTrades.forEach((trade) => {
        const pnl = toNumber(getField(trade, ['pnl', 'profit', 'pnl_value', 'pnl_usdt']))
        aggregatePnL += pnl
        if (pnl > 0) aggregateWins += 1
        else if (pnl < 0) aggregateLosses += 1

        let feeEntry = toNumber(getField(trade, ['fees_entry']))
        let feeExit = toNumber(getField(trade, ['fees_exit']))
        let feeSum = feeEntry + feeExit
        if (feeSum === 0) {
          const fallbackFee = toNumber(getField(trade, ['fee', 'fees', 'commission']))
          feeSum = fallbackFee
        }
        aggregateFees += feeSum

        const capitalAfter = toNumber(getField(trade, ['capital_after', 'capitalAfter', 'equity_after']))
        if (capitalAfter > 0) {
          lastCapitalAfter = capitalAfter
        }
      })
    }

    let totalPnL = detail ? finalCapital - initialCapital : aggregatePnL

    if (!detail) {
      totalTrades = filteredCount
      wins = aggregateWins
      losses = aggregateLosses
      totalFees = aggregateFees
      if (lastCapitalAfter !== null) {
        finalCapital = lastCapitalAfter
        initialCapital = Math.max(0, finalCapital - aggregatePnL)
      } else {
        finalCapital = aggregatePnL
        initialCapital = Math.max(0, finalCapital - aggregatePnL)
      }
      totalPnL = aggregatePnL
      avgPnLPerTrade = totalTrades > 0 ? aggregatePnL / totalTrades : 0
      totalReturnPct = initialCapital > 0 ? (aggregatePnL / initialCapital) * 100 : 0
    } else {
      if (initialCapital <= 0 && aggregatePnL !== 0) {
        if (lastCapitalAfter !== null) {
          initialCapital = Math.max(0, lastCapitalAfter - aggregatePnL)
          finalCapital = lastCapitalAfter
        }
      }

      if (!totalTrades && filteredCount) {
        totalTrades = filteredCount
      }
      if (!wins && !losses && (aggregateWins || aggregateLosses)) {
        wins = aggregateWins
        losses = aggregateLosses
      }
      if (!totalFees && aggregateFees) {
        totalFees = aggregateFees
      }
      if (!avgPnLPerTrade && totalTrades > 0) {
        avgPnLPerTrade = aggregatePnL !== 0 ? aggregatePnL / totalTrades : 0
      }
      if (!totalReturnPct && initialCapital > 0) {
        totalReturnPct = ((finalCapital - initialCapital) / initialCapital) * 100
      }
      totalPnL = finalCapital - initialCapital
    }

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    const loseRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0
    const avgFeePerTrade = totalTrades > 0 ? totalFees / totalTrades : 0
    const feeToPnLRatio = Math.abs(totalPnL) > 0 ? totalFees / Math.abs(totalPnL) : 0

    let avgTradesPerDay = 0
    if (daily.length > 0) {
      const totalDailyTrades = daily.reduce((acc, item) => acc + toNumber(item.trades), 0)
      const dayCount = daily.length
      avgTradesPerDay = dayCount > 0 ? totalDailyTrades / dayCount : 0
    } else if (detail && detail.start_date && detail.end_date && totalTrades > 0) {
      const start = new Date(detail.start_date)
      const end = new Date(detail.end_date)
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
        avgTradesPerDay = totalTrades / diffDays
      }
    }

    return {
      totalPnL,
      totalReturnPct,
      winRate,
      loseRate,
      totalTrades,
      totalFees,
      avgFeePerTrade,
      feeToPnLRatio,
      initialCapital,
      finalCapital,
      avgPnLPerTrade,
      avgTradesPerDay,
    }
  }, [backtestDetail, daily, filteredTrades])

  const useVirtualizedTrades = filteredTrades.length > VIRTUAL_THRESHOLD

  const handleTradesScroll = useCallback((event) => {
    if (!useVirtualizedTrades) return
    const { scrollTop, clientHeight } = event.currentTarget
    const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_BUFFER)
    const visibleCount = Math.ceil(clientHeight / VIRTUAL_ROW_HEIGHT) + VIRTUAL_BUFFER * 2
    const end = Math.min(filteredTrades.length, start + visibleCount)

    setTradesRange((prev) => {
      if (prev.start === start && prev.end === end) {
        return prev
      }
      return { start, end }
    })
  }, [filteredTrades.length, useVirtualizedTrades])

  useEffect(() => {
    if (!useVirtualizedTrades) {
      setTradesRange({ start: 0, end: filteredTrades.length })
      return
    }

    const container = tradesScrollRef.current
    const viewportRows = container ? Math.ceil(container.clientHeight / VIRTUAL_ROW_HEIGHT) : 0
    const fallbackRows = Math.ceil(VIRTUAL_MAX_HEIGHT / VIRTUAL_ROW_HEIGHT)
    const baseRows = viewportRows > 0 ? viewportRows : fallbackRows
    const initialEnd = Math.min(filteredTrades.length, baseRows + VIRTUAL_BUFFER * 2)

    setTradesRange({ start: 0, end: initialEnd })
    if (container) {
      container.scrollTop = 0
    }
  }, [filteredTrades.length, useVirtualizedTrades])

  const visibleTrades = useMemo(() => {
    if (!useVirtualizedTrades) {
      return filteredTrades
    }
    return filteredTrades.slice(tradesRange.start, tradesRange.end)
  }, [filteredTrades, tradesRange.end, tradesRange.start, useVirtualizedTrades])

  const topSpacerHeight = useVirtualizedTrades ? tradesRange.start * VIRTUAL_ROW_HEIGHT : 0
  const bottomSpacerHeight = useVirtualizedTrades
    ? Math.max(0, (filteredTrades.length - tradesRange.end) * VIRTUAL_ROW_HEIGHT)
    : 0

  // Summary is computed via useMemo above; no additional effect needed

  useEffect(() => {
    if (!backtestDetail) {
      setDaily([])
      return
    }

    const dailyResults = Array.isArray(backtestDetail.daily_results) ? backtestDetail.daily_results : []
    if (!dailyResults.length) {
      setDaily([])
      return
    }

    let prevCapital = toNumber(backtestDetail.initial_capital)
    const computed = dailyResults.map(item => {
      const capitalRaw = item?.capital
      const capital = capitalRaw !== undefined ? toNumber(capitalRaw) : prevCapital
      const pnlUsd = capital - prevCapital
      const pnlPct = item?.pnl_pct !== undefined ? toNumber(item.pnl_pct) : (prevCapital !== 0 ? (pnlUsd / prevCapital) * 100 : 0)
      const tradesCount = item?.trades !== undefined ? toNumber(item.trades) : 0
      const formattedDate = item?.date ? formatDate(item.date) : ''
      prevCapital = capital
      return {
        date: formattedDate,
        rawDate: item?.date || formattedDate,
        pnl: pnlUsd,
        pnlPct,
        trades: tradesCount,
        capital,
      }
    })

    setDaily(computed)
  }, [backtestDetail])

  useEffect(() => {
    if (activeChartTab !== 'dailyPnl') {
      if (charts.current.daily) {
        try { charts.current.daily.destroy() } catch { }
        charts.current.daily = undefined
      }
      return
    }

    if (!dailyChartRef.current || daily.length === 0) return

    const chart = new Chart(dailyChartRef.current, {
      type: 'line',
      data: {
        labels: daily.map(d => d.date),
        datasets: [{
          label: 'Günlük PnL (USDT)',
          data: daily.map(d => d.pnl),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.18)',
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y || 0
                const pct = daily[ctx.dataIndex]?.pnlPct ?? 0
                return `PnL: ${formatNumber(Number(value), 4)} • % ${formatNumber(pct, 2)}`
              }
            }
          },
          zoom: {
            limits: { x: { minRange: 3 } },
            pan: { enabled: true, mode: 'x' },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
          }
        },
        scales: {
          y: { beginAtZero: false, ticks: { callback: (val) => formatNumber(Number(val), 2) } }
        }
      }
    })

    charts.current.daily = chart

    return () => {
      try { chart.destroy() } catch { }
      charts.current.daily = undefined
    }
  }, [activeChartTab, daily])

  useEffect(() => {
    if (activeChartTab !== 'dailyTrades') {
      if (charts.current.dailyTrades) {
        try { charts.current.dailyTrades.destroy() } catch { }
        charts.current.dailyTrades = undefined
      }
      return
    }

    if (!dailyTradesChartRef.current || daily.length === 0) return

    const chart = new Chart(dailyTradesChartRef.current, {
      type: 'bar',
      data: {
        labels: daily.map(d => d.date),
        datasets: [{
          label: 'Günlük İşlem Sayısı',
          data: daily.map(d => d.trades),
          backgroundColor: '#10B981',
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          zoom: {
            limits: { x: { minRange: 3 } },
            pan: { enabled: true, mode: 'x' },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    })

    charts.current.dailyTrades = chart

    return () => {
      try { chart.destroy() } catch { }
      charts.current.dailyTrades = undefined
    }
  }, [activeChartTab, daily])

  useEffect(() => {
    if (activeChartTab !== 'tpSl') {
      if (charts.current.tpsl) {
        try { charts.current.tpsl.destroy() } catch { }
        charts.current.tpsl = undefined
      }
      return
    }

    const total = tpSlStats.tpCount + tpSlStats.slCount + tpSlStats.otherCount
    if (!tpSlChartRef.current || total === 0) return

    const chart = new Chart(tpSlChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['TP', 'SL', 'Diğer'],
        datasets: [{
          data: [tpSlStats.tpCount, tpSlStats.slCount, tpSlStats.otherCount],
          backgroundColor: ['#34D399', '#F87171', '#9CA3AF'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
        }
      }
    })

    charts.current.tpsl = chart

    return () => {
      try { chart.destroy() } catch { }
      charts.current.tpsl = undefined
    }
  }, [activeChartTab, tpSlStats])

  const buildCSVWithBOM = (text) => `\ufeff${text}`

  const exportCSV = (rows, filename) => {
    if (!rows || rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => r[h]).join(','))).join('\n')
    const withBOM = buildCSVWithBOM(csv)
    const blob = new Blob([withBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
        document.body.appendChild(a)
        a.click()
        if (a.parentNode) {
            try { a.parentNode.removeChild(a) } catch { /* noop */ }
        } else if (typeof a.remove === 'function') {
            try { a.remove() } catch { /* noop */ }
        }
    URL.revokeObjectURL(url)
  }

  // Template-based CSV exports with fixed-width padding and locale formats
  const exportTemplateCSV = (type) => {
    let headers = []
    let rows = []
    if (type === 'summary') {
      headers = ['Metrik', 'Değer']
      rows = summaryCSVRows.map(r => ({
        Metrik: padFixedWidth(r.metric, 20, 'left'),
        Değer: padFixedWidth(formatNumber(r.value, typeof r.value === 'number' ? 2 : 2), 18, 'right')
      }))
    } else if (type === 'tpsl') {
      headers = ['Tür', 'Adet']
      rows = tpSlCSVRows.map(r => ({
        Tür: padFixedWidth(r.label, 12, 'left'),
        Adet: padFixedWidth(formatNumber(r.count, 0), 10, 'right')
      }))
    } else if (type === 'daily') {
      headers = ['Tarih', 'PnL_USDT', 'PnL_%', 'İşlem', 'Sermaye']
      rows = dailyCSVRows.map(r => ({
        Tarih: padFixedWidth(r.date || '', 12, 'left'),
        PnL_USDT: padFixedWidth(formatNumber(r.pnl, 6), 18, 'right'),
        'PnL_%': padFixedWidth(formatNumber(r.pnlPct, 2), 10, 'right'),
        İşlem: padFixedWidth(formatNumber(r.trades, 0), 8, 'right'),
        Sermaye: padFixedWidth(formatNumber(r.capital, 2), 18, 'right')
      }))
    }
    if (!headers.length || !rows.length) return
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => r[h]).join(',')))
      .join('\n')
    const withBOM = buildCSVWithBOM(csv)
    const filename = type === 'summary' ? 'summary.csv' : type === 'tpsl' ? 'tp_sl_stats.csv' : 'daily_results.csv'
    const blob = new Blob([withBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Derived CSVs
  const summaryCSVRows = useMemo(() => [{
    metric: 'Net PnL', value: summary.totalPnL.toFixed(8)
  }, {
    metric: 'Toplam Getiri %', value: summary.totalReturnPct.toFixed(4)
  }, {
    metric: 'Başarı Oranı %', value: summary.winRate.toFixed(2)
  }, {
    metric: 'Başarısız Oran %', value: summary.loseRate.toFixed(2)
  }, {
    metric: 'Toplam İşlem', value: summary.totalTrades
  }, {
    metric: 'İşlem Başına Ortalama PnL', value: summary.avgPnLPerTrade.toFixed(8)
  }, {
    metric: 'Toplam Ücret', value: summary.totalFees.toFixed(8)
  }, {
    metric: 'İşlem Başına Ortalama Ücret', value: summary.avgFeePerTrade.toFixed(8)
  }, {
    metric: 'Ücret/PnL Oranı', value: summary.feeToPnLRatio.toFixed(4)
  }, {
    metric: 'Başlangıç Sermayesi', value: summary.initialCapital.toFixed(4)
  }, {
    metric: 'Final Sermaye', value: summary.finalCapital.toFixed(4)
  }, {
    metric: 'Günlük Ortalama İşlem', value: summary.avgTradesPerDay.toFixed(4)
  }], [summary])

  const tpSlCSVRows = useMemo(() => [{ label: 'TP', count: tpSlStats.tpCount }, { label: 'SL', count: tpSlStats.slCount }, { label: 'Diğer', count: tpSlStats.otherCount }], [tpSlStats])

  const dailyCSVRows = useMemo(() => daily.map(d => ({ date: d.date, pnl: d.pnl, pnlPct: d.pnlPct, trades: d.trades, capital: d.capital })), [daily])

  const hasTpSlData = (tpSlStats.tpCount + tpSlStats.slCount + tpSlStats.otherCount) > 0
  const hasDailyData = daily.length > 0
  const hasSummaryData = !!backtestDetail || filteredTrades.length > 0
  const detailStartDate = backtestDetail?.start_date ? formatDate(backtestDetail.start_date) : '-'
  const detailEndDate = backtestDetail?.end_date ? formatDate(backtestDetail.end_date) : '-'
  const detailMarketLabel = backtestDetail ? (String(backtestDetail.market_type).toLowerCase() === 'futures' ? `⚡ Futures (${backtestDetail.leverage || 1}x)` : '💰 Spot') : ''
  const detailModeLabel = backtestDetail ? (String(backtestDetail.test_mode).toLowerCase() === 'true' ? 'Test Modu' : 'Gerçek Mod') : ''
  const uploadName = backtestDetail?.upload_name ?? backtestDetail?.uploadName ?? ''
  const totalDailyPnl = daily.reduce((acc, d) => acc + d.pnl, 0)
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600'
  const tradeColumns = useMemo(() => ([
    { key: 'exit_time', label: 'Çıkış Zamanı' },
    { key: 'side', label: 'Yön' },
    { key: 'exit_reason', label: 'Çıkış Nedeni' },
    { key: 'pnl_usdt', label: 'PnL (USDT)' },
    { key: 'pnl_pct', label: 'PnL %' },
    { key: 'fees_entry', label: 'Giriş Ücreti' },
    { key: 'fees_exit', label: 'Çıkış Ücreti' },
    { key: 'entry_price', label: 'Giriş Fiyatı' },
    { key: 'exit_price', label: 'Çıkış Fiyatı' },
    { key: 'units', label: 'Birim' },
  ]), [])

  return (
    <div className={`min-h-screen p-6 overflow-x-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>📑 Backtest Report</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>CSV yükleyin, filtreleyin, tablo ve grafiklerle analiz edin; türetilmiş CSV'leri indirin.</p>
        </div>

        {/* Veri Kaynağı ve Eylemler */}
        <div className={`rounded-2xl p-6 mb-6 border ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
              <div className="xl:col-span-2 space-y-3">
                <label className={`block text-base font-semibold tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Backtest Seç</label>
                <select
                  value={selectedBacktestId ?? ''}
                  onChange={(e) => handleSelectBacktest(e.target.value)}
                  disabled={listLoading || backtestList.length === 0}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${listLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <option value="" disabled>
                    {listLoading ? 'Backtest listesi yükleniyor...' : backtestList.length === 0 ? 'Backtest bulunamadı' : 'Backtest seçin'}
                  </option>
                  {backtestList.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      #{bt.id} • {bt.symbol} • {bt.interval} ({bt.start_date} → {bt.end_date})
                    </option>
                  ))}
                </select>
                {listError && (
                  <div className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{listError}</div>
                )}
                {backtestList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {backtestList.slice(0, 12).map((bt) => {
                      const isActive = selectedBacktestId === bt.id
                      return (
                        <button
                          key={`chip-${bt.id}`}
                          type="button"
                          onClick={() => handleSelectBacktest(bt.id)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${isActive ? (isDark ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white') : (isDark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-indigo-400 hover:text-indigo-300' : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600')}`}
                          title={`${bt.symbol} ${bt.interval} | ${bt.start_date} → ${bt.end_date}`}
                        >
                          {bt.symbol} • {bt.interval}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fetchBacktestList()}
                  disabled={listLoading}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-200 hover:border-indigo-400 hover:text-indigo-300' : 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  🔄 Listeyi Yenile
                </button>
                {selectedBacktestId && (
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Aktif Backtest: #{selectedBacktestId}
                  </div>
                )}
                {isAutoLoading && (
                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Seçili backtest verileri yükleniyor...</div>
                )}
                {detailError && (
                  <div className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{detailError}</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-start">
              <button
                disabled={!hasSummaryData}
                onClick={() => exportTemplateCSV('summary')}
                className={`inline-flex items-center justify-center h-10 px-4 min-w-[150px] rounded-lg transition-colors shadow-sm ${isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ⬇️ Özet CSV
              </button>
              <button
                disabled={!hasTpSlData}
                onClick={() => exportTemplateCSV('tpsl')}
                className={`inline-flex items-center justify-center h-10 px-4 min-w-[150px] rounded-lg transition-colors shadow-sm ${isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ⬇️ TP/SL CSV
              </button>
              <button
                disabled={!hasDailyData}
                onClick={() => exportTemplateCSV('daily')}
                className={`inline-flex items-center justify-center h-10 px-4 min-w-[150px] rounded-lg transition-colors shadow-sm ${isDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ⬇️ Günlük CSV
              </button>
            </div>
          </div>
        </div>

        {backtestDetail && (
          <div className={`rounded-lg shadow-sm p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sembol • Interval</div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{backtestDetail.symbol} • {backtestDetail.interval}</div>
              </div>
              <div>
                <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tarih Aralığı</div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{detailStartDate} → {detailEndDate}</div>
              </div>
              <div>
                <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Market</div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{detailMarketLabel}</div>
              </div>
              <div>
                <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Backtest</div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>#{backtestDetail.id}</div>
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{detailModeLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`rounded-lg shadow-sm p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Başlangıç Tarihi</label>
              <DatePicker selected={filter.startDate} onChange={(d) => setFilter(f => ({ ...f, startDate: d }))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bitiş Tarihi</label>
              <DatePicker selected={filter.endDate} onChange={(d) => setFilter(f => ({ ...f, endDate: d }))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={filter.showTP} onChange={(e) => setFilter(f => ({ ...f, showTP: e.target.checked }))} />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>TP Göster</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={filter.showSL} onChange={(e) => setFilter(f => ({ ...f, showSL: e.target.checked }))} />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SL Göster</span>
              </label>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Yön</label>
              <select value={filter.side} onChange={(e) => setFilter(f => ({ ...f, side: e.target.value }))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}>
                <option value="ALL">Tümü</option>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Performans</h3>
            <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatNumber(summary.totalPnL, 4)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Getiri %: {formatNumber(summary.totalReturnPct, 2)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kazanç/Kayıp: {formatNumber(summary.winRate, 2)}% / {formatNumber(summary.loseRate, 2)}%</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>İşlem Başına Ortalama PnL: {formatNumber(summary.avgPnLPerTrade, 4)}</div>
          </div>
          <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ücretler</h3>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(summary.totalFees, 6)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>İşlem Başına Ortalama: {formatNumber(summary.avgFeePerTrade, 6)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ücret / PnL: {formatNumber(summary.feeToPnLRatio, 4)}</div>
          </div>
          <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sermaye</h3>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Başlangıç: {formatNumber(summary.initialCapital, 2)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Final: {formatNumber(summary.finalCapital, 2)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Toplam İşlem: {formatNumber(summary.totalTrades, 0)}</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Günlük Ortalama İşlem: {formatNumber(summary.avgTradesPerDay, 2)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className={`rounded-lg shadow-sm p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Grafik Analizi</h3>
            <div className="flex gap-2">
              {[
                { id: 'dailyPnl', label: 'Günlük PnL' },
                { id: 'dailyTrades', label: 'Günlük İşlem' },
                { id: 'tpSl', label: 'TP/SL' }
              ].map((tab) => {
                const isActive = activeChartTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveChartTab(tab.id)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${isActive
                      ? (isDark ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white')
                      : (isDark ? 'border-gray-600 text-gray-300 hover:border-indigo-400 hover:text-indigo-300'
                        : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600')}`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 h-72">
            {activeChartTab === 'dailyPnl' && (
              hasDailyData ? (
                <div className="h-full">
                  <canvas ref={dailyChartRef} className="h-full" />
                </div>
              ) : (
                <div className={`flex items-center justify-center h-full text-sm ${mutedTextClass}`}>
                  Günlük PnL verisi bulunmuyor.
                </div>
              )
            )}
            {activeChartTab === 'dailyTrades' && (
              hasDailyData ? (
                <div className="h-full">
                  <canvas ref={dailyTradesChartRef} className="h-full" />
                </div>
              ) : (
                <div className={`flex items-center justify-center h-full text-sm ${mutedTextClass}`}>
                  Günlük işlem verisi bulunmuyor.
                </div>
              )
            )}
            {activeChartTab === 'tpSl' && (
              hasTpSlData ? (
                <div className="h-full flex items-center justify-center">
                  <div className="max-w-xs w-full">
                    <canvas ref={tpSlChartRef} />
                  </div>
                </div>
              ) : (
                <div className={`flex items-center justify-center h-full text-sm ${mutedTextClass}`}>
                  TP/SL dağılımı için yeterli veri yok.
                </div>
              )
            )}
          </div>

          {activeChartTab === 'dailyPnl' && hasDailyData && (
            <>
              <div className="mt-3 flex gap-2">
                <button onClick={() => charts.current.daily?.resetZoom()} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Reset Zoom</button>
                <button onClick={() => charts.current.daily?.zoom(1.2)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Zoom +</button>
                <button onClick={() => charts.current.daily?.zoom(0.8)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Zoom -</button>
              </div>
              <div className={`mt-2 text-xs ${mutedTextClass}`}>
                Toplam Günlük PnL: {formatNumber(totalDailyPnl, 4)} • Ortalama İşlem: {formatNumber(summary.avgTradesPerDay, 2)}
              </div>
            </>
          )}
          {activeChartTab === 'dailyTrades' && hasDailyData && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => charts.current.dailyTrades?.resetZoom()} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Reset Zoom</button>
              <button onClick={() => charts.current.dailyTrades?.zoom(1.2)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Zoom +</button>
              <button onClick={() => charts.current.dailyTrades?.zoom(0.8)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Zoom -</button>
            </div>
          )}
        </div>

        {/* Trades Table */}
        <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>İşlemler</h3>
            <div className={`text-xs ${mutedTextClass}`}>
              Kaynak: {selectedBacktestId ? `Backtest #${selectedBacktestId}` : 'Manuel Yükleme'}
              {uploadName ? ` • ${uploadName}` : ''}
            </div>
          </div>
          {tradeError && (
            <div className={`mb-3 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{tradeError}</div>
          )}
          {tradesLoading ? (
            <div className={`py-12 text-center ${mutedTextClass}`}>
              Veriler yükleniyor...
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className={`${mutedTextClass}`}>Henüz trade yüklenmedi veya filtre ile eşleşen işlem yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <div
                ref={tradesScrollRef}
                className="overflow-y-auto"
                style={{ maxHeight: VIRTUAL_MAX_HEIGHT }}
                onScroll={useVirtualizedTrades ? handleTradesScroll : undefined}
              >
                <table className="min-w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <tr>
                      {tradeColumns.map((col) => (
                        <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                    {useVirtualizedTrades && topSpacerHeight > 0 && (
                      <tr style={{ height: `${topSpacerHeight}px` }}>
                        <td colSpan={tradeColumns.length} style={{ padding: 0 }}></td>
                      </tr>
                    )}
                    {visibleTrades.map((trade, idx) => {
                      const actualIndex = useVirtualizedTrades ? tradesRange.start + idx : idx
                      const exitTime = getField(trade, ['exit_time', 'exitTime', 'exit'])
                      const side = String(getField(trade, ['side', 'direction'], ''))
                      const reason = getField(trade, ['exit_reason', 'reason', 'exitReason'])
                      const pnlUsd = toNumber(getField(trade, ['pnl', 'profit', 'pnl_value', 'pnl_usdt']))
                      const pnlPct = toNumber(getField(trade, ['pnl_pct', 'pnl_percent', 'profit_pct']))
                      let feeEntry = toNumber(getField(trade, ['fees_entry']))
                      let feeExit = toNumber(getField(trade, ['fees_exit']))
                      if (feeEntry === 0 && feeExit === 0) {
                        const fallbackFee = toNumber(getField(trade, ['fee', 'fees', 'commission']))
                        feeEntry = fallbackFee
                      }
                      const entryPrice = toNumber(getField(trade, ['entry_price', 'entryPrice', 'open_price']))
                      const exitPrice = toNumber(getField(trade, ['exit_price', 'exitPrice', 'close_price']))
                      const units = toNumber(getField(trade, ['units', 'quantity', 'qty', 'size']))

                      return (
                        <tr key={`trade-${actualIndex}`} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} style={{ height: `${VIRTUAL_ROW_HEIGHT}px` }}>
                          {tradeColumns.map((col) => {
                            let content = ''
                            let cellClass = 'px-4 py-2 text-sm'

                            switch (col.key) {
                              case 'exit_time':
                                content = exitTime || '-'
                                break
                              case 'side':
                                content = side || '-'
                                break
                              case 'exit_reason':
                                content = reason || '-'
                                break
                              case 'pnl_usdt':
                                content = formatNumber(pnlUsd, 6)
                                cellClass += pnlUsd >= 0 ? ' text-green-500' : ' text-red-500'
                                break
                              case 'pnl_pct':
                                content = `${formatNumber(pnlPct, 2)}%`
                                break
                              case 'fees_entry':
                                content = formatNumber(feeEntry, 6)
                                break
                              case 'fees_exit':
                                content = formatNumber(feeExit, 6)
                                break
                              case 'entry_price':
                                content = formatNumber(entryPrice, 6)
                                break
                              case 'exit_price':
                                content = formatNumber(exitPrice, 6)
                                break
                              case 'units':
                                content = formatNumber(units, 6)
                                break
                              default:
                                content = '-'
                            }

                            return (
                              <td key={`${col.key}-${actualIndex}`} className={cellClass}>{content}</td>
                            )
                          })}
                        </tr>
                      )
                    })}
                    {useVirtualizedTrades && bottomSpacerHeight > 0 && (
                      <tr style={{ height: `${bottomSpacerHeight}px` }}>
                        <td colSpan={tradeColumns.length} style={{ padding: 0 }}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BacktestReportPage

