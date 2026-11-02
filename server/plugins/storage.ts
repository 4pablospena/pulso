import fsDriver from 'unstorage/drivers/fs'
import upstashDriver from 'unstorage/drivers/upstash'

/**
 * Dónde se guardan los datos: en Upstash (Redis) si hay credenciales — así funciona en Vercel —
 * y si no, en archivos de .data/db para desarrollo local.
 */
export default defineNitroPlugin(() => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  useStorage().mount('db', url && token ? upstashDriver({ url, token, base: 'pulso' }) : fsDriver({ base: './.data/db' }))
})
