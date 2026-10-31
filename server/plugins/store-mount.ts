import { createRuntimeStoreDriver, hasRedisStorage } from '../utils/storage-config'

export default defineNitroPlugin(async () => {
  if (!hasRedisStorage()) return

  try {
    const driver = await createRuntimeStoreDriver()
    if (!driver) return
    const storage = useStorage()
    storage.unmount('store')
    storage.mount('store', driver)
  }
  catch (error) {
    console.error('[work-time] Не удалось подключить Redis storage в runtime:', error)
    if (process.env.VERCEL) throw error
  }
})
