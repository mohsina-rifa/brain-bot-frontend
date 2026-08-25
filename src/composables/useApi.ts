import { ref, shallowRef, onScopeDispose, type Ref } from 'vue'
import { toMessage } from '@/api/client'

export interface UseApiOptions {
  /** Run immediately on creation. Default true. */
  immediate?: boolean
  /** Retry attempts on failure, with backoff. Default 1 (no retry). */
  attempts?: number
}

export interface UseApi<T, A extends unknown[]> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  /** True once a request has been running longer than 5 seconds. */
  slow: Ref<boolean>
  run: (...args: A) => Promise<T | null>
  retry: () => Promise<T | null>
}

/**
 * The one data-fetching primitive for this app.
 *
 * Deliberately hand-rolled rather than pulling in TanStack Query: everything
 * TASK.md asks for — loading, empty, success, failure, recovery, and clarity
 * on slow operations — is covered by these five refs.
 *
 * Requests are aborted when the owning scope is disposed, so a component that
 * unmounts mid-flight cannot write to a dead ref.
 */
export function useApi<T, A extends unknown[] = []>(
  fn: (signal: AbortSignal, ...args: A) => Promise<T>,
  options: UseApiOptions = {},
): UseApi<T, A> {
  const { immediate = false, attempts = 1 } = options

  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const slow = ref(false)

  let controller: AbortController | null = null
  let slowTimer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A

  const clearSlowTimer = () => {
    if (slowTimer) clearTimeout(slowTimer)
    slowTimer = null
  }

  async function run(...args: A): Promise<T | null> {
    lastArgs = args
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null
    slow.value = false
    clearSlowTimer()
    slowTimer = setTimeout(() => { slow.value = true }, 5000)

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await fn(signal, ...args)
        if (signal.aborted) return null
        data.value = result
        return result
      } catch (err) {
        if (signal.aborted) return null
        if (attempt === attempts) {
          error.value = toMessage(err)
          return null
        }
        // Back off before retrying: 300ms, 600ms, 1200ms...
        await new Promise((r) => setTimeout(r, 300 * 2 ** (attempt - 1)))
      } finally {
        if (attempt === attempts || !signal.aborted) {
          loading.value = false
          slow.value = false
          clearSlowTimer()
        }
      }
    }
    return null
  }

  /** Re-run with the same arguments. This is what every Retry button calls. */
  const retry = () => run(...(lastArgs ?? ([] as unknown as A)))

  onScopeDispose(() => {
    controller?.abort()
    clearSlowTimer()
  })

  if (immediate) void run(...([] as unknown as A))

  return { data, loading, error, slow, run, retry }
}
