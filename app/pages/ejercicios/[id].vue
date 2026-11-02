<script setup lang="ts">
import { exerciseHistory, personalRecords } from '#shared/core/progress'
import { exerciseById } from '#shared/data/exercises'
import type { Routine, StrengthSession } from '#shared/types'

const route = useRoute()
const ex = exerciseById(route.params.id as string)
if (!ex) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado' })

const { show } = useToast()
const { data: sessions } = useFetch<StrengthSession[]>('/api/sessions', { key: 'sessions', default: () => [] })
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })
const history = computed(() => exerciseHistory(sessions.value, ex.id))
const records = computed(() => personalRecords(history.value))
const unit = ex.timed ? 's' : 'reps'

const addingTo = ref(false)
async function addToRoutine(r: Routine) {
  if (r.items.some((i) => i.exerciseId === ex!.id)) return show(`Ya está en ${r.name}`)
  await $fetch('/api/routines', { method: 'POST', body: { ...r, items: [...r.items, { exerciseId: ex!.id, sets: 3, reps: ex!.reps, restSec: ex!.restSec }] } })
  await refreshNuxtData('routines')
  addingTo.value = false
  show(`Añadido a ${r.name}`)
}

const date = (t: number) => new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
</script>

<template>
  <main v-if="ex" class="page">
    <header>
      <a class="muted small" href="#" @click.prevent="$router.back()">‹ Volver</a>
      <h1 class="title" style="font-size: 28px">{{ ex.name }}</h1>
      <div class="row wrap" style="gap: 6px; margin-top: 6px">
        <span class="chip" style="color: var(--strength)">{{ ex.muscle }}</span>
        <span v-for="m in ex.secondary" :key="m" class="chip muted">{{ m }}</span>
        <span class="chip muted">{{ ex.equipment }}</span>
        <span class="chip muted">{{ ex.level }}</span>
      </div>
    </header>

    <ExerciseThumb :img="ex.img" animate />

    <section class="card">
      <h2 class="card-title">Técnica</h2>
      <ul class="tips">
        <li v-for="t in ex.tips" :key="t">{{ t }}</li>
      </ul>
      <div class="row small muted" style="gap: 16px">
        <span>{{ ex.mechanic }}</span>
        <span>{{ ex.reps[0] }}–{{ ex.reps[1] }} {{ unit }}</span>
        <span>Descanso {{ ex.restSec }} s</span>
      </div>
      <button class="btn ghost" style="--accent: var(--strength)" @click="addingTo = true"><AppIcon name="plus" /> Añadir a una rutina</button>
    </section>

    <section class="card">
      <h2 class="card-title" style="color: var(--exercise)">Tus récords</h2>
      <div v-if="history.length" class="records">
        <UiMetric v-if="!ex.timed" label="1RM estimado" :value="Math.round(records.best1RM)" unit="kg" color="var(--exercise)" />
        <UiMetric v-if="!ex.timed && !ex.bodyweight" label="Peso máximo" :value="records.maxWeight" unit="kg" />
        <UiMetric :label="ex.timed ? 'Mejor tiempo' : 'Más reps'" :value="records.maxReps" :unit="unit" />
        <UiMetric v-if="!ex.bodyweight && !ex.timed" label="Mejor volumen" :value="Math.round(records.maxVolume).toLocaleString('es-ES')" unit="kg" />
      </div>
      <p v-else class="muted small" style="margin: 0">Aún no lo has entrenado. Tus marcas aparecerán aquí.</p>
    </section>

    <section v-if="history.length > 1 && !ex.timed && !ex.bodyweight" class="card">
      <h2 class="card-title">Progreso del 1RM</h2>
      <LineChart :points="history.map((h) => ({ t: h.date, v: h.best1RM }))" color="var(--exercise)" />
    </section>

    <section v-if="history.length" class="card">
      <h2 class="card-title">Historial</h2>
      <div class="list">
        <div v-for="h in [...history].reverse()" :key="h.sessionId" class="list-row">
          <span class="muted small" style="width: 54px">{{ date(h.date) }}</span>
          <span class="grow small">{{ h.sets.map((s) => ex!.timed ? `${s.reps}s` : s.weightKg ? `${s.reps}×${s.weightKg}` : `${s.reps}`).join(' · ') }}</span>
          <strong v-if="!ex.timed && h.best1RM" class="small" style="color: var(--exercise)">{{ Math.round(h.best1RM) }} kg</strong>
        </div>
      </div>
    </section>

    <div v-if="addingTo" class="sheet-backdrop" @click.self="addingTo = false">
      <div class="sheet">
        <div class="sheet-handle" />
        <strong>¿A qué rutina?</strong>
        <div class="list">
          <button v-for="r in routines" :key="r.id" class="list-row" style="text-align: left" @click="addToRoutine(r)">
            <span class="grow">{{ r.name }}</span><span class="muted small">{{ r.items.length }} ejercicios</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.tips { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; line-height: 1.4; }
.records { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
</style>
