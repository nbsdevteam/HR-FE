import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Proxy targets come from .env so each developer can point at their own
  // backend (a local Odoo, a LAN host, or the shared dev server) without
  // editing this file. Falls back to the shared dev host when unset.
  const env = loadEnv(mode, process.cwd(), '')
  const odooTarget = env.VITE_API_BASE || 'https://dev-crm.nooralnibras.com'
  const deviceTarget = env.VITE_DEVICE_TARGET || 'http://192.168.116.204:8089'

  return {
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
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
    port: 5273,
    strictPort: true,
    proxy: {
      // Odoo backend — set VITE_API_BASE in .env (e.g. http://10.13.26.24:8069)
      '/lugal': {
        target: odooTarget,
        changeOrigin: true,
      },
      '/api': {
        target: odooTarget,
        changeOrigin: true,
      },
      '/web': {
        target: odooTarget,
        changeOrigin: true,
      },
      '/jsonrpc': {
        target: odooTarget,
        changeOrigin: true,
      },
      // Hikvision device-sync bridge (defaults to the Iraq LAN host .204)
      '/device-api': {
        target: deviceTarget,
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
        target: deviceTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/device-api/, '/api'),
      },
    },
  },
  }
})
