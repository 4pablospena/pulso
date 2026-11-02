<script setup lang="ts">
defineProps<{ label: string; value: string | number; unit?: string; color?: string }>()
</script>

<template>
  <div class="metric">
    <span class="label">{{ label }}</span>
    <span class="value" :style="{ color }">{{ value }}<small v-if="unit">{{ unit }}</small></span>
  </div>
</template>

<style scoped>
.metric { display: flex; flex-direction: column; gap: 0; min-width: 0; }
.label { font-size: 13px; font-weight: 400; color: var(--muted); letter-spacing: -0.08px; }
.value {
  font-family: ui-rounded, 'SF Pro Rounded', -apple-system, system-ui, sans-serif;
  font-size: 24px; line-height: 30px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0; white-space: nowrap;
}
small { font-size: 13px; font-weight: 700; margin-left: 2px; text-transform: uppercase; }
</style>
