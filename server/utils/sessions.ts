import type { RoutineItem } from '#shared/core/plan'
import { nextTarget } from '#shared/core/strength'
import type { Exercise } from '#shared/data/exercises'
import type { SessionExercise, StrengthSession } from '#shared/types'

/** Ejercicio planificado con la carga sugerida por su historial (sobrecarga progresiva). */
export function plannedExercise(ex: Exercise, history: StrengthSession[], item?: RoutineItem): SessionExercise {
  const reps = item?.reps ?? ex.reps
  const last = history
    .filter((s) => s.end)
    .sort((a, b) => b.start - a.start)
    .flatMap((s) => s.exercises.filter((e) => e.exerciseId === ex.id))[0]
    ?.sets.filter((s) => s.done).at(-1)
  const startWeight = ex.bodyweight || ex.timed ? 0 : 20
  const target = last && !ex.timed ? nextTarget(last, reps) : { reps: reps[0], weightKg: last?.weightKg ?? startWeight }
  return {
    exerciseId: ex.id,
    name: ex.name,
    muscle: ex.muscle,
    restSec: item?.restSec ?? ex.restSec,
    reps,
    timed: ex.timed,
    ...(item?.superset ? { superset: true } : {}),
    sets: Array.from({ length: item?.sets ?? 3 }, () => ({ ...target, rpe: null, done: false })),
  }
}
