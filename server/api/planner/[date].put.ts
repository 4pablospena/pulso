import type { DayPlan } from '#shared/core/plan'
import type { MealSlot } from '#shared/types'

type Body =
  | { slot: MealSlot; recipeId: string | null; servings?: number }
  | { training: DayPlan }
  | { reset: 'slot'; slot: MealSlot }
  | { reset: 'training' | 'day' }

/** Cambia una comida o el entreno de una fecha; `reset` vuelve a lo que diga el plan. */
export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')!
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, message: 'Fecha no válida.' })
  const body = await readBody<Body>(event)
  const planner = await db.planner.all()
  const entry = { ...planner[date], meals: { ...planner[date]?.meals } }

  if ('reset' in body) {
    if (body.reset === 'slot') delete entry.meals[body.slot]
    if (body.reset === 'training') delete entry.training
    if (body.reset === 'day') { delete planner[date]; await db.planner.save(planner); return { ok: true } }
  } else if ('training' in body) {
    entry.training = body.training
  } else {
    const servings = body.servings ? Math.min(12, Math.max(1, Math.round(body.servings))) : undefined
    entry.meals[body.slot] = { recipeId: body.recipeId, ...(servings ? { servings } : {}) }
  }

  const hasMeals = Object.keys(entry.meals).length > 0
  // Sin cambios: la fecha vuelve a seguir el plan.
  if (!hasMeals && !entry.training) delete planner[date]
  else planner[date] = { ...(hasMeals ? { meals: entry.meals } : {}), ...(entry.training ? { training: entry.training } : {}) }
  await db.planner.save(planner)
  return { ok: true }
})
