<script setup lang="ts">
import { bmr, dailyTarget, GOAL_LABEL, type BodyProfile, type Goal } from '#shared/core/energy'
import { FASTING_PROTOCOLS, type FastingProtocol } from '#shared/core/fasting'
import { scheduleFor, WEEK_ORDER, WEEKDAYS, dayTitle, type Routine } from '#shared/core/plan'
import { NUTRITION_PLANS } from '#shared/data/plans'
import type { AppUser } from '#shared/types'

definePageMeta({ layout: false })
const { settings, save } = useSettings()
const { data: me } = useFetch<{ user: AppUser | null }>('/api/me', { key: 'me' })
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })

const step = ref(0)
const STEPS = ['Tú', 'Objetivo', 'Comidas', 'Entreno']

// Paso 1 · datos
const profile = ref<BodyProfile>({ sex: 'female', age: 30, heightCm: 165, weightKg: 62, goal: 'maintain' })
watch(settings, (s) => { if (s?.onboarded) profile.value = { ...s.profile } }, { immediate: true })

// Paso 2 · objetivo
const GOAL_HINT: Record<Goal, string> = {
  cut: 'Perder grasa manteniendo músculo (−20 % de calorías).',
  maintain: 'Mantener tu peso y ganar forma.',
  bulk: 'Ganar músculo con un superávit ligero (+10 %).',
}
const moveGoal = ref(500)
const fasting = ref<FastingProtocol | null>(null)

// Paso 3 · plan nutricional
const planId = ref<string | null>(null)
const plansForGoal = computed(() => [...NUTRITION_PLANS].sort((a, b) =>
  Number(b.goals.includes(profile.value.goal)) - Number(a.goals.includes(profile.value.goal))))
watch(() => profile.value.goal, () => { planId.value = plansForGoal.value[0]?.id ?? null }, { immediate: true })

// Paso 4 · semana de entreno
const strengthDays = ref(3)
const home = ref(false)
const runs = ref(true)
const schedule = computed(() => scheduleFor(strengthDays.value, { home: home.value, runs: runs.value }))

const target = computed(() => dailyTarget(profile.value, moveGoal.value * 0.75, 'normal'))
const valid = computed(() => [
  profile.value.age >= 14 && profile.value.age <= 100 && profile.value.heightCm >= 120 && profile.value.weightKg >= 35,
  true, true, true,
][step.value])

const saving = ref(false)
async function finish() {
  saving.value = true
  await save({
    profile: profile.value,
    moveGoalKcal: moveGoal.value,
    fastingProtocol: fasting.value ?? settings.value?.fastingProtocol ?? '16:8',
    fastingStart: null,
    nutritionPlanId: planId.value,
    nutritionPlanSince: planId.value ? new Date().toISOString().slice(0, 10) : null,
    planOverrides: {},
    trainingSchedule: schedule.value,
    onboarded: true,
  })
  window.location.href = '/'
}
</script>

<template>
  <main class="welcome">
    <header class="top">
      <button v-if="step > 0" class="tint" @click="step--">Atrás</button>
      <span v-else />
      <div class="dots" aria-hidden="true"><span v-for="(s, i) in STEPS" :key="s" :class="{ on: i <= step }" /></div>
      <span class="footnote muted">{{ step + 1 }}/{{ STEPS.length }}</span>
    </header>

    <!-- 1 · Tú -->
    <section v-if="step === 0" class="content">
      <img src="/icon-180.png" alt="" width="72" height="72" class="logo">
      <h1 class="large-title">Hola{{ me?.user ? `, ${me.user.name}` : '' }}</h1>
      <p class="subhead muted">Con estos datos calculamos tus calorías y tu proteína de cada día.</p>
      <div class="group">
        <div class="list">
          <div class="list-row">
            <span class="grow">Sexo</span>
            <div class="segmented" style="width: 180px">
              <button :class="{ on: profile.sex === 'female' }" @click="profile.sex = 'female'">Mujer</button>
              <button :class="{ on: profile.sex === 'male' }" @click="profile.sex = 'male'">Hombre</button>
            </div>
          </div>
          <label class="list-row"><span class="grow">Edad</span><input v-model.number="profile.age" class="cell-input" type="number" inputmode="numeric"><span class="muted">años</span></label>
          <label class="list-row"><span class="grow">Altura</span><input v-model.number="profile.heightCm" class="cell-input" type="number" inputmode="numeric"><span class="muted">cm</span></label>
          <label class="list-row"><span class="grow">Peso</span><input v-model.number="profile.weightKg" class="cell-input" type="number" inputmode="decimal" step="0.1"><span class="muted">kg</span></label>
        </div>
      </div>
      <p class="section-footer">Metabolismo basal estimado: {{ Math.round(bmr(profile)) }} kcal. Si conectas Apple Salud, el peso se actualizará solo.</p>
    </section>

    <!-- 2 · Objetivo -->
    <section v-else-if="step === 1" class="content">
      <h1 class="large-title">Tu objetivo</h1>
      <div class="group">
        <div class="list">
          <button v-for="(label, g) in GOAL_LABEL" :key="g" class="list-row" @click="profile.goal = g as Goal">
            <span class="stack grow"><span>{{ label }}</span><span class="footnote muted">{{ GOAL_HINT[g as Goal] }}</span></span>
            <AppIcon v-if="profile.goal === g" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
        </div>
      </div>

      <h2 class="section-header">Actividad diaria</h2>
      <div class="group">
        <div class="list">
          <div class="list-row">
            <span class="grow">Calorías activas al día</span>
            <div class="stepper">
              <button :disabled="moveGoal <= 200" aria-label="Menos" @click="moveGoal -= 50"><AppIcon name="minus" :size="16" :weight="2.4" /></button>
              <span class="num">{{ moveGoal }}</span>
              <button :disabled="moveGoal >= 1500" aria-label="Más" @click="moveGoal += 50"><AppIcon name="plus" :size="16" :weight="2.4" /></button>
            </div>
          </div>
        </div>
      </div>
      <p class="section-footer">Es tu anillo de Actividad. Si usas Apple Watch, pon el mismo objetivo de «Moverse».</p>

      <h2 class="section-header">Ayuno intermitente</h2>
      <div class="chips-row">
        <button class="chip" :class="{ on: !fasting }" @click="fasting = null">No ayuno</button>
        <button v-for="p in FASTING_PROTOCOLS" :key="p" class="chip" :class="{ on: fasting === p }" @click="fasting = p">{{ p }}</button>
      </div>

      <div class="card summary">
        <span class="footnote muted">Tu objetivo diario aproximado</span>
        <span class="rounded num big" style="color: var(--move)">{{ target.kcal }}<small> kcal</small></span>
        <span class="footnote muted">{{ target.protein }} g de proteína · se ajusta cada día con tu actividad real</span>
      </div>
    </section>

    <!-- 3 · Comidas -->
    <section v-else-if="step === 2" class="content">
      <h1 class="large-title">Tus comidas</h1>
      <p class="subhead muted">Elige un plan: rellena tu semana con recetas sanas, ajusta las raciones a tu objetivo y prepara la compra.</p>
      <div class="group">
        <div class="list">
          <button v-for="p in plansForGoal" :key="p.id" class="list-row" @click="planId = p.id">
            <span class="stack grow">
              <span>{{ p.name }} <span v-if="p.goals.includes(profile.goal)" class="badge">Recomendado</span></span>
              <span class="footnote muted">{{ p.description }}</span>
            </span>
            <AppIcon v-if="planId === p.id" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
          <button class="list-row" @click="planId = null">
            <span class="stack grow"><span>Sin plan</span><span class="footnote muted">Registraré lo que coma por mi cuenta.</span></span>
            <AppIcon v-if="!planId" name="check" :size="18" :weight="2.6" class="tint" />
          </button>
        </div>
      </div>
    </section>

    <!-- 4 · Entreno -->
    <section v-else class="content">
      <h1 class="large-title">Tu semana</h1>
      <div class="group">
        <div class="list">
          <div class="list-row">
            <span class="grow">Días de fuerza</span>
            <div class="segmented" style="width: 180px">
              <button v-for="n in [2, 3, 4, 5]" :key="n" :class="{ on: strengthDays === n }" @click="strengthDays = n">{{ n }}</button>
            </div>
          </div>
          <label class="list-row"><span class="grow">Entreno en casa, sin material</span><input v-model="home" type="checkbox" class="switch"></label>
          <label class="list-row"><span class="grow">Salgo a correr</span><input v-model="runs" type="checkbox" class="switch"></label>
        </div>
      </div>
      <div class="group">
        <div class="list icons">
          <div v-for="d in WEEK_ORDER" :key="d" class="list-row">
            <IconTile :name="trainingStyle(schedule[d]).icon" :color="trainingStyle(schedule[d]).color" />
            <span class="grow">{{ WEEKDAYS[d] }}</span>
            <span class="cell-value">{{ schedule[d]?.kind === 'strength' ? dayTitle(schedule[d], routines).replace('Fuerza · ', '') : trainingStyle(schedule[d]).label }}</span>
          </div>
        </div>
      </div>
      <p class="section-footer">Podrás cambiar cualquier día en Semana y editar las rutinas en Entreno.</p>
    </section>

    <footer class="bottom">
      <button v-if="step < STEPS.length - 1" class="btn" :disabled="!valid" @click="step++">Continuar</button>
      <button v-else class="btn" :disabled="saving" @click="finish">{{ saving ? 'Preparando…' : 'Empezar a usar Pulso' }}</button>
    </footer>
  </main>
</template>

<style scoped>
.welcome { max-width: 560px; margin: 0 auto; min-height: 100dvh; padding: calc(env(safe-area-inset-top) + 8px) 16px calc(env(safe-area-inset-bottom) + 16px); display: flex; flex-direction: column; }
.top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 44px; }
.top > :last-child { justify-self: end; }
.dots { display: flex; gap: 6px; }
.dots span { width: 22px; height: 4px; border-radius: 2px; background: var(--fill-2); transition: background 0.3s; }
.dots span.on { background: var(--tint); }
.content { flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 12px 0 24px; animation: fade-in 0.3s ease; }
.content h1, .content p { margin: 0; }
.logo { border-radius: 16px; }
.cell-input { width: 80px; text-align: right; background: none; border: 0; outline: none; font-size: 17px; color: var(--text); }
.stepper { display: inline-flex; align-items: center; background: var(--fill); border-radius: 9px; height: 32px; }
.stepper button { width: 40px; height: 32px; display: grid; place-items: center; }
.stepper span { min-width: 48px; text-align: center; font-weight: 600; }
.chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
.summary { align-items: flex-start; gap: 2px; }
.big { font-size: 34px; font-weight: 700; line-height: 40px; }
.big small { font-size: 17px; }
.badge { font-size: 11px; font-weight: 600; color: var(--tint); border: 1px solid currentColor; border-radius: 4px; padding: 0 4px; margin-left: 4px; vertical-align: 2px; }
.bottom { position: sticky; bottom: 0; padding-top: 12px; background: linear-gradient(transparent, var(--bg) 30%); }
</style>
