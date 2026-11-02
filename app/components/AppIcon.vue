<script setup lang="ts">
/** Iconos de trazo propios al estilo SF Symbols (sin dependencias). `filled` rellena los que lo admiten. */
withDefaults(defineProps<{ name: string; size?: number; filled?: boolean; weight?: number }>(), { size: 20, filled: false, weight: 1.9 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" :fill="'none'" stroke="currentColor" :stroke-width="weight"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon">
    <!-- Pestañas -->
    <template v-if="name === 'rings'">
      <circle cx="12" cy="12" r="9.2" /><circle cx="12" cy="12" r="5.8" /><circle cx="12" cy="12" r="2.4" :fill="filled ? 'currentColor' : 'none'" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" :fill="filled ? 'currentColor' : 'none'" />
      <path d="M3.5 9.5h17" :stroke="filled ? '#000' : 'currentColor'" /><path d="M8 3v3.5M16 3v3.5" />
    </template>
    <template v-else-if="name === 'dumbbell'">
      <rect x="4" y="7" width="3" height="10" rx="1.2" :fill="filled ? 'currentColor' : 'none'" />
      <rect x="17" y="7" width="3" height="10" rx="1.2" :fill="filled ? 'currentColor' : 'none'" />
      <path d="M1.8 10v4M22.2 10v4M7 12h10" />
    </template>
    <template v-else-if="name === 'cart'">
      <path d="M2.5 3.5h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7.5H6" :fill="filled ? 'currentColor' : 'none'" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" /><circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
    </template>

    <!-- Comidas -->
    <template v-else-if="name === 'sunrise'"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 4v4M5.6 9.6l1.6 1.6M18.4 9.6l-1.6 1.6M2.5 14h2M19.5 14h2" /></template>
    <template v-else-if="name === 'sun'"><circle cx="12" cy="12" r="4" :fill="filled ? 'currentColor' : 'none'" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></template>
    <template v-else-if="name === 'cup'"><path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 2.5v3M12 2.5v3" /></template>
    <template v-else-if="name === 'moon'"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" :fill="filled ? 'currentColor' : 'none'" /></template>
    <template v-else-if="name === 'food'"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11" /></template>
    <template v-else-if="name === 'leaf'"><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19l7-7" /></template>
    <template v-else-if="name === 'drop'"><path d="M12 2.7S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.7 12 2.7z" :fill="filled ? 'currentColor' : 'none'" /></template>
    <template v-else-if="name === 'flame'"><path d="M12 22a6.5 6.5 0 0 0 6.5-6.5c0-4.2-3.2-6.3-4.3-10.5-2.1 2.1-3.2 4.2-3.2 6.3-1-1-2.1-2.1-2.1-4.2-2.1 2.1-3.4 5.2-3.4 8.4A6.5 6.5 0 0 0 12 22z" :fill="filled ? 'currentColor' : 'none'" /></template>
    <template v-else-if="name === 'timer'"><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 2.5M9.5 2.5h5M19 6l1.5-1.5" /></template>

    <!-- Entreno -->
    <template v-else-if="name === 'run'"><circle cx="14.5" cy="4" r="2" fill="currentColor" stroke="none" /><path d="M6 21l3.2-6 3.3 2.2.9-5.2 3 3.2h3.6M7.5 11.5l3.6-3.2 3.4 1" /></template>
    <template v-else-if="name === 'yoga'"><circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" /><path d="M12 7.5v6M5 10.5l7 2 7-2M7 20l5-6.5 5 6.5M5 20h14" /></template>
    <template v-else-if="name === 'bed'"><path d="M3 18V6M3 13h18v5M21 18v-2M3 10h6a2 2 0 0 1 2 2v1M14 10h4a3 3 0 0 1 3 3" /></template>
    <template v-else-if="name === 'bolt'"><path d="M13 2.5L5 13.5h6l-1 8 8-11h-6l1-8z" :fill="filled ? 'currentColor' : 'none'" /></template>
    <template v-else-if="name === 'trophy'"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20.5h7M10 17h4l.5 3.5h-5z" /></template>
    <template v-else-if="name === 'chart'"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></template>
    <template v-else-if="name === 'heart'"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" :fill="filled ? 'currentColor' : 'none'" /></template>
    <template v-else-if="name === 'scale'"><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 9.5a5 5 0 0 1 8 0M12 9.5l1.5-2" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></template>

    <!-- Compra y casa -->
    <template v-else-if="name === 'house'"><path d="M3.5 10.5L12 3.5l8.5 7M5.5 9v11h13V9M10 20v-5.5h4V20" /></template>
    <template v-else-if="name === 'people'"><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0M16 4.8a3.2 3.2 0 0 1 0 6.4M18 13.6a6 6 0 0 1 3 5.9" /></template>
    <template v-else-if="name === 'bag'"><path d="M5 7.5h14l-1 12.5H6L5 7.5zM9 10V6a3 3 0 0 1 6 0v4" /></template>
    <template v-else-if="name === 'camera'"><path d="M4 7.5h3l1.8-2.5h6.4L17 7.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.8" /></template>
    <template v-else-if="name === 'barcode'"><path d="M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14" /></template>
    <template v-else-if="name === 'sparkles'"><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" /></template>
    <template v-else-if="name === 'list'"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></template>

    <!-- Interfaz -->
    <template v-else-if="name === 'user'"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3.5" /><path d="M5.5 19a7.5 7.5 0 0 1 13 0" /></template>
    <template v-else-if="name === 'gear'"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="name === 'minus'"><path d="M5 12h14" /></template>
    <template v-else-if="name === 'check'"><path d="M5 12.5l4.5 4.5L19 7.5" /></template>
    <template v-else-if="name === 'trash'"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></template>
    <template v-else-if="name === 'search'"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></template>
    <template v-else-if="name === 'link'"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></template>
    <template v-else-if="name === 'share'"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></template>
    <template v-else-if="name === 'chevron'"><path d="M9 5.5l6.5 6.5L9 18.5" /></template>
    <template v-else-if="name === 'chevron-left'"><path d="M15 5.5L8.5 12l6.5 6.5" /></template>
    <template v-else-if="name === 'chevron-down'"><path d="M5.5 9l6.5 6.5L18.5 9" /></template>
    <template v-else-if="name === 'close'"><path d="M6 6l12 12M18 6L6 18" /></template>
    <template v-else-if="name === 'ellipsis'"><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></template>
    <template v-else><circle cx="12" cy="12" r="9" /></template>
  </svg>
</template>

<style scoped>
.icon { flex: none; display: block; }
</style>
