import type { ReactNode } from 'react'

import './brand-scene.css'

type BrandSceneProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  showFloorGlow?: boolean
}

const BrandScene = ({ children, className, contentClassName, showFloorGlow = false }: BrandSceneProps) => {
  return (
    <div className={['brand-scene', className].filter(Boolean).join(' ')}>
      <div className='brand-scene__glow brand-scene__glow--a' />
      <div className='brand-scene__glow brand-scene__glow--b' />
      {showFloorGlow ? <div className='brand-scene__glow brand-scene__glow--floor' /> : null}
      <div className='brand-scene__particles' />
      <div className={['brand-scene__content', contentClassName].filter(Boolean).join(' ')}>{children}</div>
    </div>
  )
}

export default BrandScene
