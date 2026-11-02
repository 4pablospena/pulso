<script setup lang="ts">
import { GOAL_LABEL, sumMacros } from '#shared/core/energy'
import { plannedMeals, portionFactor, recipeMacros } from '#shared/core/nutrition'
import { WEEK_ORDER, WEEKDAYS } from '#shared/core/plan'
import { NUTRITION_PLANS, type NutritionPlan } from '#shared/data/plans'

const { plan: active, settings, activate, targetFor } = usePlan()
const router = useRouter()
const { show } = useToast()
const open = ref<string | null>(null)

/** Media diaria del plan ya ajustada a tu objetivo. */
function average(p: NutritionPlan) {
  const days = WEEK_ORDER.map((d) => {
    const meals = plannedMeals(p, d)
    const f = portionFactor(meals, targetFor(d))
    return sumMacros(meals.map((m) => recipeMacros(m.recipe, f)))
  })
  const total = sumMacros(days)
  return { kcal: Math.round(total.kcal / 7), protein: Math.round(total.protein / 7) }
}

async function choose(p: NutritionPlan) {
  await activate(p.id)
  show(`Plan “${p.name}” activado`)
  router.push('/nutricion')
}

const recommended = computed(() => settings.value?.profile.goal)
</script>

<template>
  <main class="page">
    <PageHeader title="Planes" :back="{ to: '/semana', label: 'Semana' }" />
    <p class="section-footer" style="padding: 0; margin-top: -8px">
      Las raciones se ajustan solas a tu objetivo diario. Puedes cambiar cualquier comida y la lista de Mercadona se genera desde el plan.
    </p>

    <section v-for="p in NUTRITION_PLANS" :key="p.id" class="card" :class="{ active: active?.id === p.id }">
      <div class="row between" style="align-items: flex-start">
        <div>
          <h2 style="margin: 0; font-size: 20px">{{ p.name }}</h2>
          <div class="row wrap" style="gap: 6px; margin-top: 6px">
            <span v-for="g in p.goals" :key="g" class="chip small" :style="{ color: g === recommended ? 'var(--exercise)' : undefined }">{{ GOAL_LABEL[g] }}</span>
            <span class="chip small muted">{{ p.slots.length }} comidas</span>
          </div>
        </div>
        <span v-if="active?.id === p.id" class="chip small" style="background: var(--exercise); color: #000">Activo</span>
      </div>
      <p class="muted" style="margin: 0">{{ p.description }}</p>
      <ul class="highlights"><li v-for="h in p.highlights" :key="h">{{ h }}</li></ul>
      <div class="row" style="gap: 24px">
        <UiMetric label="Media diaria" :value="average(p).kcal" unit="kcal" color="var(--move)" />
        <UiMetric label="Proteína" :value="average(p).protein" unit="g" color="var(--exercise)" />
      </div>

      <button class="small" style="color: var(--stand); text-align: left; font-weight: 600" @click="open = open === p.id ? null : p.id">
        {{ open === p.id ? 'Ocultar menú' : 'Ver menú semanal' }}
      </button>
      <div v-if="open === p.id" class="list">
        <div v-for="d in WEEK_ORDER" :key="d" class="day">
          <strong class="small">{{ WEEKDAYS[d] }}</strong>
          <NuxtLink v-for="m in plannedMeals(p, d)" :key="m.slot" :to="`/recetas/${m.recipe.id}`" class="small meal">
            <span class="muted">{{ m.slot }}</span> {{ m.recipe.name }}
          </NuxtLink>
        </div>
      </div>

      <button v-if="active?.id !== p.id" class="btn" @click="choose(p)">Seguir este plan</button>
      <button v-else class="btn ghost" style="--accent: var(--move)" @click="activate(null)">Dejar el plan</button>
    </section>
  </main>
</template>

<style scoped>
.active { box-shadow: inset 0 0 0 2px var(--exercise); }
.highlights { margin: 0; padding-left: 18px; color: var(--text); font-size: 14px; display: flex; flex-direction: column; gap: 2px; }
.day { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
.meal { display: block; }
</style>
