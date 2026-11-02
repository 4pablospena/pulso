import { dayKey } from '#shared/core/format'
import { recipeById, setCustomRecipes } from '#shared/data/recipes'
import type { MealSlot } from '#shared/types'

interface Delivery {
  kind: 'fasting-end' | 'eating-end' | 'rest' | 'meal' | 'water'
  userId: string | null
  at?: number
  start?: number
  slot?: MealSlot
  sessionId?: string
}

/**
 * QStash llama aquí a la hora programada. Antes de avisar se comprueba que el aviso
 * sigue teniendo sentido (el ayuno no se cortó, el descanso no se saltó, la comida no se registró…).
 */
export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event)) ?? ''
  if (!(await verifyQstash(event, raw))) throw createError({ statusCode: 401, message: 'Firma no válida.' })
  const d = JSON.parse(raw) as Delivery

  // Los datos que se consulten serán los de esa persona.
  if (d.userId) {
    const user = await users.byId(d.userId)
    if (!user) return { skipped: 'usuario borrado' }
    event.context.user = user
  }
  setCustomRecipes(await db.customRecipes.all())
  const settings = await db.settings.get()

  switch (d.kind) {
    case 'fasting-end':
    case 'eating-end': {
      if (settings.fastingStart !== d.start) return { skipped: 'ayuno cambiado' }
      const fast = d.kind === 'fasting-end'
      await pushTo(d.userId, 'fasting', {
        title: fast ? '¡Ayuno completado!' : 'Se cierra tu ventana de ingesta',
        body: fast ? 'Ya puedes comer. Empieza con agua y proteína.' : `Empieza tu ayuno ${settings.fastingProtocol}.`,
        url: '/', tag: 'fasting',
      })
      return { sent: true }
    }
    case 'rest': {
      if ((await db.kv.read<number | null>('rest-until', null)) !== d.at) return { skipped: 'descanso cambiado' }
      await pushTo(d.userId, 'rest', { title: 'Descanso terminado', body: 'A por la siguiente serie.', url: d.sessionId ? `/entreno/${d.sessionId}` : '/entreno', tag: 'rest' })
      return { sent: true }
    }
    case 'meal': {
      const today = dayKey()
      const [planned] = (await plannedDays(today, 1)).map((p) => p.dto)
      const meal = planned?.meals.find((m) => m.slot === d.slot && m.recipeId)
      if (!meal) return { skipped: 'sin comida planificada' }
      const logged = (await db.foods.get(today)).some((f) => f.slot === d.slot && f.recipeId === meal.recipeId)
      if (logged) return { skipped: 'ya registrada' }
      await pushTo(d.userId, 'meals', {
        title: `Toca ${d.slot!.toLowerCase()}`, body: `${recipeById(meal.recipeId!)?.name} · ${meal.kcal} kcal`, url: '/', tag: `meal-${d.slot}`,
      })
      return { sent: true }
    }
    case 'water': {
      const drunk = (await db.water.get(dayKey())).reduce((s, w) => s + w.ml, 0)
      const hour = Number(new Intl.DateTimeFormat('es-ES', { hour: 'numeric', hour12: false, timeZone: 'Europe/Madrid' }).format(new Date()))
      // Lo esperado a esta hora, repartiendo el objetivo entre las 8 y las 22 h.
      const expected = settings.waterGoalMl * Math.min(1, Math.max(0, (hour - 8) / 14))
      if (drunk >= expected) return { skipped: 'va bien de agua' }
      await pushTo(d.userId, 'water', {
        title: 'Hora de beber agua', body: `Llevas ${(drunk / 1000).toFixed(1).replace('.', ',')} de ${(settings.waterGoalMl / 1000).toString().replace('.', ',')} L.`, url: '/', tag: 'water',
      })
      return { sent: true }
    }
  }
})
