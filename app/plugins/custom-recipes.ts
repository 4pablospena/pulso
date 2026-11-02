import { setCustomRecipes, type Recipe } from '#shared/data/recipes'

/** Carga las recetas propias de la casa para que el recetario las incluya en toda la app. */
export default defineNuxtPlugin(async () => {
  const { data } = await useFetch<Recipe[]>('/api/recipes/custom', { key: 'custom-recipes', default: () => [] })
  setCustomRecipes(data.value)
  watch(data, (list) => setCustomRecipes(list ?? []))
})
