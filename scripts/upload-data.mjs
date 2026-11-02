// Copia los datos locales (.data/db) a Upstash para no empezar de cero al desplegar.
// Uso: KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/upload-data.mjs
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import upstashDriver from 'unstorage/drivers/upstash'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.error('Faltan KV_REST_API_URL y KV_REST_API_TOKEN (cópialos de Vercel → Storage → tu base Upstash).')
  process.exit(1)
}

const local = createStorage({ driver: fsDriver({ base: './.data/db' }) })
// Misma base que server/plugins/storage.ts.
const remote = createStorage({ driver: upstashDriver({ url, token, base: 'pulso' }) })

const keys = await local.getKeys()
for (const key of keys) {
  await remote.setItem(key, await local.getItem(key))
  console.log('✓', key)
}
console.log(`${keys.length} claves subidas.`)
