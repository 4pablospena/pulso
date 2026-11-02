<script setup lang="ts">
import { balanceOf, historyStats, onTarget, type HistoryDay } from '#shared/core/balance'
import type { WeightEntry } from '#shared/types'

const range = ref<7 | 30>(7)
const { data: days } = useFetch<HistoryDay[]>(() => `/api/history?days=${range.value}`, { key: 'history', default: () => [] })
const { data: weights } = useFetch<WeightEntry[]>('/api/weight', { key: 'weights', default: () => [] })
const { settings } = useSettings()
const { show } = useToast()
const router = useRouter()

const stats = computed(() => historyStats(days.value))
const list = computed(() => [...days.value].reverse())
const fmtKg = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}`
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const openDay = (date: string) => router.push({ path: '/nutricion', query: { date } })

// Peso
const newWeight = ref<number | null>(null)
const lastWeight = computed(() => weights.value.at(-1) ?? null)
const weightPoints = computed(() => weights.value.slice(-60).map((w) => ({ t: new Date(`${w.date}T12:00:00`).getTime(), v: w.kg })))
async function saveWeight() {
  if (!newWeight.value) return
  weights.value = await $fetch('/api/weight', { method: 'POST', body: { kg: newWeight.value } })
  newWeight.value = null
  await refreshNuxtData(['history', 'settings', 'today'])
  show('Peso anotado')
}

const goalHint = computed(() => {
  const goal = settings.value?.profile.goal
  if (goal === 'cut') return 'Objetivo definición: buscas un déficit de 300–600 kcal al día.'
  if (goal === 'bulk') return 'Objetivo volumen: buscas un superávit ligero de 200–300 kcal al día.'
  return 'Objetivo mantenimiento: buscas un balance cercano a 0.'
})
</script>

<template>
  <main class="page">
    <PageHeader title="Balance" :back="{ to: '/', label: 'Hoy' }" />

    <div class="segmented">
      <button :class="{ on: range === 7 }" @click="range = 7">7 días</button>
      <button :class="{ on: range === 30 }" @click="range = 30">30 días</button>
    </div>

    <section class="card">
      <h2 class="card-title">Comidas frente a quemadas</h2>
      <BalanceChart :days="days" @select="openDay" />
      <p v-if="!stats.loggedDays" class="muted small" style="margin: 0">
        Aún no hay comidas registradas en estos días. Registra en Nutrición (también días pasados con ‹ ›) y aquí verás tu balance.
      </p>
    </section>

    <section v-if="stats.loggedDays" class="card">
      <div class="grid">
        <UiMetric label="Media comidas" :value="stats.avgEaten" unit="kcal" color="var(--move)" />
        <UiMetric label="Media quemadas" :value="stats.avgBurned" unit="kcal" color="var(--stand)" />
        <UiMetric label="Balance medio" :value="`${stats.avgBalance > 0 ? '+' : ''}${stats.avgBalance}`" unit="kcal/día"
                  :color="stats.avgBalance <= 0 ? 'var(--exercise)' : 'var(--move)'" />
        <UiMetric label="Proteína media" :value="stats.avgProtein" unit="g" color="var(--exercise)" />
        <UiMetric label="Días en objetivo" :value="`${stats.daysOnTarget}/${stats.loggedDays}`" />
        <UiMetric v-if="stats.planAdherence != null" label="Plan cumplido" :value="Math.round(stats.planAdherence * 100)" unit="%" color="var(--exercise)" />
      </div>
      <p class="muted small" style="margin: 0">
        {{ goalHint }} Las medias solo cuentan los {{ stats.loggedDays }} días con comidas registradas.
        «Quemadas» = basal + actividad cotidiana + energía activa de Salud/Strava (estimación).
      </p>
    </section>

    <section class="card">
      <h2 class="card-title"><IconTile name="scale" color="var(--indigo)" :size="26" /> Peso</h2>
      <div class="row" style="gap: 24px">
        <UiMetric label="Último" :value="lastWeight ? String(lastWeight.kg).replace('.', ',') : (settings?.profile.weightKg ?? '–')" unit="kg" />
        <UiMetric label="Cambio real" :value="stats.actualKgChange != null ? fmtKg(stats.actualKgChange) : '–'" unit="kg"
                  :color="stats.actualKgChange != null && stats.actualKgChange < 0 ? 'var(--exercise)' : undefined" />
        <UiMetric label="Según balance" :value="fmtKg(stats.expectedKgChange)" unit="kg" color="var(--stand)" />
      </div>
      <LineChart v-if="weightPoints.length > 1" :points="weightPoints" color="var(--strength)" :height="120" />
      <form class="row" @submit.prevent="saveWeight">
        <input v-model.number="newWeight" class="field" type="number" inputmode="decimal" step="0.1" placeholder="Peso de hoy (kg)">
        <button class="btn small" style="--accent: var(--strength)" :disabled="!newWeight">Anotar</button>
      </form>
      <p class="muted small" style="margin: 0">
        También llega solo desde la báscula vía Apple Salud. «Según balance» estima el cambio con 7.700 kcal ≈ 1 kg:
        si se aleja del real, revisa que registras todo lo que comes.
      </p>
    </section>

    <section class="card">
      <h2 class="card-title">Día a día</h2>
      <div class="list">
        <button v-for="d in list" :key="d.date" class="list-row" style="text-align: left" @click="openDay(d.date)">
          <div class="grow">
            <div style="font-weight: 600">{{ dateLabel(d.date) }}</div>
            <div class="muted small">
              <template v-if="d.logged">{{ Math.round(d.eaten.kcal) }} comidas · {{ d.burnedKcal }} quemadas · P {{ Math.round(d.eaten.protein) }} g</template>
              <template v-else>Sin comidas registradas</template>
              <template v-if="d.planTotal"> · plan {{ d.planDone }}/{{ d.planTotal }}</template>
            </div>
          </div>
          <strong v-if="d.logged" :style="{ color: balanceOf(d) <= 0 ? 'var(--exercise)' : 'var(--move)' }">
            {{ balanceOf(d) > 0 ? '+' : '' }}{{ balanceOf(d) }}
          </strong>
          <AppIcon v-if="onTarget(d)" name="check" :size="16" :weight="2.6" class="tint" aria-label="En objetivo" />
          <AppIcon name="chevron" class="muted" />
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
</style>
