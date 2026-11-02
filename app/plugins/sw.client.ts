/** Registra el service worker (modo sin conexión y notificaciones). En desarrollo no, para no interferir con la recarga en caliente. */
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
})
