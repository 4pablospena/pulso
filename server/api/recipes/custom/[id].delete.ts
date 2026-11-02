export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.customRecipes.save((await db.customRecipes.all()).filter((r) => r.id !== id))
  await db.kv.write(`recipe-photo:${id}`, null)
  return { ok: true }
})
