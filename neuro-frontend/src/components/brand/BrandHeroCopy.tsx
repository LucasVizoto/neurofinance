'use client'

import type { ReactNode } from 'react'

import Typography from '@mui/material/Typography'

import { BRAND_FEATURES } from './marketing'

type BrandHeroCopyProps = {
  title: ReactNode
  description: string
}

const BrandHeroCopy = ({ title, description }: BrandHeroCopyProps) => {
  return (
    <div className='flex items-center justify-between gap-8 is-full'>
      <div className='flex flex-col gap-6 max-is-[440px]'>
        <Typography
          component='h1'
          className='text-white font-extrabold'
          sx={{ fontSize: { md: '2rem', xl: '2.5rem' }, lineHeight: 1.15 }}
        >
          {title}
        </Typography>
        <Typography className='text-white/70 text-base'>{description}</Typography>
        <ul className='flex flex-col gap-4 mbs-2'>
          {BRAND_FEATURES.map(feature => (
            <li key={feature.title} className='flex items-start gap-3'>
              <span className='brand-feature-icon'>
                <i className={feature.icon} />
              </span>
              <div>
                <Typography className='text-white font-semibold'>{feature.title}</Typography>
                <Typography className='text-white/65 text-sm'>{feature.description}</Typography>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <img
        src='/images/illustrations/login-bot.png'
        alt='Assistente NeuroFinance'
        className='hidden lg:block object-contain max-bs-[560px] max-is-[min(46vw,620px)] mix-blend-screen drop-shadow-[0_20px_60px_rgba(124,58,237,0.35)]'
      />
    </div>
  )
}

export default BrandHeroCopy
