'use client'

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react'

export type AlertStatus = 'default' | 'accent' | 'success' | 'warning' | 'danger'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  status?: AlertStatus
  children?: ReactNode
}

const AlertStatusContext = createContext<AlertStatus>('default')

const STATUS_ICON: Record<AlertStatus, string> = {
  default: 'bx-info-circle',
  accent: 'bx-info-circle',
  success: 'bx-check-circle',
  warning: 'bx-error',
  danger: 'bx-x-circle'
}

function AlertRoot({ status = 'default', className, children, ...props }: AlertProps) {
  return (
    <AlertStatusContext.Provider value={status}>
      <div role='alert' className={['alert', `alert--${status}`, className].filter(Boolean).join(' ')} {...props}>
        {children}
      </div>
    </AlertStatusContext.Provider>
  )
}

function Indicator({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const status = useContext(AlertStatusContext)

  return (
    <span className={['alert__indicator', className].filter(Boolean).join(' ')} {...props}>
      {children ?? <i className={STATUS_ICON[status]} />}
    </span>
  )
}

function Content({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert__content', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function Title({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={['alert__title', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  )
}

function Description({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert__description', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export const Alert = Object.assign(AlertRoot, {
  Indicator,
  Content,
  Title,
  Description
})
