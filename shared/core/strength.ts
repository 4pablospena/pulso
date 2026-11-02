export type MuscleGroup =
  | 'Pecho' | 'Espalda' | 'Hombros' | 'Bíceps' | 'Tríceps' | 'Cuádriceps'
  | 'Isquios' | 'Glúteos' | 'Gemelos' | 'Core' | 'Full body'

export interface LoggedSet {
  reps: number
  weightKg: number
  rpe?: number | null
}

/** 1RM estimado (Epley). Con RPE se suman las repeticiones en reserva. */
export function estimatedOneRepMax(s: LoggedSet): number {
  if (s.reps <= 0 || s.weightKg <= 0) return 0
  const reserve = s.rpe != null ? Math.max(0, 10 - s.rpe) : 0
  const reps = s.reps + reserve
  return reps <= 1 ? s.weightKg : s.weightKg * (1 + reps / 30)
}

export function volume(sets: LoggedSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0)
}

export function bestOneRepMax(sets: LoggedSet[]): number {
  return sets.reduce((best, s) => Math.max(best, estimatedOneRepMax(s)), 0)
}

/** Sobrecarga progresiva: +1 rep hasta el tope del rango, luego +2,5 kg y vuelta al mínimo. */
export function nextTarget(last: LoggedSet, range: [number, number] = [6, 12], increment = 2.5): LoggedSet {
  if (last.reps >= range[1]) return { reps: range[0], weightKg: last.weightKg + increment }
  return { reps: last.reps + 1, weightKg: last.weightKg }
}

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

/**
 * Discos por lado para llegar a `target` kg con una barra de `bar` kg.
 * `rest` es lo que no se puede cargar exactamente con los discos disponibles.
 */
export function platesPerSide(target: number, bar = 20, plates = PLATES): { plates: number[]; rest: number } {
  let perSide = Math.max(0, (target - bar) / 2)
  const out: number[] = []
  for (const p of plates) {
    while (perSide + 1e-9 >= p) {
      out.push(p)
      perSide -= p
    }
  }
  return { plates: out, rest: Math.round(perSide * 2 * 100) / 100 }
}
