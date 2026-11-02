<script setup lang="ts">
/** Foto del ejercicio; alterna posición inicial y final para mostrar el movimiento. */
const props = withDefaults(defineProps<{ img: string; size?: number; animate?: boolean }>(), { size: 56, animate: false })
const frame = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { if (props.animate) timer = setInterval(() => (frame.value = 1 - frame.value), 1100) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="thumb" :style="{ width: animate ? '100%' : `${size}px`, height: animate ? 'auto' : `${size}px` }">
    <img :src="`/exercises/${img}/0.jpg`" alt="" loading="lazy" :class="{ hidden: frame === 1 }">
    <img v-if="animate" :src="`/exercises/${img}/1.jpg`" alt="" loading="lazy" class="over" :class="{ hidden: frame === 0 }">
  </div>
</template>

<style scoped>
.thumb { position: relative; border-radius: 12px; overflow: hidden; background: #fff; flex: none; }
img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.35s; }
.over { position: absolute; inset: 0; }
.hidden { opacity: 0; }
</style>
