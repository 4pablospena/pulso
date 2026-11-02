import { dayKey } from '#shared/core/format'
import { recipeGrams } from '#shared/core/nutrition'
import { recipeById } from '#shared/data/recipes'
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
  // Comer una receta del plan gasta sus ingredientes de la despensa.
  if (body.recipeId) {
    const recipe = recipeById(body.recipeId)
    const base = recipe ? recipeGrams(recipe) : 0
    if (recipe && base) {
      const factor = body.items.reduce((s, i) => s + i.grams, 0) / base
      const pantry = await db.pantry.get()
      let changed = false
      for (const [id, grams] of recipe.ingredients) {
        if (pantry[id] == null) continue
        pantry[id] = Math.max(0, Math.round(pantry[id]! - grams * factor))
        if (pantry[id] === 0) delete pantry[id]
        changed = true
      }
      if (changed) await db.pantry.save(pantry)
    }
  }
  return added
})
