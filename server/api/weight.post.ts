import { dayKey } from '#shared/core/format'

/** Anota tu peso de un día. Si es el pesaje más reciente, actualiza el perfil (basal y proteína). */
export default defineEventHandler(async (event) => {
  const { kg, date } = await readBody<{ kg: number; date?: string }>(event)
  if (!(kg > 25 && kg < 350)) throw createError({ statusCode: 400, message: 'Peso no válido.' })
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date! : dayKey()
  const list = await db.weights.add({ date: day, kg: Math.round(kg * 10) / 10, source: 'manual' })
  if (list.at(-1)?.date === day) {
    const settings = await db.settings.get()
    await db.settings.set({ ...settings, profile: { ...settings.profile, weightKg: Math.round(kg * 10) / 10 } })
  }
  return list
})
