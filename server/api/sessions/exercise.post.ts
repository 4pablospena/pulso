import { exerciseById } from '#shared/data/exercises'

/** Devuelve un ejercicio listo para añadir a una sesión, con la carga sugerida por su historial. */
export default defineEventHandler(async (event) => {
  const { exerciseId } = await readBody<{ exerciseId: string }>(event)
  const ex = exerciseById(exerciseId)
  if (!ex) throw createError({ statusCode: 404, message: 'Ejercicio no encontrado.' })
  return plannedExercise(ex, await db.sessions.all())
})
