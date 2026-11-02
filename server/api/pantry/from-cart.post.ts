import { ingredientById } from '#shared/data/foods'

/** Al terminar la compra: lo que está en el carro pasa a la despensa (envases × formato). */
export default defineEventHandler(async () => {
  const [pantry, list] = await Promise.all([db.pantry.get(), db.shopping.all()])
  let added = 0
  for (const item of list.filter((i) => i.checked && i.ingredientId)) {
    const ing = ingredientById(item.ingredientId!)
    if (!ing) continue
    pantry[ing.id] = (pantry[ing.id] ?? 0) + (item.units ?? 1) * ing.product.packGrams
    added++
  }
  await db.pantry.save(pantry)
  return { added, pantry }
})
