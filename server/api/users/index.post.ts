/** El administrador da de alta a otra persona de la casa. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ name: string; username: string; password: string }>(event)
  const user = await createUser({ name: body.name ?? '', username: body.username ?? '', password: body.password ?? '', role: 'member' })
  return publicUser(user)
})
