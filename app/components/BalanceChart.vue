<script setup lang="ts">
import { balanceOf, type HistoryDay } from '#shared/core/balance'

/** Barras de kcal comidas por día con una marca de lo quemado; color según déficit o superávit. */
const props = defineProps<{ days: HistoryDay[] }>()
const emit = defineEmits<{ select: [string] }>()

const max = computed(() => Math.max(1, ...props.days.flatMap((d) => [d.eaten.kcal, d.burnedKcal])) * 1.08)
const pct = (v: number) => `${(v / max.value) * 100}%`
const label = (date: string) => {
  const d = new Date(`${date}T12:00:00`)
  return props.days.length <= 7 ? d.toLocaleDateString('es-ES', { weekday: 'narrow' }) : String(d.getDate())
}
const hover = ref<HistoryDay | null>(null)
</script>

<template>
  <div class="chart">
    <div class="plot">
      <button v-for="d in days" :key="d.date" class="col" :aria-label="`${d.date}: ${Math.round(d.eaten.kcal)} comidas, ${d.burnedKcal} quemadas`"
              @mouseenter="hover = d" @mouseleave="hover = null" @focus="hover = d" @blur="hover = null" @click="emit('select', d.date)">
        <div class="burn" :style="{ bottom: pct(d.burnedKcal) }" />
        <div v-if="d.logged" class="bar" :class="balanceOf(d) <= 0 ? 'deficit' : 'surplus'" :style="{ height: pct(d.eaten.kcal) }" />
        <div v-else class="bar empty" />
      </button>
    </div>
    <div class="axis">
      <span v-for="(d, i) in days" :key="d.date" :style="{ visibility: days.length <= 7 || i % 5 === 0 || i === days.length - 1 ? 'visible' : 'hidden' }">{{ label(d.date) }}</span>
    </div>
    <div class="legend small muted">
      <span><i class="sw deficit" /> Déficit</span>
      <span><i class="sw surplus" /> Superávit</span>
      <span><i class="sw line" /> Quemadas</span>
    </div>
    <div v-if="hover" class="tip small">
      {{ new Date(`${hover.date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) }} ·
      <template v-if="hover.logged">{{ Math.round(hover.eaten.kcal) }} comidas / {{ hover.burnedKcal }} quemadas ({{ balanceOf(hover) > 0 ? '+' : '' }}{{ balanceOf(hover) }})</template>
      <template v-else>sin registro · {{ hover.burnedKcal }} quemadas</template>
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; display: flex; flex-direction: column; gap: 6px; }
.plot { display: flex; align-items: flex-end; gap: 3px; height: 160px; border-bottom: 1px solid var(--line); }
.col { position: relative; flex: 1; height: 100%; padding: 0; display: flex; align-items: flex-end; }
.bar { width: 100%; border-radius: 4px 4px 1px 1px; transition: height 0.6s ease; }
.bar.deficit { background: var(--exercise); }
.bar.surplus { background: var(--move); }
.bar.empty { height: 3px; background: var(--line); }
.burn { position: absolute; left: -1px; right: -1px; height: 2px; background: var(--stand); border-radius: 1px; z-index: 1; }
.axis { display: flex; gap: 3px; font-size: 10px; color: var(--muted); }
.axis span { flex: 1; text-align: center; }
.legend { display: flex; gap: 14px; }
.sw { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; margin-right: 4px; }
.sw.deficit { background: var(--exercise); }
.sw.surplus { background: var(--move); }
.sw.line { height: 2px; vertical-align: 3px; background: var(--stand); }
.tip { position: absolute; top: -6px; left: 0; right: 0; text-align: center; background: var(--raised); border-radius: 8px; padding: 4px 8px; pointer-events: none; }
</style>
