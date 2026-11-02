export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await db.sessions.save((await db.sessions.all()).filter((s) => s.id !== id))
  return { ok: true }
})
