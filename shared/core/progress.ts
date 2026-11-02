import type { StrengthSession } from '../types'
import { bestOneRepMax, estimatedOneRepMax, volume, type LoggedSet } from './strength'

export interface ExerciseLog {
  sessionId: string
  date: number
  sets: LoggedSet[]
  best1RM: number
  maxWeight: number
  volume: number
}

export interface PersonalRecords {
  best1RM: number
  maxWeight: number
  maxVolume: number
  maxReps: number
}

const finished = (sessions: StrengthSession[]) => sessions.filter((s) => s.end).sort((a, b) => a.start - b.start)

/** Historial de un ejercicio, de más antiguo a más reciente, solo con series hechas. */
export function exerciseHistory(sessions: StrengthSession[], exerciseId: string): ExerciseLog[] {
  return finished(sessions).flatMap((s) => {
    const sets = s.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((x) => x.done))
    if (!sets.length) return []
    return [{
      sessionId: s.id, date: s.start, sets,
      best1RM: bestOneRepMax(sets), maxWeight: Math.max(...sets.map((x) => x.weightKg)), volume: volume(sets),
    }]
  })
}

export function personalRecords(history: ExerciseLog[]): PersonalRecords {
  return {
    best1RM: Math.max(0, ...history.map((h) => h.best1RM)),
    maxWeight: Math.max(0, ...history.map((h) => h.maxWeight)),
    maxVolume: Math.max(0, ...history.map((h) => h.volume)),
    maxReps: Math.max(0, ...history.flatMap((h) => h.sets.map((s) => s.reps))),
  }
}

/** ¿Esta serie mejora el 1RM estimado histórico? */
export function isRecord(set: LoggedSet, records: PersonalRecords): boolean {
  return records.best1RM > 0 && estimatedOneRepMax(set) > records.best1RM
}

export function mondayOf(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

/** Sesiones y volumen de las últimas `weeks` semanas (la última es la actual). */
export function weeklyStats(sessions: StrengthSession[], weeks = 8, now = Date.now()) {
  const current = mondayOf(now)
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(current)
    start.setDate(start.getDate() - (weeks - 1 - i) * 7)
    const from = start.getTime()
    const to = from + 7 * 86_400_000
    const inWeek = finished(sessions).filter((s) => s.start >= from && s.start < to)
    return {
      weekStart: from,
      sessions: inWeek.length,
      volume: volume(inWeek.flatMap((s) => s.exercises.flatMap((e) => e.sets.filter((x) => x.done)))),
    }
  })
}

/** Semanas seguidas (hasta la actual) con al menos un entreno. La semana en curso no rompe la racha. */
export function weekStreak(sessions: StrengthSession[], now = Date.now()): number {
  const weeks = new Set(finished(sessions).map((s) => mondayOf(s.start)))
  let streak = 0
  const cursor = new Date(mondayOf(now))
  if (!weeks.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7)
  while (weeks.has(cursor.getTime())) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}
