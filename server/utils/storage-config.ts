export function hasRedisStorage(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  )
}

export function resolveStoreStorageConfig() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return { driver: 'vercel-kv' as const, base: 'work-time' }
  }
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { driver: 'upstash' as const, base: 'work-time' }
  }
  return { driver: 'fs' as const, base: './data/users' }
}

export async function createRuntimeStoreDriver() {
  const config = resolveStoreStorageConfig()
  if (config.driver === 'vercel-kv') {
    const { default: vercelKVDriver } = await import('unstorage/drivers/vercel-kv')
    return vercelKVDriver({
      base: config.base,
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  if (config.driver === 'upstash') {
    const { default: upstashDriver } = await import('unstorage/drivers/upstash')
    return upstashDriver({
      base: config.base,
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return null
}
