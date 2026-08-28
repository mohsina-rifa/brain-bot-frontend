import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@/assets/app.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createBootstrap())

const auth = useAuthStore()

/**
 * One 401 from anywhere ends the session. A screen usually has several requests
 * in flight, so this guards against each of them queueing its own redirect —
 * the first one wins and the rest are no-ops.
 */
setUnauthorizedHandler(() => {
  const current = router.currentRoute.value
  if (current.name === 'login') return

  const wasSignedIn = auth.isAuthenticated
  auth.logout()

  void router.push({
    name: 'login',
    query: {
      next: current.fullPath,
      // Explains the bounce on arrival, so an expired session never looks like
      // the app silently threw the user out.
      ...(wasSignedIn ? { reason: 'expired' } : {}),
    },
  })
})

app.mount('#app')
