import { setCustomRecipes } from '#shared/data/recipes'

/** Protege la API con la sesión y deja en el contexto quién hace la petición. */
const PUBLIC = ['/api/auth/', '/api/health/ingest', '/api/push/deliver']

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/')) return
  const user = await loadSessionUser(event)
  if (PUBLIC.some((p) => path.startsWith(p))) return
  if (authRequired() && !user) throw createError({ statusCode: 401, message: 'Inicia sesión.' })
  // Las recetas propias de la casa entran en el recetario de esta petición.
  setCustomRecipes(await db.customRecipes.all())
})
