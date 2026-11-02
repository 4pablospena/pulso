/** Ritmo en min/km, p. ej. "5:12 /km". */
export function pace(meters: number, seconds: number): string {
  if (meters <= 0 || seconds <= 0) return '–'
  const secPerKm = Math.round(seconds / (meters / 1000))
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, '0')} /km`
}

export function km(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${Math.floor(s / 60)}:${ss}`
}

/** Zona 1…5 sobre la FC máxima. */
export function hrZone(bpm: number, maxHR: number): number {
  const pct = bpm / maxHR
  return pct < 0.6 ? 1 : pct < 0.7 ? 2 : pct < 0.8 ? 3 : pct < 0.9 ? 4 : 5
}

/** Clave de día local "YYYY-MM-DD". */
export function dayKey(d: Date | number = new Date()): string {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
