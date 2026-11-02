export type Sex = 'male' | 'female'
export type Goal = 'cut' | 'maintain' | 'bulk'
export type NutritionFocus = 'highProtein' | 'mediumCarbs' | 'normal' | 'refeed' | 'flexible'

export interface BodyProfile {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  goal: Goal
}

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export const GOAL_LABEL: Record<Goal, string> = {
  cut: 'Definición',
  maintain: 'Mantenimiento',
  bulk: 'Ganancia muscular',
}

export const FOCUS_LABEL: Record<NutritionFocus, string> = {
  highProtein: 'Alta proteína',
  mediumCarbs: 'Carbohidratos medios',
  normal: 'Normocalórica',
  refeed: 'Recarga de carbohidratos',
  flexible: 'Flexible',
}

const GOAL_FACTOR: Record<Goal, number> = { cut: 0.8, maintain: 1, bulk: 1.1 }
/** NEAT mínimo del día; los entrenos llegan aparte como energía activa. */
const BASELINE_ACTIVITY = 1.15

export const exampleProfile: BodyProfile = { sex: 'male', age: 32, heightCm: 178, weightKg: 78, goal: 'maintain' }

/** Metabolismo basal (Mifflin-St Jeor). */
export function bmr(p: BodyProfile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return p.sex === 'male' ? base + 5 : base - 161
}

export function addMacros(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(addMacros, ZERO_MACROS)
}

/** Gasto total estimado del día: basal + actividad cotidiana mínima + energía activa medida. */
export function estimatedBurn(profile: BodyProfile, activeKcal: number): number {
  return Math.round(bmr(profile) * BASELINE_ACTIVITY + Math.max(activeKcal, 0))
}

/**
 * Objetivo del día: basal + energía activa real de Salud/Strava, ajustado al objetivo,
 * con el reparto de macros según el enfoque del plan.
 */
export function dailyTarget(profile: BodyProfile, activeKcal: number, focus: NutritionFocus): Macros {
  const kcal = Math.round(estimatedBurn(profile, activeKcal) * GOAL_FACTOR[profile.goal])
  const proteinPerKg = focus === 'highProtein' ? 2.2 : focus === 'refeed' ? 1.8 : 2.0
  const fatShare = focus === 'refeed' ? 0.2 : focus === 'mediumCarbs' ? 0.25 : 0.3
  const protein = Math.round(profile.weightKg * proteinPerKg)
  const fat = Math.round((kcal * fatShare) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, carbs, fat }
}

/** Estimación de kcal de una sesión de fuerza cuando el reloj no las mide (MET ≈ 5). */
export function strengthKcal(weightKg: number, durationSec: number): number {
  return Math.round((5 * weightKg * durationSec) / 3600)
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    kcal: Math.round(m.kcal * factor),
    protein: Math.round(m.protein * factor * 10) / 10,
    carbs: Math.round(m.carbs * factor * 10) / 10,
    fat: Math.round(m.fat * factor * 10) / 10,
  }
}
