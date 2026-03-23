'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications(userId: string) {
  if (!userId) return []
  try {
    const list = await prisma.notifikasi.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit 50 notif terbaru
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
    revalidatePath("/") // Revalidate the root layout / top-bar
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

// Digunakan oleh sistem (bukan via API langsung dari client)
export async function createNotification(userId: string, title: string, message: string, link?: string) {
  try {
    const notif = await prisma.notifikasi.create({
      data: {
        userId,
        title,
        message,
        link
      }
    })
    // No need to revalidate path directly here as TopBar will poll or use effect upon mount, 
    // but doing revalidatePath("/") is safe to force UI update if server rendering
    revalidatePath("/")
    return notif
  } catch (e) {
    console.error("Failed to create UI notification", e)
    return null
  }
}
