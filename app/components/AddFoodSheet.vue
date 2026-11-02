<script setup lang="ts">
import { scaleMacros } from '#shared/core/energy'
import type { FoodCandidate, FoodEntry, MealSlot } from '#shared/types'

const props = defineProps<{ slot: MealSlot; date?: string }>()
const emit = defineEmits<{ close: [] }>()
const { show } = useToast()

type Mode = 'search' | 'photo' | 'barcode' | 'quick'
const mode = ref<Mode>('search')

// Búsqueda por nombre (básicos de la app + Open Food Facts)
const query = ref('')
const results = ref<(FoodCandidate & { origin: string })[]>([])
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(searchTimer)
  if (q.trim().length < 2) { results.value = []; return }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try { results.value = await $fetch('/api/food/search', { query: { q } }) } catch { results.value = [] }
    searching.value = false
  }, 350)
})
function pick(food: FoodCandidate) {
  candidates.value.push({ name: food.name, grams: food.grams, macros: { ...food.macros } })
  source.value = 'manual'
  show(`${food.name} añadido`)
}
const candidates = ref<FoodCandidate[]>([])
const source = ref<FoodEntry['source']>('manual')
const busy = ref(false)
const error = ref<string | null>(null)
const preview = ref<string | null>(null)
const barcode = ref('')
const scanning = ref(false)
const video = ref<HTMLVideoElement>()
let stopScan: (() => void) | null = null

/** Reduce la foto a 1568 px de lado: suficiente para la visión y mucho más ligera. */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1568 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await run(async () => {
    const image = await toDataUrl(file)
    preview.value = image
    candidates.value = await $fetch<FoodCandidate[]>('/api/food/vision', { method: 'POST', body: { image } })
    source.value = 'photo'
  })
}

async function lookup(code = barcode.value) {
  if (!code) return
  await run(async () => {
    candidates.value = [await $fetch<FoodCandidate>(`/api/food/barcode/${code}`)]
    source.value = 'barcode'
  })
}

async function startScan() {
  error.value = null
  scanning.value = true
  await nextTick()
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  try {
    const controls = await new BrowserMultiFormatReader().decodeFromVideoDevice(undefined, video.value!, (result) => {
      if (!result) return
      barcode.value = result.getText()
      stopScanning()
      lookup()
    })
    stopScan = () => controls.stop()
  } catch {
    scanning.value = false
    error.value = 'No se pudo abrir la cámara. Escribe el código a mano.'
  }
}

function stopScanning() {
  stopScan?.()
  stopScan = null
  scanning.value = false
}

async function run(task: () => Promise<void>) {
  busy.value = true
  error.value = null
  try { await task() } catch (e: any) { error.value = e?.data?.message ?? e?.message ?? 'Algo ha fallado' }
  finally { busy.value = false }
}

function setGrams(i: number, grams: number) {
  const c = candidates.value[i]!
  if (!grams || !c.grams) return
  candidates.value[i] = { ...c, grams, macros: scaleMacros(c.macros, grams / c.grams) }
}

async function save() {
  await $fetch('/api/foods', { method: 'POST', body: { slot: props.slot, source: source.value, items: candidates.value, date: props.date } })
  await refreshToday()
  show(`${candidates.value.length} alimento(s) en ${props.slot}`)
  emit('close')
}

watch(mode, stopScanning)
onBeforeUnmount(stopScanning)

/** Raciones típicas del mapeo de ingredientes clave (valores orientativos Hacendado). */
const QUICK: FoodCandidate[] = [
  ['Queso fresco batido 0%', 250, 115, 20, 9, 0.5], ['Pechuga de pollo a la plancha', 150, 165, 35, 0, 2.5],
  ['Huevos L (2 uds)', 120, 170, 15, 1, 12], ['Claras de huevo líquidas', 200, 100, 22, 1.5, 0.4],
  ['Copos de avena integrales', 50, 186, 7, 30, 3.5], ['Arroz basmati cocido', 200, 260, 5, 57, 0.6],
  ['Plátano', 120, 107, 1.3, 24, 0.4], ['Atún al natural (lata)', 56, 60, 14, 0, 0.5],
  ['Salmón fresco', 150, 300, 30, 0, 20], ['Crema de cacahuete 100%', 20, 120, 5, 3, 10],
  ['Yogur griego light', 125, 75, 7, 5, 3], ['Pasta integral cocida', 200, 300, 12, 58, 2],
  ['Almendras al natural', 30, 180, 6.5, 2.5, 15.5], ['Aceite de oliva virgen extra', 10, 90, 0, 0, 10],
].map(([name, grams, kcal, protein, carbs, fat]) => ({
  name: name as string, grams: grams as number,
  macros: { kcal: kcal as number, protein: protein as number, carbs: carbs as number, fat: fat as number },
}))
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-handle" />
      <div class="sheet-bar">
        <button @click="emit('close')">Cancelar</button>
        <strong>Añadir a {{ slot }}</strong>
        <button :disabled="!candidates.length" @click="save">
          Guardar<template v-if="candidates.length"> ({{ candidates.length }})</template>
        </button>
      </div>

      <div class="segmented">
        <button :class="{ on: mode === 'search' }" @click="mode = 'search'">Buscar</button>
        <button :class="{ on: mode === 'photo' }" @click="mode = 'photo'">Foto</button>
        <button :class="{ on: mode === 'barcode' }" @click="mode = 'barcode'">Código</button>
        <button :class="{ on: mode === 'quick' }" @click="mode = 'quick'">Rápido</button>
      </div>

      <section v-if="mode === 'search'" class="section">
        <div class="search-box">
          <AppIcon name="search" :size="16" class="muted" />
          <input v-model="query" placeholder="Pechuga, yogur griego, Hacendado…" aria-label="Buscar alimento" autofocus>
        </div>
        <div v-if="results.length" class="group">
          <div class="list">
            <button v-for="(f, i) in results" :key="i" class="list-row" @click="pick(f)">
              <span class="stack grow">
                <span class="ellipsis">{{ f.name }}</span>
                <span class="footnote muted">{{ f.grams }} g · {{ Math.round(f.macros.kcal) }} kcal · P {{ Math.round(f.macros.protein) }} g · {{ f.origin }}</span>
              </span>
              <AppIcon name="plus" :size="18" :weight="2.4" class="tint" />
            </button>
          </div>
        </div>
        <p v-else class="section-footer">{{ searching ? 'Buscando…' : query.trim().length >= 2 ? 'Sin resultados.' : 'Busca entre los básicos de la app y miles de productos de Open Food Facts.' }}</p>
      </section>

      <section v-else-if="mode === 'photo'" class="card">
        <label class="btn" style="--accent: var(--exercise)">
          <AppIcon name="camera" /> Hacer o elegir foto del plato
          <input type="file" accept="image/*" capture="environment" hidden @change="onPhoto">
        </label>
        <img v-if="preview" :src="preview" alt="Foto del plato" class="preview">
        <p class="muted small" style="margin: 0">La cámara inteligente identifica cada alimento y estima ración y macros. Ajusta los gramos antes de guardar.</p>
      </section>

      <section v-else-if="mode === 'barcode'" class="card">
        <video v-show="scanning" ref="video" class="preview" muted playsinline />
        <button v-if="!scanning" class="btn" @click="startScan"><AppIcon name="barcode" /> Escanear código de barras</button>
        <button v-else class="btn ghost" @click="stopScanning">Detener cámara</button>
        <form class="row" @submit.prevent="lookup()">
          <input v-model="barcode" class="field" inputmode="numeric" placeholder="Código EAN">
          <button class="btn small" :disabled="!barcode">Buscar</button>
        </form>
        <p class="muted small" style="margin: 0">Datos de Open Food Facts, con miles de productos Hacendado.</p>
      </section>

      <section v-else class="card">
        <h2 class="card-title">Básicos Mercadona</h2>
        <div class="list">
          <button v-for="f in QUICK" :key="f.name" class="list-row" style="text-align: left"
                  @click="candidates.push({ ...f }); source = 'manual'">
            <span class="grow">{{ f.name }}</span>
            <span class="muted small">{{ f.grams }} g · {{ f.macros.kcal }} kcal</span>
            <AppIcon :name="candidates.some((c) => c.name === f.name) ? 'check' : 'plus'" style="color: var(--exercise)" />
          </button>
        </div>
      </section>

      <p v-if="busy" class="muted">Analizando…</p>
      <p v-if="error" style="color: var(--move); margin: 0">{{ error }}</p>

      <section v-if="candidates.length" class="card">
        <h2 class="card-title">Revisar</h2>
        <div class="list">
          <div v-for="(c, i) in candidates" :key="i" class="list-row">
            <div class="grow">
              <input v-model="c.name" class="field" style="padding: 8px 10px">
              <div class="muted small" style="margin-top: 4px">
                P {{ Math.round(c.macros.protein) }} · C {{ Math.round(c.macros.carbs) }} · G {{ Math.round(c.macros.fat) }}
              </div>
            </div>
            <input class="field num" type="number" inputmode="decimal" :value="c.grams" @change="setGrams(i, Number(($event.target as HTMLInputElement).value))">
            <span class="muted small">g</span>
            <strong style="color: var(--move); width: 48px; text-align: right">{{ c.macros.kcal }}</strong>
            <button class="muted" aria-label="Quitar" @click="candidates.splice(i, 1)"><AppIcon name="close" /></button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.search-box { display: flex; align-items: center; gap: 6px; background: var(--fill); border-radius: 10px; padding: 0 10px; height: 36px; }
.search-box input { flex: 1; background: none; border: 0; outline: none; font-size: 17px; }
.preview { width: 100%; max-height: 260px; object-fit: cover; border-radius: 14px; background: #000; }
</style>
