import type { Routine } from '#shared/core/plan'

/** Crea o actualiza una rutina (si trae id existente, la reemplaza). */
export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<Routine>>(event)
  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'La rutina necesita un nombre.' })
  const routine: Routine = { id: body.id || newId(), name: body.name.trim(), description: body.description, items: body.items ?? [] }
  const list = await db.routines.all()
  const exists = list.some((r) => r.id === routine.id)
  await db.routines.save(exists ? list.map((r) => (r.id === routine.id ? routine : r)) : [...list, routine])
  return routine
})
