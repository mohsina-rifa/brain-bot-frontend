import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses @import internally, which Dart Sass now
        // warns about on every file. The warnings are Bootstrap's to fix, not
        // ours, and they bury real output.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
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
