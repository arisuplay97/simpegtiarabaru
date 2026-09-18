/**
 * IndexedDB Helper untuk Antrian Absensi Offline
 * Mendukung presensi selfie desktop dan presensi biometrik mobile (PWA).
 * Menyimpan data saat koneksi terputus dan otomatis melakukan background sync saat online.
 */

const DB_NAME = "hris_offline"
const STORE_NAME = "absensi_queue"
const MOBILE_STORE_NAME = "mobile_absensi_queue"
const DB_VERSION = 2

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

export interface OfflineMobileAbsensiItem {
  id: string
  timestamp: number
  latitude: number
  longitude: number
  accuracy: number
  tipe?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB tidak tersedia di lingkungan ini"))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(MOBILE_STORE_NAME)) {
        db.createObjectStore(MOBILE_STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ─── DESKTOP SELFIE QUEUE ───────────────────────────────────────
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
    req.onsuccess = () => {
      triggerSyncRegister()
      resolve(id)
    }
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

export async function syncOfflineQueue(
  onProgress?: (done: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
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

// ─── MOBILE PWA FINGERPRINT / BIOMETRIK QUEUE ────────────────────
export async function queueMobileAbsensi(item: Omit<OfflineMobileAbsensiItem, "id" | "timestamp">): Promise<string> {
  const db = await openDB()
  const id = `mob_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const record: OfflineMobileAbsensiItem = {
    id,
    timestamp: Date.now(),
    ...item
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOBILE_STORE_NAME, "readwrite")
    const store = tx.objectStore(MOBILE_STORE_NAME)
    const req = store.add(record)
    req.onsuccess = () => {
      triggerSyncRegister()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("offline-queue-updated"))
      }
      resolve(id)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getMobileQueue(): Promise<OfflineMobileAbsensiItem[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MOBILE_STORE_NAME, "readonly")
      const store = tx.objectStore(MOBILE_STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

export async function deleteFromMobileQueue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOBILE_STORE_NAME, "readwrite")
    const store = tx.objectStore(MOBILE_STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("offline-queue-updated"))
      }
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function syncMobileOfflineQueue(
  onProgress?: (done: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const queue = await getMobileQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      const payload = {
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        offlineSync: true,
        offlineTimestamp: item.timestamp
      }

      const response = await fetch("/api/absensi/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await deleteFromMobileQueue(item.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
    onProgress?.(synced + failed, queue.length)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-queue-updated"))
  }

  return { synced, failed }
}

function triggerSyncRegister() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      reg?.sync?.register("sync-absensi").catch(() => {})
    }).catch(() => {})
  }
}
