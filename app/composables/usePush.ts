function base64ToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** Notificaciones push del dispositivo: permiso, suscripción y estado. */
export function usePush() {
  const { public: { vapidPublicKey } } = useRuntimeConfig()
  const supported = ref(false)
  const standalone = ref(false)
  const permission = ref<NotificationPermission>('default')
  const subscribed = ref(false)

  onMounted(async () => {
    supported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    standalone.value = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    if (!supported.value) return
    permission.value = Notification.permission
    const reg = await navigator.serviceWorker.getRegistration()
    subscribed.value = !!(await reg?.pushManager.getSubscription())
  })

  async function enable() {
    if (!vapidPublicKey) throw new Error('Las notificaciones no están configuradas en el servidor.')
    permission.value = await Notification.requestPermission()
    if (permission.value !== 'granted') throw new Error('Permiso denegado. Actívalo en Ajustes del iPhone → Notificaciones → Pulso.')
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
      ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(vapidPublicKey) })
    await $fetch('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } })
    subscribed.value = true
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await $fetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } })
      await sub.unsubscribe()
    }
    subscribed.value = false
  }

  return { supported, standalone, permission, subscribed, enable, disable }
}
