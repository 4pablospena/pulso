import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/** Sin NUXT_APP_PASSWORD (en local) la app queda abierta; desplegada siempre debe tenerla. */
export function authRequired() {
  return !!useRuntimeConfig().appPassword
}

function sessionConfig() {
  const password = useRuntimeConfig().appPassword
  return {
    name: 'pulso-session',
    // Clave de cifrado derivada de NUXT_APP_PASSWORD: si la cambias, se cierran todas las sesiones.
    password: createHash('sha256').update(`pulso-session:${password}`).digest('hex'),
    maxAge: 60 * 60 * 24 * 365,
    cookie: { sameSite: 'lax' as const, secure: !import.meta.dev, httpOnly: true },
  }
}

/** Carga en el contexto la persona con sesión abierta. */
export async function loadSessionUser(event: H3Event) {
  if (!authRequired()) return undefined
  const session = await getSession<{ uid?: string; ok?: boolean }>(event, sessionConfig())
  let user = session.data.uid ? await users.byId(session.data.uid) : undefined
  // Sesiones de antes de las cuentas: pasan a la cuenta de administrador.
  if (!user && session.data.ok) user = (await users.all()).find((u) => u.legacy)
  if (user) {
    await migrateLegacyData(user)
    event.context.user = user
  }
  return user
}

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Inicia sesión. La primera vez (sin usuarios) acepta NUXT_APP_PASSWORD y crea la cuenta
 * de administrador con ese usuario, que hereda los datos existentes.
 */
export async function login(event: H3Event, username: string, password: string) {
  const all = await users.all()
  let user: UserRecord | undefined
  if (!all.length) {
    if (!sameSecret(password ?? '', useRuntimeConfig().appPassword)) return null
    user = await createUser({ name: username, username, password, role: 'admin', legacy: true,
      healthToken: useRuntimeConfig().healthIngestToken })
  } else {
    const found = await users.byUsername(username ?? '')
    if (found && verifyPassword(found, password ?? '')) user = found
  }
  if (!user) return null
  await migrateLegacyData(user)
  await updateSession(event, sessionConfig(), { uid: user.id, ok: undefined })
  return user
}

export async function logout(event: H3Event) {
  await clearSession(event, sessionConfig())
}
