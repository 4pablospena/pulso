<script setup lang="ts">
import { duration } from '#shared/core/format'

const { settings, status, start, stop } = useFasting()
const time = (t: number) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
const color = computed(() => (status.value?.phase === 'eating' ? 'var(--green)' : 'var(--purple)'))
</script>

<template>
  <section class="card">
    <div class="row">
      <IconTile name="timer" color="var(--purple)" />
      <div class="stack grow">
        <span class="headline">Ayuno {{ settings?.fastingProtocol }}</span>
        <span v-if="status" class="footnote muted">{{ status.phase === 'fasting' ? 'Ayunando' : 'Ventana de ingesta' }} · hasta las {{ time(status.phaseEnd) }}</span>
        <span v-else class="footnote muted">No has empezado el ayuno</span>
      </div>
      <button v-if="!status" class="btn small" style="--accent: var(--purple); color: #fff" @click="start">Empezar</button>
      <button v-else class="btn small ghost" style="--accent: var(--red)" @click="stop">Terminar</button>
    </div>
    <div v-if="status" class="row" style="gap: 14px">
      <ActivityRings :size="54" :stroke="8" :rings="[{ value: status.progress, color }]" />
      <div class="stack">
        <span class="countdown rounded num" :style="{ color }">{{ duration(status.remainingMs / 1000) }}</span>
        <span class="caption muted">restante</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.countdown { font-size: 30px; font-weight: 700; line-height: 34px; letter-spacing: 0; }
</style>
