export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

export const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
})
