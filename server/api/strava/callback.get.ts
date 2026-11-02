export default defineEventHandler(async (event) => {
  const { code, error, scope } = getQuery(event) as Record<string, string | undefined>
  if (error || !code) return sendRedirect(event, '/ajustes?strava=cancelado')
  if (!scope?.includes('activity:write')) return sendRedirect(event, '/ajustes?strava=sin-permiso-escritura')
  await exchangeCode(code)
  await invalidateActivities()
  return sendRedirect(event, '/ajustes?strava=ok')
})
