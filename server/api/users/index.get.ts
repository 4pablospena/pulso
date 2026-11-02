export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return (await users.all()).map(publicUser)
})
