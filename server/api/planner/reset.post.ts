import { dateRange } from '#shared/core/planner'

/** Quita los cambios de esos días: vuelven a seguir el plan y la semana habitual. */
export default defineEventHandler(async (event) => {
  const { from, days = 7 } = await readBody<{ from: string; days?: number }>(event)
  const planner = await db.planner.all()
  for (const d of dateRange(from, days)) delete planner[d]
  await db.planner.save(planner)
  return { ok: true }
})
