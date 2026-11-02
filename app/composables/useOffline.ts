/** Petición pendiente de enviar cuando vuelva la conexión. */
interface QueuedRequest {
  method: 'POST' | 'PATCH' | 'DELETE'
  url: string
  body?: unknown
}

const KEY = 'pulso-offline-queue'

function load(): QueuedRequest[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
function store(list: QueuedRequest[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* sin almacenamiento: se pierde la cola */ }
}

/** Estado de conexión y cola de cambios hechos sin red (p. ej. tachar en el súper). */
export function useOffline() {
  const online = useState('online', () => true)
  const pending = useState('offline-pending', () => 0)

  /** Envía una petición; si no hay red, la guarda y devuelve null para aplicar el cambio en local. */
  async function send<T>(req: QueuedRequest): Promise<T | null> {
    try {
      return (await $fetch(req.url, { method: req.method, body: req.body as any })) as T
    } catch (e: any) {
      // Sin respuesta del servidor (o 503 del service worker): es falta de conexión.
      if (e?.response && e.response.status !== 503) throw e
      const list = [...load(), req]
      store(list)
      pending.value = list.length
      online.value = false
      return null
    }
  }

  /** Reenvía en orden lo pendiente. Devuelve cuántas se sincronizaron. */
  async function flush() {
    const list = load()
    let done = 0
    for (const req of list) {
      try {
        await $fetch(req.url, { method: req.method, body: req.body as any })
        done++
      } catch (e: any) {
        if (!e?.response) break // sigue sin red
        done++ // el servidor la rechazó: se descarta para no bloquear la cola
      }
    }
    store(list.slice(done))
    pending.value = list.length - done
    return done
  }

  return { online, pending, send, flush }
}
