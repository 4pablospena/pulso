import { describe, expect, it } from 'vitest'
import { bmr, dailyTarget, exampleProfile } from './energy'
import { fastingStatus } from './fasting'
import { estimatedOneRepMax, nextTarget } from './strength'
import { categorize, mercadonaSearchUrl } from './grocery'
import { DEFAULT_ROUTINES, DEFAULT_SCHEDULE } from './plan'
import { exerciseById } from '../data/exercises'
import { pace } from './format'

const H = 3_600_000

describe('energía', () => {
  it('basal Mifflin-St Jeor', () => expect(bmr(exampleProfile)).toBe(1737.5))

  it('la actividad sube el objetivo 1:1', () => {
    const rest = dailyTarget(exampleProfile, 0, 'normal')
    const trained = dailyTarget(exampleProfile, 500, 'normal')
    expect(trained.kcal - rest.kcal).toBe(500)
  })

  it('los macros suman las kcal', () => {
    const t = dailyTarget(exampleProfile, 350, 'highProtein')
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal)).toBeLessThan(10)
    expect(t.protein).toBe(Math.round(78 * 2.2))
  })
})

describe('ayuno', () => {
  it('a mitad del ayuno', () => {
    const s = fastingStatus(0, '16:8', 8 * H)
    expect(s).toMatchObject({ phase: 'fasting', progress: 0.5, remainingMs: 8 * H })
  })

  it('ventana de ingesta y siguiente ciclo', () => {
    expect(fastingStatus(0, '16:8', 18 * H)).toMatchObject({ phase: 'eating', remainingMs: 6 * H })
    expect(fastingStatus(0, '16:8', 25 * H)).toMatchObject({ phase: 'fasting', phaseEnd: 40 * H })
  })
})

describe('fuerza', () => {
  it('Epley', () => {
    expect(estimatedOneRepMax({ reps: 10, weightKg: 60 })).toBe(80)
    expect(estimatedOneRepMax({ reps: 1, weightKg: 100 })).toBe(100)
  })

  it('RPE suma repeticiones en reserva', () => {
    expect(estimatedOneRepMax({ reps: 8, weightKg: 60, rpe: 8 })).toBe(estimatedOneRepMax({ reps: 10, weightKg: 60 }))
  })

  it('sobrecarga progresiva', () => {
    expect(nextTarget({ reps: 12, weightKg: 50 })).toEqual({ reps: 6, weightKg: 52.5 })
    expect(nextTarget({ reps: 8, weightKg: 50 })).toEqual({ reps: 9, weightKg: 50 })
  })

  it('las rutinas de partida usan ejercicios de la base de datos', () => {
    for (const { exerciseId } of DEFAULT_ROUTINES.flatMap((r) => r.items)) expect(exerciseById(exerciseId), exerciseId).toBeDefined()
  })

  it('el plan semanal apunta a rutinas que existen', () => {
    for (const day of Object.values(DEFAULT_SCHEDULE)) {
      if (day.kind === 'strength') expect(DEFAULT_ROUTINES.some((r) => r.id === day.routineId)).toBe(true)
    }
  })
})

describe('compra', () => {
  it.each([
    ['Pechuga de pollo', 'Carne'],
    ['Queso fresco batido 0%', 'Lácteos y huevos'],
    ['Brócoli congelado', 'Congelados'],
    ['Atún al natural en lata', 'Conservas'],
    ['Crema de cacahuete 100%', 'Frutos secos'],
    ['Copos de avena integrales', 'Despensa'],
    ['Plátano', 'Fruta y verdura'],
    ['Claras de huevo líquidas', 'Lácteos y huevos'],
    ['Algo raro', 'Otros'],
  ])('%s → %s', (name, aisle) => expect(categorize(name)).toBe(aisle))

  it('URL de búsqueda de Mercadona', () => {
    expect(mercadonaSearchUrl('Queso batido 0%')).toBe('https://tienda.mercadona.es/search-results?query=Queso%20batido%200%25')
  })

  it('ritmo', () => expect(pace(10_000, 3120)).toBe('5:12 /km'))
})

describe('discos', async () => {
  const { platesPerSide } = await import('./strength')
  it('carga exacta', () => {
    expect(platesPerSide(100, 20)).toEqual({ plates: [25, 15], rest: 0 })
    expect(platesPerSide(62.5, 20)).toEqual({ plates: [20, 1.25], rest: 0 })
  })
  it('lo que no se puede cargar', () => {
    expect(platesPerSide(21, 20)).toEqual({ plates: [], rest: 1 })
    expect(platesPerSide(15, 20)).toEqual({ plates: [], rest: 0 })
  })
})
