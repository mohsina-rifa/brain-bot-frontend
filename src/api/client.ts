import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) onUnauthorized?.()
    return Promise.reject(error)
  },
)

export function toMessage(error: unknown): string {
  const err = error as AxiosError<ApiError>

  if (err?.code === 'ECONNABORTED') return 'That took too long. Check the backend is running, then try again.'
  if (err?.response) {
    const body = err.response.data
    if (Array.isArray(body?.message)) return body.message.join('. ')
    if (body?.message && typeof body.message === 'object') {
      return Object.values(body.message).join('. ')
    }
    if (typeof body?.message === 'string') return body.message
    return `Request failed with status ${err.response.status}.`
  }
  if (err?.request) return 'Could not reach the server. Check the backend is running on port 4040.'
  return 'Something went wrong. Try again.'
}

export default client
