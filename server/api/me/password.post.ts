export default defineEventHandler(async (event) => {
  const user = currentUser(event)
  if (!user) throw createError({ statusCode: 400, message: 'Sin cuentas no hay contraseña que cambiar.' })
  const { current, next } = await readBody<{ current: string; next: string }>(event)
  if (!verifyPassword(user, current ?? '')) throw createError({ statusCode: 401, message: 'La contraseña actual no es correcta.' })
  await setPassword(user.id, next ?? '')
  return { ok: true }
})
