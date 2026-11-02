import { dayKey } from '#shared/core/format'
import type { HealthDay, Workout } from '#shared/types'

/**
 * Normaliza lo que manda la app "Health Auto Export" (automatización REST API, formato JSON)
 * o un Atajo de iOS sencillo, y lo agrupa por día.
 *
 * Health Auto Export:  { data: { metrics: [{ name, units, data: [{ date, qty }] }], workouts: [...] } }
 * Atajo de iOS:        { date: "2026-11-02", activeKcal, steps, exerciseMin, weightKg?, restingHR? }
 */
export function parseHealthPayload(body: any): Map<string, Partial<HealthDay>> {
  const days = new Map<string, Partial<HealthDay>>()
  const day = (key: string) => {
    if (!days.has(key)) days.set(key, { workouts: [] })
    return days.get(key)!
  }

  if (body?.data) {
    for (const metric of body.data.metrics ?? []) {
      const field = METRICS[metric.name as string]
      if (!field) continue
      for (const point of metric.data ?? []) {
        const at = parseDate(point.date)
        if (at == null || typeof point.qty !== 'number') continue
        const d = day(dayKey(at))
        const qty = metric.name === 'active_energy' && /kj/i.test(metric.units ?? '') ? point.qty / 4.184 : point.qty
        if (field === 'restingHR' || field === 'weightKg') d[field] = qty
        else d[field] = (d[field] ?? 0) + qty
      }
    }
    for (const w of body.data.workouts ?? []) {
      const workout = parseWorkout(w)
      if (workout) day(dayKey(workout.start)).workouts!.push(workout)
    }
  } else if (body?.date) {
    const d = day(String(body.date).slice(0, 10))
    for (const k of ['activeKcal', 'steps', 'exerciseMin', 'weightKg', 'restingHR'] as const) {
      const v = Number(body[k])
      if (Number.isFinite(v)) d[k] = v
    }
  }
  return days
}

const METRICS: Record<string, 'activeKcal' | 'steps' | 'exerciseMin' | 'restingHR' | 'weightKg'> = {
  active_energy: 'activeKcal',
  step_count: 'steps',
  apple_exercise_time: 'exerciseMin',
  resting_heart_rate: 'restingHR',
  weight_body_mass: 'weightKg',
}

function parseDate(value: unknown): number | null {
  if (typeof value !== 'string') return null
  // "2026-11-02 08:00:00 +0100" → ISO
  const iso = value.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ?([+-]\d{2})(\d{2})$/, '$1T$2$3:$4')
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

function qty(v: any): number {
  return typeof v === 'number' ? v : typeof v?.qty === 'number' ? v.qty : 0
}

function parseWorkout(w: any): Workout | null {
  const start = parseDate(w.start)
  const end = parseDate(w.end)
  if (start == null) return null
  const name: string = w.name ?? 'Entreno'
  const kind: Workout['kind'] = /run|carrera/i.test(name) ? 'run' : /strength|fuerza/i.test(name) ? 'strength' : 'other'
  const distanceUnits: string = w.distance?.units ?? 'km'
  const distance = qty(w.distance) * (/km/i.test(distanceUnits) ? 1000 : /mi/i.test(distanceUnits) ? 1609.34 : 1)
  const energy = w.activeEnergyBurned ?? w.activeEnergy
  return {
    id: `health-${w.id ?? start}`,
    kind,
    name,
    start,
    durationSec: typeof w.duration === 'number' ? w.duration : end ? (end - start) / 1000 : 0,
    kcal: Math.round(qty(energy) / (/kj/i.test(energy?.units ?? '') ? 4.184 : 1)),
    distanceM: Math.round(distance),
    elevationM: qty(w.elevationUp) || undefined,
    avgHR: qty(w.avgHeartRate ?? w.heartRate?.avg) || undefined,
    source: 'Apple Salud',
  }
}

export async function saveHealthDays(days: Map<string, Partial<HealthDay>>) {
  for (const [key, incoming] of days) {
    const current = await db.health.get(key)
    // Cada envío trae el día completo: lo nuevo reemplaza, los entrenos se fusionan por id.
    const workouts = new Map([...(current?.workouts ?? []), ...(incoming.workouts ?? [])].map((w) => [w.id, w]))
    await db.health.set(key, {
      activeKcal: Math.round(incoming.activeKcal ?? current?.activeKcal ?? 0),
      steps: Math.round(incoming.steps ?? current?.steps ?? 0),
      exerciseMin: Math.round(incoming.exerciseMin ?? current?.exerciseMin ?? 0),
      restingHR: incoming.restingHR ?? current?.restingHR,
      weightKg: incoming.weightKg ?? current?.weightKg,
      workouts: [...workouts.values()],
      updatedAt: Date.now(),
    })
  }
  await db.health.touch()
}
