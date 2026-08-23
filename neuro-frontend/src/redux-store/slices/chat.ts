// Third-party Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// Type Imports
import type { StatusType, ChatDataType, ChatType, ContactType } from '@/types/apps/chatTypes'

const API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3005'

// Axios configurado com credentials
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// MOCK CONTACT — Agente NeuroFinance
const neuroAgentContact: ContactType = {
  id: 999,
  fullName: 'NeuroFinance AI',
  role: 'Especialista em Ações',
  about: 'Seu assistente especializado no mercado financeiro.',
  avatarColor: 'primary',
  status: 'online'
}

type ExtendedChatDataType = ChatDataType & {
  activeChatId?: string | null
  loadingAnalysis?: boolean
}

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
  contacts: [neuroAgentContact],
  chats: [],
  activeUser: undefined,
  activeChatId: null,
  loadingAnalysis: false,
}

// ─────────────────────────────────────────────
// ASYNC THUNKS
// ─────────────────────────────────────────────

export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (token: string, { rejectWithValue }) => {
    try {
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(atob(payloadBase64))
      const userId = payload.sub
      if (!userId) throw new Error('Invalid token: missing sub')

      const response = await axiosInstance.get(`/chats/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.chats ?? response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createNewChat = createAsyncThunk(
  'chat/createNewChat',
  async ({ initialContext, token }: { initialContext: string, token: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/chats', { initialContext }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.chat ?? response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async ({ chatId, token }: { chatId: number, token: string }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return chatId
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (mongoId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || ''
      const response = await axiosInstance.get(`/ai/chat/${mongoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
      return {
        mongoId,
        requestMessage: message,
        responseMessage: response.data.response,
        structured: response.data.structured ?? null
      }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const analyzeAsset = createAsyncThunk(
  'chat/analyzeAsset',
  async ({ ticker, mongoId, token }: { ticker: string, mongoId: string, token: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/analyze', { ticker, mongo_id: mongoId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { mongoId, ticker, result: response.data }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// ─────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
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
      const chatsData = Array.isArray(action.payload) ? action.payload : []
      const newChats: ChatType[] = chatsData.map((c: any) => ({
        id: c.id,
        userId: neuroAgentContact.id,
        mongoId: c.mongo_id,
        title: c.initialContext,
        unseenMsgs: 0,
        chat: []
      }))
      state.chats = newChats
    })
    builder.addCase(fetchChats.rejected, (_state, action) => {
      console.error('[fetchChats] error:', action.payload)
    })

    // CREATE CHAT
    builder.addCase(createNewChat.fulfilled, (state, action) => {
      const createdChat = action.payload
      const newChat: ChatType = {
        id: createdChat.id,
        userId: neuroAgentContact.id,
        mongoId: createdChat.mongo_id,
        title: createdChat.initialContext,
        unseenMsgs: 0,
        chat: []
      }
      state.chats.unshift(newChat)
      state.activeUser = neuroAgentContact
      state.activeChatId = createdChat.mongo_id
    })
    builder.addCase(createNewChat.rejected, (_state, action) => {
      console.error('[createNewChat] error:', action.payload)
    })

    // DELETE CHAT
    builder.addCase(deleteChat.fulfilled, (state, action) => {
      const deletedId = action.payload as number
      state.chats = state.chats.filter((c: any) => c.id !== deletedId)
      // Se o chat excluído era o ativo, limpar seleção
      const wasActive = state.chats.find((c: any) => c.id === deletedId)
      if (!wasActive) {
        // já foi removido — verificar se era o ativo
      }
      // Reset activeUser se não há mais chats com esse mongoId
      if (state.activeChatId && !state.chats.some((c: any) => c.mongoId === state.activeChatId)) {
        state.activeChatId = null
        state.activeUser = undefined
      }
    })
    builder.addCase(deleteChat.rejected, (_state, action) => {
      console.error('[deleteChat] error:', action.payload)
    })

    // FETCH CHAT HISTORY
    builder.addCase(fetchChatHistory.fulfilled, (state, action) => {
      const { mongoId, data } = action.payload
      // @ts-ignore
      const chatToUpdate = state.chats.find(c => c.mongoId === mongoId)
      if (chatToUpdate && data.messages) {
        chatToUpdate.chat = data.messages.map((m: any) => {
          const raw = m.content
          const message = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
          return {
            message,
            time: new Date(),
            senderId: m.type === 'ai' ? neuroAgentContact.id : state.profileUser.id,
            msgStatus: { isSent: true, isDelivered: true, isSeen: true }
          }
        })
      }
    })
    builder.addCase(fetchChatHistory.rejected, (_state, action) => {
      console.error('[fetchChatHistory] error:', action.payload)
    })

    // SEND MESSAGE
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const { mongoId, requestMessage, responseMessage, structured } = action.payload

      // @ts-ignore
      const existingChat = state.chats.find(chat => chat.mongoId === mongoId)
      if (existingChat) {
        // Mensagem do usuário
        existingChat.chat.push({
          message: requestMessage,
          time: new Date(),
          senderId: state.profileUser.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })
        // Resposta do agente — salvar JSON estruturado se existir
        existingChat.chat.push({
          message: structured ? JSON.stringify(structured) : responseMessage,
          time: new Date(),
          senderId: neuroAgentContact.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })

        // Mover para o topo
        state.chats = state.chats.filter((c: any) => c.mongoId !== mongoId)
        state.chats.unshift(existingChat)
      }
    })
    builder.addCase(sendMessage.rejected, (_state, action) => {
      console.error('[sendMessage] error:', action.payload)
    })

    // ANALYZE ASSET
    builder.addCase(analyzeAsset.pending, (state) => {
      state.loadingAnalysis = true
    })
    builder.addCase(analyzeAsset.fulfilled, (state, action) => {
      state.loadingAnalysis = false
      const { mongoId, ticker, result } = action.payload

      // @ts-ignore
      const existingChat = state.chats.find(chat => chat.mongoId === mongoId)
      if (existingChat && result.success && result.analysis) {
        existingChat.chat.push({
          message: `Analisar ativo ${ticker}`,
          time: new Date(),
          senderId: state.profileUser.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })
        existingChat.chat.push({
          message: JSON.stringify(result.analysis),
          time: new Date(),
          senderId: neuroAgentContact.id,
          msgStatus: { isSent: true, isDelivered: true, isSeen: true }
        })
        state.chats = state.chats.filter((c: any) => c.mongoId !== mongoId)
        state.chats.unshift(existingChat)
      }
    })
    builder.addCase(analyzeAsset.rejected, (state, action) => {
      state.loadingAnalysis = false
      console.error('[analyzeAsset] error:', action.payload)
    })
  }
})

export const { getActiveUserData, setActiveChat, setUserStatus } = chatSlice.actions

export default chatSlice.reducer
