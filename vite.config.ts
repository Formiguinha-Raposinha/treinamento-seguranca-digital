import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Redireciona e força a abertura direta no Google Chrome ao iniciar
process.env.BROWSER = 'chrome'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1',
    open: true
  }
})
