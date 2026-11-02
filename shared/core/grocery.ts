/** Secciones en el orden habitual de recorrido de un Mercadona. */
export const AISLES = [
  'Fruta y verdura', 'Panadería', 'Carne', 'Pescado', 'Charcutería y quesos', 'Lácteos y huevos',
  'Despensa', 'Conservas', 'Frutos secos', 'Bebidas', 'Congelados', 'Hogar e higiene', 'Otros',
] as const

export type Aisle = (typeof AISLES)[number]

export const AISLE_ICON: Record<Aisle, string> = {
  'Fruta y verdura': '🥦', 'Panadería': '🥖', 'Carne': '🍗', 'Pescado': '🐟',
  'Charcutería y quesos': '🧀', 'Lácteos y huevos': '🥚', 'Despensa': '🌾', 'Conservas': '🥫',
  'Frutos secos': '🥜', 'Bebidas': '💧', 'Congelados': '❄️', 'Hogar e higiene': '🧼', 'Otros': '🛒',
}

// Se evalúan en orden: las reglas más específicas primero
// ("brócoli congelado" → Congelados, "atún al natural" → Conservas).
const RULES: [Aisle, string[]][] = [
  ['Congelados', ['congelad', 'helado']],
  ['Conservas', ['lata', 'conserva', 'atún', 'atun', 'garbanzo cocido', 'tomate triturado']],
  ['Frutos secos', ['almendra', 'nuez', 'nueces', 'anacardo', 'pistacho', 'frutos secos', 'cacahuete']],
  ['Lácteos y huevos', ['batido 0%', 'queso batido', 'queso fresco', 'yogur', 'leche', 'kéfir', 'kefir', 'huevo', 'claras', 'skyr', 'requesón']],
  ['Charcutería y quesos', ['jamón', 'jamon', 'pavo filetead', 'queso', 'fiambre', 'pollo desmechado']],
  ['Carne', ['pollo', 'pechuga', 'ternera', 'cerdo', 'lomo', 'pavo', 'carne picada', 'hamburguesa']],
  ['Pescado', ['salmón', 'salmon', 'merluza', 'bacalao', 'gamba', 'dorada', 'lubina', 'pescado']],
  ['Fruta y verdura', ['plátano', 'platano', 'manzana', 'brócoli', 'brocoli', 'patata', 'aguacate', 'tomate', 'lechuga',
    'espinaca', 'cebolla', 'pimiento', 'fresa', 'arándano', 'naranja', 'limón', 'calabacín', 'zanahoria']],
  ['Panadería', ['pan ', 'pan de', 'barra', 'tortitas']],
  ['Despensa', ['arroz', 'avena', 'pasta', 'aceite', 'aove', 'harina', 'lenteja', 'quinoa', 'miel', 'café']],
  ['Bebidas', ['agua', 'bebida', 'zumo', 'refresco']],
  ['Hogar e higiene', ['detergente', 'papel', 'gel', 'champú', 'lavavajillas']],
]

export function categorize(name: string): Aisle {
  const key = ` ${name.toLowerCase()} `
  for (const [aisle, words] of RULES) {
    if (words.some((w) => key.includes(w))) return aisle
  }
  return 'Otros'
}

/** Búsqueda en la tienda online de Mercadona (no hay API pública de carrito). */
export function mercadonaSearchUrl(term: string): string {
  return `https://tienda.mercadona.es/search-results?query=${encodeURIComponent(term)}`
}
