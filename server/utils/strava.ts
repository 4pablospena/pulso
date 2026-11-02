import type { H3Event } from 'h3'
import type { Workout } from '#shared/types'

interface Token {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { id: number; firstname?: string; lastname?: string }
}

export interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  sport_type: string
  start_date: string
  average_heartrate?: number
  kilojoules?: number
}

const API = 'https://www.strava.com/api/v3'
const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun']

export function stravaConfig() {
  const { stravaClientId, stravaClientSecret } = useRuntimeConfig()
  return { clientId: stravaClientId, clientSecret: stravaClientSecret, configured: !!(stravaClientId && stravaClientSecret) }
}

export function stravaRedirectUri(event: H3Event) {
  return `${getRequestURL(event).origin}/api/strava/callback`
}

export const stravaToken = {
  get: () => db.kv.read<Token | null>('strava:token', null),
  set: (t: Token | null) => db.kv.write('strava:token', t),
}

async function tokenRequest(params: Record<string, string>): Promise<Token> {
  const { clientId, clientSecret, configured } = stravaConfig()
  if (!configured) throw createError({ statusCode: 400, message: 'Strava no está configurado (NUXT_STRAVA_CLIENT_ID / SECRET).' })
  return $fetch<Token>('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
  })
}

export async function exchangeCode(code: string) {
  const token = await tokenRequest({ grant_type: 'authorization_code', code })
  await stravaToken.set(token)
  return token
}

/** Token válido, renovándolo si caduca en menos de un minuto. */
async function accessToken(): Promise<string> {
  const current = await stravaToken.get()
  if (!current) throw createError({ statusCode: 401, message: 'Conecta Strava en Ajustes.' })
  if (current.expires_at - 60 > Date.now() / 1000) return current.access_token
  const fresh = await tokenRequest({ grant_type: 'refresh_token', refresh_token: current.refresh_token })
  await stravaToken.set({ ...fresh, athlete: fresh.athlete ?? current.athlete })
  return fresh.access_token
}

export async function stravaFetch<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  return $fetch<T>(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${await accessToken()}` },
  } as any) as Promise<T>
}

export async function recentActivities(): Promise<StravaActivity[]> {
  const cached = await db.kv.read<{ at: number; list: StravaActivity[] } | null>('strava:activities', null)
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.list
  const list = await stravaFetch<StravaActivity[]>('/athlete/activities?per_page=50')
  await db.kv.write('strava:activities', { at: Date.now(), list })
  return list
}

export async function invalidateActivities() {
  await db.kv.write('strava:activities', null)
}

export function toWorkout(a: StravaActivity, weightKg: number): Workout {
  const isRun = RUN_TYPES.includes(a.sport_type)
  // La lista de Strava no trae calorías; para running ≈ 1 kcal · kg · km.
  const kcal = a.kilojoules ? a.kilojoules / 4.184 : isRun ? (weightKg * a.distance) / 1000 : 0
  return {
    id: `strava-${a.id}`,
    kind: isRun ? 'run' : a.sport_type === 'WeightTraining' ? 'strength' : 'other',
    name: a.name,
    start: Date.parse(a.start_date),
    durationSec: a.moving_time,
    kcal: Math.round(kcal),
    distanceM: a.distance,
    elevationM: a.total_elevation_gain,
    avgHR: a.average_heartrate,
    source: 'Strava',
    url: `https://www.strava.com/activities/${a.id}`,
  }
}

/** Publica una sesión de fuerza como actividad manual "WeightTraining". */
export async function uploadStrength(title: string, start: number, durationSec: number, description: string) {
  const local = new Date(start - new Date(start).getTimezoneOffset() * 60_000).toISOString().slice(0, 19)
  const created = await stravaFetch<{ id: number }>('/activities', {
    method: 'POST',
    body: new URLSearchParams({
      name: title,
      sport_type: 'WeightTraining',
      start_date_local: local,
      elapsed_time: String(Math.round(durationSec)),
      description,
    }),
  })
  await invalidateActivities()
  return created.id
}
