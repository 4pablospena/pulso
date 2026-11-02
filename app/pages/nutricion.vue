<script setup lang="ts">
import { FOCUS_LABEL } from '#shared/core/energy'
import { dayKey } from '#shared/core/format'
import { focusFor } from '#shared/core/plan'
import { recipeById } from '#shared/data/recipes'
import { MEAL_SLOTS, type DaySummary, type FoodEntry, type MealSlot } from '#shared/types'

const route = useRoute()
const router = useRouter()
const todayKey = dayKey()
const parseDate = (q: unknown) => (typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q) && q <= todayKey ? q : todayKey)
/** Día abierto; se refleja en la URL (?date=YYYY-MM-DD) para poder enlazarlo desde Balance. */
const date = ref(parseDate(route.query.date))
watch(() => route.query.date, (q) => { date.value = parseDate(q) })
const isToday = computed(() => date.value === todayKey)
// Sin clave fija: cada día se cachea aparte y cambiar de día siempre trae sus datos.
const { data: day } = useFetch<DaySummary>(() => `/api/day/${date.value}`)
const { show } = useToast()
const { plan, settings } = usePlan()
// Comidas planificadas de este día (plan + cambios hechos en Semana).
const { data: plannedDays } = usePlanner(date, 1)
const { setMeal, resetMeal } = usePlannerActions()
const weekday = computed(() => new Date(`${date.value}T12:00:00`).getDay())

function shift(delta: number) {
  const d = new Date(`${date.value}T12:00:00`)
  d.setDate(d.getDate() + delta)
  date.value = dayKey(d)
  router.replace({ query: date.value === todayKey ? {} : { date: date.value } })
}
const dateLabel = computed(() => {
  if (isToday.value) return 'Hoy'
  const d = new Date(`${date.value}T12:00:00`)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dayKey(yesterday) === date.value) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
})
const addingTo = ref<MealSlot | null>(null)
const swapping = ref<MealSlot | null>(null)

const focus = computed(() => FOCUS_LABEL[focusFor(settings.value?.trainingSchedule[weekday.value], weekday.value)])
const today = computed(() => plannedDays.value[0])
/** Comida planificada de una franja, con su receta ya resuelta. */
const plannedFor = (slot: MealSlot) => {
  const m = today.value?.meals.find((x) => x.slot === slot && x.recipeId)
  const recipe = m ? recipeById(m.recipeId!) : undefined
  return m && recipe ? { ...m, recipe, swapped: !m.fromTemplate } : undefined
}
const visibleSlots = computed(() => MEAL_SLOTS.filter((s) => !plan.value || today.value?.meals.some((m) => m.slot === s) || bySlot(s).length))
const bySlot = (slot: MealSlot) => day.value?.foods.filter((f) => f.slot === slot) ?? []
const kcalOf = (slot: MealSlot) => Math.round(bySlot(slot).reduce((s, f) => s + f.macros.kcal, 0))
const eaten = (slot: MealSlot, recipeId: string) => bySlot(slot).some((f) => f.recipeId === recipeId)
const remaining = computed(() => Math.max(0, (day.value?.target.kcal ?? 0) - (day.value?.eaten.kcal ?? 0)))

async function logPlanned(slot: MealSlot) {
  const m = today.value!.meals.find((x) => x.slot === slot)!
  await logPlannedMeal(date.value, m, today.value!.factor)
  show(`${recipeById(m.recipeId!)?.name} registrado`)
}

async function choose(recipeId: string | null, servings: number) {
  await setMeal(date.value, swapping.value!, recipeId, servings)
  swapping.value = null
}

async function backToPlan() {
  await resetMeal(date.value, swapping.value!)
  swapping.value = null
}

async function remove(f: FoodEntry) {
  await $fetch(`/api/foods/${day.value!.date}/${f.id}`, { method: 'DELETE' })
  await refreshToday()
}

const burned = computed(() => day.value?.burnedKcal ?? 0)
const balance = computed(() => Math.round((day.value?.eaten.kcal ?? 0) - burned.value))

</script>

<template>
  <main class="page">
    <PageHeader title="Diario" :eyebrow="focus" :back="{ to: '/', label: 'Hoy' }">
      <NuxtLink to="/balance" class="chip">Balance</NuxtLink>
    </PageHeader>
    
    <nav class="day-nav">
      <button class="icon-btn" aria-label="Día anterior" @click="shift(-1)"><AppIcon name="chevron-left" :size="18" :weight="2.4" /></button>
      <span class="headline">{{ dateLabel }}</span>
      <button class="icon-btn" aria-label="Día siguiente" :disabled="isToday" @click="shift(1)"><AppIcon name="chevron" :size="18" :weight="2.4" /></button>
    </nav>

    <section v-if="day" class="card">
      <div class="row between" style="align-items: flex-end">
        <UiMetric label="Restantes" :value="remaining" unit="kcal" color="var(--move)" />
        <div style="text-align: right" class="small">
          <div><strong>Objetivo {{ day.target.kcal }}</strong></div>
          <div style="color: var(--stand); font-weight: 600">+{{ day.activeKcal }} kcal de actividad</div>
        </div>
      </div>
      <MacroBar label="Proteína" :value="day.eaten.protein" :target="day.target.protein" color="var(--exercise)" />
      <MacroBar label="Carbohidratos" :value="day.eaten.carbs" :target="day.target.carbs" color="var(--strength)" />
      <MacroBar label="Grasas" :value="day.eaten.fat" :target="day.target.fat" color="var(--move)" />
      <div class="balance-row small">
        <span><span class="muted">Comidas</span> <strong>{{ Math.round(day.eaten.kcal) }}</strong></span>
        <span><span class="muted">Quemadas</span> <strong>{{ burned }}</strong></span>
        <span><span class="muted">Balance</span> <strong :style="{ color: balance <= 0 ? 'var(--exercise)' : 'var(--move)' }">{{ balance > 0 ? '+' : '' }}{{ balance }}</strong></span>
      </div>
    </section>

    <NuxtLink v-if="!plan" to="/planes" class="card cta">
      <h2 class="card-title"><IconTile name="leaf" color="var(--green)" :size="26" /> Sigue un plan nutricional</h2>
      <p class="muted small" style="margin: 0">Menús semanales saludables ajustados a tu objetivo, registro en un toque y lista de Mercadona automática.</p>
    </NuxtLink>
    <p v-else class="muted small" style="margin: 0">
      {{ plan.name }} · raciones ×{{ String(today?.factor ?? 1).replace('.', ',') }} para tus {{ day?.target.kcal }} kcal
    </p>

    <FastingCard v-if="isToday" />

    <section v-for="slot in visibleSlots" :key="slot" class="card">
      <div class="row between">
        <h2 class="card-title"><IconTile :name="SLOT_STYLE[slot].icon" :color="SLOT_STYLE[slot].color" :size="26" /> {{ slot }}</h2>
        <span v-if="kcalOf(slot)" class="muted small">{{ kcalOf(slot) }} kcal</span>
      </div>

      <div v-if="plannedFor(slot)" class="planned" :class="{ done: eaten(slot, plannedFor(slot)!.recipe.id) }">
        <NuxtLink :to="`/recetas/${plannedFor(slot)!.recipe.id}?x=${today?.factor ?? 1}`" class="grow">
          <div class="small" style="color: var(--exercise); font-weight: 700">Plan{{ plannedFor(slot)!.swapped ? ' · cambiado' : '' }}</div>
          <div style="font-weight: 700">{{ plannedFor(slot)!.recipe.name }}</div>
          <div class="muted small">
            {{ plannedFor(slot)!.kcal }} kcal · P {{ plannedFor(slot)!.protein }} g · {{ plannedFor(slot)!.recipe.prepMin }} min
          </div>
        </NuxtLink>
        <div class="actions">
          <button v-if="!eaten(slot, plannedFor(slot)!.recipe.id)" class="chip" style="background: var(--tint); color: var(--on-tint)" @click="logPlanned(slot)">Comido</button>
          <span v-else class="chip" style="color: var(--exercise)"><AppIcon name="check" :size="13" :weight="3" /> Hecho</span>
          <button class="chip small" @click="swapping = slot">Cambiar</button>
        </div>
      </div>

      <div v-if="bySlot(slot).length" class="list">
        <div v-for="f in bySlot(slot)" :key="f.id" class="list-row">
          <div class="grow">
            <div style="font-weight: 600">{{ f.name }} <AppIcon v-if="f.source === 'photo'" name="camera" :size="14" class="muted" style="display: inline; vertical-align: -2px" /></div>
            <div class="muted small">{{ f.grams }} g · P {{ Math.round(f.macros.protein) }} · C {{ Math.round(f.macros.carbs) }} · G {{ Math.round(f.macros.fat) }}</div>
          </div>
          <strong style="color: var(--move)">{{ Math.round(f.macros.kcal) }}</strong>
          <button class="muted" aria-label="Borrar" @click="remove(f)"><AppIcon name="trash" /></button>
        </div>
      </div>
      <button class="row" style="color: var(--exercise); font-weight: 600" @click="addingTo = slot">
        <AppIcon name="plus" /> {{ plannedFor(slot) ? 'Otra cosa (foto, código…)' : 'Añadir' }}
      </button>
    </section>

    <AddFoodSheet v-if="addingTo" :slot="addingTo" :date="date" @close="addingTo = null" />

    <RecipePicker v-if="swapping" :slot="swapping" :title="`Cambiar ${swapping.toLowerCase()} · ${dateLabel}`"
                  :recipe-id="plannedFor(swapping)?.recipeId ?? null"
                  :servings="plannedFor(swapping)?.servings ?? settings?.householdSize ?? 1"
                  :factor="today?.factor ?? 1" :changed="!!plannedFor(swapping)?.swapped"
                  @choose="choose" @reset="backToPlan" @close="swapping = null" />
  </main>
</template>

<style scoped>
.day-nav { display: flex; align-items: center; justify-content: space-between; margin-top: -8px; }
.balance-row { display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 10px; }
.cta { text-decoration: none; box-shadow: inset 0 0 0 1px var(--exercise); }
.planned { display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 14px; background: var(--raised); }
.planned.done { opacity: 0.6; }
.actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
</style>
