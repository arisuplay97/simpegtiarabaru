import webpush from "web-push"
import { prisma } from "@/lib/prisma"

// Inisialisasi VAPID Details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BK9Cp74x349_hBDOyKO0saAuWznl42MPWD9yJcSZiNnGZ7YHCPvOBOGCdd3ciWxsl6NKFDcsbaWlIGOugHhVAbU"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "ilpdCW3RfESmKpZ-zYGSPzg3ylab_8r9LbB_FgyCDlw"
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@pdamtiara.co.id"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch (e) {
    console.warn("Failed to initialize VAPID details:", e)
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Menyimpan / memperbarui subscription Web Push milik user di database.
 */
export async function saveSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent || null,
    },
    update: {
      userId,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent || null,
      updatedAt: new Date(),
    },
  })
}

/**
 * Menghapus subscription saat user menonaktifkan notifikasi
 */
export async function deleteSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    })
  } catch {}
}

/**
 * Mengirim notifikasi Push ke satu perangkat spesifik
 */
async function sendToSingleSub(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/m/dashboard",
        tag: payload.tag || "asik-notification",
      })
    )
    return true
  } catch (err: any) {
    // Jika endpoint sudah kadaluarsa (404 atau 410 Gone), hapus dari DB
    if (err.statusCode === 404 || err.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
    } else {
      console.error(`Failed to push to ${sub.endpoint.slice(0, 30)}...:`, err.message)
    }
    return false
  }
}

/**
 * Kirim Web Push ke semua perangkat milik user tertentu
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  await Promise.allSettled(subs.map((s) => sendToSingleSub(s, payload)))
}

/**
 * Broadcast Web Push ke SEMUA perangkat pegawai aktif yang telah mendaftarkan notifikasi PWA
 */
export async function broadcastPushToAll(payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping remote push")
    return
  }

  const subs = await prisma.pushSubscription.findMany({
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  })

  if (subs.length === 0) return

  console.log(`[WebPush] Broadcasting to ${subs.length} active device subscriptions...`)
  await Promise.allSettled(subs.map((s) => sendToSingleSub(s, payload)))
}
