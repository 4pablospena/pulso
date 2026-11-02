export default defineEventHandler(async (event) => {
  const day = getRouterParam(event, 'day')!
  const id = getRouterParam(event, 'id')
  await db.foods.set(day, (await db.foods.get(day)).filter((f) => f.id !== id))
  return { ok: true }
})
