// Service worker de Pulso: la app abre sin conexión (supermercado sin cobertura)
// y recibe notificaciones push aunque esté cerrada.
const VERSION = 'v1'
const STATIC = `pulso-static-${VERSION}`
const PAGES = `pulso-pages-${VERSION}`
const API = `pulso-api-${VERSION}`
const SHELL = ['/', '/compra', '/semana', '/entreno']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  // Precarga las pantallas principales; si alguna falla (p. ej. sin sesión) no pasa nada.
  event.waitUntil(caches.open(PAGES).then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [STATIC, PAGES, API]
    for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key)
    await self.clients.claim()
  })())
})

const isStatic = (url) => url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/exercises/')
  || /\.(png|svg|jpg|webmanifest|woff2?)$/.test(url.pathname)
// Rutas de API que nunca se sirven desde caché.
const noCache = (url) => /^\/api\/(auth|health|strava\/(connect|callback)|push)/.test(url.pathname)

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request, { ignoreVary: true })
    if (cached) return cached
    if (request.mode === 'navigate') {
      const home = await caches.match('/')
      if (home) return home
    }
    return new Response(JSON.stringify({ offline: true, message: 'Sin conexión' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (isStatic(url)) return event.respondWith(cacheFirst(request))
  if (url.pathname.startsWith('/api/')) {
    if (noCache(url)) return
    return event.respondWith(networkFirst(request, API))
  }
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request, PAGES))
})

// Al cerrar sesión se borran los datos guardados de esa persona.
self.addEventListener('message', (event) => {
  if (event.data === 'clear-data') event.waitUntil(Promise.all([caches.delete(API), caches.delete(PAGES)]))
})

// ---------- Notificaciones push ----------
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  event.waitUntil(self.registration.showNotification(data.title || 'Pulso', {
    body: data.body || '',
    tag: data.tag,
    renotify: !!data.tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
