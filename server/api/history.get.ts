import type { HistoryDay } from '#shared/core/balance'
import { dayKey } from '#shared/core/format'
import { planById } from '#shared/data/plans'

/** Historial de los últimos `days` días (de más antiguo a hoy): comido, quemado, plan y peso. */
export default defineEventHandler(async (event): Promise<HistoryDay[]> => {
  const days = Math.min(90, Math.max(1, Number(getQuery(event).days) || 30))
  const settings = await db.settings.get()
  const plan = planById(settings.nutritionPlanId)
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return dayKey(d)
  })
  return Promise.all(dates.map(async (date) => {
    const s = await daySummary(date)
    // Hoy solo cuenta para el cumplimiento cuando ya has registrado algo.
    const planActive = !!plan && (!settings.nutritionPlanSince || date >= settings.nutritionPlanSince)
      && (date !== dayKey() || s.foods.length > 0)
    return {
      date,
      eaten: s.eaten,
      target: s.target,
      burnedKcal: s.burnedKcal,
      activeKcal: s.activeKcal,
      logged: s.foods.length > 0,
      planDone: new Set(s.foods.filter((f) => f.recipeId).map((f) => f.slot)).size,
      planTotal: planActive ? plan!.slots.length : null,
      weightKg: s.weightKg,
    }
  }))
})
