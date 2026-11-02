<script setup lang="ts">
/** Casilla de color con icono blanco, como en Ajustes de iOS. */
withDefaults(defineProps<{ name: string; color: string; size?: number }>(), { size: 30 })
</script>

<template>
  <span class="tile" :style="{ background: color, width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.24)}px` }">
    <AppIcon :name="name" :size="Math.round(size * 0.6)" :weight="2.2" />
  </span>
</template>

<style scoped>
.tile { display: inline-grid; place-items: center; color: #fff; flex: none; }
</style>
