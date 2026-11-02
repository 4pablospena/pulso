<script setup lang="ts">
import { EQUIPMENT, EXERCISE_DB, type Equipment, type Exercise } from '#shared/data/exercises'
import type { MuscleGroup } from '#shared/core/strength'

const props = defineProps<{ selected?: string[] }>()
const emit = defineEmits<{ pick: [Exercise]; close: [] }>()

const search = ref('')
const muscle = ref<MuscleGroup | ''>('')
const equipment = ref<Equipment | ''>('')
const MUSCLES = [...new Set(EXERCISE_DB.map((e) => e.muscle))]

const results = computed(() => filterExercises(search.value, muscle.value, equipment.value))
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-handle" />
      <div class="row between"><strong>Añadir ejercicio</strong><button class="muted" @click="emit('close')">Cerrar</button></div>
      <input v-model="search" class="field" placeholder="Buscar: press, sentadilla, polea…" autofocus>
      <div class="chips">
        <button class="chip" :class="{ on: !muscle }" @click="muscle = ''">Todos</button>
        <button v-for="m in MUSCLES" :key="m" class="chip" :class="{ on: muscle === m }" @click="muscle = muscle === m ? '' : m">{{ m }}</button>
      </div>
      <select v-model="equipment" class="field">
        <option value="">Cualquier material</option>
        <option v-for="e in EQUIPMENT" :key="e" :value="e">{{ e }}</option>
      </select>
      <div class="list">
        <button v-for="ex in results" :key="ex.id" class="list-row" style="text-align: left" @click="emit('pick', ex)">
          <ExerciseThumb :img="ex.img" :size="48" />
          <div class="grow">
            <div style="font-weight: 700">{{ ex.name }}</div>
            <div class="muted small">{{ ex.muscle }} · {{ ex.equipment }} · {{ ex.level }}</div>
          </div>
          <AppIcon :name="props.selected?.includes(ex.id) ? 'check' : 'plus'" style="color: var(--exercise)" />
        </button>
        <p v-if="!results.length" class="muted">Sin resultados</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.chip { flex: none; }
</style>
