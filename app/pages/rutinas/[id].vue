<script setup lang="ts">
import { exerciseById, type Exercise } from '#shared/data/exercises'
import type { Routine } from '#shared/types'

const route = useRoute()
const router = useRouter()
const { show } = useToast()
const isNew = route.params.id === 'nueva'
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })

const routine = ref<Routine | null>(isNew ? { id: '', name: '', description: '', items: [] } : null)
watch(routines, (list) => {
  if (!routine.value) routine.value = structuredClone(toRaw(list.find((r) => r.id === route.params.id)) ?? null)
}, { immediate: true })

const picking = ref(false)
function add(ex: Exercise) {
  if (routine.value!.items.some((i) => i.exerciseId === ex.id)) return
  routine.value!.items.push({ exerciseId: ex.id, sets: 3, reps: [...ex.reps], restSec: ex.restSec })
  show(`${ex.name} añadido`)
}

function move(i: number, delta: number) {
  const items = routine.value!.items
  const j = i + delta
  if (j < 0 || j >= items.length) return
  ;[items[i], items[j]] = [items[j]!, items[i]!]
}

const muscles = computed(() => [...new Set(routine.value?.items.map((i) => exerciseById(i.exerciseId)?.muscle).filter(Boolean))])

async function save() {
  if (!routine.value?.name.trim()) return show('Ponle un nombre a la rutina')
  await $fetch('/api/routines', { method: 'POST', body: routine.value })
  await refreshNuxtData('routines')
  show('Rutina guardada')
  router.replace('/entreno')
}

async function remove() {
  if (!confirm(`¿Borrar la rutina “${routine.value!.name}”?`)) return
  await $fetch(`/api/routines/${routine.value!.id}`, { method: 'DELETE' })
  await refreshNuxtData(['routines', 'settings'])
  router.replace('/entreno')
}
</script>

<template>
  <main v-if="routine" class="page">
    <header class="row between">
      <NuxtLink to="/entreno" class="muted">Cancelar</NuxtLink>
      <strong>{{ isNew ? 'Nueva rutina' : 'Editar rutina' }}</strong>
      <button style="color: var(--strength); font-weight: 700" @click="save">Guardar</button>
    </header>

    <section class="card">
      <input v-model="routine.name" class="field" placeholder="Nombre (p. ej. Empuje)" style="font-size: 20px; font-weight: 700">
      <input v-model="routine.description" class="field" placeholder="Descripción (opcional)">
      <div v-if="muscles.length" class="row wrap" style="gap: 6px">
        <span v-for="m in muscles" :key="m" class="chip small" style="color: var(--strength)">{{ m }}</span>
      </div>
    </section>

    <section v-for="(item, i) in routine.items" :key="item.exerciseId" class="card">
      <div class="row">
        <ExerciseThumb :img="exerciseById(item.exerciseId)?.img ?? ''" :size="48" />
        <NuxtLink :to="`/ejercicios/${item.exerciseId}`" class="grow">
          <div style="font-weight: 700">{{ exerciseById(item.exerciseId)?.name ?? item.exerciseId }}</div>
          <div class="muted small">{{ exerciseById(item.exerciseId)?.muscle }}</div>
        </NuxtLink>
        <div class="col-btns">
          <button class="muted" aria-label="Subir" :disabled="i === 0" @click="move(i, -1)">▲</button>
          <button class="muted" aria-label="Bajar" :disabled="i === routine.items.length - 1" @click="move(i, 1)">▼</button>
        </div>
        <button class="muted" aria-label="Quitar" @click="routine.items.splice(i, 1)"><AppIcon name="trash" /></button>
      </div>
      <div class="grid">
        <label>Series <input v-model.number="item.sets" class="field" type="number" min="1" max="10" inputmode="numeric"></label>
        <label>{{ exerciseById(item.exerciseId)?.timed ? 'Seg. mín' : 'Reps mín' }} <input v-model.number="item.reps[0]" class="field" type="number" inputmode="numeric"></label>
        <label>{{ exerciseById(item.exerciseId)?.timed ? 'Seg. máx' : 'Reps máx' }} <input v-model.number="item.reps[1]" class="field" type="number" inputmode="numeric"></label>
        <label>Descanso (s) <input v-model.number="item.restSec" class="field" type="number" step="15" inputmode="numeric"></label>
      </div>
      <label v-if="i < routine.items.length - 1" class="row between footnote">
        <span>Superserie con el siguiente</span>
        <input v-model="item.superset" type="checkbox" class="switch">
      </label>
    </section>

    <button class="btn" style="--accent: var(--strength)" @click="picking = true"><AppIcon name="plus" /> Añadir ejercicios</button>
    <button v-if="!isNew" class="btn ghost" style="--accent: var(--move)" @click="remove">Borrar rutina</button>

    <ExercisePicker v-if="picking" :selected="routine.items.map((i) => i.exerciseId)" @pick="add" @close="picking = false" />
  </main>
  <main v-else class="page"><p class="muted">Cargando…</p></main>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.grid label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--muted); }
.grid .field { padding: 8px; text-align: center; }
.col-btns { display: flex; flex-direction: column; font-size: 12px; }
.col-btns button:disabled { opacity: 0.2; }
</style>
