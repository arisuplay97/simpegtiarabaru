'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getSystemUsers() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "HRD")) {
      return { error: "Akses ditolak" }
    }

    const users = await prisma.user.findMany({
      include: {
        pegawai: {
          select: {
            nama: true,
            nik: true,
            jabatan: true,
            status: true,
            bidang: { select: { nama: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { data: users }
  } catch (error: any) {
    console.error("Gagal mengambil data user:", error)
    return { error: error.message }
  }
}

export async function updateSystemUser(id: string, data: any) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return { error: "Hanya Superadmin yang dapat mengedit role/akses user" }
    }

    const updateData: any = {
      role: data.role
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/settings/users")
    return { success: true, data: updated }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteSystemUser(id: string) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return { error: "Akses ditolak" }
    }

    // Hindari hapus diri sendiri
    if (session.user.id === id) {
      return { error: "Anda tidak dapat menghapus akun Anda sendiri" }
    }

    await prisma.user.delete({ where: { id } })
    
    revalidatePath("/settings/users")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function resetUserPassword(id: string) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "HRD")) {
      return { error: "Akses ditolak" }
    }

    const defaultPass = "Simpeg@2025"
    const hashedPassword = await bcrypt.hash(defaultPass, 12)

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true // Paksa ganti password saat login berikutnya
      }
    })

    revalidatePath("/settings/users")
    return { success: true, message: "Password berhasil direset. Pegawai wajib mengganti password saat login berikutnya." }
  } catch (error: any) {
    return { error: error.message }
  }
}
