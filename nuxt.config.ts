// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolveStoreStorageConfig } from './server/utils/storage-config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@vite-pwa/nuxt', 'nuxt-auth-utils'],

  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7,
    },
    allowedEmails: '',
    oauth: {
      google: {
        clientId: '',
        clientSecret: '',
      },
    },
  },

  nitro: {
    storage: {
      store: resolveStoreStorageConfig(),
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Work Time — учёт времени',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { name: 'description', content: 'Индивидуальный трекер времени по проектам и задачам' },
        { name: 'theme-color', content: '#0f1117' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'Work Time',
      short_name: 'WorkTime',
      description: 'Трекер времени по проектам и задачам',
      theme_color: '#0f1117',
      background_color: '#0f1117',
      display: 'standalone',
      lang: 'ru',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    registerWebManifestInRouteRules: true,
    includeAssets: ['icons/*.png'],
    workbox: {
      // SSR: "/" не в precache — navigateFallback ломает SW (non-precached-url)
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkOnly',
        },
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/auth/'),
          handler: 'NetworkOnly',
        },
      ],
    },
    client: {
      installPrompt: false,
      registerPlugin: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
