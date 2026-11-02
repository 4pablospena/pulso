import { dayKey } from '#shared/core/format'
import { fastingStatus } from '#shared/core/fasting'
import type { DaySummary, Settings } from '#shared/types'

/** Resumen del día compartido por todas las pestañas: cualquier cambio refresca anillos y macros. */
export function useToday() {
  return useFetch<DaySummary>(() => `/api/day/${dayKey()}`, { key: 'today', dedupe: 'defer' })
}

export function useSettings() {
  const { data, refresh } = useFetch<Settings>('/api/settings', { key: 'settings', dedupe: 'defer' })
  async function save(patch: Partial<Settings>) {
    data.value = await $fetch<Settings>('/api/settings', { method: 'PUT', body: patch })
    await refreshNuxtData('today')
  }
  return { settings: data, refresh, save }
}

/** Refresca todos los datos de la pantalla (hoy, el día abierto en Nutrición y el balance). */
export function refreshToday() {
  return refreshNuxtData()
}

export function useToast() {
  const toast = useState<string | null>('toast', () => null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function show(message: string) {
    toast.value = message
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = null), 2200)
  }
  return { toast, show }
}

/** Reloj que avanza cada `ms` para temporizadores en pantalla. */
export function useNow(ms = 1000) {
  const now = ref(Date.now())
  let id: ReturnType<typeof setInterval> | undefined
  onMounted(() => (id = setInterval(() => (now.value = Date.now()), ms)))
  onBeforeUnmount(() => clearInterval(id))
  return now
}

/** Ayuno con avisos del navegador al cambiar de fase mientras la app está abierta. */
export function useFasting() {
  const { settings, save } = useSettings()
  const now = useNow(1000)
  const status = computed(() =>
    settings.value?.fastingStart ? fastingStatus(settings.value.fastingStart, settings.value.fastingProtocol, now.value) : null)

  watch(() => status.value?.phase, (phase, previous) => {
    if (!previous || !phase || phase === previous || typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      new Notification(phase === 'eating' ? '¡Ayuno completado! 🎉' : 'Se cierra la ventana de ingesta', {
        body: phase === 'eating' ? 'Empieza con agua y proteína.' : `Comienza tu ayuno ${settings.value?.fastingProtocol}.`,
      })
    }
  })

  async function start() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission()
    await save({ fastingStart: Date.now() })
  }
  const stop = () => save({ fastingStart: null })
  return { settings, status, start, stop }
}
