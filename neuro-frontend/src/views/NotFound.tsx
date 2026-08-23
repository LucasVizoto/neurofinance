'use client'

import Link from 'next/link'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import BrandScene from '@/components/brand/BrandScene'
import Logo from '@components/layout/shared/Logo'

const NotFound = () => {
  return (
    <BrandScene className='min-bs-[100dvh]' contentClassName='min-bs-[100dvh]' showFloorGlow>
      <Link href='/dashboard' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px] z-10'>
        <Logo color='#f8f7ff' />
      </Link>
      <div className='flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-6 min-bs-[100dvh] p-6 md:p-12'>
        <div className='flex flex-col gap-5 max-is-[560px] text-center lg:text-start'>
          <Typography
            component='h1'
            className='brand-gradient-text font-extrabold leading-none'
            sx={{ fontSize: { xs: '6.5rem', md: '8.5rem' }, letterSpacing: '-0.06em' }}
          >
            404
          </Typography>
          <Typography variant='h4' className='text-white font-semibold'>
            Página não encontrada
          </Typography>
          <Typography className='text-white/70 text-base md:text-lg max-is-[460px] mx-auto lg:mx-0'>
            Ops! Parece que essa página saiu de órbita. Mas não se preocupe, vamos te ajudar a voltar ao caminho certo.
          </Typography>
          <div className='flex justify-center lg:justify-start mbs-2'>
            <Button
              href='/dashboard'
              component={Link}
              variant='contained'
              sx={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 10px 28px rgb(124 58 237 / 0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #9333EA 0%, #4F46E5 100%)' }
              }}
            >
              Voltar ao início
            </Button>
          </div>
        </div>
        <div className='relative flex items-end justify-center max-is-[560px] is-full'>
          <img
            alt='Robô NeuroFinance confuso'
            src='/images/illustrations/404-error-image.png'
            className='object-contain bs-[280px] sm:bs-[360px] md:bs-[440px] lg:bs-[520px] is-auto mix-blend-screen'
          />
        </div>
      </div>
    </BrandScene>
  )
}

export default NotFound
