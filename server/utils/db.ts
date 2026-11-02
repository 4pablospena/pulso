import { exampleProfile } from '#shared/core/energy'
import { DEFAULT_ROUTINES, DEFAULT_SCHEDULE, type Routine } from '#shared/core/plan'
import { EXERCISE_DB, exerciseById } from '#shared/data/exercises'
import type { Planner } from '#shared/core/planner'
import type { Recipe } from '#shared/data/recipes'
import { DEFAULT_NOTIFICATIONS, type FoodEntry, type HealthDay, type Settings, type ShoppingItem, type StrengthSession, type WaterEntry, type WeightEntry } from '#shared/types'

/** Almacén clave-valor (Upstash en producción, archivos en .data/db en local). */
const store = () => useStorage('db')

/** Datos de la casa, comunes a todas las personas. El resto es personal. */
const SHARED = new Set(['shopping', 'shopping-meta', 'custom-recipes', 'pantry'])
const SHARED_PREFIXES = ['recipe-photo:']

/** Cada persona guarda sus datos bajo `u:<id>:`; sin cuentas (en local) se usan las claves tal cual. */
function scoped(key: string) {
  const user = currentUser()
  const shared = SHARED.has(key) || SHARED_PREFIXES.some((p) => key.startsWith(p))
  return user && !shared ? `u:${user.id}:${key}` : key
}

async function read<T>(key: string, fallback: T): Promise<T> {
  return ((await store().getItem<T>(scoped(key))) ?? fallback) as T
}

async function write<T>(key: string, value: T) {
  await store().setItem(scoped(key), value as any)
}

/**
 * La primera vez que entra la cuenta que heredó los datos anteriores a las cuentas,
 * se copian a su espacio. Los originales se quedan como copia de seguridad.
 */
export async function migrateLegacyData(user: UserRecord) {
  if (!user.legacy || user.migrated) return
  const keys = (await store().getKeys()).filter((k) => !k.startsWith('u:') && !SHARED.has(k) && k !== 'users')
  for (const key of keys) {
    const value = await store().getItem(key)
    if (value != null) await store().setItem(`u:${user.id}:${key}`, value as any)
  }
  const list = await users.all()
  await users.save(list.map((u) => (u.id === user.id ? { ...u, migrated: true } : u)))
  user.migrated = true
}

const defaultSettings: Settings = {
  profile: exampleProfile,
  fastingProtocol: '16:8',
  fastingStart: null,
  waterGoalMl: 2500,
  moveGoalKcal: 600,
  autoUploadStrava: true,
  trainingSchedule: DEFAULT_SCHEDULE,
  nutritionPlanId: null,
  planOverrides: {},
  householdSize: 1,
  onboarded: false,
  notifications: DEFAULT_NOTIFICATIONS,
  favorites: [],
}

export const db = {
  settings: {
    get: async (): Promise<Settings> => {
      const stored = await read<Partial<Settings> | null>('settings', null)
      // Quien ya tenía ajustes guardados de antes de la bienvenida no tiene que repetirla.
      return {
        ...defaultSettings, ...stored,
        notifications: { ...DEFAULT_NOTIFICATIONS, ...stored?.notifications },
        onboarded: stored ? stored.onboarded ?? true : false,
      }
    },
    set: (s: Settings) => write('settings', s),
  },
  foods: {
    get: (day: string) => read<FoodEntry[]>(`foods:${day}`, []),
    set: (day: string, list: FoodEntry[]) => write(`foods:${day}`, list),
  },
  water: {
    get: (day: string) => read<WaterEntry[]>(`water:${day}`, []),
    set: (day: string, list: WaterEntry[]) => write(`water:${day}`, list),
  },
  health: {
    get: (day: string) => read<HealthDay | null>(`health:${day}`, null),
    set: (day: string, h: HealthDay) => write(`health:${day}`, h),
    lastSync: () => read<number | null>('health:lastSync', null),
    touch: () => write('health:lastSync', Date.now()),
  },
  sessions: {
    all: async () => (await read<StrengthSession[]>('sessions', [])).map(migrateSession),
    save: (list: StrengthSession[]) => write('sessions', list),
  },
  planner: {
    all: () => read<Planner>('planner', {}),
    save: (p: Planner) => write('planner', p),
  },
  routines: {
    // La primera vez se siembran las rutinas de partida; luego son del usuario.
    all: () => read<Routine[]>('routines', DEFAULT_ROUTINES),
    save: (list: Routine[]) => write('routines', list),
  },
  shopping: {
    // Los productos de la primera versión no tenían origen: eran añadidos a mano.
    all: async () => (await read<ShoppingItem[]>('shopping', [])).map((i) => (i.source ? i : { ...i, source: 'manual' as const })),
    save: (list: ShoppingItem[]) => write('shopping', list),
  },
  weights: {
    all: () => read<WeightEntry[]>('weights', []),
    /** Un pesaje por día; el manual manda sobre el de Salud. */
    add: async (entry: WeightEntry) => {
      const list = await read<WeightEntry[]>('weights', [])
      const existing = list.find((w) => w.date === entry.date)
      if (existing?.source === 'manual' && entry.source !== 'manual') return list
      const next = [...list.filter((w) => w.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date))
      await write('weights', next)
      return next
    },
  },
  /** Despensa de la casa: gramos (o ml) disponibles por ingrediente. */
  pantry: {
    get: () => read<Record<string, number>>('pantry', {}),
    save: (p: Record<string, number>) => write('pantry', p),
  },
  customRecipes: {
    all: () => read<Recipe[]>('custom-recipes', []),
    save: (list: Recipe[]) => write('custom-recipes', list),
  },
  kv: { read, write },
}

// Nombres de la primera versión que no coinciden con la base de datos de ejercicios.
const LEGACY_NAMES: Record<string, string> = {
  'Curl bíceps': 'curl-barra',
  'Extensión tríceps polea': 'extension-triceps-polea',
  'Press inclinado mancuernas': 'press-inclinado-mancuernas',
  'Fondos': 'fondos-pecho',
  'Zancadas': 'zancadas',
  'Kettlebell swing': 'swing-kettlebell',
  'Curl femoral': 'curl-femoral',
}

/** Sesiones guardadas antes de la base de datos de ejercicios: se les asigna su ejercicio. */
function migrateSession(s: StrengthSession): StrengthSession {
  if (s.exercises.every((e) => e.exerciseId)) return s
  return {
    ...s,
    exercises: s.exercises.map((e) => {
      if (e.exerciseId) return e
      const ex = exerciseById(LEGACY_NAMES[e.name] ?? '') ?? EXERCISE_DB.find((x) => x.name === e.name)
      return { ...e, exerciseId: ex?.id ?? e.name, restSec: e.restSec ?? ex?.restSec ?? 90, reps: e.reps ?? ex?.reps ?? [8, 12], timed: ex?.timed }
    }),
  }
}

export function newId() {
  return crypto.randomUUID()
}
