import type { IntegrationStatus } from '#shared/types'

export default defineEventHandler(async (event): Promise<IntegrationStatus> => {
  const token = await stravaToken.get()
  return {
    strava: {
      configured: stravaConfig().configured,
      connected: !!token,
      athlete: token?.athlete ? [token.athlete.firstname, token.athlete.lastname].filter(Boolean).join(' ') : null,
    },
    health: {
      lastSync: await db.health.lastSync(),
      ingestUrl: `${getRequestURL(event).origin}/api/health/ingest`,
      tokenConfigured: !!(currentUser(event)?.healthToken || useRuntimeConfig().healthIngestToken),
    },
    vision: { configured: visionConfigured() },
  }
})
