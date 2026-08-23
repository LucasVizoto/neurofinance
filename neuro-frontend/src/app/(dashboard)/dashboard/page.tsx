'use client'

import { useCallback, useEffect, useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import axios from 'axios'

import TotalRevenueReport from '@views/dashboards/analytics/TotalRevenueReport'
import MarketQuotesBar from '@views/dashboards/analytics/MarketQuotesBar'
import GrowthChart from '@views/dashboards/analytics/GrowthChart'
import TopValuations from '@views/dashboards/analytics/TopValuations'
import NewsFeed from '@views/dashboards/analytics/NewsFeed'
import Vertical from '@/components/card-statistics/Vertical'
import { GATEWAY_URL, authHeaders } from '@/libs/gateway'

const PERIODS = ['1D', '1W', '1M', '6M', '1Y'] as const
type Period = (typeof PERIODS)[number]

const formatPrice = (value?: number, currency = 'BRL') =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: currency === 'USD' ? 'USD' : 'BRL' })

const formatVolume = (value?: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(
    value ?? 0
  )

const formatMarketCap = (value?: number | null, currency = 'BRL') => {
  if (!value) return '—'
  const prefix = currency === 'USD' ? 'US$' : 'R$'
  if (value >= 1e12) return `${prefix} ${(value / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri`
  if (value >= 1e9) return `${prefix} ${(value / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`
  if (value >= 1e6) return `${prefix} ${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  return `${prefix} ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

const DashboardAnalytics = () => {
  const [ticker, setTicker] = useState('PETR4.SA')
  const [inputTicker, setInputTicker] = useState('PETR4.SA')
  const [period, setPeriod] = useState<Period>('1M')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quotes, setQuotes] = useState<any[]>([])
  const [quotesUpdatedAt, setQuotesUpdatedAt] = useState<string>()
  const [quotesLoading, setQuotesLoading] = useState(true)

  const [growth, setGrowth] = useState<{ series: any[]; totalGrowthPct: number }>({ series: [], totalGrowthPct: 0 })
  const [growthLoading, setGrowthLoading] = useState(true)

  const [valuations, setValuations] = useState<{ items: any[]; source?: string }>({ items: [] })
  const [valuationsLoading, setValuationsLoading] = useState(true)

  const [news, setNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  const fetchDashboardData = useCallback(async (symbol: string, selectedPeriod: Period) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${GATEWAY_URL}/ai/dashboard`, {
        params: { ticker: symbol, period: selectedPeriod },
        headers: authHeaders()
      })
      setData(res.data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Não foi possível carregar os dados do ativo.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGrowth = useCallback(async (symbol: string, selectedPeriod: Period) => {
    setGrowthLoading(true)
    try {
      const res = await axios.get(`${GATEWAY_URL}/ai/dashboard/growth`, {
        params: { ticker: symbol, period: selectedPeriod },
        headers: authHeaders()
      })
      setGrowth({
        series: res.data.series ?? [],
        totalGrowthPct: res.data.totalGrowthPct ?? 0
      })
    } catch (err) {
      console.error('Error fetching growth:', err)
      setGrowth({ series: [], totalGrowthPct: 0 })
    } finally {
      setGrowthLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadMarketWidgets = async () => {
      try {
        const [quotesRes, valuationsRes, newsRes] = await Promise.allSettled([
          axios.get(`${GATEWAY_URL}/ai/dashboard/quotes`, { headers: authHeaders() }),
          axios.get(`${GATEWAY_URL}/ai/dashboard/valuations`, { headers: authHeaders() }),
          axios.get(`${GATEWAY_URL}/ai/dashboard/news`, { headers: authHeaders() })
        ])

        if (quotesRes.status === 'fulfilled') {
          setQuotes(quotesRes.value.data.quotes ?? [])
          setQuotesUpdatedAt(quotesRes.value.data.updatedAt)
        }
        if (valuationsRes.status === 'fulfilled') {
          setValuations({
            items: valuationsRes.value.data.items ?? [],
            source: valuationsRes.value.data.source
          })
        }
        if (newsRes.status === 'fulfilled') {
          setNews(newsRes.value.data.articles ?? [])
        }
      } finally {
        setQuotesLoading(false)
        setValuationsLoading(false)
        setNewsLoading(false)
      }
    }

    loadMarketWidgets()
  }, [])

  useEffect(() => {
    fetchDashboardData(ticker, period)
    fetchGrowth(ticker, period)
  }, [ticker, period, fetchDashboardData, fetchGrowth])

  const handleSearch = () => {
    if (inputTicker.trim()) {
      setTicker(inputTicker.trim().toUpperCase())
    }
  }

  const thirdCard =
    data?.marketCap
      ? {
          title: 'Valor de mercado',
          icon: 'bx-pie-chart-alt-2',
          iconColor: 'success' as const,
          stats: formatMarketCap(data.marketCap, data.currency),
          trendLabel: data.peRatio ? `P/L ${Number(data.peRatio).toFixed(1)}` : undefined
        }
      : {
          title: 'Máxima / mínima do dia',
          icon: 'bx-transfer-alt',
          iconColor: 'success' as const,
          stats:
            data?.dayHigh && data?.dayLow
              ? `${formatPrice(data.dayLow, data.currency)} – ${formatPrice(data.dayHigh, data.currency)}`
              : '—'
        }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <MarketQuotesBar quotes={quotes} loading={quotesLoading} updatedAt={quotesUpdatedAt} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-center gap-3'>
          <Typography variant='h5' className='font-semibold whitespace-nowrap'>
            Dashboard do Ativo
          </Typography>
          <TextField
            size='small'
            value={inputTicker}
            onChange={e => setInputTicker(e.target.value)}
            placeholder='Ex: PETR4.SA'
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 140, maxWidth: 200 }}
          />
          <Button variant='contained' onClick={handleSearch} disabled={loading}>
            Buscar
          </Button>
          <ToggleButtonGroup
            exclusive
            size='small'
            value={period}
            onChange={(_event, value: Period | null) => {
              if (value) setPeriod(value)
            }}
            aria-label='Período do gráfico'
            sx={{
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                px: 1.5,
                minWidth: 44,
                whiteSpace: 'nowrap'
              }
            }}
          >
            {PERIODS.map(item => (
              <ToggleButton key={item} value={item}>
                {item}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='warning'>{error}</Alert>
        </Grid>
      )}

      {loading && (
        <Grid size={{ xs: 12 }} className='flex justify-center p-10'>
          <CircularProgress />
        </Grid>
      )}

      {!loading && data && data.success && (
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, lg: 8 }} order={{ xs: 2, lg: 1 }}>
              <TotalRevenueReport history={data.history} ticker={data.ticker} period={period} />
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }} order={{ xs: 1, lg: 2 }}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                  <Vertical
                    title={`Cotação atual · ${data.ticker}`}
                    icon='bx-dollar'
                    iconColor='primary'
                    stats={formatPrice(data.currentPrice)}
                    trendNumber={Number(Math.abs(data.trend || 0).toFixed(2))}
                    trend={(data.trend || 0) >= 0 ? 'positive' : 'negative'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                  <Vertical
                    title='Volume de negociações'
                    icon='bx-bar-chart-alt-2'
                    iconColor='info'
                    stats={formatVolume(data.currentVolume)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                  <Vertical
                    title={thirdCard.title}
                    icon={thirdCard.icon}
                    iconColor={thirdCard.iconColor}
                    stats={thirdCard.stats}
                    trendLabel={thirdCard.trendLabel}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      <Grid size={{ xs: 12, lg: 8 }}>
        <GrowthChart
          ticker={ticker}
          period={period}
          series={growth.series}
          totalGrowthPct={growth.totalGrowthPct}
          loading={growthLoading}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <TopValuations items={valuations.items} source={valuations.source} loading={valuationsLoading} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <NewsFeed articles={news} loading={newsLoading} />
      </Grid>
    </Grid>
  )
}

export default DashboardAnalytics
