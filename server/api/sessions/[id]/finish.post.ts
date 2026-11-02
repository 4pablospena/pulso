import { strengthKcal } from '#shared/core/energy'
import { volume } from '#shared/core/strength'

/** Cierra la sesión y la propaga: kcal al balance del día → Strava (WeightTraining). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [sessions, settings] = await Promise.all([db.sessions.all(), db.settings.get()])
  const session = sessions.find((s) => s.id === id)
  if (!session) throw createError({ statusCode: 404, message: 'Sesión no encontrada.' })

  session.end = Date.now()
  const durationSec = (session.end - session.start) / 1000
  session.kcal = strengthKcal(settings.profile.weightKg, durationSec)

  let stravaError: string | null = null
  if (settings.autoUploadStrava && (await stravaToken.get())) {
    const lines = session.exercises
      .map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length)
      .map((e) => `• ${e.name}: ${e.sets.map((s) => `${s.reps}×${s.weightKg}kg`).join(', ')}`)
    const total = Math.round(volume(session.exercises.flatMap((e) => e.sets.filter((s) => s.done))))
    try {
      session.stravaId = await uploadStrength(session.title, session.start, durationSec,
        [...lines, '', `Volumen total: ${total} kg · Registrado con Pulso`].join('\n'))
    } catch (e: any) {
      stravaError = e?.data?.message ?? e?.message ?? 'Error al subir a Strava'
    }
  }
  await db.sessions.save(sessions)
  return { session, stravaError }
})
