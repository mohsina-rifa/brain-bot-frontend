import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/bots' },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/bots', name: 'bots', component: () => import('@/views/BotsView.vue') },
  { path: '/bots/:id/qna', name: 'qna', component: () => import('@/views/QnaView.vue'), props: true },
  { path: '/bots/:id/playground', name: 'playground', component: () => import('@/views/PlaygroundView.vue'), props: true },
  { path: '/bots/:id/settings', name: 'settings', component: () => import('@/views/BotSettingsView.vue'), props: true },
]

const router = createRouter({ history: createWebHistory(), routes })

// Guard is wired in SUBTASK-2.1 once the auth store exists.
router.beforeEach((to) => {
  if (to.meta.public) return true
  return localStorage.getItem('token') ? true : { name: 'login', query: { next: to.fullPath } }
})

export default router
