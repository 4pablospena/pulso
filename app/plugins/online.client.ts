/** Vigila la conexión y sincroniza lo pendiente en cuanto vuelve. */
export default defineNuxtPlugin(() => {
  const { online, pending, flush } = useOffline()
  const { show } = useToast()
  online.value = navigator.onLine

  async function sync() {
    const synced = await flush()
    if (synced) {
      show(`${synced} ${synced === 1 ? 'cambio sincronizado' : 'cambios sincronizados'}`)
      await refreshNuxtData()
    }
  }
  window.addEventListener('online', () => { online.value = true; sync() })
  window.addEventListener('offline', () => { online.value = false })
  if (navigator.onLine) sync()
  else pending.value = JSON.parse(localStorage.getItem('pulso-offline-queue') ?? '[]').length
})
