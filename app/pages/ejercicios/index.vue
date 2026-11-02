<script setup lang="ts">
import { EQUIPMENT, EXERCISE_DB, type Equipment } from '#shared/data/exercises'
import type { MuscleGroup } from '#shared/core/strength'

const search = ref('')
const muscle = ref<MuscleGroup | ''>('')
const equipment = ref<Equipment | ''>('')
const MUSCLES = [...new Set(EXERCISE_DB.map((e) => e.muscle))]
const results = computed(() => filterExercises(search.value, muscle.value, equipment.value))
</script>

<template>
  <main class="page">
    <PageHeader title="Ejercicios" :eyebrow="`${results.length} de ${EXERCISE_DB.length}`" :back="{ to: '/entreno', label: 'Entreno' }" />

    <input v-model="search" class="field" placeholder="Buscar ejercicio o músculo">
    <div class="chips">
      <button class="chip" :class="{ on: !muscle }" @click="muscle = ''">Todos</button>
      <button v-for="m in MUSCLES" :key="m" class="chip" :class="{ on: muscle === m }" @click="muscle = muscle === m ? '' : m">{{ m }}</button>
    </div>
    <select v-model="equipment" class="field">
      <option value="">Cualquier material</option>
      <option v-for="e in EQUIPMENT" :key="e" :value="e">{{ e }}</option>
    </select>

    <section class="card">
      <div class="list">
        <NuxtLink v-for="ex in results" :key="ex.id" :to="`/ejercicios/${ex.id}`" class="list-row">
          <ExerciseThumb :img="ex.img" :size="56" />
          <div class="grow">
            <div style="font-weight: 700">{{ ex.name }}</div>
            <div class="muted small">{{ ex.muscle }}<template v-if="ex.secondary.length"> + {{ ex.secondary.join(', ') }}</template></div>
            <div class="muted small">{{ ex.equipment }} · {{ ex.level }}</div>
          </div>
          <AppIcon name="chevron" class="muted" />
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.chip { flex: none; }
.chip.on { background: var(--exercise); color: #000; }
</style>
