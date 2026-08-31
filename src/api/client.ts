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

let sessionEnded = false

export function isSessionEnded(): boolean {
  return sessionEnded
}

export function setSessionEnded(value: boolean) {
  sessionEnded = value
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

export function toFieldErrors(error: unknown): Record<string, string> {
  const body = (error as AxiosError<ApiError>)?.response?.data
  const message = body?.message
  if (!message || typeof message !== 'object' || Array.isArray(message)) return {}
  return message as Record<string, string>
}

/**
 * A status code tells the user nothing. Each of these says what failed and what
 * to do next, so no screen ever has to render a bare number.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'The server rejected those values. Check the fields and try again.',
  401: 'Your session has expired. Sign in again to continue.',
  403: 'You do not have permission to do that.',
  404: 'That is no longer there — it may have been deleted. Go back and refresh the list.',
  409: 'Someone else changed this first. Reload the page and try again.',
  413: 'That is too large to upload. Try a smaller file.',
  422: 'The server could not process those values. Check the fields and try again.',
  429: 'Too many requests in a row. Wait a few seconds, then try again.',
  500: 'The server hit an error handling that. Try again in a moment.',
  502: 'The server is not responding. Check it is running on port 4040, then try again.',
  503: 'The server is temporarily unavailable. Try again in a moment.',
  504: 'The server took too long to respond. Try again in a moment.',
}

/**
 * NestJS defaults a bare status name into the message for several codes —
 * "Unauthorized", "Not Found". That is the status code in words, which helps
 * nobody, so it is dropped in favour of our own wording.
 */
const JARGON = new Set([
  'unauthorized',
  'forbidden',
  'not found',
  'bad request',
  'conflict',
  'internal server error',
  'service unavailable',
  'payload too large',
  'unprocessable entity',
  'too many requests',
])

function isJargon(message: string): boolean {
  return JARGON.has(message.trim().toLowerCase())
}

export function toMessage(error: unknown): string {
  const err = error as AxiosError<ApiError>

  if (err?.code === 'ECONNABORTED') {
    return 'That took too long and was given up on. Check the backend is running, then try again.'
  }

  if (err?.response) {
    const status = err.response.status
    const body = err.response.data

    // Prefer the backend's own wording when it sent something readable — it is
    // more specific than anything generic we could substitute.
    if (Array.isArray(body?.message)) return body.message.join('. ')
    if (body?.message && typeof body.message === 'object') {
      return Object.values(body.message).join('. ')
    }
    if (typeof body?.message === 'string' && body.message.trim() && !isJargon(body.message)) {
      return body.message
    }

    return STATUS_MESSAGES[status] ?? 'That request did not go through. Try again.'
  }

  if (err?.request) {
    return navigator.onLine
      ? 'Could not reach the server. Check the backend is running on port 4040, then try again.'
      : 'You appear to be offline. Reconnect, then try again.'
  }

  return 'Something went wrong. Try again.'
}

/**
 * The deliberate half of the retry policy: only failures that a second attempt
 * could plausibly fix. A 4xx means the request itself was wrong, so repeating it
 * just wastes the user's time; an abort was our own doing.
 */
export function isRetryable(error: unknown): boolean {
  if (axios.isCancel(error)) return false

  const err = error as AxiosError
  if (err?.code === 'ECONNABORTED') return true
  if (!err?.response) return true

  const status = err.response.status
  return status === 429 || (status >= 500 && status < 600)
}

/**
 * The narrow case the write queue is allowed to act on: the browser itself has
 * no connection, so the request never left the machine.
 *
 * Deliberately not "any request that failed". A 400 will fail again in ten
 * minutes' time, and a server that is down while the browser is online is a
 * local backend the user can restart — promising either one will be sent later
 * is a promise we cannot keep.
 */
export function isOffline(error: unknown): boolean {
  if (axios.isCancel(error)) return false
  const err = error as AxiosError
  return !err?.response && !navigator.onLine
}

export default client
