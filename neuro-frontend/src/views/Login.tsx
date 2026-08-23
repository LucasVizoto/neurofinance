'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import AuthSplitLayout from '@/components/brand/AuthSplitLayout'
import BrandHeroCopy from '@/components/brand/BrandHeroCopy'
import { useFeedback } from '@/components/heroui'
import { GATEWAY_URL } from '@/libs/gateway'

const LoginV2 = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const { notify } = useFeedback()
  const router = useRouter()

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'google') {
      notify({
        status: 'danger',
        title: 'Falha no login com Google',
        description: 'Não foi possível autenticar com a conta Google. Tente novamente.'
      })
    }
  }, [notify])

  return (
    <AuthSplitLayout
      hero={
        <BrandHeroCopy
          title={
            <>
              Inteligência que transforma <span className='brand-accent'>decisões</span> em{' '}
              <span className='brand-accent'>resultados</span>.
            </>
          }
          description='Combinamos análise financeira e IA para gerar insights preditivos e apoiar suas decisões com confiança.'
        />
      }
    >
      <Link href='/login' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
        <Logo color='#f8f7ff' />
      </Link>
      <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
        <div className='flex flex-col gap-1'>
          <Typography variant='h4'>Bem-vindo ao NeuroFinance</Typography>
          <Typography className='text-white/70'>Entre na sua conta para continuar.</Typography>
        </div>
        <form
          noValidate
          autoComplete='off'
          onSubmit={async e => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const email = formData.get('email') as string
            const password = formData.get('password') as string
            try {
              const response = await fetch(`${GATEWAY_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              })
              if (response.ok) {
                const data = await response.json()
                localStorage.setItem('token', data.token)
                router.push('/dashboard')
              } else {
                const err = await response.json().catch(() => ({}))
                notify({
                  status: 'danger',
                  title: 'Falha no login',
                  description: err.message ?? response.statusText
                })
              }
            } catch (err) {
              console.error(err)
              notify({
                status: 'danger',
                title: 'Erro de conexão',
                description: 'Não foi possível contatar o servidor de autenticação.'
              })
            }
          }}
          className='flex flex-col gap-5'
        >
          <CustomTextField name='email' autoFocus fullWidth label='E-mail' placeholder='user@email.com' />
          <CustomTextField
            name='password'
            fullWidth
            label='Senha'
            placeholder='············'
            type={isPasswordShown ? 'text' : 'password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                      <i className={isPasswordShown ? 'bx-hide' : 'bx-show'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
            <FormControlLabel control={<Checkbox />} label='Lembrar-me' />
            <Typography className='text-end brand-accent' component={Link}>
              Esqueceu a senha?
            </Typography>
          </div>
          <Button fullWidth variant='contained' type='submit'>
            Entrar
          </Button>
          <div className='flex justify-center items-center flex-wrap gap-2'>
            <Typography>Novo por aqui?</Typography>
            <Typography component={Link} href='/register' className='brand-accent'>
              Criar uma conta
            </Typography>
          </div>
          <Divider className='gap-2'>ou</Divider>
          <GoogleAuthButton />
        </form>
      </div>
    </AuthSplitLayout>
  )
}

export default LoginV2
