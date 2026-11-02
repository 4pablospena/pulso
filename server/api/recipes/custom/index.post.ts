import { ingredientById } from '#shared/data/foods'
import type { Recipe, RecipeTag } from '#shared/data/recipes'
import { MEAL_SLOTS, type MealSlot } from '#shared/types'

interface Body {
  id?: string
  name: string
  slots: MealSlot[]
  prepMin: number
  tags: RecipeTag[]
  ingredients: [string, number][]
  steps: string[]
  /** Foto como data URL JPEG (ya reducida en el móvil); null la quita. */
  photo?: string | null
}

/** Crea o edita una receta propia; queda disponible para toda la casa. */
export default defineEventHandler(async (event) => {
  const b = await readBody<Body>(event)
  if (!b.name?.trim()) throw createError({ statusCode: 400, message: 'Ponle un nombre a la receta.' })
  const slots = (b.slots ?? []).filter((s) => MEAL_SLOTS.includes(s))
  if (!slots.length) throw createError({ statusCode: 400, message: 'Elige al menos una comida del día.' })
  const ingredients = (b.ingredients ?? []).filter(([id, g]) => ingredientById(id) && g > 0)
  if (!ingredients.length) throw createError({ statusCode: 400, message: 'Añade al menos un ingrediente.' })

  const list = await db.customRecipes.all()
  const existing = list.find((r) => r.id === b.id)
  const id = existing?.id ?? `mia-${newId().slice(0, 8)}`

  if (b.photo) {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(b.photo) || b.photo.length > 600_000) {
      throw createError({ statusCode: 400, message: 'Foto no válida o demasiado grande.' })
    }
    await db.kv.write(`recipe-photo:${id}`, b.photo)
  } else if (b.photo === null) {
    await db.kv.write(`recipe-photo:${id}`, null)
  }

  const recipe: Recipe = {
    id, name: b.name.trim(), slots, prepMin: Math.max(1, Math.round(b.prepMin || 10)),
    tags: b.tags ?? [], ingredients, steps: (b.steps ?? []).map((s) => s.trim()).filter(Boolean),
    custom: true, author: existing?.author ?? currentUser(event)?.name,
    photo: b.photo ? true : b.photo === null ? false : existing?.photo,
  }
  await db.customRecipes.save(existing ? list.map((r) => (r.id === id ? recipe : r)) : [...list, recipe])
  return recipe
})
