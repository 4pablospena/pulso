import { describe, expect, it } from 'vitest'
import { EXERCISE_DB } from '../data/exercises'
import { INGREDIENTS, ingredientById } from '../data/foods'
import { NUTRITION_PLANS } from '../data/plans'
import { RECIPES, recipeById } from '../data/recipes'
import { amountLabel, plannedMeals, portionFactor, recipeMacros, shoppingFromPlan } from './nutrition'
import { exerciseHistory, personalRecords, weekStreak } from './progress'
import type { StrengthSession } from '../types'

describe('base de datos de ejercicios', () => {
  it('ids únicos y rangos válidos', () => {
    expect(new Set(EXERCISE_DB.map((e) => e.id)).size).toBe(EXERCISE_DB.length)
    for (const e of EXERCISE_DB) {
      expect(e.reps[0], e.id).toBeLessThanOrEqual(e.reps[1])
      expect(e.tips.length, e.id).toBeGreaterThan(0)
    }
  })
})

describe('recetas y planes', () => {
  it('cada receta usa ingredientes existentes', () => {
    for (const r of RECIPES) for (const [id] of r.ingredients) expect(ingredientById(id), `${r.id} → ${id}`).toBeDefined()
  })

  it('los ids de ingredientes y recetas son únicos', () => {
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(INGREDIENTS.length)
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length)
  })

  it('cada plan tiene 7 días de recetas válidas para su franja', () => {
    for (const plan of NUTRITION_PLANS) {
      for (const slot of plan.slots) {
        const week = plan.week[slot]
        expect(week, `${plan.id} ${slot}`).toHaveLength(7)
        for (const id of week!) expect(recipeById(id)?.slots, `${plan.id} ${slot} ${id}`).toContain(slot)
      }
    }
  })

  it('las recetas tienen macros razonables', () => {
    for (const r of RECIPES) {
      const m = recipeMacros(r)
      expect(m.kcal, r.id).toBeGreaterThan(80)
      expect(m.kcal, r.id).toBeLessThan(1000)
    }
  })

  it('el día base de cada plan anda entre 1000 y 2800 kcal (luego se escala a tu objetivo)', () => {
    for (const plan of NUTRITION_PLANS) {
      for (let d = 0; d < 7; d++) {
        const kcal = plannedMeals(plan, d).reduce((s, m) => s + recipeMacros(m.recipe).kcal, 0)
        expect(kcal, `${plan.id} día ${d}`).toBeGreaterThan(1000)
        expect(kcal, `${plan.id} día ${d}`).toBeLessThan(2800)
      }
    }
  })

  it('el factor de ración se ajusta y se limita', () => {
    const meals = plannedMeals(NUTRITION_PLANS[0]!, 1)
    const base = meals.reduce((s, m) => s + recipeMacros(m.recipe).kcal, 0)
    expect(portionFactor(meals, base)).toBe(1)
    expect(portionFactor(meals, base * 3)).toBe(1.6)
    expect(portionFactor(meals, 100)).toBe(0.7)
  })

  it('los cambios del usuario sustituyen la receta del plan', () => {
    const meals = plannedMeals(NUTRITION_PLANS[0]!, 1, { '1:Cena': 'wrap-pavo' })
    expect(meals.find((m) => m.slot === 'Cena')).toMatchObject({ swapped: true, recipe: { id: 'wrap-pavo' } })
  })

  it('unidades legibles', () => {
    expect(amountLabel(ingredientById('huevo'), 120)).toBe('2 huevos')
    expect(amountLabel(ingredientById('pollo'), 170)).toBe('170 g')
  })

  it('la lista de la compra suma la semana y calcula envases', () => {
    const lines = shoppingFromPlan(NUTRITION_PLANS[3]!, {}, () => 0, 1)
    const pollo = lines.find((l) => l.ingredientId === 'pollo')!
    expect(pollo.neededGrams).toBe(170 * 3)
    // 510 g caben en una bandeja de ~500 g: se tolera un 5 % por encima del formato.
    expect(pollo.units).toBe(1)
    expect(lines.find((l) => l.ingredientId === 'pasta-integral')!.units).toBe(1)
    expect(lines.find((l) => l.ingredientId === 'aove')?.pantry).toBe(true)
  })
})

describe('seguimiento', () => {
  const day = 86_400_000
  const now = new Date('2026-11-04T12:00:00').getTime()
  const session = (start: number, weight: number): StrengthSession => ({
    id: String(start), title: 'T', start, end: start + 3600_000,
    exercises: [{ exerciseId: 'press-banca', name: 'Press banca', muscle: 'Pecho', restSec: 90, reps: [6, 10],
      sets: [{ reps: 8, weightKg: weight, rpe: null, done: true }, { reps: 8, weightKg: weight + 10, rpe: null, done: false }] }],
  })

  it('historial y récords ignoran series no hechas', () => {
    const h = exerciseHistory([session(now - 2 * day, 60), session(now - day, 65)], 'press-banca')
    expect(h).toHaveLength(2)
    expect(personalRecords(h).maxWeight).toBe(65)
  })

  it('racha de semanas', () => {
    const list = [session(now - 7 * day, 60), session(now - 14 * day, 60), session(now - 28 * day, 60)]
    expect(weekStreak(list, now)).toBe(2)
    expect(weekStreak([...list, session(now, 60)], now)).toBe(3)
  })
})

describe('planificador semanal', async () => {
  const { resolveDay, dateRange, weekStart, mealMultiplier } = await import('./planner')
  const { shoppingFromMeals } = await import('./nutrition')
  const plan = NUTRITION_PLANS.find((p) => p.id === 'definicion-168')!
  const template = { plan, overrides: {}, schedule: { 1: { kind: 'strength' as const, routineId: 'torso' } }, householdSize: 1 }

  it('sin cambios usa el plan y el horario', () => {
    const day = resolveDay('2026-11-02', {}, template) // lunes
    expect(day.training).toEqual({ kind: 'strength', routineId: 'torso' })
    expect(day.meals.map((m) => m.slot)).toEqual(['Comida', 'Merienda', 'Cena'])
    expect(day.meals.every((m) => m.fromTemplate)).toBe(true)
  })

  it('los cambios de una fecha mandan sobre el plan y pueden añadir comidas', () => {
    const day = resolveDay('2026-11-02', {
      '2026-11-02': { meals: { Desayuno: { recipeId: 'porridge-platano' }, Cena: { recipeId: null } }, training: { kind: 'run' } },
    }, template)
    expect(day.meals.map((m) => m.slot)).toEqual(['Desayuno', 'Comida', 'Merienda', 'Cena'])
    expect(day.meals[0]!.recipe?.id).toBe('porridge-platano')
    expect(day.meals[3]!.recipe).toBeNull()
    expect(day.training.kind).toBe('run')
  })

  it('fechas y semanas', () => {
    expect(weekStart('2026-11-05')).toBe('2026-11-02')
    expect(dateRange('2026-10-30', 4)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
  })

  it('cada comensal extra suma una ración base a la compra', () => {
    const day = resolveDay('2026-11-02', { '2026-11-02': { meals: { Comida: { recipeId: 'pollo-arroz-brocoli', servings: 3 } } } }, template)
    const comida = day.meals.find((m) => m.slot === 'Comida')!
    expect(mealMultiplier(comida, 1.2)).toBeCloseTo(3.2)
    const pollo = shoppingFromMeals([{ recipe: comida.recipe!, multiplier: 3 }]).find((l) => l.ingredientId === 'pollo')!
    expect(pollo.neededGrams).toBe(510)
  })
})
