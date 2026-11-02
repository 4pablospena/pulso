<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Hoy', icon: 'rings' },
  { to: '/semana', label: 'Semana', icon: 'calendar' },
  { to: '/entreno', label: 'Entreno', icon: 'dumbbell' },
  { to: '/compra', label: 'Compra', icon: 'cart' },
]
const route = useRoute()
// Diario, balance, recetas y ajustes se abren desde Hoy: la pestaña sigue marcada.
const HOY = ['/nutricion', '/balance', '/recetas', '/planes', '/ajustes']
const active = (to: string) => (to === '/' ? route.path === '/' || HOY.some((p) => route.path.startsWith(p)) : route.path.startsWith(to))
const { toast } = useToast()
const { online, pending } = useOffline()
</script>

<template>
  <div>
    <Transition name="fade">
      <div v-if="!online || pending" class="offline" role="status">
        <AppIcon name="bolt" :size="14" />
        {{ !online ? 'Sin conexión' : 'Sincronizando' }}<template v-if="pending"> · {{ pending }} {{ pending === 1 ? 'cambio pendiente' : 'cambios pendientes' }}</template>
      </div>
    </Transition>
    <slot />
    <Transition name="fade">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>
    <nav class="tabbar" aria-label="Secciones">
      <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" :class="{ on: active(t.to) }" :aria-current="active(t.to) ? 'page' : undefined">
        <AppIcon :name="t.icon" :size="25" :filled="active(t.to)" :weight="active(t.to) ? 2.1 : 1.8" />
        <span>{{ t.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.tabbar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  height: var(--tabbar); padding: 0 8px env(safe-area-inset-bottom);
  display: flex; justify-content: space-around; align-items: flex-start;
  background: var(--bar-bg); border-top: 0.5px solid var(--line);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
}
.tabbar a {
  flex: 1; max-width: 120px; padding-top: 6px; height: 50px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 10px; font-weight: 500; letter-spacing: 0.1px; color: #8e8e93;
}
.tabbar a.on { color: var(--tint); }
.offline {
  position: fixed; top: calc(env(safe-area-inset-top) + 6px); left: 50%; transform: translateX(-50%); z-index: 45;
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px;
  background: var(--toast-bg); box-shadow: var(--shadow); font-size: 13px; font-weight: 600; color: var(--orange);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
}
.tabbar a:active { opacity: 1; }
</style>
