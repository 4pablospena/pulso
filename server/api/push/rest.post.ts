/** Aviso de fin de descanso aunque la pantalla esté apagada (`at` null lo cancela). */
export default defineEventHandler(async (event) => {
  const { at, sessionId } = await readBody<{ at: number | null; sessionId?: string }>(event)
  await db.kv.write('rest-until', at ?? null)
  if (at) await scheduleAt(event, at, { kind: 'rest', sessionId })
  return { ok: true }
})
