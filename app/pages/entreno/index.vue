<script setup lang="ts">
import { dayKey, duration, km } from '#shared/core/format'
import { WEEK_ORDER, WEEKDAYS, type DayPlan } from '#shared/core/plan'
import { exerciseHistory, mondayOf, personalRecords, weeklyStats, weekStreak } from '#shared/core/progress'
import { estimatedOneRepMax, volume } from '#shared/core/strength'
import { exerciseById } from '#shared/data/exercises'
import type { IntegrationStatus, Routine, StrengthSession, Workout } from '#shared/types'

const route = useRoute()
const router = useRouter()
const tab = ref<'plan' | 'progress' | 'run'>((route.query.tab as any) ?? 'plan')
watch(tab, (t) => router.replace({ query: { tab: t } }))

const { settings, save } = useSettings()
const { data: sessions } = useFetch<StrengthSession[]>('/api/sessions', { key: 'sessions', default: () => [] })
const { data: routines } = useFetch<Routine[]>('/api/routines', { key: 'routines', default: () => [] })
const { data: integrations } = useFetch<IntegrationStatus>('/api/integrations', { key: 'integrations' })
const { data: day } = useToday()
const { data: strava } = useFetch<Workout[]>('/api/strava/activities', { key: 'strava', default: () => [], immediate: false })
watch(() => integrations.value?.strava.connected, (on) => on && refreshNuxtData('strava'), { immediate: true })

const todayIdx = new Date().getDay()
// Lo que toca hoy según el planificador (puede diferir de la semana habitual).
const { data: plannedToday } = usePlanner(() => dayKey(), 1)
const todayPlan = computed(() => plannedToday.value[0]?.training ?? settings.value?.trainingSchedule[todayIdx])
const inProgress = computed(() => sessions.value.find((s) => !s.end))
const done = computed(() => sessions.value.filter((s) => s.end))
const routineName = (id: string) => routines.value.find((r) => r.id === id)?.name ?? 'Rutina'

// ---- Plan semanal
const scheduleValue = (p?: DayPlan) => (p?.kind === 'strength' ? `r:${p.routineId}` : p?.kind ?? 'rest')
async function setDay(weekday: number, value: string) {
  const plan: DayPlan = value.startsWith('r:') ? { kind: 'strength', routineId: value.slice(2) } : { kind: value as 'run' | 'mobility' | 'rest' }
  await save({ trainingSchedule: { ...settings.value!.trainingSchedule, [weekday]: plan } })
}

async function start(routineId?: string) {
  const session = await $fetch<StrengthSession>('/api/sessions', { method: 'POST', body: { routineId } })
  await refreshNuxtData('sessions')
  router.push(`/entreno/${session.id}`)
}

// ---- Progreso
const weeks = computed(() => weeklyStats(sessions.value, 8))
const maxWeekSessions = computed(() => Math.max(1, ...weeks.value.map((w) => w.sessions)))
const streak = computed(() => weekStreak(sessions.value))
const thisWeek = computed(() => weeks.value.at(-1)!)
const plannedThisWeek = computed(() => Object.values(settings.value?.trainingSchedule ?? {}).filter((d) => d.kind === 'strength').length)

const weekVolume = computed(() => {
  const since = mondayOf(Date.now())
  const byMuscle = new Map<string, number>()
  for (const s of done.value.filter((x) => x.start >= since)) {
    for (const e of s.exercises) byMuscle.set(e.muscle, (byMuscle.get(e.muscle) ?? 0) + e.sets.filter((x) => x.done).length)
  }
  const rows = [...byMuscle].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...rows.map(([, v]) => v))
  return rows.map(([muscle, sets]) => ({ muscle, sets, pct: (sets / max) * 100 }))
})

/** Récords recientes: series que superaron el 1RM estimado anterior de ese ejercicio. */
const recentPRs = computed(() => {
  const prs: { exerciseId: string; date: number; value: number }[] = []
  const best = new Map<string, number>()
  for (const s of [...done.value].sort((a, b) => a.start - b.start)) {
    for (const e of s.exercises) {
      if (e.timed) continue
      const top = Math.max(0, ...e.sets.filter((x) => x.done && x.weightKg > 0).map(estimatedOneRepMax))
      const prev = best.get(e.exerciseId)
      if (top > 0 && prev !== undefined && top > prev) prs.push({ exerciseId: e.exerciseId, date: s.start, value: top })
      if (top > (prev ?? 0)) best.set(e.exerciseId, top)
    }
  }
  return prs.reverse().slice(0, 6)
})

const trained = computed(() => {
  const ids = [...new Set(done.value.flatMap((s) => s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => e.exerciseId)))]
  return ids.map((id) => {
    const h = exerciseHistory(sessions.value, id)
    return { id, ex: exerciseById(id), sessions: h.length, best: personalRecords(h).best1RM, last: h.at(-1)?.date ?? 0 }
  }).sort((a, b) => b.last - a.last)
})

// ---- Running
const runs = computed(() => {
  const fromStrava = strava.value.filter((w) => w.kind === 'run')
  return fromStrava.length ? fromStrava : (day.value?.workouts.filter((w) => w.kind === 'run') ?? [])
})
const weekRuns = computed(() => {
  const list = runs.value.filter((r) => r.start >= mondayOf(Date.now()))
  return { distance: list.reduce((s, r) => s + r.distanceM, 0), time: list.reduce((s, r) => s + r.durationSec, 0) }
})

const short = (t: number) => new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
</script>

<template>
  <main class="page">
    <PageHeader title="Entreno">
      <NuxtLink to="/ejercicios" class="chip">Ejercicios</NuxtLink>
    </PageHeader>

    <div class="segmented">
      <button :class="{ on: tab === 'plan' }" @click="tab = 'plan'">Plan</button>
      <button :class="{ on: tab === 'progress' }" @click="tab = 'progress'">Progreso</button>
      <button :class="{ on: tab === 'run' }" @click="tab = 'run'">Running</button>
    </div>

    <!-- PLAN -->
    <template v-if="tab === 'plan'">
      <section class="section">
        <h2 class="section-header big">Hoy</h2>
        <div class="card">
          <div class="row">
            <IconTile :name="trainingStyle(todayPlan).icon" :color="trainingStyle(todayPlan).color" :size="44" />
            <div class="stack grow">
              <span class="headline ellipsis">{{ inProgress ? inProgress.title : todayPlan?.kind === 'strength' ? routineName(todayPlan.routineId) : trainingStyle(todayPlan).label }}</span>
              <span class="subhead muted">{{ inProgress ? 'En curso' : WEEKDAYS[todayIdx] }}</span>
            </div>
            <NuxtLink v-if="inProgress" :to="`/entreno/${inProgress.id}`" class="btn small">Continuar</NuxtLink>
            <button v-else-if="todayPlan?.kind === 'strength'" class="btn small" @click="start(todayPlan.routineId)">Empezar</button>
            <button v-else class="btn small ghost" @click="start()">Entreno libre</button>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-header big">
          Rutinas
          <NuxtLink to="/rutinas/nueva">Nueva</NuxtLink>
        </h2>
        <div class="group">
          <div class="list icons">
            <div v-for="r in routines" :key="r.id" class="list-row">
              <IconTile name="dumbbell" color="var(--green)" />
              <NuxtLink :to="`/rutinas/${r.id}`" class="stack grow">
                <span>{{ r.name }}</span>
                <span class="footnote muted ellipsis">{{ r.items.length }} ejercicios · {{ r.items.slice(0, 3).map((i) => exerciseById(i.exerciseId)?.name).join(', ') }}</span>
              </NuxtLink>
              <button class="icon-btn" :aria-label="`Empezar ${r.name}`" @click="start(r.id)"><AppIcon name="bolt" :size="16" filled /></button>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-header">Semana habitual</h2>
        <div class="group">
          <div class="list">
            <div v-for="d in WEEK_ORDER" :key="d" class="list-row">
              <span class="grow" :class="{ tint: d === todayIdx }">{{ WEEKDAYS[d] }}</span>
              <select class="inline-select" :value="scheduleValue(settings?.trainingSchedule[d])" @change="setDay(d, ($event.target as HTMLSelectElement).value)">
                <optgroup label="Fuerza">
                  <option v-for="r in routines" :key="r.id" :value="`r:${r.id}`">{{ r.name }}</option>
                </optgroup>
                <option value="run">Running</option>
                <option value="mobility">Movilidad</option>
                <option value="rest">Descanso</option>
              </select>
              <AppIcon name="chevron-down" :size="14" class="chev" />
            </div>
          </div>
        </div>
        <p class="section-footer">Se repite cada semana. Para cambiar un día concreto, usa la pestaña Semana.</p>
      </section>
    </template>

    <!-- PROGRESO -->
    <template v-else-if="tab === 'progress'">
      <section class="card">
        <div class="row" style="gap: 24px">
          <UiMetric label="Racha" :value="streak" :unit="streak === 1 ? 'semana' : 'semanas'" color="var(--strength)" />
          <UiMetric label="Esta semana" :value="`${thisWeek.sessions}/${plannedThisWeek}`" unit="sesiones" />
        </div>
        <div class="weeks">
          <div v-for="w in weeks" :key="w.weekStart" class="week">
            <div class="week-bar" :style="{ height: `${(w.sessions / maxWeekSessions) * 100}%` }" :title="`${w.sessions} sesiones · ${Math.round(w.volume)} kg`" />
            <span class="muted">{{ short(w.weekStart).split(' ')[0] }}</span>
          </div>
        </div>
        <p class="muted small" style="margin: 0">Sesiones por semana (últimas 8)</p>
      </section>

      <section v-if="weekVolume.length" class="card">
        <h2 class="card-title" style="color: var(--strength)">Series por grupo esta semana</h2>
        <div v-for="r in weekVolume" :key="r.muscle" class="bar-row">
          <span class="small" style="width: 92px">{{ r.muscle }}</span>
          <div class="grow"><div class="bar" :style="{ width: `${r.pct}%` }" /></div>
          <span class="small muted" style="width: 56px; text-align: right">{{ r.sets }} series</span>
        </div>
        <p class="muted small" style="margin: 0">Referencia: 10–20 series semanales por grupo para ganar músculo.</p>
      </section>

      <section v-if="recentPRs.length" class="card">
        <h2 class="card-title"><IconTile name="trophy" color="var(--orange)" :size="26" /> Récords recientes</h2>
        <div class="list">
          <NuxtLink v-for="pr in recentPRs" :key="`${pr.exerciseId}-${pr.date}`" :to="`/ejercicios/${pr.exerciseId}`" class="list-row">
            <span class="grow">{{ exerciseById(pr.exerciseId)?.name }}</span>
            <span class="muted small">{{ short(pr.date) }}</span>
            <strong style="color: var(--exercise)">{{ Math.round(pr.value) }} kg</strong>
          </NuxtLink>
        </div>
      </section>

      <section v-if="trained.length" class="card">
        <h2 class="card-title">Por ejercicio</h2>
        <div class="list">
          <NuxtLink v-for="t in trained" :key="t.id" :to="`/ejercicios/${t.id}`" class="list-row">
            <ExerciseThumb v-if="t.ex" :img="t.ex.img" :size="40" />
            <div class="grow">
              <div style="font-weight: 600">{{ t.ex?.name ?? t.id }}</div>
              <div class="muted small">{{ t.sessions }} sesiones · último {{ short(t.last) }}</div>
            </div>
            <strong v-if="t.best" class="small" style="color: var(--exercise)">1RM {{ Math.round(t.best) }}</strong>
            <AppIcon name="chevron" class="muted" />
          </NuxtLink>
        </div>
      </section>

      <section v-if="done.length" class="card">
        <h2 class="card-title">Historial</h2>
        <div class="list">
          <NuxtLink v-for="s in done.slice(0, 15)" :key="s.id" :to="`/entreno/${s.id}`" class="list-row">
            <div class="grow">
              <div style="font-weight: 700">{{ s.title }}</div>
              <div class="muted small">{{ new Date(s.start).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }} · {{ duration((s.end! - s.start) / 1000) }}</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: 700">{{ Math.round(volume(s.exercises.flatMap((e) => e.sets.filter((x) => x.done)))).toLocaleString('es-ES') }} kg</div>
              <div v-if="s.stravaId" class="small" style="color: var(--run)">Strava ✓</div>
            </div>
          </NuxtLink>
        </div>
      </section>
      <p v-else class="muted" style="text-align: center">Completa tu primer entreno para ver tu progreso.</p>
    </template>

    <!-- RUNNING -->
    <template v-else>
      <section class="card">
        <h2 class="card-title" style="color: var(--run)"><AppIcon name="flame" /> Esta semana</h2>
        <div class="row" style="gap: 28px">
          <UiMetric label="Distancia" :value="km(weekRuns.distance)" color="var(--run)" />
          <UiMetric label="Tiempo" :value="duration(weekRuns.time)" />
        </div>
      </section>
      <section v-if="integrations && !integrations.strava.connected" class="card">
        <h2 class="card-title" style="color: var(--run)"><AppIcon name="link" /> Conecta Strava</h2>
        <p class="muted small" style="margin: 0">Mientras tanto se muestran las carreras que lleguen de Apple Salud.</p>
        <NuxtLink to="/ajustes" class="btn" style="--accent: var(--run)">Ir a integraciones</NuxtLink>
      </section>
      <WorkoutCard v-for="r in runs" :key="r.id" :workout="r" :age="settings?.profile.age" />
      <p v-if="!runs.length" class="muted" style="text-align: center">Sin carreras recientes</p>
    </template>
  </main>
</template>

<style scoped>
.inline-select { background: none; border: 0; color: var(--muted); font-size: 17px; text-align: right; -webkit-appearance: none; appearance: none; outline: none; }
.today { background: color-mix(in srgb, var(--strength) 8%, transparent); margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 10px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar { height: 10px; border-radius: 5px; background: var(--strength); transition: width 0.6s ease; }
.weeks { display: flex; align-items: flex-end; gap: 8px; height: 110px; }
.week { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; font-size: 11px; }
.week-bar { width: 100%; min-height: 3px; border-radius: 6px 6px 3px 3px; background: var(--strength); transition: height 0.6s ease; }
.week:last-child .week-bar { background: var(--exercise); }
</style>
