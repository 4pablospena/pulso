/** Foto de una receta propia. */
export default defineEventHandler(async (event) => {
  const data = await db.kv.read<string | null>(`recipe-photo:${getRouterParam(event, 'id')}`, null)
  const match = data && /^data:(image\/[a-z]+);base64,(.+)$/.exec(data)
  if (!match) throw createError({ statusCode: 404, message: 'Sin foto.' })
  setHeader(event, 'Content-Type', match[1]!)
  setHeader(event, 'Cache-Control', 'private, max-age=86400')
  return Buffer.from(match[2]!, 'base64')
})
