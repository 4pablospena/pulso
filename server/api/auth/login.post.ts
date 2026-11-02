export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event)
  // Pausa fija para frenar intentos de fuerza bruta.
  await new Promise((r) => setTimeout(r, 400))
  const user = await login(event, username, password)
  if (!user) throw createError({ statusCode: 401, message: 'Usuario o contraseña incorrectos.' })
  return publicUser(user)
})
