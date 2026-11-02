import type { AuthStatus } from '#shared/types'

export default defineEventHandler(async (event): Promise<AuthStatus> => {
  const user = currentUser(event)
  return {
    required: authRequired(),
    authenticated: !authRequired() || !!user,
    setup: authRequired() && !(await users.all()).length,
    user: user ? publicUser(user) : null,
  }
})
