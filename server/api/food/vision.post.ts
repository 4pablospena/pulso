export default defineEventHandler(async (event) => {
  const { image } = await readBody<{ image: string }>(event)
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image ?? '')
  if (!match) throw createError({ statusCode: 400, message: 'Imagen no válida.' })
  return analyzeMeal(match[2]!, match[1] as 'image/jpeg' | 'image/png' | 'image/webp')
})
