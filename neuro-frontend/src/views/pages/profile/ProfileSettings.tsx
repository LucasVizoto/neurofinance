'use client'

import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, useFeedback } from '@/components/heroui'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import type { AppDispatch, RootState } from '@/redux-store'
import { updateProfile } from '@/redux-store/slices/user'
import { getInitials } from '@/utils/getInitials'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 2 * 1024 * 1024

const ProfileSettings = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { data: user, saving, error } = useSelector((state: RootState) => state.userReducer)
  const { notify } = useFeedback()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferenceTicker, setPreferenceTicker] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setFullname(user.fullname || '')
    setUsername(user.username || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setPreferenceTicker(user.preferenceTicker || '')
    setPreview(user.profileImageUrl || null)
  }, [user])

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      const message = 'Formato inválido. Use JPG, PNG, WEBP ou GIF.'
      setLocalError(message)
      notify({ status: 'danger', title: 'Arquivo inválido', description: message })
      return
    }
    if (file.size > MAX_SIZE) {
      const message = 'A imagem deve ter no máximo 2MB.'
      setLocalError(message)
      notify({ status: 'danger', title: 'Arquivo inválido', description: message })
      return
    }

    setLocalError(null)
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    try {
      await dispatch(
        updateProfile({
          fields: { fullname, username, email, phone, preferenceTicker },
          avatar: avatarFile
        })
      ).unwrap()
      setAvatarFile(null)
      notify({ status: 'success', title: 'Perfil atualizado com sucesso' })
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Não foi possível salvar o perfil.'
      setLocalError(message)
      notify({ status: 'danger', title: 'Falha ao atualizar o perfil', description: message })
    }
  }

  const displayName = fullname || username || 'Usuário'

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Meu perfil
        </Typography>
        <Typography color='text.secondary'>Atualize seus dados e a foto usada no NeuroFinance.</Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card className='h-full'>
          <CardContent className='flex flex-col items-center gap-4 py-8'>
            <Box
              className='relative cursor-pointer'
              onClick={() => fileInputRef.current?.click()}
              sx={{ width: 120, height: 120, '&:hover .avatar-overlay': { opacity: 1 } }}
            >
              <CustomAvatar alt={displayName} src={preview || undefined} size={120} className='text-3xl'>
                {getInitials(displayName)}
              </CustomAvatar>
              <Box
                className='avatar-overlay absolute inset-0 flex items-center justify-center rounded-full'
                sx={{
                  bgcolor: 'rgba(0,0,0,0.55)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <i className='bx-camera text-2xl text-white' />
              </Box>
            </Box>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/gif'
              hidden
              onChange={handleSelectFile}
            />
            <div className='text-center'>
              <Typography variant='h5'>{displayName}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {email}
              </Typography>
            </div>
            <Button variant='tonal' startIcon={<i className='bx-image' />} onClick={() => fileInputRef.current?.click()}>
              Trocar foto
            </Button>
            <Typography variant='caption' color='text.disabled' className='text-center'>
              JPG, PNG, WEBP ou GIF · máximo 2MB
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title='Dados da conta' subheader='As alterações entram em vigor após salvar' />
          <CardContent>
            <form className='flex flex-col gap-5' onSubmit={handleSubmit}>
              {(localError || error) && (
                <Alert status='danger'>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Não foi possível salvar</Alert.Title>
                    <Alert.Description>{localError || error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              <CustomTextField
                fullWidth
                label='Nome completo'
                value={fullname}
                onChange={e => setFullname(e.target.value)}
                required
              />
              <div className='flex flex-col sm:flex-row gap-5'>
                <CustomTextField
                  fullWidth
                  label='Username'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
                <CustomTextField
                  fullWidth
                  type='email'
                  label='E-mail'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='flex flex-col sm:flex-row gap-5'>
                <CustomTextField fullWidth label='Telefone' value={phone} onChange={e => setPhone(e.target.value)} />
                <CustomTextField
                  fullWidth
                  label='Ticker preferido'
                  placeholder='PETR4.SA'
                  value={preferenceTicker}
                  onChange={e => setPreferenceTicker(e.target.value.toUpperCase())}
                />
              </div>
              <div className='flex justify-end'>
                <Button type='submit' variant='contained' disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <i className='bx-save' />}>
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProfileSettings
