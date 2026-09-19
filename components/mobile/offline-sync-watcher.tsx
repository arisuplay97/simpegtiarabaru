"use client"

import { useEffect, useRef } from "react"
import { getMobileQueue, syncMobileOfflineQueue } from "@/lib/offline/absensi-queue"
import { toast } from "sonner"

/**
 * MobileOfflineSyncWatcher
 * Memantau status koneksi internet di seluruh aplikasi PWA Mobile.
 * Begitu perangkat kembali online atau PWA dibuka dalam keadaan online,
 * seluruh antrian presensi offline akan disinkronkan otomatis ke server
 * tanpa perlu menekan tombol manual.
 */
export function MobileOfflineSyncWatcher() {
  const isSyncingRef = useRef(false)

  const performAutoSync = async (silentOnNoQueue = true) => {
    if (isSyncingRef.current || typeof window === "undefined" || !navigator.onLine) {
      return
    }

    try {
      isSyncingRef.current = true
      const queue = await getMobileQueue()
      if (queue.length === 0) {
        return
      }

      const res = await syncMobileOfflineQueue()
      if (res.synced > 0) {
        toast.success(`${res.synced} presensi offline berhasil disinkronkan otomatis ke server!`)
      }
      if (res.failed > 0 && !silentOnNoQueue) {
        toast.error(`Sinkronisasi tertunda: ${res.errors[0] || "Ditolak server"}`)
      }
    } catch (err) {
      console.error("[AutoSync] Error during background sync:", err)
    } finally {
      isSyncingRef.current = false
    }
  }

  useEffect(() => {
    // 1. Sinkronisasi otomatis saat event 'online' native terpanggil
    const handleOnline = () => {
      performAutoSync(false)
    }

    // 2. Sinkronisasi saat user membuka/berpindah tab ke PWA (visibilitychange & focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        performAutoSync(true)
      }
    }

    // 3. Tangani broadcast message dari Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "TRIGGER_OFFLINE_SYNC") {
        performAutoSync(false)
      }
    }

    window.addEventListener("online", handleOnline)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleVisibilityChange)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage)
    }

    // 4. Lakukan pengecekan awal saat komponen dimuat
    if (typeof navigator !== "undefined" && navigator.onLine) {
      // Delay sejenak agar sesi auth sudah terinisialisasi
      const timer = setTimeout(() => {
        performAutoSync(true)
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("online", handleOnline)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        window.removeEventListener("focus", handleVisibilityChange)
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
        }
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleVisibilityChange)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
      }
    }
  }, [])

  return null
}
