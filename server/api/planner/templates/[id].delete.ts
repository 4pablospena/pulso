export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await weekTemplates.save((await weekTemplates.all()).filter((t) => t.id !== id))
  return { ok: true }
})
