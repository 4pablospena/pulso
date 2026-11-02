import type { StrengthSession } from '#shared/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const incoming = await readBody<StrengthSession>(event)
  const sessions = await db.sessions.all()
  await db.sessions.save(sessions.map((s) => (s.id === id ? { ...incoming, id: s.id } : s)))
  return incoming
})
