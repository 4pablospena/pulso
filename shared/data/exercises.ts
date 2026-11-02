import type { MuscleGroup } from '../core/strength'

export type Equipment = 'Barra' | 'Mancuernas' | 'Polea' | 'Máquina' | 'Peso corporal' | 'Kettlebell' | 'Barra EZ' | 'Otro'
export type Level = 'Principiante' | 'Intermedio' | 'Avanzado'

export interface Exercise {
  id: string
  name: string
  muscle: MuscleGroup
  secondary: MuscleGroup[]
  equipment: Equipment
  level: Level
  mechanic: 'Compuesto' | 'Aislamiento'
  /** Carpeta de imágenes (free-exercise-db, dominio público) en /public/exercises. */
  img: string
  reps: [number, number]
  restSec: number
  tips: string[]
  /** Se registra por tiempo (segundos) en lugar de repeticiones. */
  timed?: boolean
  bodyweight?: boolean
}

type Row = [id: string, name: string, muscle: MuscleGroup, secondary: MuscleGroup[], eq: Equipment, level: Level,
  mech: 'C' | 'A', img: string, reps: [number, number], rest: number, tips: string[], flags?: { timed?: boolean; bw?: boolean }]

const rows: Row[] = [
  // Pecho
  ['press-banca', 'Press banca', 'Pecho', ['Tríceps', 'Hombros'], 'Barra', 'Principiante', 'C', 'Barbell_Bench_Press_-_Medium_Grip', [5, 10], 150,
    ['Escápulas juntas y abajo, pies firmes en el suelo.', 'Baja la barra a la parte baja del pecho, codos a ~45°.']],
  ['press-inclinado-barra', 'Press inclinado con barra', 'Pecho', ['Hombros', 'Tríceps'], 'Barra', 'Principiante', 'C', 'Barbell_Incline_Bench_Press_-_Medium_Grip', [6, 10], 120,
    ['Banco a 30°: más inclinación carga más el hombro.', 'Toca la parte alta del pecho sin rebotar.']],
  ['press-mancuernas', 'Press con mancuernas', 'Pecho', ['Tríceps', 'Hombros'], 'Mancuernas', 'Principiante', 'C', 'Dumbbell_Bench_Press', [8, 12], 120,
    ['Baja hasta notar estiramiento en el pecho.', 'Junta las mancuernas arriba sin chocarlas.']],
  ['press-inclinado-mancuernas', 'Press inclinado con mancuernas', 'Pecho', ['Hombros', 'Tríceps'], 'Mancuernas', 'Principiante', 'C', 'Incline_Dumbbell_Press', [8, 12], 120,
    ['Banco a 30-45°.', 'Controla la bajada en 2-3 segundos.']],
  ['aperturas-mancuernas', 'Aperturas con mancuernas', 'Pecho', [], 'Mancuernas', 'Principiante', 'A', 'Dumbbell_Flyes', [10, 15], 75,
    ['Codos ligeramente flexionados y fijos.', 'Abre hasta notar estiramiento, no más.']],
  ['cruce-poleas', 'Cruce de poleas', 'Pecho', [], 'Polea', 'Principiante', 'A', 'Cable_Crossover', [12, 15], 60,
    ['Inclínate un poco hacia delante.', 'Junta las manos frente al pecho y aprieta 1 s.']],
  ['contractora', 'Contractora (pec deck)', 'Pecho', [], 'Máquina', 'Principiante', 'A', 'Butterfly', [12, 15], 60,
    ['Ajusta el asiento: manos a la altura del pecho.', 'Movimiento lento, sin soltar de golpe.']],
  ['fondos-pecho', 'Fondos (pecho)', 'Pecho', ['Tríceps', 'Hombros'], 'Peso corporal', 'Intermedio', 'C', 'Dips_-_Chest_Version', [6, 12], 120,
    ['Inclina el torso hacia delante.', 'Baja hasta que el hombro quede a la altura del codo.'], { bw: true }],
  ['flexiones', 'Flexiones', 'Pecho', ['Tríceps', 'Hombros', 'Core'], 'Peso corporal', 'Principiante', 'C', 'Pushups', [8, 20], 60,
    ['Cuerpo en línea recta, glúteos apretados.', 'Pecho casi al suelo en cada repetición.'], { bw: true }],
  ['press-suelo-mancuernas', 'Press en suelo con mancuernas', 'Pecho', ['Tríceps'], 'Mancuernas', 'Intermedio', 'C', 'Dumbbell_Floor_Press', [8, 12], 90,
    ['Ideal en casa sin banco.', 'Pausa breve con los codos en el suelo.']],

  // Espalda
  ['dominadas', 'Dominadas', 'Espalda', ['Bíceps'], 'Peso corporal', 'Intermedio', 'C', 'Pullups', [4, 10], 150,
    ['Empieza colgado con brazos estirados.', 'Lleva el pecho hacia la barra, no solo la barbilla.'], { bw: true }],
  ['dominadas-supinas', 'Dominadas supinas (chin-up)', 'Espalda', ['Bíceps'], 'Peso corporal', 'Principiante', 'C', 'Chin-Up', [4, 10], 150,
    ['Agarre con palmas hacia ti, al ancho de hombros.', 'Controla la bajada completa.'], { bw: true }],
  ['jalon-pecho', 'Jalón al pecho', 'Espalda', ['Bíceps'], 'Polea', 'Principiante', 'C', 'Wide-Grip_Lat_Pulldown', [8, 12], 90,
    ['Saca pecho y lleva la barra a la clavícula.', 'Piensa en bajar los codos, no en tirar con las manos.']],
  ['remo-barra', 'Remo con barra', 'Espalda', ['Bíceps', 'Isquios'], 'Barra', 'Principiante', 'C', 'Bent_Over_Barbell_Row', [6, 10], 120,
    ['Torso a ~45°, espalda neutra.', 'Lleva la barra al ombligo.']],
  ['remo-mancuerna', 'Remo con mancuerna a una mano', 'Espalda', ['Bíceps'], 'Mancuernas', 'Principiante', 'C', 'One-Arm_Dumbbell_Row', [8, 12], 90,
    ['Apoya mano y rodilla en el banco.', 'Tira del codo hacia la cadera.']],
  ['remo-polea', 'Remo en polea baja', 'Espalda', ['Bíceps'], 'Polea', 'Principiante', 'C', 'Seated_Cable_Rows', [8, 12], 90,
    ['Pecho fuera, no balancees el torso.', 'Junta escápulas al final.']],
  ['remo-invertido', 'Remo invertido', 'Espalda', ['Bíceps', 'Core'], 'Peso corporal', 'Principiante', 'C', 'Inverted_Row', [8, 15], 75,
    ['Cuerpo rígido como en una plancha.', 'Pecho a la barra.'], { bw: true }],
  ['peso-muerto', 'Peso muerto', 'Espalda', ['Isquios', 'Glúteos', 'Core'], 'Barra', 'Intermedio', 'C', 'Barbell_Deadlift', [3, 6], 180,
    ['Barra pegada a las piernas todo el recorrido.', 'Empuja el suelo con los pies; espalda neutra.']],
  ['hiperextensiones', 'Hiperextensiones', 'Espalda', ['Glúteos', 'Isquios'], 'Otro', 'Principiante', 'A', 'Hyperextensions_Back_Extensions', [12, 15], 60,
    ['Sube hasta alinear el cuerpo, sin hiperextender.', 'Añade un disco al pecho para progresar.']],
  ['superman', 'Superman', 'Espalda', ['Glúteos'], 'Peso corporal', 'Principiante', 'A', 'Superman', [12, 20], 45,
    ['Eleva brazos y piernas a la vez.', 'Mantén 1-2 s arriba.'], { bw: true }],
  ['encogimientos', 'Encogimientos con mancuernas', 'Espalda', [], 'Mancuernas', 'Principiante', 'A', 'Dumbbell_Shrug', [10, 15], 60,
    ['Sube los hombros hacia las orejas.', 'Sin girar los hombros.']],

  // Hombros
  ['press-militar', 'Press militar', 'Hombros', ['Tríceps', 'Core'], 'Barra', 'Principiante', 'C', 'Standing_Military_Press', [5, 10], 150,
    ['Glúteos y abdomen apretados.', 'Saca la cabeza hacia delante al pasar la barra.']],
  ['press-hombro-mancuernas', 'Press de hombro con mancuernas', 'Hombros', ['Tríceps'], 'Mancuernas', 'Principiante', 'C', 'Dumbbell_Shoulder_Press', [8, 12], 90,
    ['Sentado con respaldo vertical.', 'Baja hasta la altura de las orejas.']],
  ['press-arnold', 'Press Arnold', 'Hombros', ['Tríceps'], 'Mancuernas', 'Intermedio', 'C', 'Arnold_Dumbbell_Press', [8, 12], 90,
    ['Empieza con palmas hacia ti y gira al subir.', 'Movimiento continuo y controlado.']],
  ['elevaciones-laterales', 'Elevaciones laterales', 'Hombros', [], 'Mancuernas', 'Principiante', 'A', 'Side_Lateral_Raise', [12, 20], 60,
    ['Sube hasta la altura del hombro, no más.', 'Codos ligeramente flexionados, guía con el codo.']],
  ['pajaros', 'Pájaros (deltoides posterior)', 'Hombros', ['Espalda'], 'Mancuernas', 'Principiante', 'A', 'Reverse_Flyes', [12, 20], 60,
    ['Torso inclinado casi paralelo al suelo.', 'Abre los brazos sin juntar escápulas al máximo.']],
  ['face-pull', 'Face pull', 'Hombros', ['Espalda'], 'Polea', 'Intermedio', 'A', 'Face_Pull', [12, 20], 60,
    ['Polea a la altura de la cara con cuerda.', 'Tira hacia la frente separando las manos.']],

  // Brazos
  ['curl-barra', 'Curl con barra', 'Bíceps', [], 'Barra', 'Principiante', 'A', 'Barbell_Curl', [8, 12], 60,
    ['Codos pegados al cuerpo.', 'No balancees el torso.']],
  ['curl-mancuernas', 'Curl con mancuernas', 'Bíceps', [], 'Mancuernas', 'Principiante', 'A', 'Dumbbell_Bicep_Curl', [10, 15], 60,
    ['Gira la palma hacia arriba al subir.', 'Baja del todo en cada repetición.']],
  ['curl-martillo', 'Curl martillo', 'Bíceps', [], 'Mancuernas', 'Principiante', 'A', 'Hammer_Curls', [10, 15], 60,
    ['Palmas mirándose durante todo el movimiento.', 'Trabaja también el antebrazo.']],
  ['curl-inclinado', 'Curl inclinado', 'Bíceps', [], 'Mancuernas', 'Principiante', 'A', 'Incline_Dumbbell_Curl', [10, 12], 60,
    ['Banco a 45°, brazos colgando por detrás.', 'Gran estiramiento: usa menos peso.']],
  ['curl-predicador', 'Curl predicador', 'Bíceps', [], 'Barra EZ', 'Principiante', 'A', 'Preacher_Curl', [8, 12], 60,
    ['Axilas apoyadas en el banco.', 'No bloquees el codo abajo.']],
  ['extension-triceps-polea', 'Extensión de tríceps en polea', 'Tríceps', [], 'Polea', 'Principiante', 'A', 'Triceps_Pushdown_-_Rope_Attachment', [10, 15], 60,
    ['Codos fijos junto al costado.', 'Separa la cuerda abajo.']],
  ['press-frances', 'Press francés', 'Tríceps', [], 'Barra EZ', 'Intermedio', 'A', 'EZ-Bar_Skullcrusher', [8, 12], 75,
    ['Baja la barra hacia la frente.', 'Brazos verticales, solo se mueve el codo.']],
  ['press-cerrado', 'Press banca agarre cerrado', 'Tríceps', ['Pecho'], 'Barra', 'Principiante', 'C', 'Close-Grip_Barbell_Bench_Press', [6, 10], 120,
    ['Manos al ancho de hombros.', 'Codos pegados al cuerpo.']],
  ['fondos-triceps', 'Fondos de tríceps', 'Tríceps', ['Pecho'], 'Peso corporal', 'Principiante', 'C', 'Dips_-_Triceps_Version', [6, 12], 90,
    ['Torso vertical.', 'Codos hacia atrás, no hacia fuera.'], { bw: true }],
  ['fondos-banco', 'Fondos en banco', 'Tríceps', [], 'Peso corporal', 'Principiante', 'A', 'Bench_Dips', [10, 20], 60,
    ['Cadera cerca del banco.', 'Baja hasta 90° de codo.'], { bw: true }],
  ['patada-triceps', 'Patada de tríceps', 'Tríceps', [], 'Mancuernas', 'Principiante', 'A', 'Tricep_Dumbbell_Kickback', [12, 15], 45,
    ['Brazo paralelo al suelo y fijo.', 'Extiende y aprieta 1 s.']],

  // Piernas
  ['sentadilla', 'Sentadilla', 'Cuádriceps', ['Glúteos', 'Core'], 'Barra', 'Principiante', 'C', 'Barbell_Squat', [5, 10], 180,
    ['Rodillas en la dirección de los pies.', 'Baja al menos hasta paralelo con la espalda neutra.']],
  ['sentadilla-frontal', 'Sentadilla frontal', 'Cuádriceps', ['Glúteos', 'Core'], 'Barra', 'Avanzado', 'C', 'Front_Barbell_Squat', [4, 8], 180,
    ['Codos altos, barra sobre los hombros.', 'Torso muy vertical.']],
  ['sentadilla-goblet', 'Sentadilla goblet', 'Cuádriceps', ['Glúteos'], 'Kettlebell', 'Principiante', 'C', 'Goblet_Squat', [8, 15], 90,
    ['Pesa pegada al pecho.', 'Codos por dentro de las rodillas al bajar.']],
  ['sentadilla-aire', 'Sentadilla sin peso', 'Cuádriceps', ['Glúteos'], 'Peso corporal', 'Principiante', 'C', 'Bodyweight_Squat', [15, 30], 45,
    ['Brazos al frente para equilibrar.', 'Talones siempre en el suelo.'], { bw: true }],
  ['sentadilla-hack', 'Sentadilla hack', 'Cuádriceps', ['Glúteos'], 'Máquina', 'Principiante', 'C', 'Hack_Squat', [8, 12], 120,
    ['Pies a media plataforma.', 'Baja profundo y controlado.']],
  ['prensa', 'Prensa', 'Cuádriceps', ['Glúteos'], 'Máquina', 'Principiante', 'C', 'Leg_Press', [8, 15], 120,
    ['No despegues la zona lumbar del respaldo.', 'No bloquees las rodillas arriba.']],
  ['zancadas', 'Zancadas con mancuernas', 'Cuádriceps', ['Glúteos'], 'Mancuernas', 'Principiante', 'C', 'Dumbbell_Lunges', [8, 12], 90,
    ['Paso largo, rodilla trasera casi al suelo.', 'Torso erguido.']],
  ['sentadilla-bulgara', 'Sentadilla búlgara', 'Cuádriceps', ['Glúteos'], 'Mancuernas', 'Intermedio', 'C', 'Split_Squats', [8, 12], 90,
    ['Pie trasero apoyado en un banco.', 'Baja en vertical.']],
  ['step-up', 'Subidas al banco', 'Cuádriceps', ['Glúteos'], 'Mancuernas', 'Intermedio', 'C', 'Dumbbell_Step_Ups', [8, 12], 75,
    ['Empuja con la pierna de arriba, no con la de abajo.', 'Banco a la altura de la rodilla.']],
  ['extension-cuadriceps', 'Extensión de cuádriceps', 'Cuádriceps', [], 'Máquina', 'Principiante', 'A', 'Leg_Extensions', [12, 15], 60,
    ['Aprieta 1 s arriba.', 'Bajada lenta.']],
  ['peso-muerto-rumano', 'Peso muerto rumano', 'Isquios', ['Glúteos', 'Espalda'], 'Barra', 'Intermedio', 'C', 'Romanian_Deadlift', [6, 10], 120,
    ['Lleva la cadera atrás con rodillas casi rectas.', 'Baja hasta notar tensión en isquios.']],
  ['peso-muerto-sumo', 'Peso muerto sumo', 'Glúteos', ['Isquios', 'Cuádriceps', 'Espalda'], 'Barra', 'Intermedio', 'C', 'Sumo_Deadlift', [3, 6], 180,
    ['Pies muy abiertos, agarre por dentro.', 'Rodillas hacia fuera.']],
  ['curl-femoral', 'Curl femoral tumbado', 'Isquios', [], 'Máquina', 'Principiante', 'A', 'Lying_Leg_Curls', [10, 15], 60,
    ['Cadera pegada al banco.', 'Controla la bajada.']],
  ['hip-thrust', 'Hip thrust', 'Glúteos', ['Isquios'], 'Barra', 'Intermedio', 'C', 'Barbell_Hip_Thrust', [8, 12], 90,
    ['Espalda alta apoyada en el banco.', 'Aprieta glúteo arriba, barbilla al pecho.']],
  ['puente-gluteo', 'Puente de glúteo', 'Glúteos', ['Isquios'], 'Barra', 'Principiante', 'C', 'Barbell_Glute_Bridge', [10, 15], 75,
    ['Desde el suelo, talones cerca de los glúteos.', 'Pausa arriba.']],
  ['puente-una-pierna', 'Puente de glúteo a una pierna', 'Glúteos', ['Isquios'], 'Peso corporal', 'Principiante', 'A', 'Single_Leg_Glute_Bridge', [10, 15], 45,
    ['Pierna libre estirada.', 'Cadera nivelada.'], { bw: true }],
  ['gemelos-pie', 'Gemelos de pie', 'Gemelos', [], 'Máquina', 'Principiante', 'A', 'Standing_Calf_Raises', [10, 20], 60,
    ['Estira abajo del todo.', 'Pausa arriba de 1 s.']],
  ['gemelos-sentado', 'Gemelos sentado', 'Gemelos', [], 'Máquina', 'Principiante', 'A', 'Seated_Calf_Raise', [12, 20], 60,
    ['Trabaja el sóleo.', 'Recorrido completo.']],

  // Core
  ['plancha', 'Plancha', 'Core', [], 'Peso corporal', 'Principiante', 'A', 'Plank', [30, 60], 45,
    ['Codos bajo los hombros.', 'Aprieta glúteos y abdomen, no hundas la cadera.'], { timed: true, bw: true }],
  ['plancha-lateral', 'Plancha lateral', 'Core', [], 'Peso corporal', 'Principiante', 'A', 'Side_Bridge', [20, 45], 45,
    ['Cuerpo en línea.', 'Cambia de lado en cada serie.'], { timed: true, bw: true }],
  ['dead-bug', 'Dead bug', 'Core', [], 'Peso corporal', 'Principiante', 'A', 'Dead_Bug', [8, 12], 45,
    ['Zona lumbar pegada al suelo.', 'Brazo y pierna contrarios.'], { bw: true }],
  ['crunch-polea', 'Crunch en polea', 'Core', [], 'Polea', 'Principiante', 'A', 'Cable_Crunch', [10, 15], 60,
    ['De rodillas, cuerda junto a la cabeza.', 'Flexiona el tronco, no la cadera.']],
  ['elevacion-piernas', 'Elevación de piernas colgado', 'Core', [], 'Peso corporal', 'Avanzado', 'A', 'Hanging_Leg_Raise', [6, 12], 60,
    ['Sin balanceo.', 'Sube piernas y pelvis.'], { bw: true }],
  ['giros-rusos', 'Giros rusos', 'Core', [], 'Peso corporal', 'Intermedio', 'A', 'Russian_Twist', [12, 20], 45,
    ['Pies elevados para más dificultad.', 'Gira el tronco, no solo los brazos.'], { bw: true }],
  ['rueda-abdominal', 'Rueda abdominal', 'Core', ['Hombros'], 'Otro', 'Intermedio', 'A', 'Ab_Roller', [6, 12], 60,
    ['Empieza de rodillas.', 'No dejes caer la cadera.'], { bw: true }],
  ['bicicleta', 'Crunch bicicleta', 'Core', [], 'Peso corporal', 'Principiante', 'A', 'Air_Bike', [12, 20], 45,
    ['Codo hacia rodilla contraria.', 'Ritmo controlado.'], { bw: true }],

  // Full body y acondicionamiento
  ['swing-kettlebell', 'Swing con kettlebell', 'Full body', ['Glúteos', 'Isquios', 'Core'], 'Kettlebell', 'Intermedio', 'C', 'One-Arm_Kettlebell_Swings', [12, 20], 60,
    ['El impulso sale de la cadera, no de los brazos.', 'Glúteos fuertes arriba.']],
  ['thruster-kettlebell', 'Thruster con kettlebell', 'Full body', ['Cuádriceps', 'Hombros'], 'Kettlebell', 'Intermedio', 'C', 'Kettlebell_Thruster', [8, 12], 90,
    ['Sentadilla y empuje en un solo gesto.', 'Usa el impulso de las piernas.']],
  ['paseo-granjero', 'Paseo del granjero', 'Full body', ['Core', 'Espalda'], 'Mancuernas', 'Intermedio', 'C', 'Farmers_Walk', [30, 60], 90,
    ['Hombros atrás y abajo.', 'Pasos cortos y rápidos.'], { timed: true }],
  ['escaladores', 'Escaladores', 'Full body', ['Core'], 'Peso corporal', 'Principiante', 'C', 'Mountain_Climbers', [20, 45], 45,
    ['Cadera baja, ritmo alto.', 'Rodilla al pecho.'], { timed: true, bw: true }],
  ['salto-cajon', 'Salto al cajón', 'Full body', ['Cuádriceps', 'Glúteos'], 'Otro', 'Principiante', 'C', 'Front_Box_Jump', [5, 10], 90,
    ['Aterriza suave con rodillas flexionadas.', 'Baja andando, no saltando.'], { bw: true }],
  ['cuerdas-batida', 'Cuerdas de batida', 'Full body', ['Hombros', 'Core'], 'Otro', 'Principiante', 'C', 'Battling_Ropes', [20, 40], 60,
    ['Rodillas flexionadas, core firme.', 'Ondas continuas.'], { timed: true }],
  ['remo-ergometro', 'Remo ergómetro', 'Full body', ['Espalda', 'Cuádriceps'], 'Máquina', 'Intermedio', 'C', 'Rowing_Stationary', [300, 900], 120,
    ['Piernas, luego cadera, luego brazos.', 'Vuelta en orden inverso.'], { timed: true }],
]

export const EXERCISE_DB: Exercise[] = rows.map(([id, name, muscle, secondary, equipment, level, mech, img, reps, restSec, tips, flags]) => ({
  id, name, muscle, secondary, equipment, level, mechanic: mech === 'C' ? 'Compuesto' : 'Aislamiento', img, reps, restSec, tips,
  timed: flags?.timed, bodyweight: flags?.bw,
}))

const byId = new Map(EXERCISE_DB.map((e) => [e.id, e]))
export function exerciseById(id: string): Exercise | undefined {
  return byId.get(id)
}

export const EQUIPMENT: Equipment[] = ['Barra', 'Mancuernas', 'Polea', 'Máquina', 'Peso corporal', 'Kettlebell', 'Barra EZ', 'Otro']
