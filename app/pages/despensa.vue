<script setup lang="ts">
import { AISLES } from '#shared/core/grocery'
import { amountLabel } from '#shared/core/nutrition'
import { INGREDIENTS, ingredientById } from '#shared/data/foods'

const { data: pantry } = useFetch<Record<string, number>>('/api/pantry', { key: 'pantry', default: () => ({}) })
const { show } = useToast()
const picking = ref(false)
const search = ref('')
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const groups = computed(() => AISLES.map((aisle) => ({
  aisle,
  rows: Object.entries(pantry.value)
    .map(([id, grams]) => ({ ing: ingredientById(id), grams }))
    .filter((r) => r.ing?.aisle === aisle),
})).filter((g) => g.rows.length))
const options = computed(() => INGREDIENTS.filter((i) => !pantry.value[i.id] && (!search.value || normalize(i.name).includes(normalize(search.value)))))

async function setGrams(id: string, grams: number) {
  pantry.value = await $fetch('/api/pantry', { method: 'PUT', body: { ingredientId: id, grams: Math.max(0, grams) } })
}
/** Paso cómodo: una unidad (huevo, plátano…) o 10 % del envase. */
const step = (id: string) => ingredientById(id)?.unitGrams ?? Math.max(10, Math.round((ingredientById(id)?.product.packGrams ?? 100) / 10 / 10) * 10)
async function add(id: string) {
  await setGrams(id, ingredientById(id)?.product.packGrams ?? 100)
  picking.value = false
  search.value = ''
  show(`${ingredientById(id)?.name} en la despensa`)
}
</script>

<template>
  <main class="page">
    <PageHeader title="Despensa" :back="{ to: '/compra', label: 'Compra' }">
      <button class="chip" @click="picking = true"><AppIcon name="plus" :size="14" :weight="2.4" /> Añadir</button>
    </PageHeader>
    <p class="section-footer" style="padding: 0; margin-top: -8px">
      Lo que tengáis aquí se resta de la lista de la compra. Al marcar una comida como hecha se descuentan sus ingredientes, y al terminar la compra puedes pasar lo del carro a la despensa.
    </p>

    <section v-for="g in groups" :key="g.aisle" class="section">
      <h2 class="section-header">{{ g.aisle }}</h2>
      <div class="group">
        <div class="list">
          <div v-for="r in g.rows" :key="r.ing!.id" class="list-row">
            <span class="stack grow">
              <span>{{ r.ing!.name }}</span>
              <span class="footnote muted">{{ amountLabel(r.ing, r.grams) }}<template v-if="!r.ing!.unitGrams"> · {{ Math.round((r.grams / r.ing!.product.packGrams) * 10) / 10 }} × {{ r.ing!.product.format }}</template></span>
            </span>
            <div class="stepper">
              <button aria-label="Menos" @click="setGrams(r.ing!.id, r.grams - step(r.ing!.id))"><AppIcon name="minus" :size="14" :weight="2.4" /></button>
              <button aria-label="Más" @click="setGrams(r.ing!.id, r.grams + step(r.ing!.id))"><AppIcon name="plus" :size="14" :weight="2.4" /></button>
            </div>
            <button class="muted" aria-label="Se ha acabado" @click="setGrams(r.ing!.id, 0)"><AppIcon name="trash" :size="18" /></button>
          </div>
        </div>
      </div>
    </section>
    <p v-if="!groups.length" class="section-footer" style="text-align: center">La despensa está vacía. Añade lo que tengáis en casa.</p>

    <div v-if="picking" class="sheet-backdrop" @click.self="picking = false">
      <div class="sheet" role="dialog" aria-label="Añadir a la despensa">
        <div class="sheet-handle" />
        <div class="sheet-bar"><button @click="picking = false">Cancelar</button><strong>Añadir a la despensa</strong><span /></div>
        <div class="search">
          <AppIcon name="search" :size="16" class="muted" />
          <input v-model="search" placeholder="Buscar ingrediente" aria-label="Buscar ingrediente">
        </div>
        <div class="group">
          <div class="list">
            <button v-for="i in options" :key="i.id" class="list-row" @click="add(i.id)">
              <span class="stack grow"><span>{{ i.name }}</span><span class="footnote muted">{{ i.product.format }}</span></span>
              <AppIcon name="plus" :size="18" :weight="2.4" class="tint" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.stepper { display: inline-flex; align-items: center; background: var(--fill); border-radius: 9px; height: 30px; }
.stepper button { width: 36px; height: 30px; display: grid; place-items: center; }
.stepper button + button { border-left: 0.5px solid var(--line); }
.search { display: flex; align-items: center; gap: 6px; background: var(--fill); border-radius: 10px; padding: 0 10px; height: 36px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 17px; }
</style>
