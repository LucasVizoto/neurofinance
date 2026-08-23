'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

// Third Party Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  history: Array<{ date: string; price: number; volume: number }>
  ticker: string
  period?: string
}

const TotalRevenueReport = ({ history, ticker, period }: Props) => {
  // Hooks
  const theme = useTheme()

  const dates = history ? history.map(item => item.date) : []
  const prices = history ? history.map(item => item.price) : []

  const series = [
    { name: 'Cotação (R$)', data: prices }
  ]

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { shared: false },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['var(--mui-palette-primary-main)'],
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: { top: -20, bottom: -10, left: 20, right: 20 }
    },
    xaxis: {
      categories: dates,
      labels: {
        rotate: period === '1D' || period === '1W' ? -45 : 0,
        hideOverlappingLabels: true,
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
