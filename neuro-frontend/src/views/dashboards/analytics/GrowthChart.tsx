'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Point = { date: string; close: number; growthPct: number }

type Props = {
  ticker: string
  period?: string
  series: Point[]
  totalGrowthPct: number
  loading: boolean
}

const GrowthChart = ({ ticker, period, series, totalGrowthPct, loading }: Props) => {
  const theme = useTheme()
  const up = totalGrowthPct >= 0

  const options: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    tooltip: {
      y: {
        formatter: (val: number) =>
          val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    colors: [up ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)'],
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      padding: { top: -10, bottom: -10, left: 10, right: 10 }
    },
    xaxis: {
      categories: series.map(p => p.date),
      labels: {
        rotate: -45,
        hideOverlappingLabels: true,
        style: { colors: 'var(--mui-palette-text-disabled)', fontFamily: theme.typography.fontFamily }
      }
    },
    yaxis: {
      labels: {
        style: { colors: 'var(--mui-palette-text-disabled)', fontFamily: theme.typography.fontFamily },
        formatter: (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
      }
    }
  }

  return (
    <Card className='h-full'>
      <CardHeader
        title='Crescimento mensal'
        subheader={`Série · ${ticker}${period ? ` · ${period}` : ''}`}
        action={
          <Chip
            size='small'
            color={up ? 'success' : 'error'}
            variant='tonal'
            label={`${up ? '+' : ''}${totalGrowthPct.toFixed(1)}% acum.`}
            className='whitespace-nowrap'
          />
        }
      />
      <CardContent>
        {loading ? (
          <Skeleton variant='rounded' height={320} />
        ) : series.length === 0 ? (
          <Typography color='text.secondary'>Sem histórico mensal para este ticker.</Typography>
        ) : (
          <AppReactApexCharts
            type='area'
            height={320}
            width='100%'
            series={[{ name: 'Fechamento', data: series.map(p => p.close) }]}
            options={options}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default GrowthChart
