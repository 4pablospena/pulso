import type { ShoppingItem } from '#shared/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const patch = await readBody<Partial<ShoppingItem>>(event)
  const list = (await db.shopping.all()).map((i) => (i.id === id ? { ...i, ...patch, id: i.id } : i))
  await db.shopping.save(list)
  return list
})
