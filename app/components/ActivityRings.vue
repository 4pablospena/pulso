<script setup lang="ts">
/** Anillos concéntricos al estilo Actividad; cada uno admite pasar del 100 % (segunda vuelta). */
const props = withDefaults(defineProps<{
  rings: { value: number; color: string }[]
  size?: number
  stroke?: number
}>(), { size: 150, stroke: 18 })

const gap = 3
const circles = computed(() => props.rings.map((ring, i) => {
  const r = props.size / 2 - props.stroke / 2 - i * (props.stroke + gap)
  const c = 2 * Math.PI * r
  const v = Math.max(0, ring.value)
  return { ...ring, r, c, first: Math.min(v, 1), lap: v > 1 ? Math.min(v - 1, 1) : 0 }
}))
</script>

<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="rings" role="img">
    <g v-for="(ring, i) in circles" :key="i" :transform="`rotate(-90 ${size / 2} ${size / 2})`">
      <circle :cx="size / 2" :cy="size / 2" :r="ring.r" :stroke="ring.color" :stroke-width="stroke" fill="none" opacity="0.22" />
      <circle v-if="ring.first > 0" :cx="size / 2" :cy="size / 2" :r="ring.r" :stroke="ring.color" :stroke-width="stroke" fill="none"
              stroke-linecap="round" :stroke-dasharray="`${ring.first * ring.c} ${ring.c}`" class="arc" />
      <circle v-if="ring.lap" :cx="size / 2" :cy="size / 2" :r="ring.r" :stroke="ring.color" :stroke-width="stroke" fill="none"
              stroke-linecap="round" :stroke-dasharray="`${ring.lap * ring.c} ${ring.c}`" class="arc lap" />
    </g>
  </svg>
</template>

<style scoped>
.rings { flex: none; }
.arc { transition: stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
.lap { filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7)); }
</style>
