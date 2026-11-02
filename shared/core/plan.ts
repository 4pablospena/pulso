import type { NutritionFocus } from './energy'

export interface RoutineItem {
  exerciseId: string
  sets: number
  reps: [number, number]
  restSec: number
  /** Se hace en superserie con el siguiente ejercicio (sin descanso entre ambos). */
  superset?: boolean
}

export interface Routine {
  id: string
  name: string
  description?: string
  items: RoutineItem[]
}

export type DayPlan =
  | { kind: 'strength'; routineId: string }
  | { kind: 'run'; note?: string }
  | { kind: 'mobility' }
  | { kind: 'rest' }

/** 0 = domingo … 6 = sábado (como `Date.getDay()`). */
export type TrainingSchedule = Record<number, DayPlan>

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
/** Orden de la semana empezando en lunes. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const item = (exerciseId: string, sets: number, reps: [number, number], restSec = 90): RoutineItem => ({ exerciseId, sets, reps, restSec })

/** Rutinas de partida; el usuario puede editarlas o crear las suyas. */
export const DEFAULT_ROUTINES: Routine[] = [
  { id: 'torso', name: 'Torso', description: 'Empuje y tirón de tren superior',
    items: [item('press-banca', 4, [6, 8], 150), item('remo-barra', 4, [6, 10], 120), item('press-hombro-mancuernas', 3, [8, 12]),
      item('jalon-pecho', 3, [8, 12]), item('curl-mancuernas', 3, [10, 12], 60), item('extension-triceps-polea', 3, [10, 15], 60)] },
  { id: 'pierna', name: 'Pierna', description: 'Cuádriceps, isquios y glúteo',
    items: [item('sentadilla', 4, [5, 8], 180), item('peso-muerto-rumano', 3, [8, 10], 120), item('prensa', 3, [10, 12], 120),
      item('curl-femoral', 3, [10, 15], 60), item('hip-thrust', 3, [8, 12]), item('gemelos-pie', 4, [10, 15], 60)] },
  { id: 'full-body', name: 'Full body', description: 'Todo el cuerpo en una sesión',
    items: [item('peso-muerto', 3, [3, 5], 180), item('press-inclinado-mancuernas', 3, [8, 12]), item('dominadas', 3, [5, 8], 120),
      item('zancadas', 3, [8, 12]), item('elevaciones-laterales', 3, [12, 15], 60), item('plancha', 3, [30, 60], 45)] },
  { id: 'casa', name: 'Casa sin material', description: 'Solo peso corporal, 30 minutos',
    items: [item('flexiones', 4, [10, 20], 60), item('sentadilla-aire', 4, [15, 25], 60), item('remo-invertido', 3, [8, 12], 60),
      item('puente-una-pierna', 3, [10, 15], 45), item('fondos-banco', 3, [10, 15], 60), item('plancha', 3, [30, 60], 45),
      item('escaladores', 3, [30, 45], 45)] },
  { id: 'core', name: 'Core y movilidad', description: 'Abdomen y zona media',
    items: [item('dead-bug', 3, [8, 12], 45), item('plancha-lateral', 3, [20, 40], 45), item('crunch-polea', 3, [10, 15], 60),
      item('superman', 3, [12, 15], 45), item('bicicleta', 3, [15, 20], 45)] },
]

/** Semana híbrida fuerza + running del documento de ecosistema. */
export const DEFAULT_SCHEDULE: TrainingSchedule = {
  1: { kind: 'strength', routineId: 'torso' },
  2: { kind: 'run', note: 'Rodaje suave' },
  3: { kind: 'strength', routineId: 'pierna' },
  4: { kind: 'mobility' },
  5: { kind: 'strength', routineId: 'full-body' },
  6: { kind: 'run', note: 'Series · calidad' },
  0: { kind: 'rest' },
}

/** El tipo de día marca el reparto de macros. */
export function focusFor(day: DayPlan | undefined, weekday: number): NutritionFocus {
  switch (day?.kind) {
    case 'strength': return 'highProtein'
    case 'run': return weekday === 6 ? 'refeed' : 'mediumCarbs'
    case 'mobility': return 'normal'
    default: return 'flexible'
  }
}

export function dayTitle(day: DayPlan | undefined, routines: Routine[]): string {
  switch (day?.kind) {
    case 'strength': return `Fuerza · ${routines.find((r) => r.id === day.routineId)?.name ?? 'Rutina'}`
    case 'run': return day.note ? `Running · ${day.note}` : 'Running'
    case 'mobility': return 'Descanso activo · Movilidad'
    default: return 'Descanso'
  }
}

/** Semana de partida según los días de fuerza, si entrena en casa y si corre. */
export function scheduleFor(strengthDays: number, opts: { home: boolean; runs: boolean }): TrainingSchedule {
  const r = (id: string): DayPlan => ({ kind: 'strength', routineId: opts.home ? 'casa' : id })
  const run: DayPlan = opts.runs ? { kind: 'run' } : { kind: 'mobility' }
  const rest: DayPlan = { kind: 'rest' }
  const layouts: Record<number, TrainingSchedule> = {
    2: { 1: r('full-body'), 2: rest, 3: run, 4: r('full-body'), 5: rest, 6: run, 0: rest },
    3: { 1: r('torso'), 2: run, 3: r('pierna'), 4: rest, 5: r('full-body'), 6: run, 0: rest },
    4: { 1: r('torso'), 2: r('pierna'), 3: run, 4: r('torso'), 5: r('pierna'), 6: run, 0: rest },
    5: { 1: r('torso'), 2: r('pierna'), 3: run, 4: r('full-body'), 5: r('torso'), 6: r('pierna'), 0: rest },
  }
  return layouts[Math.min(5, Math.max(2, strengthDays))]!
}
