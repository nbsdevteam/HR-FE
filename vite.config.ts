import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

/**
 * HR-FE builds two ways from this one config.
 *
 *   standalone  `npm run dev` — the HR app as it has always been, on :5273 with its own Layout,
 *               sidebar and login. Nothing about that changes.
 *   remote      the same code exposed as a Module Federation container, mounted inside the CRM
 *               shell alongside call-centre-omnichannel, orders, supply-chain and crm.
 *
 * The CRM side of the composition configures all of this through @nbs/module-federation/vite (`defineFederatedApp`), a
 * shared preset in that workspace. HR-FE is a separate repository, so the relevant parts are
 * mirrored here — the SINGLETON list especially, which must stay byte-identical in meaning to
 * packages/mf/vite/shared-deps.mjs. Two copies of React, react-router or TanStack Query in one
 * page is not a slow page, it is "Invalid hook call" and a second query cache.
 *
 * TODO: publish @nbs/module-federation and depend on it, deleting the duplication below.
 */

/** Must match packages/mf/vite/shared-deps.mjs in CRM-FE. */
const SHARED_SINGLETONS = {
  react: { singleton: true, requiredVersion: '18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '18.3.1' },
  'react-router': { singleton: true, requiredVersion: '7.18.0' },
  '@tanstack/react-query': { singleton: true, requiredVersion: '^5.90.21' },
  i18next: { singleton: true, requiredVersion: '^25.8.13' },
  'react-i18next': { singleton: true, requiredVersion: '^16.5.4' },
  sonner: { singleton: true, requiredVersion: '2.0.3' },
  'next-themes': { singleton: true, requiredVersion: '0.4.6' },
  '@radix-ui/react-dialog': { singleton: true, requiredVersion: '1.1.6' },
  '@radix-ui/react-popover': { singleton: true, requiredVersion: '1.1.6' },
  '@radix-ui/react-dropdown-menu': { singleton: true, requiredVersion: '2.1.6' },
  '@radix-ui/react-tooltip': { singleton: true, requiredVersion: '1.1.8' },
  '@radix-ui/react-select': { singleton: true, requiredVersion: '2.1.6' },
  'date-fns': { singleton: false, requiredVersion: '3.6.0' },
  clsx: { singleton: false, requiredVersion: '2.1.1' },
  'tailwind-merge': { singleton: false, requiredVersion: '3.2.0' },
  'lucide-react': { singleton: false, requiredVersion: '0.487.0' },
  recharts: { singleton: false, requiredVersion: '2.15.2' },
  'react-hook-form': { singleton: false, requiredVersion: '^7.55.0' },
  motion: { singleton: false, requiredVersion: '12.23.24' },
}

export default defineConfig(({ mode, command }) => {
  // Proxy targets come from .env so each developer can point at their own backend (a local Odoo, a
  // LAN host, or the shared dev server) without editing this file.
  const env = loadEnv(mode, process.cwd(), '')
  const odooTarget = env.VITE_API_BASE || 'https://dev-crm.nooralnibras.com'
  const deviceTarget = env.VITE_DEVICE_TARGET || 'http://192.168.116.204:8089'
  const isDev = command === 'serve'

  return {
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
  },
  /**
   * Served from /federated/hr/ inside the composition so this app's own chunks resolve beside its
   * remoteEntry, and from the server root when it runs alone.
   */
  base: isDev ? '/' : '/federated/hr/',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    federation({
      name: 'hr',
      filename: 'remoteEntry.js',
      exposes: {
        './routes': './src/federation/routes.tsx',
        './publicRoutes': './src/federation/publicRoutes.tsx',
        './navItems': './src/federation/navItems.ts',
        './EmployeePicker': './src/federation/EmployeePicker.tsx',
        './EmployeeAvatar': './src/federation/EmployeeAvatar.tsx',
        './EmployeeMiniCard': './src/federation/EmployeeMiniCard.tsx',
      },
      /**
       * HR consumes from the CRM composition too — call-centre-omnichannel's dialer on an employee record.
       * In dev that is the call-centre dev server; in production both apps sit on one origin.
       */
      remotes: {
        call_centre_omnichannel: {
          type: 'module',
          name: 'call_centre_omnichannel',
          entry: isDev
            ? 'http://localhost:5181/remoteEntry.js'
            : '/federated/call-centre-omnichannel/remoteEntry.js',
        },
      },
      shared: SHARED_SINGLETONS,
      manifest: { fileName: 'mf-manifest.json' },
      // Types come from src/federation/contracts.ts (a reviewed mirror of @nbs/contracts), not from
      // generated declarations — see that file's note.
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router', '@tanstack/react-query'],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    host: true,
    port: 5273,
    strictPort: true,
    // The CRM shell's dev server reads this app's remoteEntry cross-origin.
    cors: true,
    proxy: {
      '/lugal': { target: odooTarget, changeOrigin: true },
      '/api': { target: odooTarget, changeOrigin: true },
      '/web': { target: odooTarget, changeOrigin: true },
      '/jsonrpc': { target: odooTarget, changeOrigin: true },
      '/device-api': {
        target: deviceTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/device-api/, '/api'),
      },
    },
  },
  preview: {
    allowedHosts: ['hr.nooralnibras.com'],
    proxy: {
      '/device-api': {
        target: deviceTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/device-api/, '/api'),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  }
})
