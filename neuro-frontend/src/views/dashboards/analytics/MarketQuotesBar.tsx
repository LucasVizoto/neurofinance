'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

type Quote = {
  id: string
  label: string
  from: string
  to: string
  currency: string
  rate: number
  changePct: number
}

type Props = {
  quotes: Quote[]
  loading: boolean
  updatedAt?: string
}

const ICONS: Record<string, string> = {
  USD: 'bx-dollar',
  EUR: 'bx-euro',
  XAU: 'bx-crown',
  XAG: 'bx-diamond'
}

const formatRate = (quote: Quote) => {
  if (quote.currency === 'BRL') {
    return quote.rate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return quote.rate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const MarketQuotesBar = ({ quotes, loading, updatedAt }: Props) => {
  return (
    <Card
      className='overflow-hidden bg-primaryLighter'
    >
      <CardContent className='py-3 px-4 sm:px-6'>
        <div className='flex items-center justify-between gap-3 mbe-3'>
          <Typography variant='caption' className='uppercase tracking-wide font-semibold' color='text.secondary'>
            Cotações globais
          </Typography>
          {updatedAt && (
            <Typography variant='caption' color='text.disabled' className='whitespace-nowrap'>
              Atualizado {new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
        </div>

        <div className='flex gap-3 overflow-x-auto pb-1' style={{ scrollbarWidth: 'thin' }}>
          {(loading ? [1, 2, 3, 4] : quotes).map((item, index) => {
            if (loading) {
              return (
                <Box key={index} className='min-is-[160px] flex-1 rounded-lg p-3' sx={{ bgcolor: 'background.paper' }}>
                  <Skeleton width={72} />
                  <Skeleton width={110} height={32} />
                </Box>
              )
            }

            const quote = item as Quote
            const up = quote.changePct >= 0

            return (
              <Box
                key={quote.id}
                className='min-is-[170px] flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5'
                sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
              >
                <i className={`${ICONS[quote.id] || 'bx-line-chart'} text-2xl text-primary shrink-0`} />
                <div className='min-w-0 flex-1'>
                  <Typography variant='caption' color='text.secondary' className='block truncate'>
                    {quote.label}
                    <span className='opacity-70'> · {quote.from}/{quote.to}</span>
                  </Typography>
                  <div className='flex items-baseline justify-between gap-2'>
                    <Typography variant='h6' className='truncate whitespace-nowrap tabular-nums'>
                      {formatRate(quote)}
                    </Typography>
                    <Typography
                      variant='caption'
                      className='whitespace-nowrap shrink-0 font-medium'
                      color={up ? 'success.main' : 'error.main'}
                    >
                      {up ? '+' : ''}
                      {quote.changePct.toFixed(2)}%
                    </Typography>
                  </div>
                </div>
              </Box>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketQuotesBar
