'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFeedback } from '@/components/heroui'
import BrandScene from '@/components/brand/BrandScene'

const LoginCallbackClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { notify } = useFeedback()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      notify({
        status: 'danger',
        title: 'Falha no login com Google',
        description: 'O provedor não retornou um token válido.'
      })
      router.replace('/login?error=google')
      return
    }

    localStorage.setItem('token', token)
    router.replace('/dashboard')
  }, [notify, router, searchParams])

  return (
    <BrandScene className='min-bs-[100dvh]' contentClassName='flex min-bs-[100dvh] items-center justify-center text-white/80'>
      Entrando com o Google...
    </BrandScene>
  )
}

export default LoginCallbackClient
