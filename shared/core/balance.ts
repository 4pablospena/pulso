import type { Macros } from './energy'

/** Un día del historial: lo comido frente a lo quemado. */
export interface HistoryDay {
  date: string
  eaten: Macros
  target: Macros
  burnedKcal: number
  activeKcal: number
  /** Hay al menos una comida registrada. Los días sin registro no cuentan en las medias. */
  logged: boolean
  /** Comidas del plan marcadas como hechas / comidas que tenía el plan (null sin plan). */
  planDone: number
  planTotal: number | null
  weightKg: number | null
}

/** Kcal aproximadas de 1 kg de grasa corporal. */
export const KCAL_PER_KG = 7700

/** Un día "en objetivo" si lo comido queda a ±10 % del objetivo. */
export function onTarget(d: HistoryDay): boolean {
  return d.logged && Math.abs(d.eaten.kcal - d.target.kcal) <= d.target.kcal * 0.1
}

export function balanceOf(d: HistoryDay): number {
  return Math.round(d.eaten.kcal - d.burnedKcal)
}

export interface HistoryStats {
  loggedDays: number
  avgEaten: number
  avgBurned: number
  avgBalance: number
  avgProtein: number
  daysOnTarget: number
  /** Cambio de peso que predice el balance acumulado (negativo = pérdida). */
  expectedKgChange: number
  /** Cambio de peso real entre el primer y el último pesaje del periodo. */
  actualKgChange: number | null
  planAdherence: number | null
}

export function historyStats(days: HistoryDay[]): HistoryStats {
  const logged = days.filter((d) => d.logged)
  const n = logged.length || 1
  const avg = (f: (d: HistoryDay) => number) => Math.round(logged.reduce((s, d) => s + f(d), 0) / n)
  const total = logged.reduce((s, d) => s + balanceOf(d), 0)

  const weighed = days.filter((d) => d.weightKg != null).sort((a, b) => a.date.localeCompare(b.date))
  const actual = weighed.length >= 2 ? weighed.at(-1)!.weightKg! - weighed[0]!.weightKg! : null

  const planned = days.filter((d) => d.planTotal)
  const adherence = planned.length
    ? planned.reduce((s, d) => s + Math.min(d.planDone, d.planTotal!), 0) / planned.reduce((s, d) => s + d.planTotal!, 0)
    : null

  return {
    loggedDays: logged.length,
    avgEaten: avg((d) => d.eaten.kcal),
    avgBurned: avg((d) => d.burnedKcal),
    avgBalance: avg(balanceOf),
    avgProtein: avg((d) => d.eaten.protein),
    daysOnTarget: logged.filter(onTarget).length,
    expectedKgChange: Math.round((total / KCAL_PER_KG) * 100) / 100,
    actualKgChange: actual == null ? null : Math.round(actual * 10) / 10,
    planAdherence: adherence == null ? null : Math.round(adherence * 100) / 100,
  }
}
