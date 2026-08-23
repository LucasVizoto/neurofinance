import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginCallbackClient from './LoginCallbackClient'

export const metadata: Metadata = {
  title: 'Login com Google',
  description: 'Finalizando autenticação com Google'
}

const LoginCallbackPage = () => {
  return (
    <Suspense fallback={<div className='flex min-bs-[100dvh] items-center justify-center'>Entrando...</div>}>
      <LoginCallbackClient />
    </Suspense>
  )
}

export default LoginCallbackPage
