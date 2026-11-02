<script setup lang="ts">
import { duration } from '#shared/core/format'
import { exerciseHistory, isRecord, personalRecords } from '#shared/core/progress'
import { bestOneRepMax, platesPerSide, volume } from '#shared/core/strength'
import { exerciseById, type Exercise } from '#shared/data/exercises'
import type { SessionExercise, StrengthSession } from '#shared/types'

const route = useRoute()
const router = useRouter()
const { show } = useToast()
const id = route.params.id as string
const { data: sessions } = useFetch<StrengthSession[]>('/api/sessions', { key: 'sessions', default: () => [] })
const session = ref<StrengthSession | null>(null)
watch(sessions, (list) => { session.value ??= structuredClone(toRaw(list.find((s) => s.id === id)) ?? null) }, { immediate: true })

const now = useNow(1000)
const finished = computed(() => !!session.value?.end)
const elapsed = computed(() => session.value ? ((session.value.end ?? now.value) - session.value.start) / 1000 : 0)
const doneSets = computed(() => session.value?.exercises.flatMap((e) => e.sets.filter((s) => s.done)) ?? [])
const restEnds = ref<number | null>(null)
const restLeft = computed(() => (restEnds.value ? Math.max(0, (restEnds.value - now.value) / 1000) : 0))
watch(restLeft, (left) => { if (restEnds.value && left === 0) { restEnds.value = null; navigator.vibrate?.(300) } })

/** Historial previo (sin esta sesión) de cada ejercicio, para "la última vez" y los récords. */
const previous = computed(() => {
  const others = sessions.value.filter((s) => s.id !== id && s.start < (session.value?.start ?? Infinity))
  return new Map(session.value?.exercises.map((e) => {
    const h = exerciseHistory(others, e.exerciseId)
    return [e.exerciseId, { last: h.at(-1), records: personalRecords(h) }]
  }))
})
const lastText = (e: SessionExercise) => {
  const last = previous.value.get(e.exerciseId)?.last
  if (!last) return 'Primera vez'
  return `Última vez: ${last.sets.map((s) => (e.timed ? `${s.reps}s` : s.weightKg ? `${s.reps}×${s.weightKg}` : `${s.reps}`)).join(' · ')}`
}

// Guarda solo, 600 ms después del último cambio.
let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(session, (s, old) => {
  if (!s || !old || finished.value) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => $fetch(`/api/sessions/${id}`, { method: 'PUT', body: s }), 600)
}, { deep: true })

function toggle(ei: number, si: number) {
  const ex = session.value!.exercises[ei]!
  const set = ex.sets[si]!
  set.done = !set.done
  if (!set.done) return
  // En superserie no se descansa: se pasa directamente al siguiente ejercicio.
  if (ex.superset && session.value!.exercises[ei + 1]) {
    show(`Superserie: ahora ${session.value!.exercises[ei + 1]!.name}`)
    return
  }
  restEnds.value = Date.now() + ex.restSec * 1000
  // Aviso push al terminar el descanso, por si apagas la pantalla.
  $fetch('/api/push/rest', { method: 'POST', body: { at: restEnds.value, sessionId: id } }).catch(() => {})
  const records = previous.value.get(ex.exerciseId)?.records
  if (!ex.timed && records && set.weightKg > 0 && isRecord(set, records)) show(`Nuevo récord en ${ex.name}`)
}

function addSet(ei: number) {
  const sets = session.value!.exercises[ei]!.sets
  const last = sets.at(-1)
  sets.push({ reps: last?.reps ?? 10, weightKg: last?.weightKg ?? 0, rpe: null, done: false })
}

const picking = ref(false)
async function addExercise(ex: Exercise) {
  if (session.value!.exercises.some((e) => e.exerciseId === ex.id)) return
  session.value!.exercises.push(await $fetch<SessionExercise>('/api/sessions/exercise', { method: 'POST', body: { exerciseId: ex.id } }))
  picking.value = false
}

const finishing = ref(false)
async function finish() {
  finishing.value = true
  clearTimeout(saveTimer)
  await $fetch(`/api/sessions/${id}`, { method: 'PUT', body: session.value })
  const { stravaError, session: saved } = await $fetch<{ session: StrengthSession; stravaError: string | null }>(`/api/sessions/${id}/finish`, { method: 'POST' })
  await Promise.all([refreshNuxtData('sessions'), refreshToday()])
  show(stravaError ? `Guardado. Strava: ${stravaError}` : saved.stravaId ? 'Guardado y subido a Strava' : 'Entreno guardado')
  router.replace('/entreno?tab=progress')
}

async function discard() {
  if (!confirm('¿Descartar este entreno?')) return
  clearTimeout(saveTimer)
  await $fetch(`/api/sessions/${id}`, { method: 'DELETE' })
  await refreshNuxtData('sessions')
  router.replace('/entreno')
}

const RPES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10]

// Calculadora de discos
const plateFor = ref<SessionExercise | null>(null)
const plateTarget = ref(60)
const bar = ref(20)
function openPlates(ex: SessionExercise) {
  plateFor.value = ex
  plateTarget.value = ex.sets.find((s) => !s.done)?.weightKg || ex.sets.at(-1)?.weightKg || 60
}
const loadout = computed(() => platesPerSide(plateTarget.value, bar.value))
const PLATE_COLOR: Record<number, string> = { 25: 'var(--red)', 20: 'var(--blue)', 15: 'var(--yellow)', 10: 'var(--green)', 5: '#e5e5ea', 2.5: '#8e8e93', 1.25: '#636366' }
const usesBarbell = (ex: SessionExercise) => ['Barra', 'Barra EZ'].includes(exerciseById(ex.exerciseId)?.equipment ?? '')
</script>

<template>
  <main v-if="session" class="page">
    <header class="row between">
      <button class="muted" @click="finished ? router.back() : discard()">{{ finished ? '‹ Volver' : 'Descartar' }}</button>
      <strong>{{ session.title }}</strong>
      <button v-if="!finished" style="color: var(--strength); font-weight: 700" :disabled="!doneSets.length || finishing" @click="finish">
        {{ finishing ? 'Guardando…' : 'Terminar' }}
      </button>
      <span v-else />
    </header>

    <section class="card">
      <div class="row" style="gap: 26px">
        <UiMetric label="Duración" :value="duration(elapsed)" color="var(--strength)" />
        <UiMetric label="Volumen" :value="Math.round(volume(doneSets)).toLocaleString('es-ES')" unit="kg" />
        <UiMetric label="Series" :value="`${doneSets.length}/${session.exercises.reduce((n, e) => n + e.sets.length, 0)}`" />
      </div>
    </section>

    <section v-for="(ex, ei) in session.exercises" :key="ex.exerciseId" class="card"
             :class="{ 'ss-top': ex.superset && session.exercises[ei + 1], 'ss-bottom': ei > 0 && session.exercises[ei - 1]?.superset }">
      <span v-if="ex.superset && session.exercises[ei + 1]" class="ss-badge">Superserie</span>
      <div class="row">
        <ExerciseThumb :img="exerciseById(ex.exerciseId)?.img ?? ''" :size="48" />
        <NuxtLink :to="`/ejercicios/${ex.exerciseId}`" class="grow">
          <div style="font-weight: 800; font-size: 17px">{{ ex.name }}</div>
          <div class="small" style="color: var(--strength); font-weight: 600">{{ ex.muscle }} · {{ ex.reps[0] }}–{{ ex.reps[1] }} {{ ex.timed ? 's' : 'reps' }}</div>
        </NuxtLink>
        <span v-if="!ex.timed && bestOneRepMax(ex.sets.filter((s) => s.done && s.weightKg > 0))" class="small" style="color: var(--exercise); font-weight: 700">
          1RM ≈ {{ Math.round(bestOneRepMax(ex.sets.filter((s) => s.done))) }}
        </span>
      </div>
      <div class="muted small">{{ lastText(ex) }}</div>
      <div class="list">
        <div class="set-head muted small"><span>#</span><span>kg</span><span>{{ ex.timed ? 'seg' : 'reps' }}</span><span>RPE</span><span /></div>
        <div v-for="(set, si) in ex.sets" :key="si" class="set-row" :class="{ done: set.done }">
          <span class="muted">{{ si + 1 }}</span>
          <input v-model.number="set.weightKg" class="field num" type="number" inputmode="decimal" step="0.5" :disabled="finished" :placeholder="ex.timed ? '–' : '0'">
          <input v-model.number="set.reps" class="field num" type="number" inputmode="numeric" :disabled="finished">
          <select v-model="set.rpe" class="field num" :disabled="finished">
            <option :value="null">–</option>
            <option v-for="r in RPES" :key="r" :value="r">{{ r }}</option>
          </select>
          <button class="check" :class="{ on: set.done }" :disabled="finished" :aria-label="`Serie ${si + 1} hecha`" @click="toggle(ei, si)">
            <AppIcon v-if="set.done" name="check" :size="16" />
          </button>
        </div>
      </div>
      <div v-if="!finished" class="row between wrap">
        <button class="row tint footnote" style="gap: 4px" @click="addSet(ei)"><AppIcon name="plus" :size="16" :weight="2.4" /> Serie</button>
        <button v-if="usesBarbell(ex)" class="footnote tint" @click="openPlates(ex)">Discos</button>
        <button v-if="session.exercises[ei + 1]" class="footnote" :class="ex.superset ? 'tint' : 'muted'" @click="ex.superset = !ex.superset">
          {{ ex.superset ? 'Quitar superserie' : 'Superserie con el siguiente' }}
        </button>
        <button class="muted footnote" @click="session.exercises.splice(ei, 1)">Quitar</button>
      </div>
    </section>

    <button v-if="!finished" class="btn ghost" style="--accent: var(--strength)" @click="picking = true"><AppIcon name="plus" /> Añadir ejercicio</button>

    <div v-if="restEnds" class="rest">
      <AppIcon name="timer" /> <span class="grow">Descanso {{ duration(restLeft) }}</span>
      <button class="chip" @click="restEnds += 30_000; $fetch('/api/push/rest', { method: 'POST', body: { at: restEnds, sessionId: id } }).catch(() => {})">+30 s</button>
      <button class="chip" @click="restEnds = null; $fetch('/api/push/rest', { method: 'POST', body: { at: null } }).catch(() => {})">Saltar</button>
    </div>

    <div v-if="plateFor" class="sheet-backdrop" @click.self="plateFor = null">
      <div class="sheet" role="dialog" aria-label="Calculadora de discos">
        <div class="sheet-handle" />
        <div class="sheet-bar"><span /><strong>Discos · {{ plateFor.name }}</strong><button @click="plateFor = null">OK</button></div>
        <div class="group">
          <div class="list">
            <label class="list-row">
              <span class="grow">Peso total</span>
              <input v-model.number="plateTarget" type="number" inputmode="decimal" step="2.5" class="plate-input">
              <span class="muted">kg</span>
            </label>
            <div class="list-row">
              <span class="grow">Barra</span>
              <div class="segmented" style="width: 170px">
                <button v-for="b in [20, 15, 10]" :key="b" :class="{ on: bar === b }" @click="bar = b">{{ b }} kg</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card bar-visual">
          <span class="footnote muted">Por cada lado</span>
          <div class="plates">
            <span class="sleeve" />
            <span v-for="(p, i) in loadout.plates" :key="i" class="plate" :style="{ background: PLATE_COLOR[p], height: `${30 + p * 2.4}px` }">{{ p }}</span>
            <span v-if="!loadout.plates.length" class="footnote muted">Solo la barra</span>
          </div>
          <span v-if="loadout.rest" class="footnote" style="color: var(--orange)">Faltan {{ loadout.rest }} kg que no se pueden cargar con discos estándar.</span>
        </div>
      </div>
    </div>

    <ExercisePicker v-if="picking" :selected="session.exercises.map((e) => e.exerciseId)" @pick="addExercise" @close="picking = false" />
  </main>
  <main v-else class="page"><p class="muted">Cargando…</p></main>
</template>

<style scoped>
.ss-top { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; box-shadow: inset 3px 0 0 var(--tint); margin-bottom: -16px; }
.ss-bottom { border-top-left-radius: 4px; border-top-right-radius: 4px; box-shadow: inset 3px 0 0 var(--tint); }
.ss-badge { align-self: flex-start; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--tint); letter-spacing: 0.3px; }
.plate-input { width: 80px; text-align: right; background: none; border: 0; outline: none; font-size: 17px; color: var(--text); }
.bar-visual { gap: 10px; }
.plates { display: flex; align-items: center; gap: 3px; min-height: 96px; }
.sleeve { width: 48px; height: 10px; border-radius: 3px; background: #aeaeb2; }
.plate { width: 22px; border-radius: 4px; display: grid; place-items: center; writing-mode: vertical-rl; font-size: 11px; font-weight: 700; color: #000; }
.set-head, .set-row { display: grid; grid-template-columns: 24px 1fr 1fr 1fr 32px; align-items: center; gap: 8px; padding: 8px 0; }
.set-row .num { width: 100%; }
.set-row.done { opacity: 0.7; }
.rest {
  position: fixed; left: 16px; right: 16px; bottom: calc(var(--tabbar) + 12px); max-width: 608px; margin: 0 auto; z-index: 35;
  display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 18px;
  background: rgba(44, 44, 46, 0.95); backdrop-filter: blur(20px); font-weight: 700; font-variant-numeric: tabular-nums;
}
</style>
