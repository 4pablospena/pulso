import { dayKey } from '#shared/core/format'
import type { FoodCandidate, FoodEntry, MealSlot } from '#shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ slot: MealSlot; source: FoodEntry['source']; recipeId?: string; items: FoodCandidate[]; date?: string }>(event)
  // Se puede registrar en un día pasado (se guarda a mediodía de ese día).
  const day = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') ? body.date! : dayKey()
  const at = day === dayKey() ? Date.now() : new Date(`${day}T12:00:00`).getTime()
  const list = await db.foods.get(day)
  const added: FoodEntry[] = body.items.map((c) => ({
    ...c, id: newId(), at, slot: body.slot, source: body.source, ...(body.recipeId ? { recipeId: body.recipeId } : {}),
  }))
  await db.foods.set(day, [...list, ...added])
  return added
})
