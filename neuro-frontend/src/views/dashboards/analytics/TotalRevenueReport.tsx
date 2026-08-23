'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'

import { historyTickAmount, historyXAxisFormat, toHistorySeries } from '@/libs/charts/historyAxis'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  history: Array<{ date: string; price: number; volume: number }>
  ticker: string
  period?: string
}

const TotalRevenueReport = ({ history, ticker, period }: Props) => {
  const theme = useTheme()
  const points = history ?? []

  const series = [
    {
      name: 'Cotação (R$)',
      data: toHistorySeries(points.map(item => ({ date: item.date, value: item.price })))
    }
  ]

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      redrawOnParentResize: true,
      redrawOnWindowResize: true
    },
    tooltip: {
      shared: false,
      x: { format: historyXAxisFormat(period) }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['var(--mui-palette-primary-main)'],
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -20, bottom: 0, left: 16, right: 16 }
    },
    xaxis: {
      type: 'datetime',
      tickAmount: historyTickAmount(points.length),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        datetimeUTC: false,
        format: historyXAxisFormat(period),
        hideOverlappingLabels: true,
        rotate: 0,
        trim: false,
        minHeight: 28,
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        },
        formatter: (val: number) => `R$ ${val.toFixed(2)}`
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title={`Histórico de Cotação - ${ticker}`}
        subheader={period ? `Período ${period}` : undefined}
        titleTypographyProps={{ noWrap: true, className: 'truncate' }}
      />
      <CardContent>
        <AppReactApexCharts type='line' height={400} width='100%' series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default TotalRevenueReport
