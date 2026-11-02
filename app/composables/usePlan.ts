import { dailyTarget } from '#shared/core/energy'
import { dayKey } from '#shared/core/format'
import { plannedMeals, portionFactor, recipeMacros } from '#shared/core/nutrition'
import { focusFor } from '#shared/core/plan'
import { planById } from '#shared/data/plans'
import type { MealSlot } from '#shared/types'

/** Plan nutricional activo y las raciones de un día, ajustadas a tu objetivo. */
export function usePlan() {
  const { settings, save } = useSettings()
  const { data: today } = useToday()
  const plan = computed(() => planById(settings.value?.nutritionPlanId))

  /** Objetivo de un día: el real para hoy (incluye tu actividad), estimado para el resto. */
  function targetFor(weekday: number): number {
    if (weekday === new Date().getDay() && today.value) return today.value.target.kcal
    const s = settings.value
    if (!s) return 0
    return dailyTarget(s.profile, s.moveGoalKcal * 0.75, focusFor(s.trainingSchedule[weekday], weekday)).kcal
  }

  /** `targetKcal` permite usar el objetivo real de un día concreto (p. ej. uno pasado). */
  function day(weekday: number, targetKcal?: number) {
    if (!plan.value || !settings.value) return null
    const meals = plannedMeals(plan.value, weekday, settings.value.planOverrides)
    const factor = portionFactor(meals, targetKcal ?? targetFor(weekday))
    return { meals: meals.map((m) => ({ ...m, factor, macros: recipeMacros(m.recipe, factor) })), factor }
  }

  async function swap(weekday: number, slot: MealSlot, recipeId: string | null) {
    const overrides = { ...settings.value!.planOverrides }
    if (recipeId) overrides[`${weekday}:${slot}`] = recipeId
    else delete overrides[`${weekday}:${slot}`]
    await save({ planOverrides: overrides })
  }

  const activate = (id: string | null) => save({ nutritionPlanId: id, nutritionPlanSince: id ? dayKey() : null, planOverrides: {} })

  return { plan, settings, day, swap, activate, targetFor }
}
