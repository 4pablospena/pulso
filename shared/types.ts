import type { BodyProfile, Macros } from './core/energy'
import type { FastingProtocol } from './core/fasting'
import type { Aisle } from './core/grocery'
import type { DayPlan, Routine, TrainingSchedule } from './core/plan'
import type { MuscleGroup } from './core/strength'

export type { Routine, TrainingSchedule }

export type MealSlot = 'Desayuno' | 'Comida' | 'Merienda' | 'Cena'
export const MEAL_SLOTS: MealSlot[] = ['Desayuno', 'Comida', 'Merienda', 'Cena']

export interface Settings {
  profile: BodyProfile
  fastingProtocol: FastingProtocol
  fastingStart: number | null
  waterGoalMl: number
  moveGoalKcal: number
  autoUploadStrava: boolean
  trainingSchedule: TrainingSchedule
  /** Plan nutricional activo (id de NUTRITION_PLANS) o null. */
  nutritionPlanId: string | null
  /** Día (YYYY-MM-DD) en que se activó el plan, para medir el cumplimiento desde entonces. */
  nutritionPlanSince?: string | null
  /** Personas que comen en casa: multiplica la lista de la compra. */
  householdSize: number
  /** Cambios del usuario sobre el plan: clave "díaSemana:comida" → id de receta. */
  planOverrides: Record<string, string>
}

export interface FoodCandidate {
  name: string
  grams: number
  macros: Macros
}

export interface FoodEntry extends FoodCandidate {
  id: string
  at: number
  slot: MealSlot
  source: 'manual' | 'barcode' | 'photo' | 'plan'
  recipeId?: string
}

export interface WaterEntry {
  at: number
  ml: number
}

export interface Workout {
  id: string
  kind: 'run' | 'strength' | 'other'
  name: string
  start: number
  durationSec: number
  kcal: number
  distanceM: number
  elevationM?: number
  avgHR?: number
  source: 'Apple Salud' | 'Strava' | 'Pulso'
  url?: string
}

/** Lo que llega de Apple Salud (vía Health Auto Export o Atajos) para un día. */
export interface HealthDay {
  activeKcal: number
  steps: number
  exerciseMin: number
  restingHR?: number
  weightKg?: number
  workouts: Workout[]
  updatedAt: number
}

export interface SetEntry {
  reps: number
  weightKg: number
  rpe: number | null
  done: boolean
}

export interface SessionExercise {
  exerciseId: string
  name: string
  muscle: MuscleGroup
  restSec: number
  reps: [number, number]
  timed?: boolean
  sets: SetEntry[]
}

export interface StrengthSession {
  id: string
  title: string
  routineId?: string
  start: number
  end: number | null
  exercises: SessionExercise[]
  kcal?: number
  stravaId?: number
}

export interface ShoppingItem {
  id: string
  name: string
  aisle: Aisle
  checked: boolean
  addedAt: number
  source: 'manual' | 'plan'
  /** Quién lo añadió (la lista es compartida por la casa). */
  ownerId?: string
  ownerName?: string
  /** Ya lo tienes en casa: no hace falta comprarlo. */
  have?: boolean
  /** Solo en productos generados desde el plan nutricional. */
  ingredientId?: string
  product?: string
  format?: string
  units?: number
  neededGrams?: number
  recipes?: string[]
  pantry?: boolean
}

export interface DaySummary {
  date: string
  foods: FoodEntry[]
  water: WaterEntry[]
  eaten: Macros
  target: Macros
  /** Gasto total estimado: basal + actividad cotidiana + energía activa. */
  burnedKcal: number
  activeKcal: number
  activeSource: 'Apple Salud' | 'Strava + Pulso' | 'Sin datos'
  steps: number
  exerciseMin: number
  workouts: Workout[]
  healthUpdatedAt: number | null
  weightKg: number | null
}

export interface WeightEntry {
  date: string
  kg: number
  source: 'manual' | 'Apple Salud'
}

export interface IntegrationStatus {
  strava: { configured: boolean; connected: boolean; athlete: string | null }
  health: { lastSync: number | null; ingestUrl: string; tokenConfigured: boolean }
  vision: { configured: boolean }
}

/** Un día del planificador ya resuelto (plan + cambios), con raciones ajustadas a tu objetivo. */
export interface PlannedDay {
  date: string
  weekday: number
  training: DayPlan
  trainingFromTemplate: boolean
  targetKcal: number
  factor: number
  plannedKcal: number
  plannedProtein: number
  meals: {
    slot: MealSlot
    recipeId: string | null
    servings: number
    fromTemplate: boolean
    kcal: number
    protein: number
  }[]
}

export interface ShoppingMeta {
  from: string
  days: number
  generatedAt: number
}

/** Persona que usa la app (sin datos sensibles). */
export interface AppUser {
  id: string
  name: string
  username: string
  role: 'admin' | 'member'
  createdAt: number
}

export interface AuthStatus {
  required: boolean
  authenticated: boolean
  /** Aún no hay usuarios: el primer acceso usa NUXT_APP_PASSWORD y crea la cuenta de administrador. */
  setup: boolean
  user: AppUser | null
}
