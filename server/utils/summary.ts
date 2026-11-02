import { dailyTarget, estimatedBurn, strengthKcal, sumMacros } from '#shared/core/energy'
import { dayKey } from '#shared/core/format'
import { focusFor } from '#shared/core/plan'
import { resolveDay } from '#shared/core/planner'
import type { DaySummary, Workout } from '#shared/types'

/**
 * Junta todo lo del día. El gasto sale de Apple Salud si hay datos (incluye Watch y Strava);
 * si no, de Strava + sesiones de Pulso, para no contar nada dos veces.
 */
export async function daySummary(date: string): Promise<DaySummary> {
  const [settings, foods, water, health, sessions, weights, planner] = await Promise.all([
    db.settings.get(), db.foods.get(date), db.water.get(date), db.health.get(date), db.sessions.all(), db.weights.all(), db.planner.all(),
  ])

  const pulsoWorkouts: Workout[] = sessions
    .filter((s) => s.end && dayKey(s.start) === date)
    .map((s) => ({
      id: s.id, kind: 'strength', name: s.title, start: s.start, durationSec: (s.end! - s.start) / 1000,
      kcal: s.kcal ?? strengthKcal(settings.profile.weightKg, (s.end! - s.start) / 1000), distanceM: 0, source: 'Pulso',
    }))

  let stravaWorkouts: Workout[] = []
  if (await stravaToken.get()) {
    try {
      stravaWorkouts = (await recentActivities())
        .map((a) => toWorkout(a, settings.profile.weightKg))
        .filter((w) => dayKey(w.start) === date)
    } catch { /* sin conexión con Strava: seguimos con lo que haya */ }
  }

  let activeKcal = 0
  let activeSource: DaySummary['activeSource'] = 'Sin datos'
  if (health && health.activeKcal > 0) {
    // Una sesión de Pulso hecha sin el Watch no está en Salud: se suma salvo que Salud ya la tenga.
    const missing = pulsoWorkouts.filter((p) => !health.workouts.some((w) => w.kind === 'strength' && Math.abs(w.start - p.start) < 30 * 60_000))
    activeKcal = health.activeKcal + missing.reduce((sum, w) => sum + w.kcal, 0)
    activeSource = 'Apple Salud'
  } else {
    // Las sesiones de fuerza subidas a Strava ya cuentan como de Pulso.
    const uploaded = new Set(sessions.map((s) => s.stravaId).filter(Boolean).map((id) => `strava-${id}`))
    const fallback = [...pulsoWorkouts, ...stravaWorkouts.filter((w) => !uploaded.has(w.id))]
    activeKcal = fallback.reduce((sum, w) => sum + w.kcal, 0)
    if (fallback.length) activeSource = 'Strava + Pulso'
  }

  const workouts = dedupe([...(health?.workouts ?? []), ...stravaWorkouts, ...pulsoWorkouts])
  const day = new Date(`${date}T12:00:00`)

  return {
    date,
    foods: foods.sort((a, b) => a.at - b.at),
    water,
    eaten: sumMacros(foods.map((f) => f.macros)),
    // El entreno del día sale del planificador (o del horario semanal) y marca el reparto de macros.
    target: dailyTarget(settings.profile, activeKcal, focusFor(resolveDay(date, planner, plannerTemplate(settings)).training, day.getDay())),
    burnedKcal: estimatedBurn(settings.profile, activeKcal),
    activeKcal: Math.round(activeKcal),
    activeSource,
    steps: health?.steps ?? 0,
    exerciseMin: health?.exerciseMin ?? 0,
    workouts: workouts.sort((a, b) => b.start - a.start),
    healthUpdatedAt: health?.updatedAt ?? null,
    weightKg: weights.find((w) => w.date === date)?.kg ?? health?.weightKg ?? null,
  }
}

/** El mismo entreno puede venir de Salud y de Strava: se queda el primero que empiece a menos de 5 min. */
function dedupe(list: Workout[]): Workout[] {
  const out: Workout[] = []
  for (const w of list) {
    if (!out.some((o) => o.kind === w.kind && Math.abs(o.start - w.start) < 5 * 60_000)) out.push(w)
  }
  return out
}
