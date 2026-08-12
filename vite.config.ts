import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    host: true,
    port: 5173,
    proxy: {
      // Odoo backend (dev-crm.nooralnibras.com)
      '/lugal': {
        target: 'https://dev-crm.nooralnibras.com',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://dev-crm.nooralnibras.com',
        changeOrigin: true,
      },
      '/web': {
        target: 'https://dev-crm.nooralnibras.com',
        changeOrigin: true,
      },
      '/jsonrpc': {
        target: 'https://dev-crm.nooralnibras.com',
        changeOrigin: true,
      },
      // Hikvision device-sync bridge (Iraq LAN host .204)
      '/device-api': {
        target: 'http://192.168.116.204:8089',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/device-api/, '/api'),
      },
    },
  },
  preview: {
    allowedHosts: ['hr.nooralnibras.com'],
    // Same-origin public path for remote testers (India → hr.nooralnibras.com)
    // Browser calls /device-api/*; preview proxies to the Iraq device-sync :8089.
    proxy: {
      '/device-api': {
        target: 'http://192.168.116.204:8089',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/device-api/, '/api'),
      },
    },
  },
})
