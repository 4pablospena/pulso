import { ingredientById, type Ingredient } from '../data/foods'
import type { NutritionPlan } from '../data/plans'
import { recipeById, type Recipe } from '../data/recipes'
import type { MealSlot } from '../types'
import { scaleMacros, sumMacros, type Macros } from './energy'
import type { Aisle } from './grocery'

export function recipeMacros(recipe: Recipe, factor = 1): Macros {
  const base = sumMacros(recipe.ingredients.map(([id, grams]) => {
    const ing = ingredientById(id)
    return ing ? scaleMacros(ing.per100, grams / 100) : { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  }))
  return scaleMacros(base, factor)
}

export function recipeGrams(recipe: Recipe, factor = 1): number {
  return Math.round(recipe.ingredients.reduce((s, [, g]) => s + g, 0) * factor)
}

/** Índice 0…6 de lunes a domingo a partir de `Date.getDay()`. */
export const weekIndex = (weekday: number) => (weekday + 6) % 7

export interface PlannedMeal {
  slot: MealSlot
  recipe: Recipe
  swapped: boolean
}

export function plannedMeals(plan: NutritionPlan, weekday: number, overrides: Record<string, string> = {}): PlannedMeal[] {
  return plan.slots.flatMap((slot) => {
    const override = overrides[`${weekday}:${slot}`]
    const id = override ?? plan.week[slot]?.[weekIndex(weekday)]
    const recipe = id ? recipeById(id) : undefined
    return recipe ? [{ slot, recipe, swapped: !!override }] : []
  })
}

/** Factor para ajustar las raciones del día a tu objetivo calórico (entre 0,7× y 1,6×, de 0,05 en 0,05). */
export function portionFactor(meals: PlannedMeal[], targetKcal: number): number {
  const planned = meals.reduce((s, m) => s + recipeMacros(m.recipe).kcal, 0)
  if (!planned || !targetKcal) return 1
  const f = Math.min(1.6, Math.max(0.7, targetKcal / planned))
  return Math.round(f * 20) / 20
}

/** "2 huevos", "1 plátano" o "120 g" según el ingrediente. */
export function amountLabel(ing: Ingredient | undefined, grams: number): string {
  if (ing?.unitGrams && ing.unitName) {
    const n = Math.max(1, Math.round((grams / ing.unitGrams) * 2) / 2)
    return `${String(n).replace('.', ',')} ${n === 1 ? ing.unitName[0] : ing.unitName[1]}`
  }
  return grams >= 1000 ? `${(grams / 1000).toFixed(1).replace('.', ',')} kg` : `${Math.round(grams)} g`
}

export interface ShoppingLine {
  ingredientId: string
  name: string
  aisle: Aisle
  product: string
  format: string
  units: number
  neededGrams: number
  recipes: string[]
  pantry: boolean
}

/**
 * Lista de la compra para los próximos `days` días del plan: suma los gramos de cada ingrediente
 * (ya ajustados a tu objetivo) y calcula cuántos envases de Mercadona hacen falta.
 */
export function shoppingFromPlan(
  plan: NutritionPlan,
  overrides: Record<string, string>,
  targetKcalFor: (weekday: number) => number,
  startWeekday: number,
  days = 7,
): ShoppingLine[] {
  const portions: { recipe: Recipe; multiplier: number }[] = []
  for (let i = 0; i < days; i++) {
    const weekday = (startWeekday + i) % 7
    const meals = plannedMeals(plan, weekday, overrides)
    const factor = portionFactor(meals, targetKcalFor(weekday))
    for (const { recipe } of meals) portions.push({ recipe, multiplier: factor })
  }
  return shoppingFromMeals(portions)
}

/** Suma los ingredientes de unas raciones (receta × multiplicador) y los pasa a envases de Mercadona. */
export function shoppingFromMeals(portions: { recipe: Recipe; multiplier: number }[]): ShoppingLine[] {
  const totals = new Map<string, { grams: number; recipes: Set<string> }>()
  for (const { recipe, multiplier } of portions) {
    for (const [id, grams] of recipe.ingredients) {
      const t = totals.get(id) ?? { grams: 0, recipes: new Set<string>() }
      t.grams += grams * multiplier
      t.recipes.add(recipe.name)
      totals.set(id, t)
    }
  }
  return [...totals].flatMap(([id, t]) => {
    const ing = ingredientById(id)
    if (!ing) return []
    return [{
      ingredientId: id,
      name: ing.name,
      aisle: ing.aisle,
      product: ing.product.name,
      format: ing.product.format,
      units: Math.max(1, Math.ceil(t.grams / ing.product.packGrams - 0.05)),
      neededGrams: Math.round(t.grams),
      recipes: [...t.recipes],
      pantry: !!ing.pantry,
    }]
  })
}
