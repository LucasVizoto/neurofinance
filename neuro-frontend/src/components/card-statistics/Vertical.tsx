// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { CardStatsVerticalProps } from '@/types/pages/widgetTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const Vertical = (props: CardStatsVerticalProps) => {
  const { title, icon = 'bx-line-chart', iconColor = 'primary', stats, trendNumber, trend, trendLabel } = props
  const showTrend = Boolean(trendLabel) || typeof trendNumber === 'number'

  return (
    <Card className='overflow-hidden h-full'>
      <CardContent className='flex items-start gap-3 min-w-0'>
        <CustomAvatar variant='rounded' skin='light' color={iconColor} size={42} className='shrink-0'>
          <i className={classnames(icon, 'text-[22px]')} />
        </CustomAvatar>

        <div className='min-w-0 flex-1 flex flex-col gap-1'>
          <Typography variant='body2' color='text.secondary' noWrap title={title} className='truncate'>
            {title}
          </Typography>

          <Tooltip title={stats}>
            <Typography
              variant='h4'
              noWrap
              className='truncate whitespace-nowrap text-xl sm:text-2xl leading-tight tabular-nums'
            >
              {stats}
            </Typography>
          </Tooltip>

          {showTrend && (
            <Typography
              color={trend === 'negative' ? 'error.main' : 'success.main'}
              className='flex gap-0.5 items-center whitespace-nowrap min-w-0'
            >
              {!trendLabel && (
                <i
                  className={classnames(
                    'text-lg shrink-0',
                    trend === 'negative' ? 'bx-down-arrow-alt' : 'bx-up-arrow-alt'
                  )}
                />
              )}
              <span className='text-[13px] font-medium truncate'>
                {trendLabel ?? `${Number(trendNumber ?? 0).toFixed(2)}%`}
              </span>
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Vertical
