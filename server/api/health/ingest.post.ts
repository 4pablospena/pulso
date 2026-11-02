/**
 * Webhook para Apple Salud. Configúralo en "Health Auto Export" (REST API, JSON)
 * o en un Atajo de iOS con la cabecera Authorization: Bearer <token de Salud de la persona, en Ajustes>.
 */
export default defineEventHandler(async (event) => {
  const given = String(getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '') ?? getQuery(event).token ?? '')
  // Cada persona tiene su token: así los datos de Salud van a su cuenta.
  const owner = await users.byHealthToken(given)
  if (owner) {
    await migrateLegacyData(owner)
    event.context.user = owner
  } else {
    const expected = useRuntimeConfig().healthIngestToken
    const accounts = await users.all()
    if (!expected || given !== expected || accounts.length) throw createError({ statusCode: 401, message: 'Token de Salud no válido.' })
  }

  const days = parseHealthPayload(await readBody(event))
  await saveHealthDays(days)

  // El peso más reciente de la báscula/Salud recalcula basal y proteína.
  const latestWeight = [...days].sort(([a], [b]) => a.localeCompare(b)).reverse().find(([, d]) => d.weightKg)?.[1].weightKg
  for (const [date, d] of days) if (d.weightKg) await db.weights.add({ date, kg: Math.round(d.weightKg * 10) / 10, source: 'Apple Salud' })
  if (latestWeight) {
    const settings = await db.settings.get()
    await db.settings.set({ ...settings, profile: { ...settings.profile, weightKg: Math.round(latestWeight * 10) / 10 } })
  }
  return { ok: true, days: [...days.keys()] }
})
