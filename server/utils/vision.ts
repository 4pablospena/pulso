import Anthropic from '@anthropic-ai/sdk'
import type { FoodCandidate } from '#shared/types'

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
}

let client: Anthropic | null = null

export function visionConfigured() {
  return !!useRuntimeConfig().anthropicApiKey
}

/** Cámara inteligente: identifica los alimentos del plato y estima ración y macros. */
export async function analyzeMeal(base64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<FoodCandidate[]> {
  if (!visionConfigured()) throw createError({ statusCode: 400, message: 'Falta NUXT_ANTHROPIC_API_KEY para la cámara inteligente.' })
  client ??= new Anthropic({ apiKey: useRuntimeConfig().anthropicApiKey })

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        {
          type: 'text',
          text: 'Identifica cada alimento del plato y estima la ración en gramos y sus kcal, proteína, '
            + 'carbohidratos y grasa para esa ración. Usa nombres en español. Si ves un envase de marca '
            + '(p. ej. Hacendado), usa sus valores típicos.',
        },
      ],
    }],
  } as any)

  if (response.stop_reason === 'refusal') throw createError({ statusCode: 422, message: 'No se pudo analizar esta imagen.' })
  const text = [...response.content].reverse().find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw createError({ statusCode: 422, message: 'No se detectaron alimentos.' })

  const { items } = JSON.parse(text.text) as { items: { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[] }
  return items.map((i) => ({
    name: i.name,
    grams: Math.round(i.grams),
    macros: { kcal: Math.round(i.kcal), protein: i.protein, carbs: i.carbs, fat: i.fat },
  }))
}
