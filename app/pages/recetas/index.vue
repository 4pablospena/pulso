<script setup lang="ts">
import { recipeMacros } from '#shared/core/nutrition'
import { allRecipes, type RecipeTag } from '#shared/data/recipes'
import { MEAL_SLOTS, type MealSlot } from '#shared/types'

const { settings, save } = useSettings()
const { data: custom } = useFetch('/api/recipes/custom', { key: 'custom-recipes', default: () => [] })
const search = ref('')
const slot = ref<MealSlot | ''>('')
const filter = ref<'todas' | 'favoritas' | 'mias'>('todas')
const tag = ref<RecipeTag | ''>('')
const TAGS: RecipeTag[] = ['Alta proteína', 'Rápida', 'Ligera', 'Vegetariana', 'Batch cooking']
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const favs = computed(() => new Set(settings.value?.favorites ?? []))

const results = computed(() => {
  void custom.value // se recalcula al cambiar las recetas propias
  return allRecipes().filter((r) =>
    (!slot.value || r.slots.includes(slot.value))
    && (!tag.value || r.tags.includes(tag.value))
    && (filter.value !== 'favoritas' || favs.value.has(r.id))
    && (filter.value !== 'mias' || r.custom)
    && (!search.value || normalize(r.name).includes(normalize(search.value))))
    .sort((a, b) => Number(favs.value.has(b.id)) - Number(favs.value.has(a.id)))
})

async function toggleFav(id: string) {
  const list = new Set(settings.value?.favorites ?? [])
  list.has(id) ? list.delete(id) : list.add(id)
  await save({ favorites: [...list] })
}
</script>

<template>
  <main class="page">
    <PageHeader title="Recetas" :eyebrow="`${results.length} recetas`" :back="{ to: '/semana', label: 'Semana' }">
      <NuxtLink to="/recetas/nueva" class="chip"><AppIcon name="plus" :size="14" :weight="2.4" /> Nueva</NuxtLink>
    </PageHeader>

    <div class="search">
      <AppIcon name="search" :size="16" class="muted" />
      <input v-model="search" placeholder="Buscar receta" aria-label="Buscar receta">
    </div>
    <div class="segmented">
      <button :class="{ on: filter === 'todas' }" @click="filter = 'todas'">Todas</button>
      <button :class="{ on: filter === 'favoritas' }" @click="filter = 'favoritas'">Favoritas</button>
      <button :class="{ on: filter === 'mias' }" @click="filter = 'mias'">De la casa</button>
    </div>
    <div class="chips">
      <button class="chip" :class="{ on: !slot }" @click="slot = ''">Cualquier comida</button>
      <button v-for="s in MEAL_SLOTS" :key="s" class="chip" :class="{ on: slot === s }" @click="slot = slot === s ? '' : s">{{ s }}</button>
      <button v-for="t in TAGS" :key="t" class="chip" :class="{ on: tag === t }" @click="tag = tag === t ? '' : t">{{ t }}</button>
    </div>

    <div class="grid">
      <div v-for="r in results" :key="r.id" class="tile">
        <NuxtLink :to="`/recetas/${r.id}`">
          <RecipeCover :recipe="r" :height="110" :radius="0" />
          <div class="info">
            <span class="name">{{ r.name }}</span>
            <span class="caption muted">{{ recipeMacros(r).kcal }} kcal · {{ r.prepMin }} min{{ r.custom ? ' · de la casa' : '' }}</span>
          </div>
        </NuxtLink>
        <button class="fav" :class="{ on: favs.has(r.id) }" :aria-label="favs.has(r.id) ? 'Quitar de favoritas' : 'Añadir a favoritas'" @click="toggleFav(r.id)">
          <AppIcon name="heart" :size="16" :filled="favs.has(r.id)" :weight="2.2" />
        </button>
      </div>
    </div>
    <p v-if="!results.length" class="section-footer" style="text-align: center">
      {{ filter === 'favoritas' ? 'Marca recetas con el corazón para tenerlas a mano.' : filter === 'mias' ? 'Crea vuestra primera receta con «Nueva».' : 'Sin resultados.' }}
    </p>
  </main>
</template>

<style scoped>
.search { display: flex; align-items: center; gap: 6px; background: var(--fill); border-radius: 10px; padding: 0 10px; height: 36px; margin-top: -8px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 17px; }
.search input::placeholder { color: var(--muted); }
.chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
.chip { flex: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.tile { position: relative; background: var(--card); border-radius: 14px; overflow: hidden; }
.info { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px 12px; }
.name { font-size: 15px; font-weight: 600; line-height: 19px; letter-spacing: -0.24px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.fav { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: #fff; background: rgba(0, 0, 0, 0.35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.fav.on { color: var(--pink); background: rgba(255, 255, 255, 0.9); }
</style>
