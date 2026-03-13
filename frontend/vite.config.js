// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Only apply the subpath base when building for GH Pages.
  // Docker builds (mode === 'production') serve from root — no subpath needed.
  // Set VITE_BASE_URL=/botletin-oficial/ in the GH Actions workflow to activate it.
  base: process.env.VITE_BASE_URL ?? '/',

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))