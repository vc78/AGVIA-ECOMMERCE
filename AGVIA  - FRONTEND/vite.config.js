import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173,
  },
})
