import type { MealSlot } from '../types'

export type RecipeTag = 'Alta proteína' | 'Vegetariana' | 'Rápida' | 'Batch cooking' | 'Ligera' | 'Sin cocinar'

export interface Recipe {
  id: string
  name: string
  /** Receta creada por alguien de la casa. */
  custom?: boolean
  author?: string
  /** Tiene foto subida (se sirve en /api/recipes/photo/<id>). */
  photo?: boolean
  slots: MealSlot[]
  prepMin: number
  tags: RecipeTag[]
  /** [id de ingrediente, gramos] para una ración base. */
  ingredients: [string, number][]
  steps: string[]
}

const D: MealSlot[] = ['Desayuno']
const M: MealSlot[] = ['Merienda']
const DM: MealSlot[] = ['Desayuno', 'Merienda']
const C: MealSlot[] = ['Comida']
const X: MealSlot[] = ['Cena']
const CX: MealSlot[] = ['Comida', 'Cena']

export const RECIPES: Recipe[] = [
  // Desayunos
  { id: 'porridge-platano', name: 'Porridge de avena con plátano y cacahuete', slots: D, prepMin: 5, tags: ['Rápida', 'Vegetariana'],
    ingredients: [['avena', 60], ['leche', 200], ['platano', 100], ['crema-cacahuete', 15], ['especias', 1]],
    steps: ['Calienta la avena con la leche 3 min removiendo.', 'Añade el plátano en rodajas, la crema de cacahuete y canela.'] },
  { id: 'tostadas-aguacate-huevo', name: 'Tostadas integrales con aguacate y huevo', slots: D, prepMin: 10, tags: ['Vegetariana'],
    ingredients: [['pan-integral', 70], ['aguacate', 50], ['huevo', 120], ['tomate', 50], ['especias', 1]],
    steps: ['Tuesta el pan y unta el aguacate machacado.', 'Cuece o haz a la plancha los huevos y ponlos encima con tomate en rodajas.'] },
  { id: 'batido-frutos-rojos', name: 'Bol de queso batido con frutos rojos y nueces', slots: DM, prepMin: 3, tags: ['Alta proteína', 'Rápida', 'Sin cocinar', 'Vegetariana'],
    ingredients: [['queso-batido', 250], ['frutos-rojos', 100], ['avena', 30], ['nueces', 15]],
    steps: ['Descongela los frutos rojos 1 min en el microondas.', 'Mézclalo todo en un bol.'] },
  { id: 'tortitas-avena-claras', name: 'Tortitas de avena y claras', slots: D, prepMin: 15, tags: ['Alta proteína', 'Vegetariana'],
    ingredients: [['claras', 150], ['avena', 50], ['platano', 60], ['miel', 10]],
    steps: ['Tritura claras, avena y plátano.', 'Haz tortitas en sartén antiadherente a fuego medio, 2 min por lado.', 'Sirve con un hilo de miel.'] },
  { id: 'yogur-manzana-chia', name: 'Yogur con manzana, chía y almendras', slots: DM, prepMin: 3, tags: ['Rápida', 'Sin cocinar', 'Vegetariana'],
    ingredients: [['yogur', 250], ['chia', 15], ['manzana', 150], ['almendras', 15]],
    steps: ['Pica la manzana.', 'Mezcla con el yogur, la chía y las almendras.'] },
  { id: 'revuelto-pavo-espinacas', name: 'Revuelto de huevo y pavo con espinacas', slots: D, prepMin: 8, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['huevo', 120], ['claras', 100], ['jamon-pavo', 60], ['espinacas', 40], ['pan-integral', 60]],
    steps: ['Saltea las espinacas 1 min.', 'Añade huevos, claras y el pavo picado y remueve hasta cuajar.', 'Acompaña con el pan tostado.'] },
  { id: 'porridge-cacao', name: 'Porridge de cacao con frutos rojos', slots: D, prepMin: 5, tags: ['Vegetariana', 'Rápida'],
    ingredients: [['avena', 60], ['bebida-avena', 250], ['cacao', 10], ['frutos-rojos', 80], ['chia', 10]],
    steps: ['Cuece la avena con la bebida y el cacao 3 min.', 'Corona con frutos rojos y chía.'] },
  { id: 'tostada-hummus', name: 'Tostadas de hummus, tomate y huevo', slots: D, prepMin: 8, tags: ['Vegetariana'],
    ingredients: [['pan-integral', 70], ['hummus', 50], ['tomate', 60], ['huevo', 60]],
    steps: ['Tuesta el pan y unta el hummus.', 'Añade tomate en rodajas y el huevo cocido.'] },

  // Comidas
  { id: 'pollo-arroz-brocoli', name: 'Pollo con arroz basmati y brócoli', slots: C, prepMin: 20, tags: ['Alta proteína', 'Batch cooking'],
    ingredients: [['pollo', 170], ['arroz-basmati', 80], ['brocoli', 200], ['aove', 10], ['especias', 2]],
    steps: ['Cuece el arroz 12 min.', 'Haz el pollo a la plancha con especias.', 'Cuece el brócoli al vapor 6 min y aliña con el aceite.'] },
  { id: 'salmon-boniato', name: 'Salmón con boniato asado y judías verdes', slots: CX, prepMin: 30, tags: ['Alta proteína'],
    ingredients: [['salmon', 150], ['boniato', 250], ['judias-verdes', 150], ['aove', 5], ['especias', 1]],
    steps: ['Hornea el boniato en dados 25 min a 200 °C.', 'Añade el salmón los últimos 12 min.', 'Saltea las judías verdes.'] },
  { id: 'lentejas-verduras', name: 'Lentejas estofadas con verduras', slots: C, prepMin: 25, tags: ['Vegetariana', 'Batch cooking'],
    ingredients: [['lentejas', 250], ['zanahoria', 80], ['pimiento', 60], ['cebolla', 50], ['tomate-triturado', 100], ['aove', 10], ['especias', 2]],
    steps: ['Sofríe cebolla, pimiento y zanahoria picados.', 'Añade tomate, pimentón y las lentejas escurridas.', 'Cuece 10 min con un poco de agua.'] },
  { id: 'pasta-bolonesa', name: 'Pasta integral boloñesa de ternera', slots: C, prepMin: 25, tags: ['Alta proteína', 'Batch cooking'],
    ingredients: [['pasta-integral', 90], ['ternera-picada', 130], ['tomate-triturado', 150], ['champinones', 100], ['cebolla', 40], ['aove', 8], ['especias', 1]],
    steps: ['Cuece la pasta.', 'Dora la carne con cebolla y champiñón.', 'Añade el tomate, orégano y cuece 10 min. Mezcla con la pasta.'] },
  { id: 'ensalada-garbanzos-atun', name: 'Ensalada de garbanzos y atún', slots: C, prepMin: 10, tags: ['Rápida', 'Sin cocinar', 'Alta proteína'],
    ingredients: [['garbanzos', 200], ['atun', 104], ['tomate', 120], ['pepino', 100], ['pimiento', 50], ['aove', 10], ['especias', 1]],
    steps: ['Lava y escurre los garbanzos.', 'Pica las verduras y mézclalo todo con el atún.', 'Aliña con aceite, sal y comino.'] },
  { id: 'wok-pollo', name: 'Wok de pollo con verduras y arroz', slots: CX, prepMin: 15, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['pollo', 160], ['verduras-wok', 250], ['arroz-vaso', 125], ['aove', 8], ['especias', 1]],
    steps: ['Saltea el pollo en tiras a fuego fuerte.', 'Añade las verduras congeladas 6 min.', 'Calienta el arroz y sirve juntos.'] },
  { id: 'merluza-patatas', name: 'Merluza al horno con patatas panaderas', slots: CX, prepMin: 35, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['merluza', 200], ['patata', 250], ['pimiento', 60], ['cebolla', 40], ['aove', 10], ['especias', 1]],
    steps: ['Hornea patata, cebolla y pimiento en láminas 25 min a 200 °C.', 'Pon la merluza encima y hornea 10 min más.'] },
  { id: 'bowl-quinoa-tofu', name: 'Bowl de quinoa, tofu y aguacate', slots: C, prepMin: 20, tags: ['Vegetariana'],
    ingredients: [['quinoa', 70], ['tofu', 150], ['espinacas', 50], ['aguacate', 50], ['zanahoria', 60], ['aove', 5], ['especias', 1]],
    steps: ['Cuece la quinoa 12 min.', 'Dora el tofu en dados con pimentón.', 'Monta el bowl con espinacas, zanahoria rallada y aguacate.'] },
  { id: 'lomo-patata-ensalada', name: 'Lomo a la plancha con patata y ensalada', slots: CX, prepMin: 20, tags: ['Alta proteína'],
    ingredients: [['lomo', 150], ['patata', 200], ['lechuga', 80], ['tomate', 100], ['aove', 10], ['especias', 1]],
    steps: ['Cuece la patata en el microondas 6 min.', 'Haz el lomo a la plancha.', 'Acompaña con ensalada aliñada.'] },
  { id: 'burrito-pollo', name: 'Burritos de pollo y verduras', slots: CX, prepMin: 15, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['wrap', 120], ['pollo', 140], ['pimiento', 80], ['cebolla', 40], ['aguacate', 50], ['tomate', 60], ['especias', 1]],
    steps: ['Saltea pollo, pimiento y cebolla en tiras con comino.', 'Rellena las tortillas con aguacate y tomate.'] },
  { id: 'arroz-gambas', name: 'Arroz integral salteado con gambas', slots: C, prepMin: 25, tags: ['Alta proteína'],
    ingredients: [['arroz-integral', 80], ['gambas', 150], ['verduras-wok', 150], ['aove', 10], ['especias', 1]],
    steps: ['Cuece el arroz integral 20 min.', 'Saltea gambas y verduras y mezcla con el arroz.'] },
  { id: 'garbanzos-espinacas', name: 'Garbanzos con espinacas y huevo', slots: C, prepMin: 15, tags: ['Vegetariana', 'Rápida'],
    ingredients: [['garbanzos', 250], ['espinacas', 150], ['huevo', 60], ['tomate-triturado', 80], ['aove', 10], ['especias', 2]],
    steps: ['Sofríe ajo y pimentón, añade tomate y espinacas.', 'Incorpora los garbanzos 5 min.', 'Sirve con el huevo cocido.'] },

  // Meriendas
  { id: 'yogur-nueces-miel', name: 'Yogur con nueces y miel', slots: M, prepMin: 2, tags: ['Rápida', 'Sin cocinar', 'Vegetariana'],
    ingredients: [['yogur', 250], ['nueces', 20], ['miel', 10]], steps: ['Mezcla y listo.'] },
  { id: 'tortitas-cacahuete', name: 'Tortitas de arroz con crema de cacahuete y plátano', slots: M, prepMin: 2, tags: ['Rápida', 'Sin cocinar', 'Vegetariana'],
    ingredients: [['tortitas-arroz', 25], ['crema-cacahuete', 20], ['platano', 100]], steps: ['Unta las tortitas y añade el plátano en rodajas.'] },
  { id: 'batido-cacao', name: 'Batido de queso batido, plátano y cacao', slots: DM, prepMin: 3, tags: ['Alta proteína', 'Rápida', 'Vegetariana'],
    ingredients: [['leche', 250], ['queso-batido', 150], ['platano', 100], ['cacao', 5]], steps: ['Tritura todo con hielo.'] },
  { id: 'manzana-almendras', name: 'Manzana y almendras', slots: M, prepMin: 1, tags: ['Rápida', 'Sin cocinar', 'Vegetariana', 'Ligera'],
    ingredients: [['manzana', 180], ['almendras', 25]], steps: ['Para llevar.'] },
  { id: 'bocadillo-pavo', name: 'Sándwich integral de pavo y mozzarella', slots: M, prepMin: 5, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['pan-integral', 60], ['jamon-pavo', 60], ['mozzarella', 40], ['tomate', 40]], steps: ['Monta el sándwich y tuéstalo si quieres.'] },
  { id: 'hummus-crudites', name: 'Hummus con crudités', slots: M, prepMin: 5, tags: ['Vegetariana', 'Sin cocinar', 'Ligera'],
    ingredients: [['hummus', 60], ['zanahoria', 100], ['pepino', 100]], steps: ['Corta zanahoria y pepino en bastones.'] },

  // Cenas
  { id: 'tortilla-espinacas', name: 'Tortilla de espinacas y champiñones', slots: X, prepMin: 12, tags: ['Vegetariana', 'Ligera'],
    ingredients: [['huevo', 180], ['espinacas', 100], ['champinones', 100], ['pan-integral', 40], ['aove', 5]],
    steps: ['Saltea champiñones y espinacas.', 'Añade los huevos batidos y cuaja la tortilla.'] },
  { id: 'salmon-verduras', name: 'Salmón al horno con calabacín y pimiento', slots: X, prepMin: 20, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['salmon', 140], ['calabacin', 200], ['pimiento', 100], ['aove', 8], ['especias', 1]],
    steps: ['Hornea las verduras en tiras 10 min a 200 °C.', 'Añade el salmón y hornea 12 min más.'] },
  { id: 'ensalada-pavo', name: 'Ensalada templada de pavo y aguacate', slots: X, prepMin: 12, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['pavo', 150], ['lechuga', 100], ['tomate', 120], ['pepino', 100], ['aguacate', 40], ['aove', 8], ['especias', 1]],
    steps: ['Haz el pavo a la plancha y córtalo en tiras.', 'Sírvelo sobre la ensalada aliñada.'] },
  { id: 'merluza-judias', name: 'Merluza con judías verdes y patata', slots: X, prepMin: 15, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['merluza', 220], ['judias-verdes', 200], ['patata', 120], ['aove', 8], ['especias', 1]],
    steps: ['Cuece judías y patata 12 min.', 'Haz la merluza a la plancha y aliña con aceite y pimentón.'] },
  { id: 'revuelto-gambas', name: 'Revuelto de gambas y espinacas', slots: X, prepMin: 10, tags: ['Alta proteína', 'Rápida', 'Ligera'],
    ingredients: [['huevo', 120], ['claras', 100], ['gambas', 120], ['espinacas', 80], ['aove', 5]],
    steps: ['Saltea gambas y espinacas.', 'Añade huevos y claras y remueve hasta cuajar.'] },
  { id: 'crema-calabacin', name: 'Crema de calabacín con huevo duro', slots: X, prepMin: 20, tags: ['Vegetariana', 'Ligera', 'Batch cooking'],
    ingredients: [['calabacin', 300], ['cebolla', 50], ['patata', 80], ['huevo', 120], ['aove', 8], ['especias', 1]],
    steps: ['Cuece calabacín, cebolla y patata 15 min.', 'Tritura con el aceite.', 'Sirve con los huevos duros picados.'] },
  { id: 'ensalada-atun-huevo', name: 'Ensalada de atún y huevo', slots: X, prepMin: 10, tags: ['Alta proteína', 'Rápida', 'Ligera'],
    ingredients: [['lechuga', 100], ['atun', 104], ['huevo', 60], ['tomate', 120], ['aove', 8]],
    steps: ['Cuece el huevo 10 min.', 'Monta la ensalada y aliña.'] },
  { id: 'tofu-salteado', name: 'Tofu salteado con verduras y arroz', slots: X, prepMin: 15, tags: ['Vegetariana', 'Rápida'],
    ingredients: [['tofu', 180], ['verduras-wok', 250], ['arroz-vaso', 125], ['aove', 8], ['especias', 1]],
    steps: ['Dora el tofu en dados.', 'Añade las verduras 6 min y sirve con el arroz.'] },
  { id: 'pollo-horno-verduras', name: 'Pollo al horno con calabacín y champiñones', slots: X, prepMin: 25, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['pollo', 170], ['calabacin', 150], ['champinones', 150], ['aove', 8], ['especias', 1]],
    steps: ['Hornea todo junto 20 min a 200 °C con hierbas.'] },
  { id: 'wrap-pavo', name: 'Wrap de pavo y mozzarella', slots: X, prepMin: 5, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['wrap', 60], ['jamon-pavo', 80], ['mozzarella', 50], ['lechuga', 40], ['tomate', 60]],
    steps: ['Rellena la tortilla, enróllala y dórala 1 min en la sartén.'] },

  // Ampliación: desayunos
  { id: 'tostada-requeson-fruta', name: 'Tostada de requesón con kiwi y miel', slots: D, prepMin: 5, tags: ['Rápida', 'Vegetariana', 'Sin cocinar'],
    ingredients: [['pan-integral', 70], ['requeson', 120], ['kiwi', 150], ['miel', 8]],
    steps: ['Tuesta el pan.', 'Unta el requesón y añade el kiwi en rodajas y un hilo de miel.'] },
  { id: 'overnight-oats', name: 'Avena nocturna con yogur y frutos rojos', slots: D, prepMin: 5, tags: ['Batch cooking', 'Vegetariana', 'Sin cocinar'],
    ingredients: [['avena', 60], ['yogur', 200], ['leche', 100], ['frutos-rojos', 100], ['chia', 10]],
    steps: ['Mezcla avena, yogur, leche y chía en un tarro.', 'Deja en la nevera toda la noche y añade los frutos rojos por la mañana.'] },
  { id: 'revuelto-setas', name: 'Revuelto de setas con pan integral', slots: D, prepMin: 10, tags: ['Vegetariana', 'Rápida'],
    ingredients: [['huevo', 120], ['claras', 100], ['setas', 120], ['pan-integral', 60], ['aove', 5]],
    steps: ['Saltea las setas con un poco de aceite.', 'Añade huevos y claras y remueve a fuego suave.', 'Sirve con el pan tostado.'] },
  { id: 'batido-verde', name: 'Batido de plátano, espinacas y queso batido', slots: DM, prepMin: 3, tags: ['Alta proteína', 'Rápida', 'Vegetariana'],
    ingredients: [['queso-batido', 200], ['platano', 120], ['espinacas', 40], ['bebida-avena', 200], ['crema-cacahuete', 10]],
    steps: ['Tritura todo con hielo hasta que quede fino.'] },
  { id: 'tostada-sardinas', name: 'Tostadas de sardinas y tomate', slots: D, prepMin: 5, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['pan-integral', 70], ['sardinas', 85], ['tomate', 80], ['aove', 5]],
    steps: ['Ralla el tomate sobre el pan tostado.', 'Pon las sardinas encima con un hilo de aceite.'] },

  // Ampliación: comidas
  { id: 'cuscus-pollo', name: 'Cuscús con pollo, calabacín y pimiento', slots: C, prepMin: 20, tags: ['Alta proteína', 'Batch cooking'],
    ingredients: [['cuscus', 70], ['pollo', 160], ['calabacin', 150], ['pimiento', 80], ['aove', 10], ['especias', 2]],
    steps: ['Hidrata el cuscús con agua caliente 5 min.', 'Saltea el pollo con comino y las verduras en dados.', 'Mézclalo todo.'] },
  { id: 'albondigas-pavo', name: 'Albóndigas de pavo en salsa de tomate con arroz', slots: CX, prepMin: 30, tags: ['Alta proteína', 'Batch cooking'],
    ingredients: [['pavo-picado', 160], ['tomate-triturado', 150], ['cebolla', 50], ['arroz-basmati', 60], ['aove', 8], ['especias', 2]],
    steps: ['Forma albóndigas con la carne y las especias.', 'Dóralas, añade cebolla y tomate y cuece 15 min.', 'Sirve con el arroz.'] },
  { id: 'ensalada-cuscus-feta', name: 'Ensalada de cuscús, garbanzos y feta', slots: C, prepMin: 15, tags: ['Vegetariana', 'Batch cooking'],
    ingredients: [['cuscus', 60], ['garbanzos', 150], ['feta', 40], ['tomate', 120], ['pepino', 100], ['aove', 10]],
    steps: ['Hidrata el cuscús.', 'Mézclalo con garbanzos, verduras picadas y el feta desmenuzado.', 'Aliña con aceite y limón.'] },
  { id: 'poke-salmon', name: 'Poke de salmón con edamame y arroz', slots: C, prepMin: 15, tags: ['Alta proteína'],
    ingredients: [['arroz-vaso', 125], ['salmon', 120], ['edamame', 80], ['aguacate', 50], ['pepino', 80], ['zanahoria', 50]],
    steps: ['Calienta el arroz y cuece el edamame 3 min.', 'Corta el salmón en dados (o hazlo a la plancha).', 'Monta el bol con todo.'] },
  { id: 'lentejas-calabaza', name: 'Lentejas con calabaza y espinacas', slots: C, prepMin: 25, tags: ['Vegetariana', 'Batch cooking'],
    ingredients: [['lentejas', 250], ['calabaza', 150], ['espinacas', 60], ['cebolla', 50], ['aove', 10], ['especias', 2]],
    steps: ['Sofríe la cebolla y añade la calabaza en dados 10 min.', 'Incorpora las lentejas, las espinacas y comino. Cuece 8 min.'] },
  { id: 'pasta-atun-tomate', name: 'Pasta integral con atún y tomate', slots: C, prepMin: 15, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['pasta-integral', 90], ['atun', 104], ['tomate-triturado', 150], ['cebolla', 30], ['aove', 8], ['especias', 1]],
    steps: ['Cuece la pasta.', 'Haz una salsa rápida con cebolla y tomate, añade el atún y mezcla con la pasta.'] },
  { id: 'pollo-curry-arroz', name: 'Pollo al curry suave con arroz integral', slots: C, prepMin: 30, tags: ['Alta proteína', 'Batch cooking'],
    ingredients: [['pollo', 160], ['arroz-integral', 70], ['yogur', 80], ['cebolla', 50], ['pimiento', 60], ['especias', 3]],
    steps: ['Cuece el arroz integral.', 'Dora el pollo con cebolla y pimiento, añade curry y el yogur al final sin que hierva.'] },
  { id: 'merluza-cuscus', name: 'Merluza con cuscús y verduras', slots: CX, prepMin: 20, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['merluza', 200], ['cuscus', 50], ['calabacin', 120], ['zanahoria', 60], ['aove', 8]],
    steps: ['Hidrata el cuscús.', 'Saltea las verduras y haz la merluza a la plancha.'] },
  { id: 'gazpacho-huevo-atun', name: 'Gazpacho con huevo y atún', slots: CX, prepMin: 10, tags: ['Rápida', 'Ligera', 'Sin cocinar'],
    ingredients: [['gazpacho', 400], ['huevo', 60], ['atun', 52], ['pan-integral', 30]],
    steps: ['Sirve el gazpacho frío.', 'Acompaña con el huevo duro picado, el atún y picatostes de pan.'] },

  // Ampliación: meriendas
  { id: 'requeson-nueces', name: 'Requesón con nueces y miel', slots: M, prepMin: 2, tags: ['Alta proteína', 'Rápida', 'Sin cocinar', 'Vegetariana'],
    ingredients: [['requeson', 150], ['nueces', 15], ['miel', 8]], steps: ['Mezcla y listo.'] },
  { id: 'naranja-almendras', name: 'Naranja y almendras', slots: M, prepMin: 1, tags: ['Rápida', 'Sin cocinar', 'Vegetariana', 'Ligera'],
    ingredients: [['naranja', 200], ['almendras', 20]], steps: ['Para llevar.'] },
  { id: 'edamame-sal', name: 'Edamame con sal', slots: M, prepMin: 5, tags: ['Alta proteína', 'Vegetariana', 'Rápida'],
    ingredients: [['edamame', 150], ['especias', 1]], steps: ['Cuece 4 min, escurre y añade sal en escamas.'] },
  { id: 'tortitas-pavo', name: 'Tortitas de arroz con pavo y tomate', slots: M, prepMin: 3, tags: ['Alta proteína', 'Rápida'],
    ingredients: [['tortitas-arroz', 25], ['jamon-pavo', 60], ['tomate', 60]], steps: ['Monta las tortitas con el pavo y el tomate en rodajas.'] },
  { id: 'kiwi-yogur', name: 'Yogur con kiwi y chía', slots: DM, prepMin: 2, tags: ['Rápida', 'Sin cocinar', 'Vegetariana', 'Ligera'],
    ingredients: [['yogur', 250], ['kiwi', 150], ['chia', 10]], steps: ['Corta el kiwi y mézclalo con el yogur y la chía.'] },

  // Ampliación: cenas
  { id: 'crema-calabaza', name: 'Crema de calabaza con huevo poché', slots: X, prepMin: 25, tags: ['Vegetariana', 'Ligera', 'Batch cooking'],
    ingredients: [['calabaza', 300], ['cebolla', 50], ['patata', 80], ['huevo', 60], ['aove', 8], ['especias', 1]],
    steps: ['Cuece calabaza, cebolla y patata 20 min.', 'Tritura con el aceite.', 'Sirve con un huevo poché por encima.'] },
  { id: 'mejillones-ensalada', name: 'Ensalada de mejillones y patata', slots: X, prepMin: 15, tags: ['Alta proteína', 'Ligera'],
    ingredients: [['mejillones', 140], ['patata', 150], ['lechuga', 80], ['tomate', 100], ['aove', 8]],
    steps: ['Cuece la patata en dados 10 min.', 'Mezcla con la ensalada y los mejillones.'] },
  { id: 'tortilla-calabacin', name: 'Tortilla de calabacín y cebolla', slots: X, prepMin: 15, tags: ['Vegetariana', 'Ligera'],
    ingredients: [['huevo', 180], ['calabacin', 200], ['cebolla', 50], ['aove', 8]],
    steps: ['Pocha el calabacín y la cebolla.', 'Añade los huevos batidos y cuaja la tortilla por ambos lados.'] },
  { id: 'pavo-setas', name: 'Pechuga de pavo con setas y espinacas', slots: X, prepMin: 15, tags: ['Alta proteína', 'Ligera', 'Rápida'],
    ingredients: [['pavo', 160], ['setas', 150], ['espinacas', 80], ['aove', 8], ['especias', 1]],
    steps: ['Haz el pavo a la plancha.', 'Saltea las setas y las espinacas con ajo.'] },
  { id: 'salmon-cuscus', name: 'Salmón con cuscús y judías verdes', slots: X, prepMin: 20, tags: ['Alta proteína'],
    ingredients: [['salmon', 130], ['cuscus', 40], ['judias-verdes', 150], ['aove', 5]],
    steps: ['Hidrata el cuscús.', 'Haz el salmón al horno 12 min y saltea las judías.'] },
  { id: 'wok-tofu-edamame', name: 'Wok de tofu, edamame y verduras', slots: X, prepMin: 15, tags: ['Vegetariana', 'Rápida', 'Alta proteína'],
    ingredients: [['tofu', 150], ['edamame', 80], ['verduras-wok', 200], ['aove', 8], ['especias', 1]],
    steps: ['Dora el tofu en dados.', 'Añade edamame y verduras a fuego fuerte 6 min.'] },
]

/** Recetas creadas por la casa (se cargan desde la API y se registran aquí). */
const custom = new Map<string, Recipe>()
const byId = new Map(RECIPES.map((r) => [r.id, r]))

export function setCustomRecipes(list: Recipe[]) {
  custom.clear()
  for (const r of list) custom.set(r.id, r)
}

/** Recetario completo: el de serie más las recetas propias. */
export function allRecipes(): Recipe[] {
  return [...RECIPES, ...custom.values()]
}

export function recipeById(id: string): Recipe | undefined {
  return byId.get(id) ?? custom.get(id)
}

const EMOJI: [RegExp, string][] = [
  [/tortitas de avena/i, '🥞'], [/batido/i, '🥤'], [/porridge|avena/i, '🥣'], [/yogur|queso batido|bol de queso/i, '🥣'],
  [/tostad|sándwich/i, '🥪'], [/wrap|burrito/i, '🌯'], [/salmón|merluza/i, '🐟'], [/gamba/i, '🦐'],
  [/tortilla|revuelto|huevo/i, '🍳'], [/lenteja|garbanzo/i, '🫘'], [/pasta/i, '🍝'], [/tofu/i, '🍱'],
  [/wok|arroz/i, '🍚'], [/ensalada/i, '🥗'], [/lomo/i, '🥩'], [/pollo|pavo/i, '🍗'], [/manzana/i, '🍎'],
  [/hummus/i, '🧆'], [/crema/i, '🥣'], [/tortitas/i, '🍘'],
]

/** Emoji que identifica la receta de un vistazo en el planificador. */
export function recipeEmoji(recipe: Pick<Recipe, 'name'> | null | undefined): string {
  if (!recipe) return '🍽️'
  return EMOJI.find(([re]) => re.test(recipe.name))?.[1] ?? '🍽️'
}
