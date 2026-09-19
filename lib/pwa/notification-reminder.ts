/**
 * Web Push & Attendance Reminder Helper for ASIK PWA
 * Mendukung pengingat otomatis sebelum jam presensi masuk dan pulang.
 */

const REMINDER_KEY = "asik_push_reminder_enabled"
const LAST_NOTIFIED_KEY = "asik_last_reminder_date"

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
}

export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission
}

export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false
  try {
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      localStorage.setItem(REMINDER_KEY, "true")
      return true
    }
    return false
  } catch {
    return false
  }
}

export function isReminderEnabled(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(REMINDER_KEY) === "true" && Notification.permission === "granted"
}

export function toggleReminder(enabled: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem(REMINDER_KEY, enabled ? "true" : "false")
}

export async function triggerNotification(title: string, body: string, url: string = "/m/fingerprint") {
  if (!isPushSupported() || Notification.permission !== "granted") return

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: "/slip.png",
          badge: "/slip.png",
          vibrate: [100, 50, 100],
          data: { url }
        } as any)
        return
      }
    }

    // Fallback standard notification
    new Notification(title, { body, icon: "/slip.png" })
  } catch (e) {
    console.warn("Failed to show notification:", e)
  }
}

/**
 * Memeriksa jam sekarang terhadap batas absen masuk/pulang
 * Mengirim notifikasi pengingat jika sudah masuk 15-30 menit sebelum batas jam.
 */
export function checkAndSendSmartReminder(settings?: {
  batasMasuk?: string
  mulaiPulang?: string
  sudahMasuk?: boolean
  sudahPulang?: boolean
}) {
  if (!isReminderEnabled()) return

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeMinutes = currentHour * 60 + currentMinute

  const batasMasukStr = settings?.batasMasuk || "14:00"
  const mulaiPulangStr = settings?.mulaiPulang || "16:00"

  const [bmH, bmM] = batasMasukStr.split(":").map(Number)
  const batasMasukMinutes = bmH * 60 + (bmM || 0)

  const [mpH, mpM] = mulaiPulangStr.split(":").map(Number)
  const mulaiPulangMinutes = mpH * 60 + (mpM || 0)

  const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY)

  // 1. Pengingat Pagi / Siang: Belum Masuk dan mendekati batas tutup (misal 30 menit sebelum batas)
  if (!settings?.sudahMasuk && (batasMasukMinutes - currentTimeMinutes <= 30) && (batasMasukMinutes - currentTimeMinutes > 0)) {
    const notifyKey = `${todayStr}_masuk_urgent`
    if (lastNotified !== notifyKey) {
      triggerNotification(
        "⏰ Waktunya Presensi Masuk!",
        `Halo! Batas absensi masuk ditutup pukul ${batasMasukStr}. Segera lakukan presensi sekarang.`
      )
      localStorage.setItem(LAST_NOTIFIED_KEY, notifyKey)
    }
    return
  }

  // 2. Pengingat Pulang: Sudah masuk, belum pulang, dan jam sudah melewati jam mulai pulang
  if (settings?.sudahMasuk && !settings?.sudahPulang && currentTimeMinutes >= mulaiPulangMinutes && (currentTimeMinutes - mulaiPulangMinutes <= 45)) {
    const notifyKey = `${todayStr}_pulang`
    if (lastNotified !== notifyKey) {
      triggerNotification(
        "👋 Waktunya Presensi Pulang!",
        `Jam kerja hari ini telah selesai. Jangan lupa tap presensi pulang sebelum meninggalkan area.`
      )
      localStorage.setItem(LAST_NOTIFIED_KEY, notifyKey)
    }
  }
}
