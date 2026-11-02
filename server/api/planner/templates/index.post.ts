/** Guarda la semana que empieza en `from` (lunes) como plantilla reutilizable. */
export default defineEventHandler(async (event) => {
  const { name, from } = await readBody<{ name: string; from: string }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Ponle un nombre a la plantilla.' })
  const days = (await plannedDays(from, 7)).map(({ resolved }) => entryFrom(resolved))
  const template = { id: newId(), name: name.trim(), createdAt: Date.now(), days }
  await weekTemplates.save([...(await weekTemplates.all()), template])
  return template
})
