import { describe, expect, it } from 'vitest'
import { balanceOf, historyStats, onTarget, type HistoryDay } from './balance'
import { dailyTarget, estimatedBurn, exampleProfile } from './energy'

const day = (date: string, eaten: number, burned: number, extra: Partial<HistoryDay> = {}): HistoryDay => ({
  date,
  eaten: { kcal: eaten, protein: 150, carbs: 0, fat: 0 },
  target: { kcal: 2000, protein: 160, carbs: 0, fat: 0 },
  burnedKcal: burned,
  activeKcal: 0,
  logged: eaten > 0,
  planDone: 0,
  planTotal: null,
  weightKg: null,
  ...extra,
})

describe('balance', () => {
  it('el objetivo es el gasto estimado por el factor del objetivo', () => {
    const cut = { ...exampleProfile, goal: 'cut' as const }
    expect(dailyTarget(cut, 300, 'normal').kcal).toBe(Math.round(estimatedBurn(cut, 300) * 0.8))
  })

  it('consumidas menos quemadas', () => {
    expect(balanceOf(day('2026-11-01', 1800, 2300))).toBe(-500)
  })

  it('en objetivo a ±10 %', () => {
    expect(onTarget(day('a', 2150, 0))).toBe(true)
    expect(onTarget(day('a', 2300, 0))).toBe(false)
  })

  it('las medias ignoran los días sin registro', () => {
    const s = historyStats([day('a', 1800, 2300), day('b', 0, 2300), day('c', 2000, 2500)])
    expect(s.loggedDays).toBe(2)
    expect(s.avgEaten).toBe(1900)
    expect(s.avgBalance).toBe(-500)
  })

  it('7700 kcal de déficit ≈ 1 kg', () => {
    const days = Array.from({ length: 14 }, (_, i) => day(`d${i}`, 1750, 2300))
    expect(historyStats(days).expectedKgChange).toBe(-1)
  })

  it('peso real y cumplimiento del plan', () => {
    const s = historyStats([
      day('2026-11-01', 1800, 2300, { weightKg: 90, planDone: 3, planTotal: 3 }),
      day('2026-11-02', 1800, 2300, { planDone: 1, planTotal: 3 }),
      day('2026-11-03', 1800, 2300, { weightKg: 89.4, planDone: 2, planTotal: 3 }),
    ])
    expect(s.actualKgChange).toBe(-0.6)
    expect(s.planAdherence).toBe(0.67)
  })
})
