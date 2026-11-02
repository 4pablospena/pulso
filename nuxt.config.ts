export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Pulso',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#000000' },
        // Instalable en la pantalla de inicio del iPhone como app a pantalla completa.
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Pulso' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icon-180.png' },
        { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
      ],
    },
  },
  runtimeConfig: {
    // Se rellenan con NUXT_STRAVA_CLIENT_ID, NUXT_ANTHROPIC_API_KEY, etc.
    stravaClientId: '',
    stravaClientSecret: '',
    anthropicApiKey: '',
    healthIngestToken: '',
    /** Contraseña de acceso (NUXT_APP_PASSWORD). Obligatoria al desplegar. */
    appPassword: '',
  },
  nitro: {
    // Permite saber en cualquier parte del servidor quién hace la petición (datos por persona).
    experimental: { asyncContext: true },
    // El almacenamiento 'db' se monta en server/plugins/storage.ts (Upstash o archivos locales).
    vercel: {
      // La cámara inteligente puede tardar más de los 10 s por defecto.
      // Frankfurt, junto a la base de datos Upstash.
      functions: { maxDuration: 60, regions: ['fra1'] },
    },
  },
})
