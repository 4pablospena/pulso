import { dailyTarget } from '#shared/core/energy'
import { dayKey } from '#shared/core/format'
import { recipeMacros } from '#shared/core/nutrition'
import { focusFor } from '#shared/core/plan'
import { dateRange, dayFactor, resolveDay, type PlannerEntry, type PlannerTemplate, type ResolvedDay } from '#shared/core/planner'
import { planById } from '#shared/data/plans'
import type { PlannedDay, Settings } from '#shared/types'

export function plannerTemplate(settings: Settings): PlannerTemplate {
  return {
    plan: planById(settings.nutritionPlanId),
    overrides: settings.planOverrides,
    schedule: settings.trainingSchedule,
    householdSize: settings.householdSize ?? 1,
  }
}

/** Objetivo de un día: el real para hoy (con tu actividad), estimado (~75 % de tu meta de actividad) para el resto. */
export async function targetKcalFor(day: ResolvedDay, settings: Settings): Promise<number> {
  if (day.date === dayKey()) return (await daySummary(day.date)).target.kcal
  return dailyTarget(settings.profile, settings.moveGoalKcal * 0.75, focusFor(day.training, day.weekday)).kcal
}

export async function plannedDays(from: string, days: number): Promise<{ resolved: ResolvedDay; dto: PlannedDay }[]> {
  const [settings, planner] = await Promise.all([db.settings.get(), db.planner.all()])
  const template = plannerTemplate(settings)
  return Promise.all(dateRange(from, days).map(async (date) => {
    const resolved = resolveDay(date, planner, template)
    const targetKcal = await targetKcalFor(resolved, settings)
    const factor = dayFactor(resolved, targetKcal)
    const meals = resolved.meals.map((m) => {
      const macros = m.recipe ? recipeMacros(m.recipe, factor) : null
      return { slot: m.slot, recipeId: m.recipe?.id ?? null, servings: m.servings, fromTemplate: m.fromTemplate,
        kcal: macros?.kcal ?? 0, protein: Math.round(macros?.protein ?? 0) }
    })
    return {
      resolved,
      dto: {
        date, weekday: resolved.weekday, training: resolved.training, trainingFromTemplate: resolved.trainingFromTemplate,
        targetKcal, factor, meals,
        plannedKcal: meals.reduce((s, m) => s + m.kcal, 0),
        plannedProtein: meals.reduce((s, m) => s + m.protein, 0),
      },
    }
  }))
}

/** Convierte un día resuelto (plan + cambios) en una entrada fija del planificador. */
export function entryFrom(day: ResolvedDay): PlannerEntry {
  const meals: PlannerEntry['meals'] = {}
  for (const m of day.meals) meals[m.slot] = { recipeId: m.recipe?.id ?? null, servings: m.servings }
  return { meals, training: day.training }
}

/** Escribe varias fechas del planificador de una vez. */
export async function writeEntries(entries: Record<string, PlannerEntry>) {
  const planner = await db.planner.all()
  await db.planner.save({ ...planner, ...entries })
}
