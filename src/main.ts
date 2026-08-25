import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import App from './App.vue'
import router from './router'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(createBootstrap())
  .mount('#app')
