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
