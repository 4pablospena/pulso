export type FastingProtocol = '16:8' | '18:6' | '20:4' | 'OMAD'

export const FASTING_PROTOCOLS: FastingProtocol[] = ['16:8', '18:6', '20:4', 'OMAD']

export function fastingHours(p: FastingProtocol): number {
  return { '16:8': 16, '18:6': 18, '20:4': 20, OMAD: 23 }[p]
}

export interface FastingStatus {
  phase: 'fasting' | 'eating'
  /** 0…1 dentro de la fase actual. */
  progress: number
  remainingMs: number
  phaseEnd: number
}

const HOUR = 3_600_000

/** Estado de un ayuno iniciado en `start`. Tras el ayuno se abre la ventana; al cerrarse, vuelve a empezar. */
export function fastingStatus(start: number, p: FastingProtocol, now = Date.now()): FastingStatus {
  const fast = fastingHours(p) * HOUR
  const cycle = 24 * HOUR
  const elapsed = Math.max(0, now - start) % cycle
  const cycleStart = now - elapsed
  if (elapsed < fast) {
    return { phase: 'fasting', progress: elapsed / fast, remainingMs: fast - elapsed, phaseEnd: cycleStart + fast }
  }
  const eat = cycle - fast
  const inEating = elapsed - fast
  return { phase: 'eating', progress: inEating / eat, remainingMs: eat - inEating, phaseEnd: cycleStart + cycle }
}
