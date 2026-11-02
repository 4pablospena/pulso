import type { PushSubscription } from 'web-push'

/** Guarda la suscripción push de este dispositivo. */
export default defineEventHandler(async (event) => {
  const { subscription } = await readBody<{ subscription: PushSubscription }>(event)
  if (!subscription?.endpoint) throw createError({ statusCode: 400, message: 'Suscripción no válida.' })
  const list = (await pushSubs.get()).filter((s) => s.endpoint !== subscription.endpoint)
  await pushSubs.set([...list, subscription])
  return { ok: true, devices: list.length + 1 }
})
