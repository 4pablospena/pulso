import { scaleMacros } from '#shared/core/energy'
import { INGREDIENTS } from '#shared/data/foods'
import type { FoodCandidate } from '#shared/types'

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/** Busca alimentos por nombre: primero los básicos de la app, después Open Food Facts (productos de España). */
export default defineEventHandler(async (event): Promise<(FoodCandidate & { origin: string })[]> => {
  const q = String(getQuery(event).q ?? '').trim()
  if (q.length < 2) return []

  const local = INGREDIENTS
    .filter((i) => !i.pantry && normalize(i.name).includes(normalize(q)))
    .slice(0, 5)
    .map((i) => {
      const grams = i.unitGrams ?? 100
      return { name: i.name, grams, macros: scaleMacros(i.per100, grams / 100), origin: 'Básico' }
    })

  const res = await $fetch<any>('https://world.openfoodfacts.org/cgi/search.pl', {
    query: {
      search_terms: q, search_simple: 1, action: 'process', json: 1, page_size: 20,
      fields: 'code,product_name,brands,nutriments,serving_quantity',
      tagtype_0: 'countries', tag_contains_0: 'contains', tag_0: 'spain',
    },
    headers: { 'User-Agent': 'Pulso/1.0 (app personal)' },
    timeout: 8000,
  }).catch(() => null)

  const remote = (res?.products ?? [])
    .filter((p: any) => p.product_name && p.nutriments && (num(p.nutriments['energy-kcal_100g']) || num(p.nutriments.energy_100g)))
    .map((p: any) => {
      const n = p.nutriments
      const per100 = {
        kcal: num(n['energy-kcal_100g']) || num(n.energy_100g) / 4.184,
        protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), fat: num(n.fat_100g),
      }
      const grams = num(p.serving_quantity) || 100
      return { name: [p.product_name, p.brands?.split(',')[0]].filter(Boolean).join(' · '), grams, macros: scaleMacros(per100, grams / 100), origin: 'Open Food Facts' }
    })
    .slice(0, 15)

  return [...local, ...remote]
})
