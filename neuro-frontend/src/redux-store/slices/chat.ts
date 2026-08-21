// Third-party Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// Type Imports
import type { StatusType, ChatDataType, ChatType, ContactType } from '@/types/apps/chatTypes'

const API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3005'

// Configurações do Axios para enviar credentials (cookies de sessão, etc)
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Para enviar cookies
})

// MOCK CONTACT para o Agente NeuroFinance
const neuroAgentContact: ContactType = {
  id: 999, // Agent ID mockado
  fullName: 'NeuroFinance AI',
  role: 'Especialista em Ações',
  about: 'Seu assistente especializado no mercado financeiro.',
  avatarColor: 'primary',
  status: 'online'
}

type ExtendedChatDataType = ChatDataType & { activeChatId?: string | null }

const initialState: ExtendedChatDataType = {
  profileUser: {
    id: 1,
    avatar: '/images/avatars/1.png',
    fullName: 'Investidor',
    role: 'Usuário',
    about: 'Sessão ativa.',
    status: 'online',
    settings: {
      isNotificationsOn: true,
      isTwoStepAuthVerificationEnabled: false
    }
  },
  contacts: [neuroAgentContact], // Apenas o nosso agente
  chats: [],
  activeUser: undefined,
  activeChatId: null
}

// ----------------- ASYNC THUNKS ----------------- //

export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/chats/user/${userId}`)
      // Retorna array de chats: [{ id, mongoId, title, createdAt }]
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createNewChat = createAsyncThunk(
  'chat/createNewChat',
  async ({ title, token }: { title?: string, token: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/chats', { title }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data // Retorna o chat recém criado
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (mongoId: string, { rejectWithValue }) => {
    try {
      // O gateway encaminha para /ai/chat/:mongoId
      const response = await axiosInstance.get(`/ai/chat/${mongoId}`)
      return { mongoId, data: response.data }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ mongoId, message, ticker, token }: { mongoId: string, message: string, ticker?: string, token: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/chat', { mongo_id: mongoId, message, ticker }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { mongoId, requestMessage: message, responseMessage: response.data.response }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Esse reducer é chamado localmente quando clicamos num contato/chat na sidebar
    getActiveUserData: (state, action: PayloadAction<number>) => {
      const activeUser = state.contacts.find(user => user.id === action.payload)
      const chat = state.chats.find(chat => chat.userId === action.payload)

      if (chat && chat.unseenMsgs > 0) {
        chat.unseenMsgs = 0
      }

      if (activeUser) {
        state.activeUser = activeUser
      }
    },
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChatId = action.payload
      state.activeUser = neuroAgentContact
    },
    setUserStatus: (state, action: PayloadAction<{ status: StatusType }>) => {
      state.profileUser = {
        ...state.profileUser,
        status: action.payload.status
      }
    }
  },
  extraReducers: (builder) => {
    // FETCH CHATS
    builder.addCase(fetchChats.fulfilled, (state, action) => {
      // action.payload = array de chats do BD: { id, mongoId, title, createdAt }
      // O template espera: { id, userId, unseenMsgs, chat: UserChatType[] }
      
      const newChats: ChatType[] = action.payload.map((c: any) => ({
        id: c.id, // ID interno (Postgres)
        userId: neuroAgentContact.id, // O "userId" no template é o ID do contato com quem estamos conversando
        mongoId: c.mongoId, // Guardar o mongoId
        title: c.title,
        unseenMsgs: 0,
        chat: [] // Histórico será preenchido depois
      }))
      state.chats = newChats
    })
    
    // CREATE CHAT
    builder.addCase(createNewChat.fulfilled, (state, action) => {
      const createdChat = action.payload
      const newChat: ChatType = {
        id: createdChat.id,
        userId: neuroAgentContact.id,
        mongoId: createdChat.mongoId,
        title: createdChat.title,
        unseenMsgs: 0,
        chat: []
      }
      state.chats.unshift(newChat)
      state.activeUser = neuroAgentContact
      state.activeChatId = createdChat.mongoId
    })
    
    // FETCH HISTORY
    builder.addCase(fetchChatHistory.fulfilled, (state, action) => {
      const { mongoId, data } = action.payload
      // Encontrar o chat no state
      // @ts-ignore
      const chatToUpdate = state.chats.find(c => c.mongoId === mongoId)
      if (chatToUpdate && data.messages) {
        // mapear mensagens
        chatToUpdate.chat = data.messages.map((m: any) => ({
          message: m.content,
          time: new Date(),
          senderId: m.type === 'ai' ? neuroAgentContact.id : state.profileUser.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        }))
      }
    })
    
    // SEND MESSAGE
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const { mongoId, requestMessage, responseMessage } = action.payload
      
      // @ts-ignore
      const existingChat = state.chats.find(chat => chat.mongoId === mongoId)
      if (existingChat) {
        existingChat.chat.push({
          message: requestMessage,
          time: new Date(),
          senderId: state.profileUser.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })
        existingChat.chat.push({
          message: responseMessage,
          time: new Date(),
          senderId: neuroAgentContact.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })
        
        // Mover para o topo
        state.chats = state.chats.filter((c: any) => c.mongoId !== mongoId)
        state.chats.unshift(existingChat)
      }
    })
  }
})

export const { getActiveUserData, setActiveChat, setUserStatus } = chatSlice.actions

export default chatSlice.reducer
