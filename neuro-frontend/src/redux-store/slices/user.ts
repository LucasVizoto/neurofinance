import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { GATEWAY_URL, authHeaders } from '@/libs/gateway'

export type AuthUser = {
  id: string
  username: string
  email: string
  fullname: string
  phone?: string | null
  profileImageUrl?: string | null
  profileImageName?: string | null
  preferenceTicker?: string | null
  customColor?: string | null
}

type UserState = {
  data: AuthUser | null
  loading: boolean
  saving: boolean
  error: string | null
}

const initialState: UserState = {
  data: null,
  loading: false,
  saving: false,
  error: null
}

export const fetchMe = createAsyncThunk('user/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${GATEWAY_URL}/me`, {
      headers: authHeaders(),
      withCredentials: true
    })
    return response.data.user as AuthUser
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message)
  }
})

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (
    payload: { fields: Record<string, string>; avatar?: File | null },
    { rejectWithValue }
  ) => {
    try {
      const form = new FormData()
      Object.entries(payload.fields).forEach(([key, value]) => {
        if (value != null && String(value).trim() !== '') {
          form.append(key, String(value).trim())
        }
      })
      if (payload.avatar) {
        form.append('avatar', payload.avatar)
      }

      const response = await axios.put(`${GATEWAY_URL}/users/profile`, form, {
        headers: authHeaders(),
        withCredentials: true
      })
      return response.data.user as AuthUser
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: () => initialState
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMe.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false
        state.error = String(action.payload || 'Não foi possível carregar o perfil.')
      })
      .addCase(updateProfile.pending, state => {
        state.saving = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false
        state.data = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false
        state.error = String(action.payload || 'Não foi possível salvar o perfil.')
      })
  }
})

export const { clearUser } = userSlice.actions
export default userSlice.reducer
