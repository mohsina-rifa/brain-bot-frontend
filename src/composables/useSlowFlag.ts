import { ref, onScopeDispose } from 'vue'
import { SLOW_AFTER_MS } from '@/composables/useApi'

/**
 * The same "this is taking a while" clock useApi runs, for the operations that
 * do not go through useApi — Q&A create and chat send both post directly so
 * they can keep their own optimistic state.
 */
export function useSlowFlag(delay = SLOW_AFTER_MS) {
  const slow = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function stop() {
    if (timer) clearTimeout(timer)
    timer = null
    slow.value = false
  }

  function start() {
    stop()
    timer = setTimeout(() => {
      slow.value = true
    }, delay)
  }

  onScopeDispose(stop)

  return { slow, start, stop }
}
