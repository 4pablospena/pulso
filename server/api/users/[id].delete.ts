/** Elimina una cuenta y todos sus datos personales (la compra compartida se queda). */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  if (id === currentUser(event)?.id) throw createError({ statusCode: 400, message: 'No puedes eliminar tu propia cuenta.' })
  const list = await users.all()
  if (!list.some((u) => u.id === id)) throw createError({ statusCode: 404, message: 'Esa cuenta no existe.' })
  const storage = useStorage('db')
  for (const key of await storage.getKeys(`u:${id}`)) await storage.removeItem(key)
  await users.save(list.filter((u) => u.id !== id))
  return { ok: true }
})
