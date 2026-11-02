<script setup lang="ts">
const props = withDefaults(defineProps<{ points: { t: number; v: number }[]; color: string; height?: number }>(), { height: 140 })

const W = 320
const pad = 10
const geometry = computed(() => {
  const pts = props.points
  const vs = pts.map((p) => p.v)
  const min = Math.min(...vs) * 0.97
  const max = Math.max(...vs) * 1.03
  const t0 = pts[0]?.t ?? 0
  const t1 = pts.at(-1)?.t ?? 1
  const x = (t: number) => (pts.length < 2 ? W / 2 : pad + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * pad))
  const y = (v: number) => props.height - pad - ((v - min) / (max - min || 1)) * (props.height - 2 * pad)
  const coords = pts.map((p) => ({ x: x(p.t), y: y(p.v), p }))
  return { coords, path: coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') }
})
const hover = ref<number | null>(null)
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" :style="{ height: `${height}px` }">
      <path :d="geometry.path" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    </svg>
    <button v-for="(c, i) in geometry.coords" :key="i" class="dot" :style="{ left: `${(c.x / W) * 100}%`, top: `${c.y}px`, background: color }"
            :aria-label="`${Math.round(c.p.v)} kg`" @mouseenter="hover = i" @mouseleave="hover = null" @focus="hover = i" @blur="hover = null" />
    <div v-if="hover !== null" class="tip" :style="{ left: `${(geometry.coords[hover]!.x / W) * 100}%`, top: `${geometry.coords[hover]!.y - 34}px` }">
      {{ Math.round(geometry.coords[hover]!.p.v) }} kg · {{ new Date(geometry.coords[hover]!.p.t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }}
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; }
svg { width: 100%; display: block; }
.dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; transform: translate(-50%, -50%); padding: 0; }
.tip { position: absolute; transform: translateX(-50%); background: var(--raised); padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none; }
</style>
