<script setup lang="ts">
import { recipeMacros } from '#shared/core/nutrition'
import { RECIPES, type RecipeTag } from '#shared/data/recipes'
import type { MealSlot } from '#shared/types'

const props = defineProps<{
  slot: MealSlot
  title: string
  recipeId: string | null
  servings: number
  factor: number
  /** La comida tiene un cambio respecto al plan (se puede volver a él). */
  changed: boolean
}>()
const emit = defineEmits<{
  choose: [recipeId: string | null, servings: number]
  reset: []
  close: []
}>()

const servings = ref(props.servings)
const search = ref('')
const tag = ref<RecipeTag | ''>('')
const TAGS: RecipeTag[] = ['Alta proteína', 'Rápida', 'Ligera', 'Vegetariana', 'Sin cocinar', 'Batch cooking']
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const options = computed(() => RECIPES.filter((r) =>
  r.slots.includes(props.slot)
  && (!tag.value || r.tags.includes(tag.value))
  && (!search.value || normalize(r.name).includes(normalize(search.value)))))
const look = computed(() => SLOT_STYLE[props.slot])
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet" role="dialog" :aria-label="title">
      <div class="sheet-handle" />
      <div class="sheet-bar">
        <button @click="emit('close')">Cancelar</button>
        <strong>{{ title }}</strong>
        <button v-if="recipeId && servings !== props.servings" @click="emit('choose', recipeId, servings)">Guardar</button>
        <span v-else />
      </div>

      <div class="group">
        <div class="list">
          <div class="list-row">
            <span class="grow">Comensales</span>
            <div class="stepper">
              <button :disabled="servings <= 1" aria-label="Menos" @click="servings--"><AppIcon name="minus" :size="16" :weight="2.4" /></button>
              <span class="num">{{ servings }}</span>
              <button :disabled="servings >= 12" aria-label="Más" @click="servings++"><AppIcon name="plus" :size="16" :weight="2.4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div class="search">
        <AppIcon name="search" :size="16" class="muted" />
        <input v-model="search" placeholder="Buscar receta" aria-label="Buscar receta">
      </div>
      <div class="chips">
        <button class="chip" :class="{ on: !tag }" @click="tag = ''">Todas</button>
        <button v-for="t in TAGS" :key="t" class="chip" :class="{ on: tag === t }" @click="tag = tag === t ? '' : t">{{ t }}</button>
      </div>

      <div class="group">
        <div class="list icons">
          <button v-for="r in options" :key="r.id" class="list-row" @click="emit('choose', r.id, servings)">
            <IconTile :name="look.icon" :color="look.color" />
            <span class="stack grow">
              <span>{{ r.name }}</span>
              <span class="footnote muted">{{ recipeMacros(r, factor).kcal }} kcal · {{ Math.round(recipeMacros(r, factor).protein) }} g proteína · {{ r.prepMin }} min</span>
            </span>
            <AppIcon v-if="r.id === recipeId" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
        </div>
      </div>

      <div class="group">
        <div class="list">
          <button v-if="changed" class="list-row tint" @click="emit('reset')">Volver a la receta del plan</button>
          <button class="list-row" style="color: var(--red)" @click="emit('choose', null, servings)">No planificar esta comida</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stepper { display: inline-flex; align-items: center; background: var(--fill); border-radius: 9px; height: 32px; }
.stepper button { width: 46px; height: 32px; display: grid; place-items: center; }
.stepper span { min-width: 24px; text-align: center; font-weight: 600; border-left: 0.5px solid var(--line); border-right: 0.5px solid var(--line); }
.search { display: flex; align-items: center; gap: 6px; background: var(--fill); border-radius: 10px; padding: 0 10px; height: 36px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 17px; }
.search input::placeholder { color: var(--muted); }
.chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
.chip { flex: none; }
</style>
