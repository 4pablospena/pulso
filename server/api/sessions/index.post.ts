import { exerciseById } from '#shared/data/exercises'
import type { StrengthSession } from '#shared/types'

/** Crea una sesión desde una rutina (o libre) con cargas sugeridas por sobrecarga progresiva. */
export default defineEventHandler(async (event) => {
  const { routineId } = await readBody<{ routineId?: string }>(event)
  const [routines, sessions] = await Promise.all([db.routines.all(), db.sessions.all()])
  const routine = routines.find((r) => r.id === routineId)
  const session: StrengthSession = {
    id: newId(),
    title: routine?.name ?? 'Entreno libre',
    routineId: routine?.id,
    start: Date.now(),
    end: null,
    exercises: (routine?.items ?? []).flatMap((item) => {
      const ex = exerciseById(item.exerciseId)
      return ex ? [plannedExercise(ex, sessions, item)] : []
    }),
  }
  await db.sessions.save([session, ...sessions])
  return session
})
