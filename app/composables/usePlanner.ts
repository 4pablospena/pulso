import type { DayPlan } from '#shared/core/plan'
import type { MealSlot, PlannedDay } from '#shared/types'

/** Días del planificador (comidas + entreno) desde `from` durante `days` días. */
export function usePlanner(from: Ref<string> | (() => string), days: number | (() => number) = 7) {
  return useFetch<PlannedDay[]>('/api/planner', {
    query: { from, days },
    default: () => [],
  })
}

/** Cambios en el planificador; tras cada uno se refresca todo para que Hoy, Semana y Compra cuadren. */
export function usePlannerActions() {
  const put = async (date: string, body: object) => {
    await $fetch(`/api/planner/${date}`, { method: 'PUT', body })
    await refreshNuxtData()
  }
  return {
    setMeal: (date: string, slot: MealSlot, recipeId: string | null, servings?: number) => put(date, { slot, recipeId, servings }),
    resetMeal: (date: string, slot: MealSlot) => put(date, { reset: 'slot', slot }),
    setTraining: (date: string, training: DayPlan) => put(date, { training }),
    resetTraining: (date: string) => put(date, { reset: 'training' }),
  }
}

/** Registra en el diario una comida planificada, con tu ración del día. */
export async function logPlannedMeal(date: string, meal: PlannedDay['meals'][number], factor: number) {
  const { recipeById } = await import('#shared/data/recipes')
  const { recipeGrams, recipeMacros } = await import('#shared/core/nutrition')
  const recipe = recipeById(meal.recipeId!)!
  await $fetch('/api/foods', {
    method: 'POST',
    body: { slot: meal.slot, source: 'plan', recipeId: recipe.id, date,
      items: [{ name: recipe.name, grams: recipeGrams(recipe, factor), macros: recipeMacros(recipe, factor) }] },
  })
  await refreshNuxtData()
}
