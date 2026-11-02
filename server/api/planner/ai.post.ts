import { GOAL_LABEL } from '#shared/core/energy'
import { recipeMacros } from '#shared/core/nutrition'
import { ingredientById } from '#shared/data/foods'
import { allRecipes } from '#shared/data/recipes'
import { MEAL_SLOTS, type MealSlot } from '#shared/types'
import type { PlannerEntry } from '#shared/core/planner'

/**
 * Rellena días del planificador con recetas del recetario según lo que pidas
 * («sin lactosa, barato, que repita comidas para cocinar dos veces»…).
 * La respuesta está restringida a ids del recetario, así todo entra en la compra.
 */
export default defineEventHandler(async (event) => {
  const { from, days = 7, prompt } = await readBody<{ from: string; days?: number; prompt: string }>(event)
  if (!prompt?.trim()) throw createError({ statusCode: 400, message: 'Cuéntale a la IA qué semana quieres.' })

  const settings = await db.settings.get()
  const planned = await plannedDays(from, Math.min(14, days))
  const dates = planned.map((p) => p.dto.date)
  // Franjas a rellenar: las del plan, o las cuatro si no hay plan.
  const slots = MEAL_SLOTS.filter((s) => planned.some((p) => p.dto.meals.some((m) => m.slot === s)))
  const useSlots: MealSlot[] = slots.length ? slots : MEAL_SLOTS

  const recipes = allRecipes()
  const catalog = recipes.map((r) => {
    const m = recipeMacros(r)
    const main = r.ingredients.filter(([id]) => id !== 'especias').map(([id]) => ingredientById(id)?.name).filter(Boolean).join(', ')
    return `${r.id} | ${r.name} | ${r.slots.join('/')} | ${r.tags.join(', ') || '-'} | ${m.kcal} kcal, ${Math.round(m.protein)} g prot | ${main}`
  }).join('\n')

  const dayItem = {
    type: 'object',
    properties: {
      date: { type: 'string', enum: dates },
      ...Object.fromEntries(useSlots.map((s) => [s, { type: 'string', enum: [...recipes.filter((r) => r.slots.includes(s)).map((r) => r.id), 'none'] }])),
    },
    required: ['date', ...useSlots],
    additionalProperties: false,
  }
  const schema = {
    type: 'object',
    properties: {
      days: { type: 'array', items: dayItem },
      summary: { type: 'string' },
    },
    required: ['days', 'summary'],
    additionalProperties: false,
  }

  const context = planned.map((p) => `${p.dto.date} (${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][p.dto.weekday]}): entreno ${p.dto.training.kind}, objetivo ${p.dto.targetKcal} kcal`).join('\n')

  const response = await anthropic().beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
    system: 'Eres el planificador de comidas de Pulso, una app de nutrición saludable en España. Eliges recetas SOLO del catálogo dado. '
      + 'Las raciones se ajustan después al objetivo calórico, así que prioriza variedad, proteína suficiente, verdura y lo que pida la persona. '
      + 'Si pide presupuesto, favorece legumbre, huevo, pollo, avena, arroz y verdura de temporada, y repetir recetas para aprovechar ingredientes; '
      + 'no conoces los precios exactos de Mercadona. Usa "none" solo si no hay ninguna receta compatible con lo pedido. '
      + 'En summary explica en una o dos frases, en español y sin markdown, cómo has organizado la semana.',
    messages: [{
      role: 'user',
      content: `Objetivo: ${GOAL_LABEL[settings.profile.goal]}. Comensales en casa: ${settings.householdSize}.\n`
        + `Días a planificar:\n${context}\n\nFranjas: ${useSlots.join(', ')}\n\n`
        + `Petición: ${prompt.trim()}\n\nCatálogo (id | nombre | franjas | etiquetas | macros por ración | ingredientes):\n${catalog}`,
    }],
  } as any)

  if (response.stop_reason === 'refusal') throw createError({ statusCode: 422, message: 'La IA no ha podido planificar esa petición.' })
  const text = [...response.content].reverse().find((b: any) => b.type === 'text') as { text: string } | undefined
  if (!text) throw createError({ statusCode: 502, message: 'La IA no ha devuelto un plan.' })
  const result = JSON.parse(text.text) as { days: ({ date: string } & Record<string, string>)[]; summary: string }

  const existing = await db.planner.all()
  const entries: Record<string, PlannerEntry> = {}
  for (const day of result.days) {
    if (!dates.includes(day.date)) continue
    const meals: PlannerEntry['meals'] = { ...existing[day.date]?.meals }
    for (const slot of useSlots) {
      const id = day[slot]
      if (id) meals[slot] = { recipeId: id === 'none' ? null : id, servings: settings.householdSize }
    }
    entries[day.date] = { ...existing[day.date], meals }
  }
  await writeEntries(entries)
  return { summary: result.summary, days: Object.keys(entries).length }
})
