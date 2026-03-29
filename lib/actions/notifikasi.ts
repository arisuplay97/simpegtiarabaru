'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ─── existing functions ────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  if (!userId) return []
  try {
    const list = await prisma.notifikasi.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return list
  } catch (e: any) {
    console.error("Failed to get notifications", e)
    return []
  }
}

export async function getUnreadCount(userId: string) {
  if (!userId) return 0
  try {
    return await prisma.notifikasi.count({
      where: { userId, isRead: false }
    })
  } catch (e) {
    return 0
  }
}

export async function markAsRead(id: string, userId: string) {
  try {
    await prisma.notifikasi.update({
      where: { id },
      data: { isRead: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function markAllAsRead(userId: string) {
  try {
    await prisma.notifikasi.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createNotification(userId: string, title: string, message: string, link?: string) {
  try {
    const notif = await prisma.notifikasi.create({
      data: { userId, title, message, link }
    })
    revalidatePath("/")
    return notif
  } catch (e) {
    console.error("Failed to create UI notification", e)
    return null
  }
}

// ─── BARU: Pengumuman Berjalan (Broadcast ke semua pegawai) ─────────────

/**
 * Ambil pengumuman aktif untuk ticker mobile.
 * Pakai 5 notifikasi terbaru yang di-broadcast secara global (link = "BROADCAST").
 * Ini publik untuk semua user yang login.
 */
export async function getPengumumanAktif() {
  try {
    // Ambil dari Notifikasi yang memiliki link "BROADCAST" dan dibuat dalam 30 hari terakhir
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    const rows = await prisma.notifikasi.findMany({
      where: {
        link: "BROADCAST",
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      distinct: ['title', 'message'],
    })

    // Deduplikasi: ambil unik berdasarkan title+message (karena broadcast = banyak row)
    const seen = new Set<string>()
    return rows.filter(r => {
      const key = `${r.title}||${r.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).map(r => ({ id: r.id, title: r.title, message: r.message, createdAt: r.createdAt }))
  } catch {
    return []
  }
}

/**
 * Admin/HRD: broadcast pengumuman ke SEMUA user yang aktif.
 * Membuat satu notifikasi per user dengan link = "BROADCAST".
 */
export async function broadcastPengumuman(title: string, message: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  const role = (session.user as any).role
  if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
    return { error: "Akses ditolak. Hanya Admin/HRD yang dapat broadcast." }
  }

  try {
    // Ambil semua user aktif
    const users = await prisma.user.findMany({
      select: { id: true },
      where: { pegawai: { status: "AKTIF" } }
    })

    if (users.length === 0) return { error: "Tidak ada pegawai aktif" }

    // Batch create dengan createMany
    await prisma.notifikasi.createMany({
      data: users.map(u => ({
        userId: u.id,
        title,
        message,
        link: "BROADCAST",
        isRead: false,
      }))
    })

    revalidatePath("/notifikasi")
    revalidatePath("/m/dashboard")
    return { success: true, count: users.length }
  } catch (e: any) {
    console.error("broadcastPengumuman error:", e)
    return { error: e.message }
  }
}

/**
 * Admin/HRD: hapus pengumuman broadcast (hapus semua notif dengan title+message yang sama)
 */
export async function hapusPengumuman(title: string, message: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  const role = (session.user as any).role
  if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
    return { error: "Akses ditolak" }
  }

  try {
    const result = await prisma.notifikasi.deleteMany({
      where: { link: "BROADCAST", title, message }
    })
    revalidatePath("/notifikasi")
    return { success: true, deleted: result.count }
  } catch (e: any) {
    return { error: e.message }
  }
}
