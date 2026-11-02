/** Tu cuenta y tu token de Salud (para configurar Health Auto Export). */
export default defineEventHandler((event) => {
  const user = currentUser(event)
  return {
    user: user ? publicUser(user) : null,
    healthToken: user?.healthToken ?? null,
    ingestUrl: `${getRequestURL(event).origin}/api/health/ingest`,
  }
})
