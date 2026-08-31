import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@/assets/app.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler, setSessionEnded } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useActiveBotStore } from '@/stores/activeBot'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createBootstrap())

const auth = useAuthStore()

let redirecting = false

setUnauthorizedHandler(() => {
  const current = router.currentRoute.value
  if (current.name === 'login') return

  if (redirecting) return
  redirecting = true

  const wasSignedIn = auth.isAuthenticated
  auth.logout()
  setSessionEnded(true)

  useActiveBotStore().clear()

  void router
    .push({
      name: 'login',
      query: {
        next: current.fullPath,
        ...(wasSignedIn ? { reason: 'expired' } : {}),
      },
    })
    .finally(() => {
      redirecting = false
    })
})

/**
 * ErrorBoundary catches what is thrown while rendering. What reaches here is the
 * rest — a watcher, an event handler, an async callback — where there is no
 * component to swap out for a recovery screen. Logging it is the honest limit:
 * swallowing it silently would hide real bugs, and there is nothing on screen
 * that could be usefully replaced.
 */
app.config.errorHandler = (err, _instance, info) => {
  console.error(`[app] unhandled error (${info})`, err)
}

app.mount('#app')
