import { dateRange } from '#shared/core/planner'

/** Aplica una plantilla a la semana que empieza en `to` (lunes). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { to } = await readBody<{ to: string }>(event)
  const template = (await weekTemplates.all()).find((t) => t.id === id)
  if (!template) throw createError({ statusCode: 404, message: 'Plantilla no encontrada.' })
  const dates = dateRange(to, 7)
  await writeEntries(Object.fromEntries(template.days.map((entry, i) => [dates[i]!, entry])))
  return { ok: true }
})
