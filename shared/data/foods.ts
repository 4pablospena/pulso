import type { Macros } from '../core/energy'
import type { Aisle } from '../core/grocery'

export interface Ingredient {
  id: string
  name: string
  /** Valores por 100 g (o ml) en el estado en que se pesa en la receta. */
  per100: Macros
  aisle: Aisle
  /** Producto de referencia en Mercadona y su formato habitual (aproximado). */
  product: { name: string; packGrams: number; format: string }
  /** Gramos de una unidad, para mostrar "2 huevos" en lugar de "120 g". */
  unitGrams?: number
  unitName?: [string, string]
  /** Básicos que se suelen tener en casa: se listan aparte para revisar. */
  pantry?: boolean
}

type Row = [id: string, name: string, kcal: number, p: number, c: number, f: number, aisle: Aisle,
  product: string, packGrams: number, format: string, extra?: Partial<Pick<Ingredient, 'unitGrams' | 'unitName' | 'pantry'>>]

// Valores nutricionales medios de referencia; los formatos son orientativos y pueden variar en tienda.
const rows: Row[] = [
  // Proteínas
  ['pollo', 'Pechuga de pollo', 110, 23, 0, 1.5, 'Carne', 'Pechuga de pollo fileteada', 500, 'Bandeja ~500 g'],
  ['pavo', 'Pechuga de pavo', 105, 24, 0, 1, 'Carne', 'Filetes de pechuga de pavo', 400, 'Bandeja ~400 g'],
  ['ternera-picada', 'Carne picada de vacuno', 137, 21, 0, 5.5, 'Carne', 'Carne picada de vacuno', 400, 'Bandeja ~400 g'],
  ['lomo', 'Lomo de cerdo', 145, 22, 0, 6, 'Carne', 'Lomo de cerdo fileteado', 500, 'Bandeja ~500 g'],
  ['salmon', 'Salmón', 200, 20, 0, 13, 'Pescado', 'Lomos de salmón', 250, 'Bandeja 2 lomos ~250 g'],
  ['merluza', 'Merluza', 75, 17, 0, 0.8, 'Congelados', 'Filetes de merluza congelados', 400, 'Bolsa ~400 g'],
  ['gambas', 'Gambas peladas', 80, 18, 0, 1, 'Congelados', 'Gamba pelada congelada', 300, 'Bolsa ~300 g'],
  ['atun', 'Atún al natural', 105, 25, 0, 0.8, 'Conservas', 'Atún claro al natural (pack 3)', 156, 'Pack 3 latas (~156 g escurrido)'],
  ['huevo', 'Huevo', 143, 12.6, 0.7, 9.5, 'Lácteos y huevos', 'Huevos frescos L', 720, 'Docena', { unitGrams: 60, unitName: ['huevo', 'huevos'] }],
  ['claras', 'Claras de huevo', 48, 11, 0.7, 0.2, 'Lácteos y huevos', 'Claras de huevo líquidas', 500, 'Envase ~500 g'],
  ['queso-batido', 'Queso fresco batido 0%', 46, 8, 3.6, 0.2, 'Lácteos y huevos', 'Queso fresco batido 0% M.G.', 500, 'Tarrina ~500 g'],
  ['yogur', 'Yogur natural desnatado', 45, 4.5, 6, 0.1, 'Lácteos y huevos', 'Yogur natural desnatado', 500, 'Pack 4 × 125 g'],
  ['jamon-pavo', 'Fiambre de pechuga de pavo', 95, 18, 2, 1.5, 'Charcutería y quesos', 'Pechuga de pavo en lonchas', 200, 'Paquete ~200 g'],
  ['mozzarella', 'Mozzarella light', 160, 18, 1, 9, 'Charcutería y quesos', 'Mozzarella fresca light', 125, 'Bola ~125 g'],
  ['tofu', 'Tofu firme', 120, 13, 1.5, 7, 'Charcutería y quesos', 'Tofu natural', 400, 'Pack ~400 g'],
  ['garbanzos', 'Garbanzos cocidos', 120, 7, 16, 2.5, 'Conservas', 'Garbanzo cocido (bote)', 250, 'Bote 400 g (~250 g escurrido)'],
  ['lentejas', 'Lentejas cocidas', 100, 8, 14, 0.5, 'Conservas', 'Lenteja cocida (bote)', 250, 'Bote 400 g (~250 g escurrido)'],
  ['hummus', 'Hummus', 270, 7, 12, 21, 'Charcutería y quesos', 'Hummus clásico', 240, 'Tarrina ~240 g'],
  ['leche', 'Leche desnatada', 35, 3.4, 4.9, 0.1, 'Lácteos y huevos', 'Leche desnatada', 1000, 'Brik 1 L'],
  ['bebida-avena', 'Bebida de avena', 45, 1, 7.5, 1.5, 'Bebidas', 'Bebida de avena', 1000, 'Brik 1 L'],

  // Hidratos
  ['avena', 'Copos de avena', 370, 13, 60, 7, 'Despensa', 'Copos de avena integrales', 500, 'Bolsa ~500 g'],
  ['arroz-basmati', 'Arroz basmati (crudo)', 350, 8, 78, 0.6, 'Despensa', 'Arroz basmati', 1000, 'Paquete 1 kg'],
  ['arroz-integral', 'Arroz integral (crudo)', 350, 7.5, 74, 2.7, 'Despensa', 'Arroz integral', 1000, 'Paquete 1 kg'],
  ['arroz-vaso', 'Arroz cocido en vasito', 150, 3, 32, 1.5, 'Despensa', 'Arroz basmati vasitos microondas', 250, 'Pack 2 × 125 g'],
  ['pasta-integral', 'Pasta integral (cruda)', 350, 13, 64, 2.5, 'Despensa', 'Macarrones integrales', 500, 'Paquete ~500 g'],
  ['quinoa', 'Quinoa (cruda)', 368, 14, 64, 6, 'Despensa', 'Quinoa', 500, 'Paquete ~500 g'],
  ['pan-integral', 'Pan integral de molde', 250, 10, 41, 4, 'Panadería', 'Pan de molde 100% integral', 460, 'Paquete ~460 g'],
  ['tortitas-arroz', 'Tortitas de arroz', 380, 8, 80, 3, 'Panadería', 'Tortitas de arroz integral', 130, 'Paquete ~130 g'],
  ['wrap', 'Tortilla de trigo integral', 300, 9, 50, 7, 'Panadería', 'Tortillas de trigo integrales', 360, 'Pack 6 uds', { unitGrams: 60, unitName: ['tortilla', 'tortillas'] }],
  ['patata', 'Patata', 77, 2, 17, 0.1, 'Fruta y verdura', 'Patatas', 3000, 'Malla ~3 kg'],
  ['boniato', 'Boniato', 86, 1.6, 20, 0.1, 'Fruta y verdura', 'Boniato', 1000, '~1 kg a granel'],
  ['platano', 'Plátano', 89, 1.1, 23, 0.3, 'Fruta y verdura', 'Plátano de Canarias', 1000, '~6 uds (1 kg)', { unitGrams: 120, unitName: ['plátano', 'plátanos'] }],
  ['manzana', 'Manzana', 52, 0.3, 14, 0.2, 'Fruta y verdura', 'Manzanas', 1000, '~5 uds (1 kg)', { unitGrams: 180, unitName: ['manzana', 'manzanas'] }],
  ['frutos-rojos', 'Frutos rojos', 50, 1, 9, 0.3, 'Congelados', 'Frutos rojos congelados', 300, 'Bolsa ~300 g'],

  // Verduras
  ['brocoli', 'Brócoli', 34, 2.8, 4, 0.4, 'Congelados', 'Brócoli congelado', 1000, 'Bolsa ~1 kg'],
  ['judias-verdes', 'Judías verdes', 31, 1.8, 7, 0.1, 'Congelados', 'Judía verde redonda congelada', 1000, 'Bolsa ~1 kg'],
  ['verduras-wok', 'Verduras para wok', 40, 2, 6, 0.5, 'Congelados', 'Salteado de verduras congelado', 450, 'Bolsa ~450 g'],
  ['espinacas', 'Espinacas frescas', 23, 2.9, 1.4, 0.4, 'Fruta y verdura', 'Espinacas baby', 300, 'Bolsa ~300 g'],
  ['lechuga', 'Mezcla de ensalada', 17, 1.2, 2.9, 0.3, 'Fruta y verdura', 'Ensalada mezcla', 200, 'Bolsa ~200 g'],
  ['tomate', 'Tomate', 18, 0.9, 3.9, 0.2, 'Fruta y verdura', 'Tomate ensalada', 1000, '~1 kg'],
  ['pepino', 'Pepino', 15, 0.7, 3.6, 0.1, 'Fruta y verdura', 'Pepino', 300, '1 ud (~300 g)'],
  ['pimiento', 'Pimiento', 27, 1, 6, 0.2, 'Fruta y verdura', 'Pimientos tricolor', 500, 'Bandeja ~500 g'],
  ['cebolla', 'Cebolla', 40, 1.1, 9, 0.1, 'Fruta y verdura', 'Cebollas', 1000, 'Malla ~1 kg'],
  ['calabacin', 'Calabacín', 17, 1.2, 3.1, 0.3, 'Fruta y verdura', 'Calabacín', 600, '~2 uds'],
  ['champinones', 'Champiñones', 22, 3.1, 3.3, 0.3, 'Fruta y verdura', 'Champiñón laminado', 250, 'Bandeja ~250 g'],
  ['zanahoria', 'Zanahoria', 41, 0.9, 10, 0.2, 'Fruta y verdura', 'Zanahorias', 1000, 'Bolsa ~1 kg'],
  ['aguacate', 'Aguacate', 160, 2, 8.5, 14.7, 'Fruta y verdura', 'Aguacates', 500, 'Malla ~3 uds'],
  ['tomate-triturado', 'Tomate triturado', 30, 1.3, 4.5, 0.2, 'Conservas', 'Tomate triturado', 400, 'Bote ~400 g'],

  // Grasas y despensa
  ['aove', 'Aceite de oliva virgen extra', 884, 0, 0, 100, 'Despensa', 'Aceite de oliva virgen extra', 1000, 'Botella 1 L', { pantry: true }],
  ['crema-cacahuete', 'Crema de cacahuete 100%', 600, 25, 15, 48, 'Frutos secos', 'Crema de cacahuete 100% cacahuete', 350, 'Bote ~350 g'],
  ['almendras', 'Almendras naturales', 600, 21, 7, 52, 'Frutos secos', 'Almendra natural', 200, 'Bolsa ~200 g'],
  ['nueces', 'Nueces', 690, 15, 7, 65, 'Frutos secos', 'Nuez natural pelada', 200, 'Bolsa ~200 g'],
  ['chia', 'Semillas de chía', 490, 17, 8, 31, 'Despensa', 'Semillas de chía', 200, 'Bolsa ~200 g'],
  ['miel', 'Miel', 304, 0.3, 82, 0, 'Despensa', 'Miel de flores', 500, 'Bote ~500 g', { pantry: true }],
  ['cacao', 'Cacao puro desgrasado', 340, 20, 14, 11, 'Despensa', 'Cacao puro desgrasado en polvo', 250, 'Bote ~250 g', { pantry: true }],
  ['especias', 'Sal y especias', 0, 0, 0, 0, 'Despensa', 'Especias (pimentón, comino, orégano, canela)', 50, 'Bote', { pantry: true }],
]

export const INGREDIENTS: Ingredient[] = rows.map(([id, name, kcal, protein, carbs, fat, aisle, product, packGrams, format, extra]) => ({
  id, name, per100: { kcal, protein, carbs, fat }, aisle, product: { name: product, packGrams, format }, ...extra,
}))

const byId = new Map(INGREDIENTS.map((i) => [i.id, i]))
export function ingredientById(id: string): Ingredient | undefined {
  return byId.get(id)
}
