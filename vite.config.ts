import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/zoho/... to https://www.zohoapis.in/crm/v6/...
      '/api/zoho': {
        target: 'https://www.zohoapis.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zoho/, '/crm/v6'),
        secure: true,
      }
    }
  }
})
