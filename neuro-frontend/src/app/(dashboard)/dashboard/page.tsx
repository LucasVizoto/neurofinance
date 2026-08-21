'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Components Imports
import TotalRevenueReport from '@views/dashboards/analytics/TotalRevenueReport'
import Vertical from '@/components/card-statistics/Vertical'

import axios from 'axios'

const DashboardAnalytics = () => {
  const [ticker, setTicker] = useState('PETR4.SA')
  const [inputTicker, setInputTicker] = useState('PETR4.SA')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async (symbol: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await axios.get(`http://localhost:3005/ai/dashboard?ticker=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(res.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData(ticker)
  }, [ticker])

  const handleSearch = () => {
    if (inputTicker.trim()) {
      setTicker(inputTicker.trim().toUpperCase())
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className="flex items-center gap-4 mb-6">
          <Typography variant="h5" className="font-semibold">Dashboard do Ativo</Typography>
          <TextField
            size="small"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value)}
            placeholder="Ex: PETR4.SA"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="contained" onClick={handleSearch} disabled={loading}>
            Buscar
          </Button>
        </div>
      </Grid>
      
      {loading && (
        <Grid size={{ xs: 12 }} className="flex justify-center p-10">
          <CircularProgress />
        </Grid>
      )}

      {!loading && data && data.success && (
        <>
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, lg: 8 }} order={{ xs: 2, lg: 1 }}>
                <TotalRevenueReport history={data.history} ticker={data.ticker} />
              </Grid>
              
              <Grid size={{ xs: 12, lg: 4 }} order={{ xs: 1, lg: 2 }}>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                    <Vertical
                      title={`Cotação Atual (${data.ticker})`}
                      imageSrc='/images/cards/wallet-info-bg.png'
                      stats={`R$ ${data.currentPrice?.toFixed(2)}`}
                      trendNumber={Number(Math.abs(data.trend || 0).toFixed(2))}
                      trend={(data.trend || 0) >= 0 ? 'positive' : 'negative'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                    <Vertical
                      title='Volume de Negociações'
                      imageSrc='/images/cards/paypal-error-bg.png'
                      stats={(data.currentVolume || 0).toLocaleString('pt-BR')}
                      trendNumber={0}
                      trend='positive'
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default DashboardAnalytics
