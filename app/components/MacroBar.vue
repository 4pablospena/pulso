<script setup lang="ts">
const props = defineProps<{ label?: string; value: number; target: number; color: string; unit?: string }>()
const pct = computed(() => Math.min(100, (props.value / Math.max(props.target, 1)) * 100))
</script>

<template>
  <div class="macro">
    <div v-if="label" class="row between footnote">
      <span>{{ label }}</span>
      <span class="muted">{{ Math.round(value) }} / {{ Math.round(target) }} {{ unit ?? 'g' }}</span>
    </div>
    <div class="track" :style="{ background: `color-mix(in srgb, ${color} 20%, transparent)` }">
      <div class="fill" :style="{ width: `${pct}%`, background: color }" />
    </div>
  </div>
</template>

<style scoped>
.macro { display: flex; flex-direction: column; gap: 6px; }
.track { height: 6px; border-radius: 3px; overflow: hidden; }
.fill { height: 100%; border-radius: 3px; transition: width 0.7s cubic-bezier(0.32, 0.72, 0, 1); }
</style>
