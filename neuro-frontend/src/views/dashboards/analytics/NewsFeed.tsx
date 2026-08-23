'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

type Article = {
  title: string
  url: string
  source: string
  summary: string
  publishedAt: string
  image?: string | null
  sentiment: string
}

type Props = {
  articles: Article[]
  loading: boolean
}

const sentimentColor = (label: string): 'success' | 'error' | 'warning' | 'default' => {
  const value = label.toLowerCase()
  if (value.includes('bullish')) return 'success'
  if (value.includes('bearish')) return 'error'
  if (value.includes('neutral')) return 'default'
  return 'warning'
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const NewsFeed = ({ articles, loading }: Props) => {
  return (
    <Card>
      <CardHeader title='Notícias recentes' subheader='Feed NEWS_SENTIMENT · mercado de ações' />
      <CardContent>
        <Grid container spacing={4}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Skeleton variant='rounded' height={210} />
                </Grid>
              ))
            : articles.length === 0
              ? (
                <Grid size={{ xs: 12 }}>
                  <Typography color='text.secondary'>Nenhuma notícia disponível no momento.</Typography>
                </Grid>
              )
              : articles.map(article => (
                  <Grid key={article.url || article.title} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card variant='outlined' className='h-full flex flex-col overflow-hidden'>
                      {article.image ? (
                        <img
                          src={article.image}
                          alt=''
                          className='w-full object-cover'
                          style={{ height: 120 }}
                          onError={event => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <CardContent className='flex flex-col gap-2 flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <Typography variant='caption' color='text.secondary' className='truncate'>
                            {article.source}
                          </Typography>
                          <Chip
                            size='small'
                            variant='outlined'
                            color={sentimentColor(article.sentiment)}
                            label={article.sentiment}
                            className='shrink-0'
                          />
                        </div>
                        <Link
                          href={article.url || undefined}
                          target='_blank'
                          rel='noopener noreferrer'
                          underline='hover'
                          color='inherit'
                        >
                          <Typography variant='h6' className='line-clamp-2'>
                            {article.title}
                          </Typography>
                        </Link>
                        <Typography variant='body2' color='text.secondary' className='line-clamp-3 flex-1'>
                          {article.summary}
                        </Typography>
                        <Typography variant='caption' color='text.disabled' className='whitespace-nowrap'>
                          {formatDate(article.publishedAt)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default NewsFeed
