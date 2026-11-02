import { EXERCISE_DB, type Equipment } from '#shared/data/exercises'
import type { MuscleGroup } from '#shared/core/strength'

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Busca por nombre o músculo (sin tildes) y filtra por grupo y material. */
export function filterExercises(query: string, muscle: MuscleGroup | '' = '', equipment: Equipment | '' = '') {
  const q = normalize(query.trim())
  return EXERCISE_DB.filter((e) =>
    (!muscle || e.muscle === muscle)
    && (!equipment || e.equipment === equipment)
    && (!q || normalize(`${e.name} ${e.muscle} ${e.secondary.join(' ')} ${e.equipment}`).includes(q)))
}
