export default defineEventHandler(async () => {
  const token = await stravaToken.get()
  if (token) {
    await $fetch('https://www.strava.com/oauth/deauthorize', {
      method: 'POST', headers: { Authorization: `Bearer ${token.access_token}` },
    }).catch(() => null)
  }
  await stravaToken.set(null)
  await invalidateActivities()
  return { ok: true }
})
