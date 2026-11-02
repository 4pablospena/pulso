import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { AppUser } from '#shared/types'

export interface UserRecord extends AppUser {
  salt: string
  hash: string
  /** Token para que Health Auto Export envíe los datos de Salud de esta persona. */
  healthToken: string
  /** Dueño de los datos anteriores a las cuentas (sin prefijo): se le migran al usarlos. */
  legacy?: boolean
  migrated?: boolean
}

const KEY = 'users'
const storage = () => useStorage('db')

export const users = {
  all: async () => (await storage().getItem<UserRecord[]>(KEY)) ?? [],
  save: (list: UserRecord[]) => storage().setItem(KEY, list as any),
  byId: async (id: string) => (await users.all()).find((u) => u.id === id),
  byUsername: async (username: string) => (await users.all()).find((u) => u.username === normalizeUsername(username)),
  byHealthToken: async (token: string) => (token ? (await users.all()).find((u) => u.healthToken === token) : undefined),
}

export const normalizeUsername = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]/g, '')

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') }
}

export function verifyPassword(user: UserRecord, password: string) {
  const candidate = Buffer.from(hashPassword(password, user.salt).hash, 'hex')
  const expected = Buffer.from(user.hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export async function createUser(input: { name: string; username: string; password: string; role: AppUser['role']; legacy?: boolean; healthToken?: string }) {
  const username = normalizeUsername(input.username)
  if (username.length < 2) throw createError({ statusCode: 400, message: 'El usuario debe tener al menos 2 letras o números.' })
  if (input.password.length < 8) throw createError({ statusCode: 400, message: 'La contraseña debe tener al menos 8 caracteres.' })
  const list = await users.all()
  if (list.some((u) => u.username === username)) throw createError({ statusCode: 409, message: 'Ese usuario ya existe.' })
  const user: UserRecord = {
    id: crypto.randomUUID(), name: input.name.trim() || username, username, role: input.role, createdAt: Date.now(),
    ...hashPassword(input.password), healthToken: input.healthToken || randomBytes(24).toString('hex'),
    ...(input.legacy ? { legacy: true } : {}),
  }
  await users.save([...list, user])
  return user
}

export async function setPassword(id: string, password: string) {
  if (password.length < 8) throw createError({ statusCode: 400, message: 'La contraseña debe tener al menos 8 caracteres.' })
  const list = await users.all()
  await users.save(list.map((u) => (u.id === id ? { ...u, ...hashPassword(password) } : u)))
}

export const publicUser = ({ id, name, username, role, createdAt }: UserRecord): AppUser => ({ id, name, username, role, createdAt })

/** Persona de la petición en curso (la pone el middleware de sesión). */
export function currentUser(event?: H3Event): UserRecord | undefined {
  try {
    return (event ?? useEvent()).context.user as UserRecord | undefined
  } catch {
    return undefined
  }
}

export function requireAdmin(event: H3Event) {
  if (authRequired() && currentUser(event)?.role !== 'admin') throw createError({ statusCode: 403, message: 'Solo el administrador puede hacer esto.' })
}
