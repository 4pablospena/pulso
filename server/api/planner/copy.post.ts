import { dateRange } from '#shared/core/planner'

/** Copia comidas y entrenos de una semana (lunes `from`) a otra (lunes `to`). */
export default defineEventHandler(async (event) => {
  const { from, to } = await readBody<{ from: string; to: string }>(event)
  const source = await plannedDays(from, 7)
  const targets = dateRange(to, 7)
  await writeEntries(Object.fromEntries(source.map(({ resolved }, i) => [targets[i]!, entryFrom(resolved)])))
  return { ok: true }
})
