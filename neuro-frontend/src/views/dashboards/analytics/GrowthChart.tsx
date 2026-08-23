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

import { historyTickAmount, toHistorySeries } from '@/libs/charts/historyAxis'

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
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      redrawOnParentResize: true,
      redrawOnWindowResize: true
    },
    tooltip: {
      x: { format: 'MMM yyyy' },
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
      xaxis: { lines: { show: false } },
      padding: { top: -10, bottom: 0, left: 10, right: 10 }
    },
    xaxis: {
      type: 'datetime',
      tickAmount: historyTickAmount(series.length),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        datetimeUTC: false,
        format: 'MMM yy',
        hideOverlappingLabels: true,
        rotate: 0,
        minHeight: 28,
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
            series={[{ name: 'Fechamento', data: toHistorySeries(series.map(p => ({ date: p.date, value: p.close }))) }]}
            options={options}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default GrowthChart
