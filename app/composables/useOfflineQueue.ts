const DB_NAME = 'work-time-offline'
const STORE_NAME = 'pending-store'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function savePendingStore(store: unknown): Promise<void> {
  if (!import.meta.client) return
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(store, 'latest')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function loadPendingStore<T>(): Promise<T | null> {
  if (!import.meta.client) return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get('latest')
      request.onsuccess = () => {
        db.close()
        resolve((request.result as T) ?? null)
      }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  }
  catch {
    return null
  }
}

export async function clearPendingStore(): Promise<void> {
  if (!import.meta.client) return
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete('latest')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export function useOfflineQueue() {
  const isOnline = ref(true)

  onMounted(() => {
    isOnline.value = navigator.onLine
    const onOnline = () => { isOnline.value = true }
    const onOffline = () => { isOnline.value = false }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    onUnmounted(() => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    })
  })

  return { isOnline }
}
