/** Borra un producto, o todos los ya comprados con id = "checked". */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const list = (await db.shopping.all()).filter((i) => (id === 'checked' ? !i.checked : i.id !== id))
  await db.shopping.save(list)
  return list
})
