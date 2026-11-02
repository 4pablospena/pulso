import { scaleMacros } from '#shared/core/energy'
import type { FoodCandidate } from '#shared/types'

/** Producto por código de barras en Open Food Facts (incluye miles de referencias Hacendado). */
export default defineEventHandler(async (event): Promise<FoodCandidate> => {
  const code = getRouterParam(event, 'code')!.replace(/\D/g, '')
  const res = await $fetch<any>(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
    query: { fields: 'product_name,brands,serving_quantity,nutriments' },
    headers: { 'User-Agent': 'Pulso/1.0 (app personal)' },
  }).catch(() => null)
  const p = res?.product
  const n = p?.nutriments
  if (res?.status !== 1 || !n) throw createError({ statusCode: 404, message: 'Producto no encontrado.' })

  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const per100 = {
    kcal: num(n['energy-kcal_100g']) || num(n['energy_100g']) / 4.184,
    protein: num(n.proteins_100g),
    carbs: num(n.carbohydrates_100g),
    fat: num(n.fat_100g),
  }
  const grams = num(p.serving_quantity) || 100
  return {
    name: [p.product_name, p.brands].filter(Boolean).join(' · ') || `Producto ${code}`,
    grams,
    macros: scaleMacros(per100, grams / 100),
  }
})
