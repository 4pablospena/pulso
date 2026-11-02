export default defineEventHandler((event) => {
  const { clientId, configured } = stravaConfig()
  if (!configured) throw createError({ statusCode: 400, message: 'Configura NUXT_STRAVA_CLIENT_ID y NUXT_STRAVA_CLIENT_SECRET.' })
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: stravaRedirectUri(event),
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,activity:write',
  }).toString()
  return sendRedirect(event, url.toString())
})
