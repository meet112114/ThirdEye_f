import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      // Force HMR to use the same host/port as the HTTP server
      // This fixes WebSocket connection failures on Windows / WSL / proxied setups
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      // Use polling on Windows to reliably detect file changes
      usePolling: true,
      interval: 100,
    },
  },
})
