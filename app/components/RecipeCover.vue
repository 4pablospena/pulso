<script setup lang="ts">
import type { Recipe } from '#shared/data/recipes'

/** Portada de la receta: su foto si la tiene; si no, una ilustración según su ingrediente principal. */
const props = withDefaults(defineProps<{ recipe: Recipe; height?: number; radius?: number }>(), { height: 120, radius: 12 })

// Cada familia de receta con su icono y su color, para que el recetario se lea de un vistazo.
const FAMILIES: [RegExp, string, string][] = [
  [/salmón|merluza|atún|sardina|mejill|gamba|pescado|poke/i, 'fish', '#0a84ff'],
  [/huevo|tortilla de|revuelto|claras/i, 'egg', '#ffb800'],
  [/lenteja|garbanzo|hummus|edamame|tofu/i, 'bean', '#c46a2b'],
  [/pollo|pavo|lomo|ternera|albóndiga|bolo/i, 'meat', '#ff453a'],
  [/batido|gazpacho/i, 'drop', '#bf5af2'],
  [/porridge|avena|yogur|requesón|queso batido|bol/i, 'bowl', '#ff9f0a'],
  [/ensalada|crema|verdura|calabac|calabaza|setas/i, 'leaf', '#30d158'],
  [/tostad|sándwich|wrap|burrito|tortitas/i, 'sun', '#e3a600'],
  [/manzana|naranja|kiwi|fruta/i, 'leaf', '#ff375f'],
]
const look = computed(() => {
  const found = FAMILIES.find(([re]) => re.test(props.recipe.name))
  return found ? { icon: found[1], color: found[2] } : { icon: SLOT_STYLE[props.recipe.slots[0] ?? 'Comida'].icon, color: '#5e5ce6' }
})

const img = ref<HTMLImageElement>()
const failed = ref(false)
// Si la foto falló antes de hidratar la página, el evento ya pasó: se comprueba al montar.
onMounted(() => { if (img.value?.complete && !img.value.naturalWidth) failed.value = true })
</script>

<template>
  <div class="cover" :style="{ height: `${height}px`, borderRadius: `${radius}px`, '--c': look.color }">
    <img v-if="recipe.photo && !failed" ref="img" :src="`/api/recipes/photo/${recipe.id}`" alt="" loading="lazy" @error="failed = true">
    <template v-else>
      <AppIcon :name="look.icon" :size="Math.round(height * 0.7)" :weight="1.3" class="glyph" />
      <AppIcon :name="look.icon" :size="Math.round(height * 0.26)" :weight="1.8" class="mark" />
    </template>
  </div>
</template>

<style scoped>
.cover {
  position: relative; overflow: hidden; flex: none; width: 100%;
  background:
    radial-gradient(120% 90% at 85% 10%, color-mix(in srgb, var(--c) 60%, #fff 0%), transparent 65%),
    linear-gradient(150deg, color-mix(in srgb, var(--c) 92%, #fff 8%), color-mix(in srgb, var(--c) 50%, #000 50%));
}
img { width: 100%; height: 100%; object-fit: cover; display: block; }
.glyph { position: absolute; right: -10%; bottom: -18%; color: rgba(255, 255, 255, 0.22); transform: rotate(-12deg); }
.mark { position: absolute; left: 10%; top: 14%; color: rgba(255, 255, 255, 0.9); }
</style>
