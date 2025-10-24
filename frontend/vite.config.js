import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow LAN + ngrok
    port: 5173,
    allowedHosts: ['*'], // allow all hosts (for ngrok test)
    hmr: {
      protocol: 'wss',
      host: 'fbe3adfbbb8c.ngrok-free.app', // 👈 tumhara current ngrok domain
      port: 443,
    },
  },
})
