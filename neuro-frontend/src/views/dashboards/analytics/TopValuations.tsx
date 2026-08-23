'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

type Valuation = {
  symbol: string
  name: string
  sector: string
  marketCap: number
  peRatio: number | null
}

type Props = {
  items: Valuation[]
  source?: string
  loading: boolean
}

const formatCap = (value: number) => {
  if (value >= 1e12) return `US$ ${(value / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri`
  if (value >= 1e9) return `US$ ${(value / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`
  return `US$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

const TopValuations = ({ items, source, loading }: Props) => {
  return (
    <Card className='h-full'>
      <CardHeader
        title='Top 5 Valuations'
        subheader='Maiores market caps do universo acompanhado'
        action={
          source ? (
            <Chip size='small' variant='outlined' label={source === 'mock' ? 'referência' : source} className='whitespace-nowrap' />
          ) : null
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} variant='rounded' />)
          : items.map((item, index) => (
              <div key={item.symbol} className='flex items-center gap-3 min-w-0'>
                <div className='flex items-center justify-center is-8 bs-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0'>
                  {index + 1}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <Typography variant='h6' className='truncate'>
                      {item.symbol}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' className='truncate hidden sm:inline'>
                      {item.sector}
                    </Typography>
                  </div>
                  <Typography variant='body2' color='text.secondary' className='truncate'>
                    {item.name}
                  </Typography>
                </div>
                <div className='text-end shrink-0 min-w-0'>
                  <Typography variant='body2' className='whitespace-nowrap font-medium tabular-nums'>
                    {formatCap(item.marketCap)}
                  </Typography>
                  <Typography variant='caption' color='text.disabled' className='whitespace-nowrap'>
                    P/L {item.peRatio != null ? item.peRatio.toFixed(1) : '—'}
                  </Typography>
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  )
}

export default TopValuations
