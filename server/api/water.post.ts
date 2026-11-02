import { dayKey } from '#shared/core/format'

export default defineEventHandler(async (event) => {
  const { ml, date } = await readBody<{ ml: number; date?: string }>(event)
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date! : dayKey()
  const list = [...(await db.water.get(day)), { at: Date.now(), ml }]
  await db.water.set(day, list)
  return list
})
