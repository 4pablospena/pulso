import type { AuthStatus } from '#shared/types'

/** Manda a /login si la app tiene contraseña y no hay sesión. */
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const status = await useRequestFetch()<AuthStatus>('/api/auth/status').catch(() => null)
  if (status?.required && !status.authenticated) return navigateTo({ path: '/login', query: { next: to.fullPath } })
})
