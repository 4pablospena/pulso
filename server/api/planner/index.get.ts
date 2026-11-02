import { dayKey } from '#shared/core/format'

/** Días planificados desde `from` (por defecto hoy) durante `days` días. */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const from = /^\d{4}-\d{2}-\d{2}$/.test(String(q.from)) ? String(q.from) : dayKey()
  const days = Math.min(31, Math.max(1, Number(q.days) || 7))
  return (await plannedDays(from, days)).map((d) => d.dto)
})
