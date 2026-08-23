'use client'

import type { ReactNode } from 'react'

import classnames from 'classnames'

import BrandScene from './BrandScene'
import { useSettings } from '@core/hooks/useSettings'

type AuthSplitLayoutProps = {
  hero: ReactNode
  children: ReactNode
}

const AuthSplitLayout = ({ hero, children }: AuthSplitLayoutProps) => {
  const { settings } = useSettings()

  return (
    <div className='flex bs-full justify-center min-bs-[100dvh]'>
      <BrandScene
        showFloorGlow
        className={classnames('hidden md:block flex-1 min-bs-[100dvh]', {
          'border-ie': settings.skin === 'bordered'
        })}
        contentClassName='flex items-center is-full bs-full p-8 xl:p-12'
      >
        {hero}
      </BrandScene>
      <aside className='auth-form-panel'>{children}</aside>
    </div>
  )
}

export default AuthSplitLayout
