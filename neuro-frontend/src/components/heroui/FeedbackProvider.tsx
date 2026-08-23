'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { Alert, type AlertStatus } from './Alert'
import { AlertDialog, type AlertDialogStatus } from './AlertDialog'
import './heroui.css'

export type NotifyOptions = {
  status?: AlertStatus
  title: string
  description?: string
  duration?: number
}

export type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  status?: Extract<AlertDialogStatus, 'danger' | 'warning'>
}

type FeedbackContextValue = {
  notify: (options: NotifyOptions) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

type ToastItem = NotifyOptions & { id: string }

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const dismiss = useCallback((id: string) => {
    setToasts(current => current.filter(item => item.id !== id))
  }, [])

  const notify = useCallback(
    (options: NotifyOptions) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts(current => [...current, { id, status: 'accent', ...options }])
      const duration = options.duration ?? 4500
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setDialog(options)
    })
  }, [])

  const closeDialog = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm])
  const dialogStatus = dialog?.status ?? 'warning'

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className='feedback-toast-stack' aria-live='polite'>
        {toasts.map(toast => (
          <Alert key={toast.id} status={toast.status}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{toast.title}</Alert.Title>
              {toast.description ? <Alert.Description>{toast.description}</Alert.Description> : null}
            </Alert.Content>
            <button type='button' className='alert-close' aria-label='Fechar' onClick={() => dismiss(toast.id)}>
              <i className='bx-x' />
            </button>
          </Alert>
        ))}
      </div>
      <AlertDialog>
        <AlertDialog.Backdrop isOpen={Boolean(dialog)} onOpenChange={open => !open && closeDialog(false)}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className='sm:max-w-[400px]'>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status={dialogStatus} />
                <AlertDialog.Heading>{dialog?.title}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>{dialog?.description}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <button type='button' className='hero-btn hero-btn--tertiary' onClick={() => closeDialog(false)}>
                  {dialog?.cancelLabel || 'Cancelar'}
                </button>
                <button
                  type='button'
                  className={`hero-btn ${dialogStatus === 'danger' ? 'hero-btn--danger' : 'hero-btn--warning'}`}
                  onClick={() => closeDialog(true)}
                >
                  {dialog?.confirmLabel || 'Confirmar'}
                </button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider')
  }
  return context
}
