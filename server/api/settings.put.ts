import { fastingHours } from '#shared/core/fasting'
import type { Settings } from '#shared/types'

const MEAL_TIMES = { Desayuno: '30 8 * * *', Comida: '0 14 * * *', Merienda: '30 17 * * *', Cena: '0 21 * * *' } as const
const WATER_CRON = '0 11,13,17,19 * * *'

export default defineEventHandler(async (event) => {
  const prev = await db.settings.get()
  const next: Settings = { ...prev, ...(await readBody<Partial<Settings>>(event)) }
  await db.settings.set(next)

  if (schedulingConfigured()) {
    // Ayuno: avisos al terminar el ayuno y al cerrar la ventana de ingesta.
    if (next.fastingStart && next.fastingStart !== prev.fastingStart) {
      const fastEnd = next.fastingStart + fastingHours(next.fastingProtocol) * 3_600_000
      await scheduleAt(event, fastEnd, { kind: 'fasting-end', start: next.fastingStart })
      await scheduleAt(event, next.fastingStart + 24 * 3_600_000, { kind: 'eating-end', start: next.fastingStart })
    }
    // Recordatorios diarios de comidas y agua: se crean o borran al cambiar la preferencia.
    const schedules = await db.kv.read<{ meals: string[]; water: string[] }>('push-schedules', { meals: [], water: [] })
    if (next.notifications.meals !== prev.notifications.meals) {
      await unschedule(schedules.meals)
      schedules.meals = next.notifications.meals
        ? (await Promise.all(Object.entries(MEAL_TIMES).map(([slot, cron]) => scheduleDaily(event, cron, { kind: 'meal', slot })))).filter(Boolean) as string[]
        : []
    }
    if (next.notifications.water !== prev.notifications.water) {
      await unschedule(schedules.water)
      const id = next.notifications.water ? await scheduleDaily(event, WATER_CRON, { kind: 'water' }) : null
      schedules.water = id ? [id] : []
    }
    await db.kv.write('push-schedules', schedules)
  }
  return next
})
