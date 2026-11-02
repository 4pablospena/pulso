export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [routines, settings] = await Promise.all([db.routines.all(), db.settings.get()])
  await db.routines.save(routines.filter((r) => r.id !== id))
  // Los días que usaban esta rutina pasan a descanso.
  const schedule = Object.fromEntries(Object.entries(settings.trainingSchedule)
    .map(([d, plan]) => [d, plan.kind === 'strength' && plan.routineId === id ? { kind: 'rest' as const } : plan]))
  await db.settings.set({ ...settings, trainingSchedule: schedule })
  return { ok: true }
})
