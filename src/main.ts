import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'

import '@/assets/theme.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@/assets/app.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler, setSessionEnded } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useActiveBotStore } from '@/stores/activeBot'
import { useWriteQueueStore } from '@/stores/writeQueue'

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
  useWriteQueueStore().clear()

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

app.config.errorHandler = (err, _instance, info) => {
  console.error(`[app] unhandled error (${info})`, err)
}

app.mount('#app')
