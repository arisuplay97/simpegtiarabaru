"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getPengaturan() {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    // Selalu gunakan ID "1" untuk pengaturan global
    let pengaturan = await (prisma as any).pengaturan.findUnique({
      where: { id: "1" }
    })

    // Jika belum ada, buat default
    if (!pengaturan) {
      pengaturan = await (prisma as any).pengaturan.create({
        data: { id: "1" }
      })
    }

    return { data: pengaturan }
  } catch (error: any) {
    console.error("Gagal mengambil pengaturan:", error)
    return { error: error.message }
  }
}

export async function updatePengaturan(payload: any) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "HRD")) {
      return { error: "Akses ditolak" }
    }

    // Pastikan ID selalu "1"
    const { id, createdAt, updatedAt, ...updateData } = payload

    const updated = await (prisma as any).pengaturan.update({
      where: { id: "1" },
      data: updateData as any
    })

    revalidatePath("/settings")
    revalidatePath("/absensi")
    revalidatePath("/cuti")
    
    return { success: true, data: updated }
  } catch (error: any) {
    console.error("Gagal memperbarui pengaturan:", error)
    return { error: error.message }
  }
}
