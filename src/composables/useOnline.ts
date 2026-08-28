import { ref, onScopeDispose } from 'vue'

/**
 * Browser connectivity, as a ref.
 *
 * navigator.onLine only knows whether there is a network interface, not whether
 * the backend is reachable — so this drives the offline banner, while a request
 * that fails against a live connection still surfaces its own error.
 */
export function useOnline() {
  const online = ref(navigator.onLine)

  const update = () => {
    online.value = navigator.onLine
  }

  window.addEventListener('online', update)
  window.addEventListener('offline', update)

  onScopeDispose(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return online
}
