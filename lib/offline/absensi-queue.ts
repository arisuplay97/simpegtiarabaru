/**
 * IndexedDB Helper untuk Antrian Absensi Offline
 * Menyimpan data absensi saat tidak ada koneksi internet,
 * lalu sync otomatis saat online kembali.
 */

const DB_NAME = "hris_offline"
const STORE_NAME = "absensi_queue"
const DB_VERSION = 1

export interface OfflineAbsensiItem {
  id: string
  timestamp: number
  foto: string         // base64 dataUrl
  latitude: number
  longitude: number
  accuracy: number
  faceVerified: boolean
  faceAttempts: number
  deviceId?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queueAbsensi(item: Omit<OfflineAbsensiItem, "id" | "timestamp">): Promise<string> {
  const db = await openDB()
  const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const record: OfflineAbsensiItem = {
    id,
    timestamp: Date.now(),
    ...item
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(record)
    req.onsuccess = () => resolve(id)
    req.onerror = () => reject(req.error)
  })
}

export async function getQueue(): Promise<OfflineAbsensiItem[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFromQueue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function clearQueue(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Sync semua antrian offline ke server
 * Dipanggil otomatis saat koneksi kembali
 */
export async function syncOfflineQueue(
  onProgress?: (done: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      // Konversi base64 kembali ke File
      const res = await fetch(item.foto)
      const blob = await res.blob()
      const file = new File([blob], "selfie_offline.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("foto", file)
      formData.append("latitude", String(item.latitude))
      formData.append("longitude", String(item.longitude))
      formData.append("faceVerified", String(item.faceVerified))
      formData.append("faceAttempts", String(item.faceAttempts))
      formData.append("offlineSync", "true")
      formData.append("offlineTimestamp", String(item.timestamp))
      if (item.deviceId) formData.append("deviceId", item.deviceId)

      const response = await fetch("/api/absensi/selfie", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await deleteFromQueue(item.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
    onProgress?.(synced + failed, queue.length)
  }

  return { synced, failed }
}
