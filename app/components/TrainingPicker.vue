<script setup lang="ts">
import type { DayPlan, Routine } from '#shared/core/plan'

defineProps<{ title: string; current: DayPlan; routines: Routine[]; changed: boolean }>()
const emit = defineEmits<{ choose: [DayPlan]; reset: []; close: [] }>()

const OTHER: DayPlan[] = [{ kind: 'run' }, { kind: 'mobility' }, { kind: 'rest' }]
const same = (a: DayPlan, b: DayPlan) => a.kind === b.kind && (a.kind !== 'strength' || (b.kind === 'strength' && a.routineId === b.routineId))
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet" role="dialog" :aria-label="title">
      <div class="sheet-handle" />
      <div class="sheet-bar">
        <button @click="emit('close')">Cancelar</button>
        <strong>{{ title }}</strong>
        <span />
      </div>

      <h3 class="section-header">Fuerza</h3>
      <div class="group" style="margin-top: -8px">
        <div class="list icons">
          <button v-for="r in routines" :key="r.id" class="list-row" @click="emit('choose', { kind: 'strength', routineId: r.id })">
            <IconTile name="dumbbell" color="var(--green)" />
            <span class="stack grow"><span>{{ r.name }}</span><span class="footnote muted">{{ r.items.length }} ejercicios</span></span>
            <AppIcon v-if="same(current, { kind: 'strength', routineId: r.id })" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
        </div>
      </div>

      <h3 class="section-header">Otros</h3>
      <div class="group" style="margin-top: -8px">
        <div class="list icons">
          <button v-for="o in OTHER" :key="o.kind" class="list-row" @click="emit('choose', o)">
            <IconTile :name="trainingStyle(o).icon" :color="trainingStyle(o).color" />
            <span class="grow">{{ trainingStyle(o).label }}</span>
            <AppIcon v-if="same(current, o)" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
        </div>
      </div>

      <button v-if="changed" class="btn plain" @click="emit('reset')">Volver a mi semana habitual</button>
    </div>
  </div>
</template>
