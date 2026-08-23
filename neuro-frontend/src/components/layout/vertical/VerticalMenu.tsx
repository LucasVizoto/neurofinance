'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import ModeDropdown from '../shared/ModeDropdown'
import UserDropdown from '../shared/UserDropdown'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='bx-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { transitionDuration, isBreakpointReached } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // O wrapper externo precisa ocupar toda a altura e usar flex para empurrar o footer para baixo
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Área scrollável do menu — ocupa todo o espaço disponível */}
      <Box sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <ScrollWrapper
          {...(isBreakpointReached
            ? {
                className: 'bs-full overflow-y-auto overflow-x-hidden',
                onScroll: (container: any) => scrollMenu(container, false)
              }
            : {
                options: { wheelPropagation: false, suppressScrollX: true },
                onScrollY: (container: any) => scrollMenu(container, true)
              })}
        >
          {/* Vertical Menu */}
          <Menu
            popoutMenuOffset={{ mainAxis: 27 }}
            menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
            renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
            renderExpandedMenuItemIcon={{ icon: <i className='bx-bxs-circle' /> }}
            menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
          >
            <MenuItem href='/dashboard' icon={<i className='bx-trending-up' />}>
              Dashboard
            </MenuItem>
            <MenuItem href='/chat' icon={<i className='bx-chat' />}>
              Chat
            </MenuItem>
            <MenuItem href='/profile' icon={<i className='bx-user' />}>
              Perfil
            </MenuItem>
          </Menu>
        </ScrollWrapper>
      </Box>

      {/* Footer fixo no rodapé do sidebar */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 2,
          px: 2
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-around'
          spacing={1}
          sx={{ width: '100%' }}
        >
          {/* Ícone de tema fica ACIMA do avatar do usuário */}
          <ModeDropdown />
          <UserDropdown />
        </Stack>
      </Box>
    </Box>
  )
}

export default VerticalMenu
