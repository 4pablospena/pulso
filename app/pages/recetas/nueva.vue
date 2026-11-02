<script setup lang="ts">
import { amountLabel, recipeMacros } from '#shared/core/nutrition'
import { INGREDIENTS, ingredientById } from '#shared/data/foods'
import { recipeById, type Recipe, type RecipeTag } from '#shared/data/recipes'
import { MEAL_SLOTS, type MealSlot } from '#shared/types'

const route = useRoute()
const router = useRouter()
const { show } = useToast()
const editing = typeof route.query.edit === 'string' ? recipeById(route.query.edit) : undefined

const form = ref({
  name: editing?.name ?? '',
  slots: [...(editing?.slots ?? ['Comida'])] as MealSlot[],
  prepMin: editing?.prepMin ?? 15,
  tags: [...(editing?.tags ?? [])] as RecipeTag[],
  ingredients: structuredClone(editing?.ingredients ?? []) as [string, number][],
  steps: (editing?.steps ?? []).join('\n'),
})
const photo = ref<string | null | undefined>(undefined) // undefined = sin cambios
const preview = computed(() => photo.value ?? (photo.value === undefined && editing?.photo ? `/api/recipes/photo/${editing.id}` : null))
const TAGS: RecipeTag[] = ['Alta proteína', 'Rápida', 'Ligera', 'Vegetariana', 'Sin cocinar', 'Batch cooking']

const toggle = <T,>(list: T[], v: T) => { const i = list.indexOf(v); i >= 0 ? list.splice(i, 1) : list.push(v) }

// Ingredientes
const picking = ref(false)
const search = ref('')
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const options = computed(() => INGREDIENTS.filter((i) => !search.value || normalize(i.name).includes(normalize(search.value))))
function addIngredient(id: string) {
  if (!form.value.ingredients.some(([x]) => x === id)) form.value.ingredients.push([id, ingredientById(id)?.unitGrams ?? 100])
  picking.value = false
  search.value = ''
}
const macros = computed(() => recipeMacros({ ...form.value, id: 'preview', steps: [] } as Recipe))

/** Reduce la foto a 900 px: suficiente para la portada y ligera de guardar. */
function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, 900 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(img.src)
    photo.value = canvas.toDataURL('image/jpeg', 0.78)
  }
  img.src = URL.createObjectURL(file)
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const recipe = await $fetch<Recipe>('/api/recipes/custom', {
      method: 'POST',
      body: { ...form.value, id: editing?.id, steps: form.value.steps.split('\n'), ...(photo.value !== undefined ? { photo: photo.value } : {}) },
    })
    await refreshNuxtData('custom-recipes')
    show(editing ? 'Receta guardada' : 'Receta creada')
    router.replace(`/recetas/${recipe.id}`)
  } catch (e: any) {
    show(e?.data?.message ?? 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="page">
    <PageHeader :title="editing ? 'Editar receta' : 'Nueva receta'" :back="{ to: editing ? `/recetas/${editing.id}` : '/recetas', label: editing ? 'Receta' : 'Recetas' }">
      <button class="chip" :disabled="saving || !form.name.trim() || !form.ingredients.length" @click="save">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
    </PageHeader>

    <label class="photo">
      <img v-if="preview" :src="preview" alt="">
      <span v-else class="placeholder"><AppIcon name="camera" :size="30" /><span class="subhead">Añadir foto</span></span>
      <input type="file" accept="image/*" hidden @change="onPhoto">
    </label>
    <button v-if="preview" class="btn plain" style="--accent: var(--red); margin-top: -12px" @click="photo = null">Quitar foto</button>

    <div class="group">
      <div class="list">
        <label class="list-row"><input v-model="form.name" class="bare grow" placeholder="Nombre de la receta"></label>
        <div class="list-row">
          <span class="grow">Tiempo</span>
          <input v-model.number="form.prepMin" class="bare num-input" type="number" inputmode="numeric" min="1"><span class="muted">min</span>
        </div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-header">Para</h2>
      <div class="chips">
        <button v-for="s in MEAL_SLOTS" :key="s" class="chip" :class="{ on: form.slots.includes(s) }" @click="toggle(form.slots, s)">{{ s }}</button>
      </div>
    </section>
    <section class="section">
      <h2 class="section-header">Etiquetas</h2>
      <div class="chips">
        <button v-for="t in TAGS" :key="t" class="chip" :class="{ on: form.tags.includes(t) }" @click="toggle(form.tags, t)">{{ t }}</button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-header">Ingredientes (1 ración)</h2>
      <div class="group">
        <div class="list">
          <div v-for="(ing, i) in form.ingredients" :key="ing[0]" class="list-row">
            <span class="stack grow"><span>{{ ingredientById(ing[0])?.name }}</span><span class="footnote muted">{{ amountLabel(ingredientById(ing[0]), ing[1]) }}</span></span>
            <input v-model.number="ing[1]" class="bare num-input" type="number" inputmode="numeric" min="1"><span class="muted">g</span>
            <button class="muted" aria-label="Quitar" @click="form.ingredients.splice(i, 1)"><AppIcon name="close" :size="16" /></button>
          </div>
          <button class="list-row tint" @click="picking = true"><AppIcon name="plus" :size="18" :weight="2.4" /> Añadir ingrediente</button>
        </div>
      </div>
      <p class="section-footer">{{ macros.kcal }} kcal · {{ Math.round(macros.protein) }} g proteína · {{ Math.round(macros.carbs) }} g hidratos · {{ Math.round(macros.fat) }} g grasa por ración. Los ingredientes salen de la base de Mercadona, así la receta entra en la lista de la compra.</p>
    </section>

    <section class="section">
      <h2 class="section-header">Preparación</h2>
      <div class="group">
        <textarea v-model="form.steps" class="steps" rows="5" placeholder="Un paso por línea" />
      </div>
    </section>

    <div v-if="picking" class="sheet-backdrop" @click.self="picking = false">
      <div class="sheet" role="dialog" aria-label="Añadir ingrediente">
        <div class="sheet-handle" />
        <div class="sheet-bar"><button @click="picking = false">Cancelar</button><strong>Ingrediente</strong><span /></div>
        <div class="search">
          <AppIcon name="search" :size="16" class="muted" />
          <input v-model="search" placeholder="Buscar ingrediente" aria-label="Buscar ingrediente" autofocus>
        </div>
        <div class="group">
          <div class="list">
            <button v-for="i in options" :key="i.id" class="list-row" @click="addIngredient(i.id)">
              <span class="stack grow"><span>{{ i.name }}</span><span class="footnote muted">{{ i.per100.kcal }} kcal / 100 g · {{ i.aisle }}</span></span>
              <AppIcon v-if="form.ingredients.some(([x]) => x === i.id)" name="check" :size="18" class="tint" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.photo { display: block; height: 200px; border-radius: 16px; overflow: hidden; background: var(--card); cursor: pointer; }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--tint); }
.bare { background: none; border: 0; outline: none; font-size: 17px; color: var(--text); min-width: 0; }
.bare::placeholder { color: var(--faint); }
.num-input { width: 64px; text-align: right; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.steps { width: 100%; background: none; border: 0; outline: none; resize: vertical; font-size: 17px; padding: 12px 16px; color: var(--text); }
.search { display: flex; align-items: center; gap: 6px; background: var(--fill); border-radius: 10px; padding: 0 10px; height: 36px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 17px; }
</style>
