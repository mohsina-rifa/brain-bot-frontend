import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // The backend sets CORS to `origin: true`, so this proxy is not strictly
    // required — it is kept so the app works unchanged if that ever tightens.
    proxy: {
      '/api': { target: 'http://localhost:4040', changeOrigin: true },
    },
  },
})
