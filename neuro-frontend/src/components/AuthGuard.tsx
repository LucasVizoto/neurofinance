'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'

import type { AppDispatch } from '@/redux-store'
import { fetchMe } from '@/redux-store/slices/user'
import BrandScene from '@/components/brand/BrandScene'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }

    dispatch(fetchMe())
      .unwrap()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        localStorage.removeItem('token')
        router.replace('/login')
      })
  }, [dispatch, router])

  if (!isAuthenticated) {
    return (
      <BrandScene className='min-bs-[100dvh]' contentClassName='flex min-bs-[100dvh] items-center justify-center text-white/80'>
        Carregando...
      </BrandScene>
    )
  }

  return <>{children}</>
}
