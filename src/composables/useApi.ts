import { ref, shallowRef, onScopeDispose, type Ref } from 'vue'
import { isRetryable, toMessage } from '@/api/client'

/** How long a request may run before we tell the user it is taking a while. */
export const SLOW_AFTER_MS = 5000

export interface UseApiOptions {
  /** Run immediately on creation. Default false. */
  immediate?: boolean
  /**
   * Total attempts, including the first. Default 1 — no retry.
   *
   * Leave it at 1 for anything that writes. A POST that appears to fail may
   * still have been applied on the server, so retrying it risks creating the
   * same record twice. Reads are safe to repeat, so list loads pass 3.
   */
  attempts?: number
  /** Base backoff in milliseconds; doubles each attempt. */
  backoffMs?: number
}

export interface UseApi<T, A extends unknown[]> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  /** True once a request has been running longer than SLOW_AFTER_MS. */
  slow: Ref<boolean>
  /** True while waiting out the backoff between two attempts. */
  retrying: Ref<boolean>
  run: (...args: A) => Promise<T | null>
  retry: () => Promise<T | null>
  cancel: () => void
}

export function useApi<T, A extends unknown[] = []>(
  fn: (signal: AbortSignal, ...args: A) => Promise<T>,
  options: UseApiOptions = {},
): UseApi<T, A> {
  const { immediate = false, attempts = 1, backoffMs = 300 } = options

  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const slow = ref(false)
  const retrying = ref(false)

  let controller: AbortController | null = null
  let slowTimer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A

  function clearSlowTimer() {
    if (slowTimer) clearTimeout(slowTimer)
    slowTimer = null
  }

  function settle() {
    loading.value = false
    slow.value = false
    retrying.value = false
    clearSlowTimer()
  }

  async function run(...args: A): Promise<T | null> {
    lastArgs = args
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null
    slow.value = false
    retrying.value = false
    clearSlowTimer()
    slowTimer = setTimeout(() => {
      slow.value = true
    }, SLOW_AFTER_MS)

    try {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const result = await fn(signal, ...args)
          if (signal.aborted) return null
          data.value = result
          return result
        } catch (err) {
          if (signal.aborted) return null

          if (attempt === attempts || !isRetryable(err)) {
            error.value = toMessage(err)
            return null
          }

          retrying.value = true
          await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** (attempt - 1)))
          if (signal.aborted) return null
          retrying.value = false
        }
      }
      return null
    } finally {
      if (!signal.aborted) settle()
    }
  }

  function cancel() {
    if (!loading.value) return
    controller?.abort()
    controller = null
    settle()
    error.value =
      'Stopped waiting for the server. Nothing was changed — try again when you are ready.'
  }

  const retry = () => run(...(lastArgs ?? ([] as unknown as A)))

  onScopeDispose(() => {
    controller?.abort()
    clearSlowTimer()
  })

  if (immediate) void run(...([] as unknown as A))

  return { data, loading, error, slow, retrying, run, retry, cancel }
}
