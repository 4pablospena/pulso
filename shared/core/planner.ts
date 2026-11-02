import type { NutritionPlan } from '../data/plans'
import { recipeById, type Recipe } from '../data/recipes'
import { MEAL_SLOTS, type MealSlot } from '../types'
import { dayKey } from './format'
import { plannedMeals, portionFactor, recipeMacros } from './nutrition'
import type { DayPlan, TrainingSchedule } from './plan'

/** Lo que el usuario ha decidido para una comida concreta de una fecha. */
export interface MealChoice {
  /** null = esa comida no se planifica (comer fuera, saltarla…). */
  recipeId: string | null
  /** Personas que comen esta receta (tú incluido). */
  servings?: number
}

/** Cambios sobre la plantilla para una fecha. Lo que no esté aquí sale del plan y del horario semanal. */
export interface PlannerEntry {
  meals?: Partial<Record<MealSlot, MealChoice>>
  training?: DayPlan
}

export type Planner = Record<string, PlannerEntry>

export interface PlannerTemplate {
  plan?: NutritionPlan
  /** Cambios antiguos por día de la semana ("díaSemana:comida" → receta). */
  overrides: Record<string, string>
  schedule: TrainingSchedule
  householdSize: number
}

export interface ResolvedMeal {
  slot: MealSlot
  recipe: Recipe | null
  servings: number
  /** Viene del plan sin cambios del usuario. */
  fromTemplate: boolean
}

export interface ResolvedDay {
  date: string
  weekday: number
  training: DayPlan
  trainingFromTemplate: boolean
  meals: ResolvedMeal[]
}

const weekdayOf = (date: string) => new Date(`${date}T12:00:00`).getDay()

/** Une la plantilla (plan nutricional + horario de entreno) con los cambios de esa fecha. */
export function resolveDay(date: string, planner: Planner, t: PlannerTemplate): ResolvedDay {
  const weekday = weekdayOf(date)
  const entry = planner[date] ?? {}
  const template = new Map((t.plan ? plannedMeals(t.plan, weekday, t.overrides) : []).map((m) => [m.slot, m.recipe]))
  const slots = MEAL_SLOTS.filter((s) => template.has(s) || entry.meals?.[s])
  const meals = slots.map((slot): ResolvedMeal => {
    const choice = entry.meals?.[slot]
    if (choice) {
      return { slot, recipe: choice.recipeId ? recipeById(choice.recipeId) ?? null : null, servings: choice.servings ?? t.householdSize, fromTemplate: false }
    }
    return { slot, recipe: template.get(slot) ?? null, servings: t.householdSize, fromTemplate: true }
  })
  return {
    date,
    weekday,
    training: entry.training ?? t.schedule[weekday] ?? { kind: 'rest' },
    trainingFromTemplate: !entry.training,
    meals,
  }
}

export function dateRange(from: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(`${from}T12:00:00`)
    d.setDate(d.getDate() + i)
    return dayKey(d)
  })
}

/** Lunes de la semana de `date`. */
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d)
}

/** Factor de tu ración para el día (las de los demás comensales van a ración base). */
export function dayFactor(day: ResolvedDay, targetKcal: number): number {
  const mine = day.meals.flatMap((m) => (m.recipe ? [{ slot: m.slot, recipe: m.recipe, swapped: false }] : []))
  return portionFactor(mine, targetKcal)
}

export function dayKcal(day: ResolvedDay, factor: number) {
  return day.meals.reduce((s, m) => s + (m.recipe ? recipeMacros(m.recipe, factor).kcal : 0), 0)
}

/** Multiplicador de ingredientes de una comida: tu ración ajustada + una ración base por cada comensal más. */
export function mealMultiplier(meal: ResolvedMeal, factor: number): number {
  return factor + Math.max(0, meal.servings - 1)
}
