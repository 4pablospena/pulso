import { categorize } from '#shared/core/grocery'

/** Añade productos sueltos a mano evitando duplicados pendientes. */
export default defineEventHandler(async (event) => {
  const { names = [] } = await readBody<{ names?: string[] }>(event)
  const list = await db.shopping.all()
  const pending = new Set(list.filter((i) => !i.checked).map((i) => i.name.toLowerCase()))
  for (const raw of names) {
    const name = raw.trim()
    if (!name || pending.has(name.toLowerCase())) continue
    pending.add(name.toLowerCase())
    const me = currentUser(event)
    list.push({ id: newId(), name, aisle: categorize(name), checked: false, addedAt: Date.now(), source: 'manual', ...(me ? { ownerId: me.id, ownerName: me.name } : {}) })
  }
  await db.shopping.save(list)
  const me = currentUser(event)
  const added = names.map((n) => n.trim()).filter(Boolean)
  if (me && added.length) {
    await pushToHousehold(event, 'shopping', {
      title: `${me.name} ha añadido a la compra`, body: added.join(', '), url: '/compra', tag: 'shopping',
    }).catch(() => {})
  }
  return list
})
