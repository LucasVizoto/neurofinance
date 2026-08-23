'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode
} from 'react'

export type AlertDialogStatus = 'default' | 'accent' | 'success' | 'warning' | 'danger'

type OverlayContextValue = {
  close: () => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

function AlertDialogRoot({ children }: { children?: ReactNode }) {
  return <div className='alert-dialog'>{children}</div>
}

type BackdropProps = HTMLAttributes<HTMLDivElement> & {
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  isDismissable?: boolean
  children?: ReactNode
}

function Backdrop({
  isOpen = false,
  onOpenChange,
  isDismissable = false,
  className,
  children,
  ...props
}: BackdropProps) {
  const close = useCallback(() => onOpenChange?.(false), [onOpenChange])

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <OverlayContext.Provider value={{ close }}>
      <div
        className={['alert-dialog__backdrop', 'alert-dialog__backdrop--opaque', className].filter(Boolean).join(' ')}
        onClick={() => {
          if (isDismissable) close()
        }}
        {...props}
      >
        {children}
      </div>
    </OverlayContext.Provider>
  )
}

function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert-dialog__container', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function Dialog({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role='alertdialog'
      aria-modal='true'
      className={['alert-dialog__dialog', className].filter(Boolean).join(' ')}
      onClick={event => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

function Header({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert-dialog__header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function Heading({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={['alert-dialog__heading', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </h2>
  )
}

function Body({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert-dialog__body', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function Footer({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['alert-dialog__footer', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function Icon({
  status = 'default',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status?: AlertDialogStatus }) {
  const iconByStatus: Record<AlertDialogStatus, string> = {
    default: 'bx-info-circle',
    accent: 'bx-info-circle',
    success: 'bx-check-circle',
    warning: 'bx-error',
    danger: 'bx-error-circle'
  }

  return (
    <span className={['alert-dialog__icon', `alert-dialog__icon--${status}`, className].filter(Boolean).join(' ')} {...props}>
      {children ?? <i className={iconByStatus[status]} />}
    </span>
  )
}

function CloseTrigger({ className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const overlay = useContext(OverlayContext)

  return (
    <button
      type='button'
      aria-label='Fechar'
      className={['alert-dialog__close-trigger', className].filter(Boolean).join(' ')}
      onClick={event => {
        onClick?.(event)
        overlay?.close()
      }}
      {...props}
    >
      <i className='bx-x' />
    </button>
  )
}

export const AlertDialog = Object.assign(AlertDialogRoot, {
  Backdrop,
  Container,
  Dialog,
  Header,
  Heading,
  Body,
  Footer,
  Icon,
  CloseTrigger
})
