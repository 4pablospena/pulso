import { ingredientById } from '#shared/data/foods'

/** Fija la cantidad de un ingrediente en la despensa (0 lo quita). */
export default defineEventHandler(async (event) => {
  const { ingredientId, grams } = await readBody<{ ingredientId: string; grams: number }>(event)
  if (!ingredientById(ingredientId)) throw createError({ statusCode: 400, message: 'Ingrediente desconocido.' })
  const pantry = await db.pantry.get()
  if (grams > 0) pantry[ingredientId] = Math.round(grams)
  else delete pantry[ingredientId]
  await db.pantry.save(pantry)
  return pantry
})
