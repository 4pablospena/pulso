<script setup lang="ts">
import { amountLabel, recipeMacros } from '#shared/core/nutrition'
import { ingredientById } from '#shared/data/foods'
import { recipeById } from '#shared/data/recipes'

const route = useRoute()
const recipe = recipeById(route.params.id as string)
if (!recipe) throw createError({ statusCode: 404, statusMessage: 'Receta no encontrada' })

const { show } = useToast()
/** Factor de ración: llega desde el plan (?x=1.15) o se elige aquí. */
const factor = ref(Number(route.query.x) || 1)
const macros = computed(() => recipeMacros(recipe, factor.value))

async function toShopping() {
  const names = recipe!.ingredients.map(([id]) => ingredientById(id)).filter((i) => i && !i.pantry).map((i) => i!.name)
  await $fetch('/api/shopping', { method: 'POST', body: { names } })
  show('Ingredientes añadidos a la compra')
}
</script>

<template>
  <main v-if="recipe" class="page">
    <header>
      <a class="muted small" href="#" @click.prevent="$router.back()">‹ Volver</a>
      <h1 class="title" style="font-size: 28px">{{ recipe.name }}</h1>
      <div class="row wrap" style="gap: 6px; margin-top: 6px">
        <span class="chip small">⏱ {{ recipe.prepMin }} min</span>
        <span v-for="t in recipe.tags" :key="t" class="chip small muted">{{ t }}</span>
      </div>
    </header>

    <section class="card">
      <div class="macros">
        <UiMetric label="Energía" :value="macros.kcal" unit="kcal" color="var(--move)" />
        <UiMetric label="Proteína" :value="Math.round(macros.protein)" unit="g" color="var(--exercise)" />
        <UiMetric label="Hidratos" :value="Math.round(macros.carbs)" unit="g" color="var(--strength)" />
        <UiMetric label="Grasa" :value="Math.round(macros.fat)" unit="g" color="var(--stand)" />
      </div>
      <div class="row between small">
        <span class="muted">Ración</span>
        <div class="segmented">
          <button v-for="f in [0.75, 1, 1.25, 1.5]" :key="f" :class="{ on: Math.abs(factor - f) < 0.01 }" @click="factor = f">×{{ String(f).replace('.', ',') }}</button>
        </div>
      </div>
      <p v-if="route.query.x" class="muted small" style="margin: 0">Ración ajustada a tu objetivo de hoy: ×{{ String(route.query.x).replace('.', ',') }}</p>
    </section>

    <section class="card">
      <h2 class="card-title">Ingredientes</h2>
      <div class="list">
        <div v-for="[id, grams] in recipe.ingredients" :key="id" class="list-row">
          <span class="grow">{{ ingredientById(id)?.name ?? id }}</span>
          <strong>{{ id === 'especias' ? 'al gusto' : amountLabel(ingredientById(id), grams * factor) }}</strong>
        </div>
      </div>
      <button class="btn ghost" style="--accent: var(--exercise)" @click="toShopping"><AppIcon name="cart" /> Añadir ingredientes a la compra</button>
    </section>

    <section class="card">
      <h2 class="card-title">Preparación</h2>
      <ol class="steps"><li v-for="s in recipe.steps" :key="s">{{ s }}</li></ol>
    </section>
  </main>
</template>

<style scoped>
.macros { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; line-height: 1.45; }
.segmented button { padding: 6px 10px; }
</style>
