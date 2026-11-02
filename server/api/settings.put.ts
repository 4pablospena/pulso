import type { Settings } from '#shared/types'

export default defineEventHandler(async (event) => {
  const next = { ...(await db.settings.get()), ...(await readBody<Partial<Settings>>(event)) }
  await db.settings.set(next)
  return next
})
