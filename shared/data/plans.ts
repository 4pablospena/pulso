import type { Goal } from '../core/energy'
import type { MealSlot } from '../types'

export interface NutritionPlan {
  id: string
  name: string
  description: string
  goals: Goal[]
  slots: MealSlot[]
  /** Recetas por comida, de lunes a domingo. */
  week: Partial<Record<MealSlot, [string, string, string, string, string, string, string]>>
  highlights: string[]
}

export const NUTRITION_PLANS: NutritionPlan[] = [
  {
    id: 'mediterranea-proteica',
    name: 'Mediterránea alta en proteína',
    description: 'Cuatro comidas variadas con pescado, legumbre y mucha verdura. Pensada para entrenar fuerza y correr.',
    goals: ['maintain', 'bulk'],
    slots: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
    highlights: ['~2 g de proteína por kg', 'Pescado 3 veces por semana', 'Legumbre 2 veces por semana'],
    week: {
      Desayuno: ['porridge-platano', 'tostadas-aguacate-huevo', 'batido-frutos-rojos', 'tortitas-avena-claras', 'revuelto-pavo-espinacas', 'porridge-cacao', 'tostadas-aguacate-huevo'],
      Comida: ['pollo-arroz-brocoli', 'lentejas-verduras', 'salmon-boniato', 'pasta-bolonesa', 'ensalada-garbanzos-atun', 'arroz-gambas', 'lomo-patata-ensalada'],
      Merienda: ['yogur-nueces-miel', 'tortitas-cacahuete', 'batido-cacao', 'manzana-almendras', 'bocadillo-pavo', 'yogur-manzana-chia', 'hummus-crudites'],
      Cena: ['tortilla-espinacas', 'salmon-verduras', 'ensalada-pavo', 'merluza-judias', 'pollo-horno-verduras', 'revuelto-gambas', 'crema-calabacin'],
    },
  },
  {
    id: 'definicion-168',
    name: 'Definición con ayuno 16:8',
    description: 'Tres comidas dentro de la ventana de 8 horas, saciantes y con proteína alta para perder grasa sin perder músculo.',
    goals: ['cut'],
    slots: ['Comida', 'Merienda', 'Cena'],
    highlights: ['Compatible con ayuno 16:8', 'Cenas ligeras', 'Mucho volumen de verdura'],
    week: {
      Comida: ['pollo-arroz-brocoli', 'ensalada-garbanzos-atun', 'merluza-patatas', 'wok-pollo', 'lentejas-verduras', 'salmon-boniato', 'burrito-pollo'],
      Merienda: ['batido-frutos-rojos', 'manzana-almendras', 'batido-cacao', 'yogur-manzana-chia', 'batido-frutos-rojos', 'hummus-crudites', 'yogur-nueces-miel'],
      Cena: ['ensalada-atun-huevo', 'pollo-horno-verduras', 'revuelto-gambas', 'salmon-verduras', 'ensalada-pavo', 'merluza-judias', 'tortilla-espinacas'],
    },
  },
  {
    id: 'vegetariana',
    name: 'Vegetariana equilibrada',
    description: 'Sin carne ni pescado, con huevo, lácteos, legumbre y tofu para llegar a la proteína.',
    goals: ['cut', 'maintain', 'bulk'],
    slots: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
    highlights: ['Legumbre casi a diario', 'Tofu y huevo como proteína', 'Rica en fibra'],
    week: {
      Desayuno: ['porridge-cacao', 'tostada-hummus', 'batido-frutos-rojos', 'tortitas-avena-claras', 'yogur-manzana-chia', 'porridge-platano', 'tostadas-aguacate-huevo'],
      Comida: ['lentejas-verduras', 'bowl-quinoa-tofu', 'garbanzos-espinacas', 'lentejas-verduras', 'bowl-quinoa-tofu', 'garbanzos-espinacas', 'lentejas-verduras'],
      Merienda: ['yogur-nueces-miel', 'hummus-crudites', 'batido-cacao', 'tortitas-cacahuete', 'manzana-almendras', 'batido-frutos-rojos', 'yogur-manzana-chia'],
      Cena: ['tortilla-espinacas', 'tofu-salteado', 'crema-calabacin', 'tortilla-espinacas', 'tofu-salteado', 'crema-calabacin', 'tortilla-espinacas'],
    },
  },
  {
    id: 'batch-cooking',
    name: 'Batch cooking: cocina 2 veces',
    description: 'Cocinas el domingo y el miércoles y comes lo mismo varios días. Menos tiempo y lista de la compra más corta.',
    goals: ['cut', 'maintain', 'bulk'],
    slots: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
    highlights: ['2 sesiones de cocina por semana', 'Táperes para la oficina', 'Lista corta'],
    week: {
      Desayuno: ['porridge-platano', 'porridge-platano', 'porridge-platano', 'batido-frutos-rojos', 'batido-frutos-rojos', 'batido-frutos-rojos', 'tostadas-aguacate-huevo'],
      Comida: ['pollo-arroz-brocoli', 'pollo-arroz-brocoli', 'pollo-arroz-brocoli', 'pasta-bolonesa', 'pasta-bolonesa', 'pasta-bolonesa', 'lentejas-verduras'],
      Merienda: ['yogur-nueces-miel', 'manzana-almendras', 'yogur-nueces-miel', 'manzana-almendras', 'yogur-nueces-miel', 'manzana-almendras', 'tortitas-cacahuete'],
      Cena: ['crema-calabacin', 'crema-calabacin', 'ensalada-atun-huevo', 'merluza-judias', 'merluza-judias', 'ensalada-atun-huevo', 'tortilla-espinacas'],
    },
  },
]

export function planById(id: string | null | undefined): NutritionPlan | undefined {
  return NUTRITION_PLANS.find((p) => p.id === id)
}
