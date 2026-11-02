import type { ShoppingMeta } from '#shared/types'

export default defineEventHandler(() => db.kv.read<ShoppingMeta | null>('shopping-meta', null))
