import { dayKey } from '#shared/core/format'
import { shoppingFromMeals } from '#shared/core/nutrition'
import { mealMultiplier } from '#shared/core/planner'
import { ingredientById } from '#shared/data/foods'
import type { ShoppingItem, ShoppingMeta } from '#shared/types'

/**
 * Genera la compra de los días elegidos del planificador: tus raciones ajustadas a tu objetivo
 * más una ración por cada comensal extra. Sustituye lo pendiente que venía del plan, conserva lo
 * añadido a mano y lo que ya está en el carro, y recuerda lo que marcaste como «ya lo tengo».
 */
export default defineEventHandler(async (event) => {
  const body = (await readBody<{ from?: string; days?: number }>(event).catch(() => null)) ?? {}
  const from = /^\d{4}-\d{2}-\d{2}$/.test(body.from ?? '') ? body.from! : dayKey()
  const days = Math.min(14, Math.max(1, Number(body.days) || 7))

  const planned = await plannedDays(from, days)
  const portions = planned.flatMap(({ resolved, dto }) =>
    resolved.meals.flatMap((m) => (m.recipe ? [{ recipe: m.recipe, multiplier: mealMultiplier(m, dto.factor) }] : [])))
  if (!portions.length) throw createError({ statusCode: 400, message: 'No hay comidas planificadas en esos días. Elige un plan o planifica en Semana.' })
  const lines = shoppingFromMeals(portions)

  const current = await db.shopping.all()
  const hadAtHome = new Set(current.filter((i) => i.have && i.ingredientId).map((i) => i.ingredientId))
  const covered = (name: string) => lines.some((l) => sameProduct(name, l.name) || sameProduct(name, l.product))
  // La lista es de la casa: solo se recalcula lo que venía de TU plan; lo de los demás se queda.
  const me = currentUser(event)
  const mine = (i: ShoppingItem) => !me || !i.ownerId || i.ownerId === me.id
  const kept = current.filter((i) => i.checked || !mine(i) || (i.source !== 'plan' && !covered(i.name)))
  // Lo que ya hay en la despensa se resta: solo se compra lo que falta.
  const pantry = await db.pantry.get()
  const fresh: ShoppingItem[] = lines.map((l) => {
    const stock = pantry[l.ingredientId] ?? 0
    const missing = l.neededGrams - stock
    const pack = ingredientById(l.ingredientId)?.product.packGrams ?? 1
    const coveredByPantry = stock > 0 && missing <= 0
    return {
    id: newId(), name: l.name, aisle: l.aisle, checked: false, addedAt: Date.now(), source: 'plan',
    ...(me ? { ownerId: me.id, ownerName: me.name } : {}),
    ingredientId: l.ingredientId, product: l.product, format: l.format,
    units: stock > 0 && missing > 0 ? Math.max(1, Math.ceil(missing / pack - 0.05)) : l.units,
    neededGrams: l.neededGrams, recipes: l.recipes, pantry: l.pantry,
    ...(stock > 0 ? { inPantryGrams: Math.round(stock) } : {}),
    // Lo básico de despensa se da por hecho que lo tienes, salvo que lo desmarcaras.
    have: coveredByPantry || hadAtHome.has(l.ingredientId) || (l.pantry && !current.some((i) => i.ingredientId === l.ingredientId && i.have === false)),
    }
  })
  const list = [...kept, ...fresh]
  await db.shopping.save(list)
  await db.kv.write<ShoppingMeta>('shopping-meta', { from, days, generatedAt: Date.now() })
  if (me) {
    await pushToHousehold(event, 'shopping', {
      title: 'Lista de la compra actualizada', body: `${me.name} ha calculado la compra de ${days} días (${fresh.length} productos).`, url: '/compra', tag: 'shopping',
    }).catch(() => {})
  }
  return list
})

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim()

/** "Huevos L" ≈ "Huevo", "Salmón fresco" ≈ "Salmón": mismo producto si uno empieza por el otro (singular). */
function sameProduct(a: string, b: string) {
  const x = normalize(a).replace(/s\b/g, '')
  const y = normalize(b).replace(/s\b/g, '')
  return x.startsWith(y) || y.startsWith(x)
}
