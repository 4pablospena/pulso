<script setup lang="ts">
import { dayKey } from '#shared/core/format'
import { AISLES, categorize, mercadonaSearchUrl } from '#shared/core/grocery'
import { amountLabel } from '#shared/core/nutrition'
import { weekStart } from '#shared/core/planner'
import { ingredientById } from '#shared/data/foods'
import type { ShoppingItem, ShoppingMeta } from '#shared/types'

const { data: items, refresh: refreshItems } = useFetch<ShoppingItem[]>('/api/shopping', { key: 'shopping', default: () => [] })

// La lista es de la casa: se actualiza sola para ver lo que tachan los demás.
let poll: ReturnType<typeof setInterval> | undefined
const onVisible = () => document.visibilityState === 'visible' && refreshItems()
onMounted(() => {
  poll = setInterval(() => document.visibilityState === 'visible' && refreshItems(), 15_000)
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  clearInterval(poll)
  document.removeEventListener('visibilitychange', onVisible)
})
const { data: meta } = useFetch<ShoppingMeta | null>('/api/shopping/meta', { key: 'shopping-meta' })
const { settings, save } = useSettings()
const { show } = useToast()

const draft = ref('')
const ordering = ref(false)
const generating = ref(false)
const configuring = ref(false)
const sent = ref(new Set<string>())
const expanded = ref<string | null>(null)

// Para qué días es la compra
const todayKey = dayKey()
const nextMonday = (() => {
  const d = new Date(`${weekStart(todayKey)}T12:00:00`)
  d.setDate(d.getDate() + 7)
  return dayKey(d)
})()
const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return dayKey(d) })()
const fromOptions = [
  { value: todayKey, label: 'Hoy' },
  { value: tomorrow, label: 'Mañana' },
  { value: nextMonday, label: 'El próximo lunes' },
]
const from = ref(todayKey)
const days = ref(7)
const fmt = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const rangeLabel = computed(() => {
  if (!meta.value) return null
  const end = new Date(`${meta.value.from}T12:00:00`)
  end.setDate(end.getDate() + meta.value.days - 1)
  const short = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${short(new Date(`${meta.value.from}T12:00:00`))} – ${short(end)} · ${meta.value.days} días`
})

// Listas
const toBuy = computed(() => items.value.filter((i) => !i.checked && !i.have))
const atHome = computed(() => items.value.filter((i) => !i.checked && i.have))
const inCart = computed(() => items.value.filter((i) => i.checked))
const groups = computed(() => AISLES.map((a) => ({ aisle: a, rows: toBuy.value.filter((i) => i.aisle === a) })).filter((g) => g.rows.length))
const packs = computed(() => toBuy.value.reduce((n, i) => n + (i.units ?? 1), 0))
const progress = computed(() => {
  const total = toBuy.value.length + inCart.value.length
  return total ? inCart.value.length / total : 0
})

const searchTerm = (i: ShoppingItem) => i.product ?? i.name
const need = (i: ShoppingItem) => (i.neededGrams ? amountLabel(ingredientById(i.ingredientId ?? ''), i.neededGrams) : '')

async function generate() {
  generating.value = true
  try {
    items.value = await $fetch('/api/shopping/plan', { method: 'POST', body: { from: from.value, days: days.value } })
    await refreshNuxtData('shopping-meta')
    configuring.value = false
    show('Lista calculada desde tu semana')
  } catch (e: any) {
    show(e?.data?.message ?? 'No se pudo generar la lista')
  } finally {
    generating.value = false
  }
}

// Los cambios funcionan sin cobertura: se aplican al momento y se envían en cuanto vuelva la red.
const { send } = useOffline()
async function patch(item: ShoppingItem, body: Partial<ShoppingItem>) {
  items.value = items.value.map((i) => (i.id === item.id ? { ...i, ...body } : i))
  const fresh = await send<ShoppingItem[]>({ method: 'PATCH', url: `/api/shopping/${item.id}`, body })
  if (fresh) items.value = fresh
}
const toggle = (item: ShoppingItem) => patch(item, { checked: !item.checked })
const setHave = (item: ShoppingItem, have: boolean) => patch(item, { have })
const setUnits = (item: ShoppingItem, units: number) => units >= 1 && patch(item, { units })

async function add() {
  if (!draft.value.trim()) return
  items.value = await $fetch('/api/shopping', { method: 'POST', body: { names: [draft.value] } })
  draft.value = ''
}

async function toPantry() {
  const { added } = await $fetch<{ added: number }>('/api/pantry/from-cart', { method: 'POST' })
  await remove('checked')
  await refreshNuxtData('pantry')
  show(added ? `${added} productos guardados en la despensa` : 'Carro vaciado')
}

async function remove(id: string) {
  items.value = items.value.filter((i) => (id === 'checked' ? !i.checked : i.id !== id))
  const fresh = await send<ShoppingItem[]>({ method: 'DELETE', url: `/api/shopping/${id}` })
  if (fresh) items.value = fresh
}

/** Varias personas tienen productos de su plan: se indica de quién es cada uno. */
const severalOwners = computed(() => new Set(items.value.filter((i) => i.ownerName).map((i) => i.ownerName)).size > 1)

/** Texto con formato de WhatsApp (*negrita*, viñetas) agrupado por pasillos. */
const shareText = computed(() => [
  `*Lista de la compra*${rangeLabel.value ? ` · ${rangeLabel.value}` : ''}`,
  ...groups.value.map((g) => `*${g.aisle}*\n${g.rows.map((r) => `• ${r.product ?? r.name}${r.units ? ` × ${r.units}` : ''}`).join('\n')}`),
  '_Enviada desde Pulso_',
].join('\n\n'))
const whatsappUrl = computed(() => `https://wa.me/?text=${encodeURIComponent(shareText.value)}`)

async function share() {
  if (navigator.share) await navigator.share({ title: 'Lista de la compra', text: shareText.value }).catch(() => {})
  else { await navigator.clipboard.writeText(shareText.value); show('Lista copiada') }
}
</script>

<template>
  <main class="page">
    <PageHeader title="Compra" :eyebrow="rangeLabel ?? undefined">
      <NuxtLink to="/despensa" class="icon-btn" aria-label="Despensa"><AppIcon name="house" :size="17" :weight="2.2" /></NuxtLink>
      <button class="icon-btn" aria-label="Compartir lista" :disabled="!toBuy.length" @click="share"><AppIcon name="share" :size="17" :weight="2.2" /></button>
      <button class="chip" style="color: var(--run)" :disabled="!toBuy.length" @click="ordering = true">Mercadona</button>
    </PageHeader>

    <a v-if="toBuy.length" :href="whatsappUrl" target="_blank" rel="noopener" class="btn whatsapp">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" /></svg>
      Enviar por WhatsApp
    </a>

    <!-- De dónde sale la lista -->
    <section v-if="rangeLabel && !configuring" class="card">
      <div class="row">
        <IconTile name="calendar" color="var(--green)" />
        <div class="stack grow">
          <span class="headline">Desde tu planificación</span>
          <span class="footnote muted">{{ settings?.householdSize ?? 1 }} {{ (settings?.householdSize ?? 1) === 1 ? 'persona' : 'personas' }} · {{ toBuy.length }} productos · {{ packs }} envases</span>
        </div>
        <button class="footnote tint" @click="configuring = true">Cambiar</button>
      </div>
      <div class="row footnote">
        <MacroBar class="grow" :value="progress * 100" :target="100" color="var(--green)" />
        <span class="muted num">{{ inCart.length }}/{{ toBuy.length + inCart.length }} en el carro</span>
      </div>
    </section>
    <section v-else class="section">
      <div class="group">
        <div class="list">
          <div class="list-row">
            <span class="grow">Desde</span>
            <select v-model="from" class="inline-select"><option v-for="o in fromOptions" :key="o.value" :value="o.value">{{ o.label }}</option></select>
          </div>
          <div class="list-row">
            <span class="grow">Días</span>
            <select v-model.number="days" class="inline-select"><option v-for="n in [2, 3, 4, 5, 7, 10, 14]" :key="n" :value="n">{{ n }} días</option></select>
          </div>
          <div class="list-row">
            <span class="grow">Personas en casa</span>
            <div class="stepper">
              <button :disabled="(settings?.householdSize ?? 1) <= 1" aria-label="Menos" @click="save({ householdSize: (settings?.householdSize ?? 1) - 1 })"><AppIcon name="minus" :size="16" :weight="2.4" /></button>
              <span class="num">{{ settings?.householdSize ?? 1 }}</span>
              <button aria-label="Más" @click="save({ householdSize: (settings?.householdSize ?? 1) + 1 })"><AppIcon name="plus" :size="16" :weight="2.4" /></button>
            </div>
          </div>
        </div>
      </div>
      <p class="section-footer">Suma los ingredientes de las comidas planificadas en Semana y los convierte en productos y envases de Mercadona.</p>
      <button class="btn" style="margin-top: 8px" :disabled="generating" @click="generate">{{ generating ? 'Calculando…' : 'Calcular lista' }}</button>
      <button v-if="rangeLabel" class="btn plain" @click="configuring = false">Cancelar</button>
    </section>

    <!-- Por comprar, por pasillos -->
    <section v-for="g in groups" :key="g.aisle" class="section">
      <h2 class="section-header">{{ g.aisle }}</h2>
      <div class="group">
        <div class="list checks">
          <div v-for="item in g.rows" :key="item.id">
            <div class="list-row">
              <button class="check" :aria-label="`Al carro: ${item.product ?? item.name}`" @click="toggle(item)" />
              <button class="stack grow" style="text-align: left" @click="expanded = expanded === item.id ? null : item.id">
                <span>{{ item.product ?? item.name }}</span>
                <span v-if="item.source === 'plan'" class="footnote muted">{{ item.format }} · necesitas {{ need(item) }}<template v-if="item.inPantryGrams"> (tienes {{ amountLabel(ingredientById(item.ingredientId ?? ''), item.inPantryGrams) }})</template><template v-if="severalOwners && item.ownerName"> · {{ item.ownerName }}</template></span>
                <span v-else-if="severalOwners && item.ownerName" class="footnote muted">Añadido por {{ item.ownerName }}</span>
              </button>
              <div v-if="item.units" class="stepper small">
                <button aria-label="Menos" @click="setUnits(item, item.units - 1)"><AppIcon name="minus" :size="14" :weight="2.4" /></button>
                <span class="num">{{ item.units }}</span>
                <button aria-label="Más" @click="setUnits(item, item.units + 1)"><AppIcon name="plus" :size="14" :weight="2.4" /></button>
              </div>
            </div>
            <div v-if="expanded === item.id" class="details">
              <p v-if="item.recipes?.length" class="footnote muted" style="margin: 0">Para {{ item.recipes.join(', ') }}</p>
              <div class="row" style="gap: 8px">
                <button class="chip small" @click="setHave(item, true)"><AppIcon name="house" :size="13" /> Ya lo tengo</button>
                <a class="chip small" :href="mercadonaSearchUrl(searchTerm(item))" target="_blank" rel="noopener"><AppIcon name="search" :size="13" /> Mercadona</a>
                <button class="chip small" style="color: var(--red)" @click="remove(item.id)">Quitar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <p v-if="!toBuy.length && !inCart.length && rangeLabel" class="section-footer" style="text-align: center">No te falta nada.</p>

    <!-- Añadir a mano, como un recordatorio nuevo -->
    <form class="group" @submit.prevent="add">
      <div class="list checks">
        <label class="list-row">
          <AppIcon name="plus" :size="22" :weight="2.2" class="tint" style="margin: 0 1px" />
          <input v-model="draft" class="bare grow" placeholder="Añadir producto" enterkeyhint="done">
          <span v-if="draft.trim()" class="footnote muted">{{ categorize(draft) }}</span>
        </label>
      </div>
    </form>

    <section v-if="atHome.length" class="section">
      <h2 class="section-header">Ya lo tienes en casa</h2>
      <div class="group">
        <div class="list checks">
          <div v-for="item in atHome" :key="item.id" class="list-row">
            <AppIcon name="house" :size="20" class="muted" style="margin: 0 2px" />
            <span class="grow muted">{{ item.product ?? item.name }}</span>
            <button class="footnote tint" @click="setHave(item, false)">Comprar</button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="inCart.length" class="section">
      <h2 class="section-header big" style="font-size: 17px">
        <span class="muted">En el carro · {{ inCart.length }}</span>
        <button style="color: var(--red)" @click="remove('checked')">Vaciar</button>
      </h2>
      <div class="group">
        <div class="list checks">
          <div v-for="item in inCart" :key="item.id" class="list-row">
            <button class="check on" :aria-label="`Sacar del carro: ${item.product ?? item.name}`" @click="toggle(item)"><AppIcon name="check" :size="14" :weight="3" /></button>
            <span class="grow muted strike">{{ item.product ?? item.name }}<template v-if="item.units"> × {{ item.units }}</template></span>
          </div>
        </div>
      </div>
      <button class="btn ghost" style="margin-top: 8px" @click="toPantry">Guardar en la despensa y vaciar el carro</button>
    </section>

    <div v-if="ordering" class="sheet-backdrop" @click.self="ordering = false">
      <div class="sheet" role="dialog" aria-label="Pedido en Mercadona">
        <div class="sheet-handle" />
        <div class="sheet-bar"><span /><strong>Pedido en Mercadona</strong><button @click="ordering = false">OK</button></div>
        <div class="group">
          <div class="list">
            <a v-for="item in toBuy" :key="item.id" class="list-row" :href="mercadonaSearchUrl(searchTerm(item))" target="_blank" rel="noopener"
               @click="sent = new Set([...sent, item.id])">
              <span class="grow" :class="{ muted: sent.has(item.id) }">{{ item.product ?? item.name }}</span>
              <span v-if="item.units" class="cell-value num">× {{ item.units }}</span>
              <AppIcon :name="sent.has(item.id) ? 'check' : 'share'" :size="16" :class="sent.has(item.id) ? 'tint' : 'faint'" />
            </a>
          </div>
        </div>
        <p class="section-footer">Mercadona no tiene API pública de carrito: cada producto abre su buscador en tienda.mercadona.es para añadirlo a tu cesta con la cantidad indicada.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.list.checks { --inset: 52px; }
.whatsapp { --accent: #25d366; color: #fff; margin-top: -6px; }
.stepper { display: inline-flex; align-items: center; background: var(--fill); border-radius: 9px; height: 32px; flex: none; }
.stepper button { width: 40px; height: 32px; display: grid; place-items: center; color: var(--text); }
.stepper span { min-width: 22px; text-align: center; font-weight: 600; }
.stepper.small { height: 28px; }
.stepper.small button { width: 30px; height: 28px; }
.inline-select { background: none; border: 0; color: var(--muted); font-size: 17px; text-align: right; -webkit-appearance: none; appearance: none; outline: none; }
.details { display: flex; flex-direction: column; gap: 8px; padding: 0 0 12px 36px; }
.bare { background: none; border: 0; outline: none; font-size: 17px; color: var(--text); }
.bare::placeholder { color: var(--muted); }
.strike { text-decoration: line-through; }
</style>
