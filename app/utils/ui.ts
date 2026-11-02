import type { DayPlan } from '#shared/core/plan'
import type { MealSlot } from '#shared/types'

/** Icono y color de cada comida del día. */
export const SLOT_STYLE: Record<MealSlot, { icon: string; color: string }> = {
  Desayuno: { icon: 'sunrise', color: 'var(--orange)' },
  Comida: { icon: 'sun', color: '#e3a600' },
  Merienda: { icon: 'cup', color: 'var(--teal)' },
  Cena: { icon: 'moon', color: 'var(--indigo)' },
}

/** Icono y color de cada tipo de día de entreno. */
export function trainingStyle(t: DayPlan | undefined): { icon: string; color: string; label: string } {
  switch (t?.kind) {
    case 'strength': return { icon: 'dumbbell', color: 'var(--green)', label: 'Fuerza' }
    case 'run': return { icon: 'run', color: 'var(--run)', label: 'Running' }
    case 'mobility': return { icon: 'yoga', color: 'var(--teal)', label: 'Movilidad' }
    default: return { icon: 'bed', color: 'var(--indigo)', label: 'Descanso' }
  }
}
