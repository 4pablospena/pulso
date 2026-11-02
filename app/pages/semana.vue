<script setup lang="ts">
import { dayKey } from '#shared/core/format'
import { dayTitle, WEEKDAYS, type DayPlan, type Routine } from '#shared/core/plan'
import { weekStart } from '#shared/core/planner'
import { recipeById } from '#shared/data/recipes'
import { MEAL_SLOTS, type MealSlot, type PlannedDay } from '#shared/types'

const todayKey = dayKey()
const monday = ref(weekStart(todayKey))
const { data: days, pending } = usePlanner(monday, 7)
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })
const { plan, settings } = usePlan()
const { setMeal, resetMeal, setTraining, resetTraining } = usePlannerActions()
const router = useRouter()
const { show } = useToast()

function shiftWeek(delta: number) {
  const d = new Date(`${monday.value}T12:00:00`)
  d.setDate(d.getDate() + delta * 7)
  monday.value = dayKey(d)
}
const weekLabel = computed(() => {
  const start = new Date(`${monday.value}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  if (monday.value === weekStart(todayKey)) return `Esta semana · ${f(start)} – ${f(end)}`
  return `${f(start)} – ${f(end)}`
})
const isPast = (d: PlannedDay) => d.date < todayKey

const summary = computed(() => {
  const list = days.value
  const n = list.length || 1
  return {
    kcal: Math.round(list.reduce((s, d) => s + d.plannedKcal, 0) / n),
    target: Math.round(list.reduce((s, d) => s + d.targetKcal, 0) / n),
    protein: Math.round(list.reduce((s, d) => s + d.plannedProtein, 0) / n),
    strength: list.filter((d) => d.training.kind === 'strength').length,
    runs: list.filter((d) => d.training.kind === 'run').length,
    unplanned: list.reduce((s, d) => s + d.meals.filter((m) => !m.recipeId).length, 0),
  }
})

// Edición
type MealEdit = { day: PlannedDay; slot: MealSlot; meal?: PlannedDay['meals'][number] }
const editingMeal = ref<MealEdit | null>(null)
const editingTraining = ref<PlannedDay | null>(null)
const missingSlots = (d: PlannedDay) => MEAL_SLOTS.filter((s) => !d.meals.some((m) => m.slot === s))
const dayName = (d: PlannedDay) => `${WEEKDAYS[d.weekday]} ${new Date(`${d.date}T12:00:00`).getDate()}`
const slotLower = (s: MealSlot) => s.toLowerCase()

async function chooseMeal(recipeId: string | null, servings: number) {
  const e = editingMeal.value!
  await setMeal(e.day.date, e.slot, recipeId, servings)
  editingMeal.value = null
}
async function resetMealEdit() {
  const e = editingMeal.value!
  await resetMeal(e.day.date, e.slot)
  editingMeal.value = null
}
async function chooseTraining(t: DayPlan) {
  await setTraining(editingTraining.value!.date, t)
  editingTraining.value = null
}
async function resetTrainingEdit() {
  await resetTraining(editingTraining.value!.date)
  editingTraining.value = null
}

// Compra de esta semana (desde hoy si la semana ya ha empezado)
const generating = ref(false)
async function makeShoppingList() {
  const from = monday.value < todayKey ? todayKey : monday.value
  const end = new Date(`${monday.value}T12:00:00`)
  end.setDate(end.getDate() + 6)
  const daysLeft = Math.round((end.getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000) + 1
  if (daysLeft < 1) return show('Esa semana ya ha pasado')
  generating.value = true
  try {
    await $fetch('/api/shopping/plan', { method: 'POST', body: { from, days: daysLeft } })
    await refreshNuxtData()
    router.push('/compra')
  } catch (e: any) {
    show(e?.data?.message ?? 'No se pudo crear la lista')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <main class="page">
    <PageHeader title="Semana" :eyebrow="plan?.name ?? 'Sin plan nutricional'">
      <NuxtLink to="/planes" class="chip">{{ plan ? 'Plan' : 'Elegir plan' }}</NuxtLink>
    </PageHeader>

    <nav class="week-nav">
      <button class="icon-btn" aria-label="Semana anterior" @click="shiftWeek(-1)"><AppIcon name="chevron-left" :size="18" :weight="2.4" /></button>
      <span class="headline">{{ weekLabel }}</span>
      <button class="icon-btn" aria-label="Semana siguiente" @click="shiftWeek(1)"><AppIcon name="chevron" :size="18" :weight="2.4" /></button>
    </nav>

    <section class="card">
      <div class="grid">
        <UiMetric label="Media planificada" :value="summary.kcal" :unit="`/${summary.target} kcal`" color="var(--move)" />
        <UiMetric label="Proteína media" :value="summary.protein" unit="g" color="var(--exercise)" />
        <UiMetric label="Fuerza" :value="summary.strength" unit="días" color="var(--green)" />
        <UiMetric label="Running" :value="summary.runs" unit="días" color="var(--run)" />
      </div>
      <button class="btn" :disabled="generating" @click="makeShoppingList">
        <AppIcon name="cart" :size="20" :weight="2.2" /> {{ generating ? 'Calculando…' : 'Crear lista de la compra' }}
      </button>
    </section>
    <p v-if="summary.unplanned || !plan" class="section-footer" style="margin-top: -12px">
      <template v-if="!plan">Elige un plan para rellenar la semana sola, o toca cada comida para elegir la receta. </template>
      <template v-if="summary.unplanned">{{ summary.unplanned }} comidas sin planificar no entran en la compra.</template>
    </p>

    <section v-for="d in days" :key="d.date" class="section" :class="{ past: isPast(d) }">
      <div class="day-head">
        <h2 class="section-header" style="padding: 0">{{ dayName(d) }}</h2>
        <span v-if="d.date === todayKey" class="today-pill">HOY</span>
        <span class="grow" />
        <NuxtLink :to="{ path: '/nutricion', query: d.date === todayKey ? {} : { date: d.date } }" class="footnote tint">Diario</NuxtLink>
      </div>
      <div class="group" :class="{ today: d.date === todayKey }">
        <div class="list icons">
          <button class="list-row" @click="editingTraining = d">
            <IconTile :name="trainingStyle(d.training).icon" :color="trainingStyle(d.training).color" />
            <span class="stack grow">
              <span class="ellipsis">{{ dayTitle(d.training, routines) }}</span>
              <span v-if="!d.trainingFromTemplate" class="footnote muted">Cambiado para este día</span>
            </span>
            <AppIcon name="chevron" :size="14" class="chev" />
          </button>
          <button v-for="m in d.meals" :key="m.slot" class="list-row" @click="editingMeal = { day: d, slot: m.slot, meal: m }">
            <IconTile :name="SLOT_STYLE[m.slot].icon" :color="m.recipeId ? SLOT_STYLE[m.slot].color : 'var(--tertiary)'" />
            <span class="stack grow">
              <span class="footnote muted">{{ m.slot }}<template v-if="m.recipeId"> · {{ m.kcal }} kcal</template></span>
              <span class="ellipsis" :class="{ muted: !m.recipeId }">{{ m.recipeId ? recipeById(m.recipeId)?.name : 'Sin planificar' }}</span>
            </span>
            <span v-if="m.servings > 1" class="servings footnote"><AppIcon name="people" :size="14" />{{ m.servings }}</span>
            <AppIcon name="chevron" :size="14" class="chev" />
          </button>
          <button v-for="s in missingSlots(d)" :key="s" class="list-row add" @click="editingMeal = { day: d, slot: s }">
            <IconTile name="plus" color="var(--tertiary)" />
            <span class="grow tint">Añadir {{ slotLower(s) }}</span>
          </button>
        </div>
      </div>
      <div class="day-foot">
        <MacroBar :value="d.plannedKcal" :target="d.targetKcal" color="var(--move)" />
        <span class="footnote muted num">{{ d.plannedKcal }} de {{ d.targetKcal }} kcal</span>
      </div>
    </section>

    <p v-if="pending && !days.length" class="muted">Cargando…</p>

    <RecipePicker v-if="editingMeal" :slot="editingMeal.slot"
                  :title="`${editingMeal.slot} · ${dayName(editingMeal.day)}`"
                  :recipe-id="editingMeal.meal?.recipeId ?? null"
                  :servings="editingMeal.meal?.servings ?? settings?.householdSize ?? 1"
                  :factor="editingMeal.day.factor"
                  :changed="!!editingMeal.meal && !editingMeal.meal.fromTemplate"
                  @choose="chooseMeal" @reset="resetMealEdit" @close="editingMeal = null" />
    <TrainingPicker v-if="editingTraining" :title="`Entreno · ${dayName(editingTraining)}`" :current="editingTraining.training"
                    :routines="routines" :changed="!editingTraining.trainingFromTemplate"
                    @choose="chooseTraining" @reset="resetTrainingEdit" @close="editingTraining = null" />
  </main>
</template>

<style scoped>
.week-nav { display: flex; align-items: center; justify-content: space-between; margin-top: -8px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.past { opacity: 0.5; }
.day-head { display: flex; align-items: center; gap: 8px; padding: 0 16px; }
.today-pill { font-size: 11px; font-weight: 700; color: #000; background: var(--tint); border-radius: 4px; padding: 1px 5px; }
.group.today { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tint) 55%, transparent); }
.servings { display: inline-flex; align-items: center; gap: 3px; color: var(--muted); }
.day-foot { display: flex; align-items: center; gap: 12px; padding: 0 16px; }
.day-foot > :first-child { flex: 1; }
</style>
