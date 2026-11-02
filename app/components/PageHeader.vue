<script setup lang="ts">
/**
 * Cabecera de iOS: título grande que, al hacer scroll, se recoge en una barra
 * compacta translúcida con el título centrado.
 */
const props = defineProps<{ title: string; eyebrow?: string; back?: { to: string; label: string } }>()

const sentinel = ref<HTMLElement>()
const compact = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(([e]) => { compact.value = !e!.isIntersecting }, { rootMargin: '-44px 0px 0px 0px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onBeforeUnmount(() => observer?.disconnect())
useHead({ title: () => `${props.title} · Pulso` })
</script>

<template>
  <div class="header">
    <div class="bar" :class="{ compact }">
      <NuxtLink v-if="back" :to="back.to" class="back"><AppIcon name="chevron-left" :size="22" :weight="2.4" />{{ back.label }}</NuxtLink>
      <span v-else />
      <strong class="bar-title">{{ title }}</strong>
      <div class="bar-trailing"><slot name="compact" /></div>
    </div>
    <div class="large">
      <div class="grow">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h1 ref="sentinel" class="large-title">{{ title }}</h1>
      </div>
      <div class="trailing"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.header { padding-top: calc(env(safe-area-inset-top) + 44px); }
.bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 40;
  height: calc(env(safe-area-inset-top) + 44px); padding: env(safe-area-inset-top) 12px 0;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  border-bottom: 0.5px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}
.bar.compact {
  background: var(--bar-bg); border-bottom-color: var(--line);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
}
.bar-title { font-size: 17px; font-weight: 600; opacity: 0; transform: translateY(4px); transition: opacity 0.2s, transform 0.2s; white-space: nowrap; }
.bar.compact .bar-title { opacity: 1; transform: none; }
.back { display: inline-flex; align-items: center; gap: 0; color: var(--tint); justify-self: start; margin-left: -6px; }
.bar-trailing { justify-self: end; }
.large { display: flex; align-items: flex-end; gap: 12px; padding: 0 0 2px; }
.trailing { display: flex; gap: 8px; align-items: center; padding-bottom: 4px; }
</style>
