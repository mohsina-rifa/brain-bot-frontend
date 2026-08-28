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
}

/**
 * The one data-fetching primitive for this app.
 *
 * Deliberately hand-rolled rather than pulling in TanStack Query: everything
 * TASK.md asks for — loading, empty, success, failure, recovery, and clarity
 * on slow operations — is covered by these refs.
 *
 * Requests are aborted when the owning scope is disposed, so a component that
 * unmounts mid-flight cannot write to a dead ref.
 */
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
    // The clock covers the whole run, retries included: what the user cares
    // about is how long they have been waiting, not which attempt we are on.
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
          // A newer call superseded this one. Its own run() owns the refs now,
          // so leave them alone.
          if (signal.aborted) return null

          if (attempt === attempts || !isRetryable(err)) {
            error.value = toMessage(err)
            return null
          }

          retrying.value = true
          // 300ms, 600ms, 1200ms — enough to ride out a blip without making a
          // genuinely dead server feel like a hang.
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

  /** Re-run with the same arguments. This is what every Retry button calls. */
  const retry = () => run(...(lastArgs ?? ([] as unknown as A)))

  onScopeDispose(() => {
    controller?.abort()
    clearSlowTimer()
  })

  if (immediate) void run(...([] as unknown as A))

  return { data, loading, error, slow, retrying, run, retry }
}
