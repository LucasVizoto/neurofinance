'use client'

import { useState } from 'react'
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

const RegisterV2 = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const { notify } = useFeedback()
  const router = useRouter()

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  return (
    <AuthSplitLayout
      hero={
        <BrandHeroCopy
          title={
            <>
              A jornada começa com uma <span className='brand-accent'>conta</span> e melhores{' '}
              <span className='brand-accent'>resultados</span>.
            </>
          }
          description='Crie seu acesso ao NeuroFinance e use IA para analisar ativos, acompanhar o mercado e decidir com mais confiança.'
        />
      }
    >
      <Link href='/login' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
        <Logo color='#f8f7ff' />
      </Link>
      <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
        <div className='flex flex-col gap-1'>
          <Typography variant='h4'>Crie sua conta</Typography>
          <Typography className='text-white/70'>Preencha os dados para começar.</Typography>
        </div>
        <form
          noValidate
          autoComplete='off'
          onSubmit={async e => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const username = formData.get('username') as string
            const email = formData.get('email') as string
            const password = formData.get('password') as string
            const fullname = formData.get('fullname') as string
            const cpf = formData.get('cpf') as string
            const phone = formData.get('phone') as string

            try {
              const response = await fetch(`${GATEWAY_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, fullname, cpf, phone })
              })
              if (response.ok) {
                notify({
                  status: 'success',
                  title: 'Conta criada com sucesso',
                  description: 'Faça login para começar a usar o NeuroFinance.'
                })
                router.push('/login')
              } else {
                const err = await response.json().catch(() => ({}))
                notify({
                  status: 'danger',
                  title: 'Falha no cadastro',
                  description: err.message ?? 'Não foi possível criar a conta.'
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
          <CustomTextField name='username' autoFocus fullWidth label='Username' placeholder='johndoe' />
          <CustomTextField name='fullname' fullWidth label='Nome completo' placeholder='João Silva' />
          <CustomTextField name='cpf' fullWidth label='CPF' placeholder='12345678901' />
          <CustomTextField name='phone' fullWidth label='Telefone' placeholder='11999999999' />
          <CustomTextField name='email' fullWidth label='E-mail' placeholder='user@email.com' />
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
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label={
              <>
                <span>Concordo com a </span>
                <Link className='brand-accent' href='/' onClick={e => e.preventDefault()}>
                  política de privacidade
                </Link>
              </>
            }
          />
          <Button fullWidth variant='contained' type='submit'>
            Criar conta
          </Button>
          <div className='flex justify-center items-center flex-wrap gap-2'>
            <Typography>Já tem uma conta?</Typography>
            <Typography component={Link} href='/login' className='brand-accent'>
              Entrar
            </Typography>
          </div>
          <Divider className='gap-2'>ou</Divider>
          <GoogleAuthButton label='Cadastrar com Google' />
        </form>
      </div>
    </AuthSplitLayout>
  )
}

export default RegisterV2
