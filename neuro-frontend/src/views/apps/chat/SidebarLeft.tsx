'use client'

// React Imports
import { useState } from 'react'
import type { ReactNode, RefObject } from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { ChatDataType, StatusObjType } from '@/types/apps/chatTypes'
import type { AppDispatch } from '@/redux-store'

// Slice Imports
import { createNewChat, deleteChat, fetchChatHistory } from '@/redux-store/slices/chat'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomChip from '@core/components/mui/Chip'
import UserProfileLeft from './UserProfileLeft'
import AvatarWithBadge from './AvatarWithBadge'
import CustomTextField from '@core/components/mui/TextField'
import { useFeedback } from '@/components/heroui'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { formatDateToMonthShort } from './utils'

export const statusObj: StatusObjType = {
  busy: 'error',
  away: 'warning',
  online: 'success',
  offline: 'secondary'
}

type Props = {
  chatStore: ChatDataType
  getActiveUserData: (id: number) => void
  dispatch: AppDispatch
  backdropOpen: boolean
  setBackdropOpen: (value: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
  isBelowLgScreen: boolean
  isBelowMdScreen: boolean
  isBelowSmScreen: boolean
  messageInputRef: RefObject<HTMLDivElement>
}

type RenderChatType = {
  chatStore: ChatDataType
  getActiveUserData: (id: number) => void
  setSidebarOpen: (value: boolean) => void
  backdropOpen: boolean
  setBackdropOpen: (value: boolean) => void
  isBelowMdScreen: boolean
  dispatch: AppDispatch
  onDeleteChat: (chat: { id: number; title?: string }) => void
}

// ─────────────────────────────────────────────
// Chat list renderer (with delete button)
// ─────────────────────────────────────────────
const renderChat = (props: RenderChatType) => {
  const { chatStore, getActiveUserData, setSidebarOpen, backdropOpen, setBackdropOpen, isBelowMdScreen, dispatch, onDeleteChat } = props

  if (chatStore.chats.length === 0) {
    return (
      <li className='flex flex-col items-center justify-center gap-3 py-10 text-center opacity-60'>
        <i className='bx-message-rounded-dots text-5xl text-primary' />
        <Typography variant='body2'>Nenhum chat ainda.<br />Clique em "Novo Chat" para começar.</Typography>
      </li>
    )
  }

  return chatStore.chats.map((chat: any) => {
    const contact = chatStore.contacts.find(contact => contact.id === chat.userId) || chatStore.contacts[0]
    const isChatActive = (chatStore as any).activeChatId === chat.mongoId

    // Pegar o último snippet de mensagem (evitar mostrar JSON bruto)
    const lastMsg = chat.chat.length ? chat.chat[chat.chat.length - 1].message : null
    let lastMsgPreview = lastMsg
    if (lastMsg) {
      try {
        const parsed = JSON.parse(lastMsg)
        if (parsed?.tipo === 'analise_estruturada') {
          lastMsgPreview = `📊 Análise de ${parsed.ticker} — ${parsed.recomendacao}`
        }
      } catch { /* not JSON */ }
    }

    return (
      <li
        key={chat.id}
        className={classnames(
          'group flex items-center gap-3 pli-3 plb-2 cursor-pointer rounded-lg mbe-1 transition-all',
          {
            'bg-primary shadow-primarySm': isChatActive,
            'text-[var(--mui-palette-primary-contrastText)]': isChatActive,
            'hover:bg-actionHover': !isChatActive
          }
        )}
        onClick={() => {
          dispatch(fetchChatHistory(chat.mongoId) as any)
          dispatch({ type: 'chat/setActiveChat', payload: chat.mongoId } as any)
          getActiveUserData(chat.userId)
          isBelowMdScreen && setSidebarOpen(false)
          isBelowMdScreen && backdropOpen && setBackdropOpen(false)
        }}
      >
        <AvatarWithBadge
          src={'/images/avatars/bot-icon.jpg'}
          isChatActive={isChatActive}
          alt={contact.fullName}
          badgeColor={statusObj[contact.status]}
          color={contact.avatarColor}
        />
        <div className='min-is-0 flex-auto'>
          <Typography
            color='inherit'
            className='truncate font-medium'
            style={{ maxWidth: 160 }}
          >
            {chat.title
              ? (chat.title.length > 28 ? chat.title.substring(0, 25) + '...' : chat.title)
              : contact?.fullName}
          </Typography>
          <Typography variant='body2' color={isChatActive ? 'inherit' : 'text.secondary'} className='truncate'>
            {lastMsgPreview ?? contact.role}
          </Typography>
        </div>
        <div className='flex flex-col items-end justify-start gap-1 shrink-0'>
          <Typography
            variant='body2'
            color='inherit'
            className={classnames('truncate text-xs', { 'text-textDisabled': !isChatActive })}
          >
            {chat.chat.length ? formatDateToMonthShort(chat.chat[chat.chat.length - 1].time) : null}
          </Typography>
          {/* Botão excluir — visível no hover ou quando ativo */}
          <Tooltip title='Excluir chat' placement='left'>
            <IconButton
              size='small'
              className={classnames(
                'opacity-0 group-hover:opacity-100 transition-opacity',
                { 'opacity-100': isChatActive }
              )}
              sx={{
                color: isChatActive ? 'rgba(255,255,255,0.8)' : 'error.main',
                '&:hover': { color: 'error.main', backgroundColor: 'rgba(255,77,77,0.12)' },
                padding: '2px',
              }}
              onClick={e => {
                e.stopPropagation()
                onDeleteChat({ id: chat.id, title: chat.title })
              }}
            >
              <i className='bx-trash text-base' />
            </IconButton>
          </Tooltip>
          {chat.unseenMsgs > 0
            ? <CustomChip round='true' label={chat.unseenMsgs} color='error' size='small' />
            : null}
        </div>
      </li>
    )
  })
}

// ─────────────────────────────────────────────
// Scroll wrapper
// ─────────────────────────────────────────────
const ScrollWrapper = ({ children, isBelowLgScreen }: { children: ReactNode; isBelowLgScreen: boolean }) => {
  if (isBelowLgScreen) {
    return <div className='bs-full overflow-y-auto overflow-x-hidden'>{children}</div>
  } else {
    return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
  }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const SidebarLeft = (props: Props) => {
  const {
    chatStore,
    getActiveUserData,
    dispatch,
    backdropOpen,
    setBackdropOpen,
    sidebarOpen,
    setSidebarOpen,
    isBelowLgScreen,
    isBelowMdScreen,
    isBelowSmScreen,
    messageInputRef
  } = props

  const [userSidebar, setUserSidebar] = useState(false)
  const { confirm, notify } = useFeedback()

  const handleDeleteChat = async (chat: { id: number; title?: string }) => {
    const confirmed = await confirm({
      title: 'Excluir conversa',
      description: `Tem certeza que deseja excluir ${chat.title ? `"${chat.title}"` : 'esta conversa'}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      status: 'danger'
    })

    if (!confirmed) return

    const token = localStorage.getItem('token') || ''
    dispatch(deleteChat({ chatId: chat.id, token }) as any)
  }

  const handleNewChat = () => {
    if (chatStore.chats.length >= 5) {
      notify({
        status: 'danger',
        title: 'Limite de chats atingido',
        description: 'Exclua uma conversa para criar outra. O máximo é 5 chats.',
        duration: 5000
      })
      return
    }
    const token = localStorage.getItem('token') || ''
    dispatch(createNewChat({ initialContext: 'Nova consulta ao NeuroFinance', token }) as any)
    isBelowMdScreen && setSidebarOpen(false)
    setBackdropOpen(false)
    messageInputRef.current?.focus()
  }

  return (
    <>
      <Drawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className='bs-full'
        variant={!isBelowMdScreen ? 'permanent' : 'persistent'}
        ModalProps={{ disablePortal: true, keepMounted: true }}
        sx={{
          zIndex: isBelowMdScreen && sidebarOpen ? 11 : 10,
          position: !isBelowMdScreen ? 'static' : 'absolute',
          ...(isBelowSmScreen && sidebarOpen && { width: '100%' }),
          '& .MuiDrawer-paper': {
            overflow: 'hidden',
            boxShadow: 'none',
            width: isBelowSmScreen ? '100%' : '370px',
            position: !isBelowMdScreen ? 'static' : 'absolute'
          }
        }}
      >
        {/* Header */}
        <div className='flex items-center plb-[19px] pli-6 gap-4 border-be'>
          <AvatarWithBadge
            alt={chatStore.profileUser.fullName}
            src={chatStore.profileUser.avatar}
            badgeColor={statusObj[chatStore.profileUser.status]}
            onClick={() => setUserSidebar(true)}
          />
          <div className='flex is-full items-center flex-auto sm:gap-x-3'>
            <Button
              fullWidth
              variant='contained'
              color='primary'
              onClick={handleNewChat}
              startIcon={<i className='bx-plus' />}
            >
              Novo Chat
            </Button>
            {isBelowMdScreen && (
              <IconButton
                className='mis-2'
                size='small'
                onClick={() => {
                  setSidebarOpen(false)
                  setBackdropOpen(false)
                }}
              >
                <i className='bx-x text-2xl' />
              </IconButton>
            )}
          </div>
        </div>

        {/* Contador de chats */}
        <div className='flex items-center justify-between px-4 py-2 border-be bg-backgroundDefault'>
          <Typography variant='caption' color='text.secondary'>
            Conversas
          </Typography>
          <Typography
            variant='caption'
            color={chatStore.chats.length >= 5 ? 'error' : 'text.secondary'}
            fontWeight={600}
          >
            {chatStore.chats.length}/5
          </Typography>
        </div>

        {/* Chat List */}
        <ScrollWrapper isBelowLgScreen={isBelowLgScreen}>
          <ul className='p-3 pbs-4'>
            {renderChat({
              chatStore,
              getActiveUserData,
              backdropOpen,
              setSidebarOpen,
              isBelowMdScreen,
              setBackdropOpen,
              dispatch,
              onDeleteChat: handleDeleteChat
            })}
          </ul>
        </ScrollWrapper>
      </Drawer>

      <UserProfileLeft
        userSidebar={userSidebar}
        setUserSidebar={setUserSidebar}
        profileUserData={chatStore.profileUser}
        dispatch={dispatch}
        isBelowLgScreen={isBelowLgScreen}
        isBelowSmScreen={isBelowSmScreen}
      />
    </>
  )
}

export default SidebarLeft
