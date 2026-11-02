import webpush, { type PushSubscription } from 'web-push'
import { Client, Receiver } from '@upstash/qstash'
import type { H3Event } from 'h3'
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from '#shared/types'

export interface PushPayload {
  title: string
  body: string
  url?: string
  /** Notificaciones con la misma etiqueta se sustituyen en lugar de acumularse. */
  tag?: string
}

const SUBS = 'push-subs'

function vapid() {
  const { vapidPrivateKey, public: { vapidPublicKey } } = useRuntimeConfig()
  if (!vapidPrivateKey || !vapidPublicKey) return false
  webpush.setVapidDetails('mailto:pulso@localhost.invalid', vapidPublicKey, vapidPrivateKey)
  return true
}

export const pushConfigured = () => !!(useRuntimeConfig().vapidPrivateKey && useRuntimeConfig().public.vapidPublicKey)

/** Suscripciones de la persona actual (una por dispositivo). */
export const pushSubs = {
  get: () => db.kv.read<PushSubscription[]>(SUBS, []),
  set: (list: PushSubscription[]) => db.kv.write(SUBS, list),
}

/** Lee las suscripciones y preferencias de otra persona sin cambiar de sesión. */
async function subsOf(userId: string | null) {
  const storage = useStorage('db')
  const prefix = userId ? `u:${userId}:` : ''
  const subs = (await storage.getItem<PushSubscription[]>(`${prefix}${SUBS}`)) ?? []
  const settings = (await storage.getItem<{ notifications?: Partial<NotificationPrefs> }>(`${prefix}settings`)) ?? {}
  return { subs, prefs: { ...DEFAULT_NOTIFICATIONS, ...settings.notifications } }
}

/** Envía un aviso a todos los dispositivos de una persona (null = sin cuentas, modo local). */
export async function pushTo(userId: string | null, kind: keyof NotificationPrefs | 'test', payload: PushPayload) {
  if (!vapid()) return 0
  const { subs, prefs } = await subsOf(userId)
  if (kind !== 'test' && !prefs[kind]) return 0
  let sent = 0
  const alive: PushSubscription[] = []
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 6 })
      alive.push(sub)
      sent++
    } catch (e: any) {
      // 404/410: el dispositivo ya no existe (app borrada o permiso retirado).
      if (![404, 410].includes(e?.statusCode)) alive.push(sub)
    }
  }
  if (alive.length !== subs.length) {
    await useStorage('db').setItem(`${userId ? `u:${userId}:` : ''}${SUBS}`, alive as any)
  }
  return sent
}

/** Avisa al resto de la casa (todas las cuentas menos la tuya). */
export async function pushToHousehold(event: H3Event, kind: keyof NotificationPrefs, payload: PushPayload) {
  const me = currentUser(event)
  const others = (await users.all()).filter((u) => u.id !== me?.id)
  await Promise.all(others.map((u) => pushTo(u.id, kind, payload).catch(() => 0)))
}

// ---------- Avisos programados (QStash) ----------

/** Claves de QStash: las que crea la integración de Vercel (QSTASH_*) o las NUXT_QSTASH_*. */
function qstashEnv() {
  const c = useRuntimeConfig()
  return {
    token: c.qstashToken || process.env.QSTASH_TOKEN || '',
    url: c.qstashUrl || process.env.QSTASH_URL || '',
    current: c.qstashCurrentSigningKey || process.env.QSTASH_CURRENT_SIGNING_KEY || '',
    next: c.qstashNextSigningKey || process.env.QSTASH_NEXT_SIGNING_KEY || '',
  }
}

function qstash() {
  const { token, url } = qstashEnv()
  return token ? new Client({ token, ...(url ? { baseUrl: url } : {}) }) : null
}

export const schedulingConfigured = () => !!qstashEnv().token

/** Programa la llamada a /api/push/deliver en un momento concreto. */
export async function scheduleAt(event: H3Event, at: number, body: Record<string, unknown>) {
  const client = qstash()
  if (!client || at <= Date.now()) return
  await client.publishJSON({
    url: `${getRequestURL(event).origin}/api/push/deliver`,
    body: { ...body, userId: currentUser(event)?.id ?? null, at },
    notBefore: Math.floor(at / 1000),
  })
}

/** Recordatorio diario (cron en hora de Madrid). Devuelve el id para poder borrarlo. */
export async function scheduleDaily(event: H3Event, cron: string, body: Record<string, unknown>) {
  const client = qstash()
  if (!client) return null
  const { scheduleId } = await client.schedules.create({
    destination: `${getRequestURL(event).origin}/api/push/deliver`,
    cron: `CRON_TZ=Europe/Madrid ${cron}`,
    body: JSON.stringify({ ...body, userId: currentUser(event)?.id ?? null }),
    headers: { 'Content-Type': 'application/json' },
  })
  return scheduleId
}

export async function unschedule(ids: string[]) {
  const client = qstash()
  if (!client) return
  await Promise.all(ids.map((id) => client.schedules.delete(id).catch(() => {})))
}

/** Comprueba que la llamada viene de QStash (firma). */
export async function verifyQstash(event: H3Event, rawBody: string) {
  const { current, next } = qstashEnv()
  if (!current) return false
  const receiver = new Receiver({ currentSigningKey: current, nextSigningKey: next })
  const signature = getHeader(event, 'upstash-signature') ?? ''
  return receiver.verify({ signature, body: rawBody }).catch(() => false)
}
