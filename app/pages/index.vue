<script setup lang="ts">
import { FOCUS_LABEL } from '#shared/core/energy'
import { dayKey } from '#shared/core/format'
import { dayTitle, focusFor } from '#shared/core/plan'
import { recipeById } from '#shared/data/recipes'
import type { PlannedDay, Routine } from '#shared/types'

const { data: day } = useToday()
const { settings } = useSettings()
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })
const { plan: nutritionPlan } = usePlan()
const todayKey = dayKey()
const weekday = new Date().getDay()
// Hoy según el planificador (plan + lo que hayas cambiado en Semana).
const { data: planned } = usePlanner(() => todayKey, 1)
const plannedToday = computed(() => planned.value[0])
const training = computed(() => plannedToday.value?.training)
const trainingLook = computed(() => trainingStyle(training.value))
const title = computed(() => dayTitle(training.value, routines.value))
const focus = computed(() => FOCUS_LABEL[focusFor(training.value, weekday)])
const eaten = (m: PlannedDay['meals'][number]) => !!day.value?.foods.some((f) => f.recipeId === m.recipeId && f.slot === m.slot)
const mealsLeft = computed(() => plannedToday.value?.meals.filter((m) => m.recipeId && !eaten(m)).length ?? 0)
const router = useRouter()
const { show } = useToast()

async function markEaten(m: PlannedDay['meals'][number]) {
  await logPlannedMeal(todayKey, m, plannedToday.value!.factor)
  show(`${recipeById(m.recipeId!)?.name} registrado`)
}

const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const waterMl = computed(() => day.value?.water.reduce((s, w) => s + w.ml, 0) ?? 0)
const waterGoal = computed(() => settings.value?.waterGoalMl ?? 2500)
const moveGoal = computed(() => settings.value?.moveGoalKcal ?? 600)
const remaining = computed(() => Math.max(0, (day.value?.target.kcal ?? 0) - (day.value?.eaten.kcal ?? 0)))
const balance = computed(() => Math.round((day.value?.eaten.kcal ?? 0) - (day.value?.burnedKcal ?? 0)))

async function startWorkout() {
  const routineId = training.value?.kind === 'strength' ? training.value.routineId : undefined
  const session = await $fetch<{ id: string }>('/api/sessions', { method: 'POST', body: { routineId } })
  router.push(`/entreno/${session.id}`)
}

async function addWater(ml: number) {
  await $fetch('/api/water', { method: 'POST', body: { ml } })
  await refreshToday()
  show(`${ml} ml de agua añadidos`)
}
</script>

<template>
  <main class="page">
    <PageHeader title="Hoy" :eyebrow="today">
      <NuxtLink to="/ajustes" aria-label="Ajustes" class="avatar"><AppIcon name="user" :size="34" :weight="1.5" /></NuxtLink>
    </PageHeader>

    <!-- Anillos -->
    <section class="section">
      <NuxtLink to="/balance" class="card rings-card">
        <div class="row" style="gap: 18px; align-items: center">
          <ActivityRings v-if="day" :size="132" :stroke="16" :rings="[
            { value: day.eaten.kcal / Math.max(day.target.kcal, 1), color: 'var(--move)' },
            { value: day.eaten.protein / Math.max(day.target.protein, 1), color: 'var(--exercise)' },
            { value: day.activeKcal / moveGoal, color: 'var(--stand)' },
          ]" />
          <div v-if="day" class="ring-metrics">
            <div>
              <div class="headline">Ingesta</div>
              <div class="value rounded num" style="color: var(--move)">{{ Math.round(day.eaten.kcal) }}/{{ day.target.kcal }}<small>KCAL</small></div>
            </div>
            <div>
              <div class="headline">Proteína</div>
              <div class="value rounded num" style="color: var(--exercise)">{{ Math.round(day.eaten.protein) }}/{{ day.target.protein }}<small>G</small></div>
            </div>
            <div>
              <div class="headline">Actividad</div>
              <div class="value rounded num" style="color: var(--stand)">{{ day.activeKcal }}/{{ moveGoal }}<small>KCAL</small></div>
            </div>
          </div>
        </div>
        <div v-if="day" class="ring-foot footnote">
          <span><span class="muted">Te quedan</span> {{ remaining }} kcal</span>
          <span class="muted">Balance <span :style="{ color: balance <= 0 ? 'var(--green)' : 'var(--move)' }">{{ balance > 0 ? '+' : '' }}{{ balance }}</span></span>
          <AppIcon name="chevron" :size="14" class="faint" />
        </div>
      </NuxtLink>
    </section>

    <!-- Entreno -->
    <section class="section">
      <h2 class="section-header big">Entrenamiento</h2>
      <div class="card">
        <div class="row">
          <IconTile :name="trainingLook.icon" :color="trainingLook.color" :size="44" />
          <div class="stack grow">
            <span class="headline ellipsis">{{ title }}</span>
            <span class="subhead muted">{{ focus }}</span>
          </div>
          <button v-if="training?.kind === 'strength'" class="btn small" @click="startWorkout">Empezar</button>
          <a v-else-if="training?.kind === 'run'" class="btn small" style="--accent: var(--run)" href="https://www.strava.com/" target="_blank" rel="noopener">Strava</a>
        </div>
        <p v-if="training?.kind === 'run'" class="footnote muted" style="margin: 0">Grábalo con Strava o el Apple Watch: aparecerá aquí y ajustará tus calorías.</p>
      </div>
    </section>

    <!-- Comidas -->
    <section class="section">
      <h2 class="section-header big">
        Comidas
        <NuxtLink to="/semana">Planificar</NuxtLink>
      </h2>
      <div v-if="plannedToday?.meals.length" class="group">
        <div class="list icons">
          <div v-for="m in plannedToday.meals" :key="m.slot" class="list-row" :class="{ done: eaten(m) }">
            <IconTile :name="SLOT_STYLE[m.slot].icon" :color="SLOT_STYLE[m.slot].color" />
            <NuxtLink :to="m.recipeId ? `/recetas/${m.recipeId}?x=${plannedToday.factor}` : '/semana'" class="stack grow">
              <span class="footnote muted">{{ m.slot }}<template v-if="m.recipeId"> · {{ m.kcal }} kcal</template></span>
              <span class="ellipsis" :class="{ muted: !m.recipeId }">{{ m.recipeId ? recipeById(m.recipeId)?.name : 'Sin planificar' }}</span>
            </NuxtLink>
            <button v-if="m.recipeId" class="check" :class="{ on: eaten(m) }" :disabled="eaten(m)"
                    :aria-label="eaten(m) ? 'Comida registrada' : `Marcar ${m.slot} como comida`" @click="markEaten(m)">
              <AppIcon v-if="eaten(m)" name="check" :size="14" :weight="3" />
            </button>
          </div>
          <NuxtLink to="/nutricion" class="list-row add">
            <IconTile name="plus" color="var(--tertiary)" />
            <span class="grow tint">Registrar otra cosa</span>
            <AppIcon name="chevron" :size="14" class="chev" />
          </NuxtLink>
        </div>
      </div>
      <NuxtLink v-else :to="nutritionPlan ? '/nutricion' : '/planes'" class="group">
        <div class="list icons">
          <div class="list-row">
            <IconTile name="leaf" color="var(--green)" />
            <div class="stack grow">
              <span>{{ nutritionPlan ? 'Diario de hoy' : 'Elige un plan nutricional' }}</span>
              <span class="footnote muted">{{ nutritionPlan ? 'Hoy no hay comidas planificadas.' : 'Menús saludables ajustados a tu objetivo y compra automática.' }}</span>
            </div>
            <AppIcon name="chevron" :size="14" class="chev" />
          </div>
        </div>
      </NuxtLink>
      <p v-if="plannedToday?.meals.length" class="section-footer">
        {{ mealsLeft ? `Te ${mealsLeft === 1 ? 'queda 1 comida' : `quedan ${mealsLeft} comidas`} por registrar.` : 'Has registrado todas las comidas de hoy.' }}
      </p>
    </section>

    <!-- Ayuno e hidratación -->
    <section class="section">
      <h2 class="section-header big">Hábitos</h2>
      <FastingCard />
      <div class="card">
        <div class="row">
          <IconTile name="drop" color="var(--blue)" />
          <div class="stack grow">
            <span class="headline">Agua</span>
            <span class="value-sm rounded num" style="color: var(--blue)">{{ (waterMl / 1000).toFixed(1).replace('.', ',') }}<small> / {{ (waterGoal / 1000).toString().replace('.', ',') }} L</small></span>
          </div>
          <button class="btn small ghost" style="--accent: var(--blue)" @click="addWater(250)">+250 ml</button>
        </div>
        <MacroBar :value="waterMl" :target="waterGoal" color="var(--blue)" />
      </div>
    </section>

    <section v-if="day?.workouts.length" class="section">
      <h2 class="section-header big">Actividad reciente</h2>
      <WorkoutCard v-for="w in day.workouts.slice(0, 2)" :key="w.id" :workout="w" :age="settings?.profile.age" />
    </section>
  </main>
</template>

<style scoped>
.avatar { color: var(--muted); }
.rings-card { gap: 14px; }
.ring-metrics { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.ring-metrics .headline { font-size: 15px; }
.value { font-size: 22px; font-weight: 700; line-height: 26px; letter-spacing: 0; white-space: nowrap; }
.value small, .value-sm small { font-size: 13px; font-weight: 700; margin-left: 2px; }
.value-sm { font-size: 20px; font-weight: 700; }
.ring-foot { display: flex; align-items: center; gap: 12px; padding-top: 12px; border-top: 0.5px solid var(--line); }
.ring-foot > :first-child { flex: 1; }
.done { opacity: 0.5; }
.add { color: var(--tint); }
</style>
