'use client'

import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'

import CustomAvatar from '@core/components/mui/Avatar'
import { useSettings } from '@core/hooks/useSettings'
import type { AppDispatch, RootState } from '@/redux-store'
import { clearUser } from '@/redux-store/slices/user'
import { getInitials } from '@/utils/getInitials'
import { useFeedback } from '@/components/heroui'

const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { settings } = useSettings()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.userReducer.data)
  const { confirm } = useFeedback()

  const displayName = user?.fullname || user?.username || 'Usuário'
  const displayEmail = user?.email || ''
  const avatarUrl = user?.profileImageUrl || undefined

  const handleDropdownOpen = () => {
    setOpen(prev => !prev)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    const confirmed = await confirm({
      title: 'Sair do sistema',
      description: 'Tem certeza que deseja sair do sistema?',
      confirmLabel: 'Sair',
      cancelLabel: 'Cancelar',
      status: 'warning'
    })

    if (!confirmed) return

    localStorage.removeItem('token')
    dispatch(clearUser())
    setOpen(false)
    router.push('/login')
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2.5'
      >
        <CustomAvatar
          ref={anchorRef}
          alt={displayName}
          src={avatarUrl}
          onClick={handleDropdownOpen}
          className='cursor-pointer'
        >
          {getInitials(displayName)}
        </CustomAvatar>
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-5 gap-2 min-w-0' tabIndex={-1}>
                    <CustomAvatar size={40} alt={displayName} src={avatarUrl}>
                      {getInitials(displayName)}
                    </CustomAvatar>
                    <div className='flex items-start flex-col min-w-0'>
                      <Typography variant='h6' className='truncate max-is-[160px]'>
                        {displayName}
                      </Typography>
                      <Typography variant='body2' color='text.disabled' className='truncate max-is-[160px]'>
                        {displayEmail}
                      </Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3' onClick={e => handleDropdownClose(e, '/profile')}>
                    <i className='bx-user' />
                    <Typography color='text.primary'>Meu Perfil</Typography>
                  </MenuItem>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3' onClick={handleUserLogout}>
                    <i className='bx-power-off' />
                    <Typography color='text.primary'>Sair</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
