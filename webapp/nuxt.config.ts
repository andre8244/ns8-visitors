import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Internal app behind login: no SSR, simpler debugging and no hydration
  // issues with tippy/Headless UI components
  ssr: false,
  modules: ['nuxt-auth-utils'],
  // Components are named after their file, whatever their folder
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      // The icon of My Nethesis
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }
      ],
      // Sets the theme before the page shows, with no white flash in the
      // dark theme. Keys: useAdminTheme() and useKiosk()
      script: [
        {
          tagPosition: 'head',
          innerHTML: `try {
  var kiosk = location.pathname.indexOf('/kiosk') === 0
  var mode = localStorage.getItem(kiosk ? 'visitors-kiosk-theme' : 'visitors-theme')
  var auto = !kiosk && (!mode || mode === 'auto') && matchMedia('(prefers-color-scheme: dark)').matches
  if (mode === 'dark' || auto) document.documentElement.classList.add('dark')
  // The tablet pages have the color of the brand
  if (kiosk) document.documentElement.classList.add('kiosk')
} catch (e) {}`
        }
      ]
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  runtimeConfig: {
    // Overridden at runtime by NUXT_* environment variables
    databasePath: './.data/visitors.sqlite',
    migrationsPath: './server/database/migrations',
    adminGroup: 'visitors-admin',
    // The cookie lasts one year, for the paired tablets; admin sessions
    // expire earlier, see requireAdmin()
    session: {
      maxAge: 365 * 24 * 60 * 60,
      cookie: { sameSite: 'strict' }
    },
    ldap: {
      host: '127.0.0.1',
      port: 389,
      bindDn: '',
      bindPassword: '',
      baseDn: '',
      schema: 'rfc2307'
    }
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
      }
    },
    // Personal data: never stored by the browser or by proxies
    '/api/**': { headers: { 'Cache-Control': 'no-store' } }
  },
  nitro: {
    // better-sqlite3 is a native module: keep it outside the bundle
    externals: { external: ['better-sqlite3'] },
    // The tests run on the server code: type-check them with it
    typescript: {
      tsConfig: { include: ['../tests/**/*', '../vitest.config.ts'] }
    }
  }
})
