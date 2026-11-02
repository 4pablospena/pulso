<script setup lang="ts">
import { duration, hrZone, km, pace } from '#shared/core/format'
import type { Workout } from '#shared/types'

const props = defineProps<{ workout: Workout; age?: number }>()
const look = computed(() => props.workout.kind === 'run'
  ? { icon: 'run', color: 'var(--run)' }
  : props.workout.kind === 'strength' ? { icon: 'dumbbell', color: 'var(--green)' } : { icon: 'bolt', color: 'var(--teal)' })
const zone = computed(() => (props.workout.avgHR && props.age ? hrZone(props.workout.avgHR, 220 - props.age) : null))
const zoneColors = ['var(--teal)', 'var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)']
const when = computed(() => new Date(props.workout.start).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <section class="card">
    <div class="row">
      <IconTile :name="look.icon" :color="look.color" />
      <div class="stack grow">
        <span class="headline ellipsis">{{ workout.name }}</span>
        <span class="footnote muted">{{ when }} · {{ workout.source }}</span>
      </div>
      <a v-if="workout.url" :href="workout.url" target="_blank" rel="noopener" class="footnote" style="color: var(--run)">Strava</a>
    </div>
    <div class="metrics">
      <div v-if="workout.distanceM"><span class="caption muted">Distancia</span><b class="rounded num">{{ km(workout.distanceM) }}</b></div>
      <div v-if="workout.kind === 'run'"><span class="caption muted">Ritmo</span><b class="rounded num" :style="{ color: look.color }">{{ pace(workout.distanceM, workout.durationSec) }}</b></div>
      <div v-else><span class="caption muted">Tiempo</span><b class="rounded num">{{ duration(workout.durationSec) }}</b></div>
      <div v-if="workout.kcal"><span class="caption muted">Activas</span><b class="rounded num" style="color: var(--move)">{{ workout.kcal }} kcal</b></div>
      <div v-if="workout.avgHR"><span class="caption muted">FC media</span><b class="rounded num" style="color: var(--red)">{{ Math.round(workout.avgHR) }} ppm</b></div>
      <div v-if="zone"><span class="caption muted">Zona</span><b class="rounded num" :style="{ color: zoneColors[zone - 1] }">Z{{ zone }}</b></div>
    </div>
  </section>
</template>

<style scoped>
.metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px 16px; }
.metrics div { display: flex; flex-direction: column; gap: 1px; }
.metrics b { font-size: 20px; font-weight: 700; letter-spacing: 0; white-space: nowrap; }
</style>
