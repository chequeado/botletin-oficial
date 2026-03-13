// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // En GH Pages la app vive en /botletin-oficial/ — en dev en /
  base: mode === 'production' ? '/botletin-oficial/' : '/',

  server: {
    port: 3000,
    proxy: {
      // Proxies /api/* → FastAPI en desarrollo local
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))