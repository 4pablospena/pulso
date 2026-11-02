export default defineEventHandler(async (event) => {
  const { endpoint } = await readBody<{ endpoint: string }>(event)
  await pushSubs.set((await pushSubs.get()).filter((s) => s.endpoint !== endpoint))
  return { ok: true }
})
