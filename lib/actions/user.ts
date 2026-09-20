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

    if (data.username !== undefined) {
      const cleanUsername = data.username ? data.username.toLowerCase().trim() : null
      if (cleanUsername) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username: { equals: cleanUsername, mode: "insensitive" },
            id: { not: id }
          }
        })
        if (existingUsername) {
          return { error: "Username ini sudah digunakan oleh akun lain." }
        }
      }
      updateData.username = cleanUsername
    }

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing && existing.id !== id) {
        return { error: "Email ini sudah digunakan oleh akun lain." }
      }
      updateData.email = data.email
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        pegawai: true
      }
    })

    if (data.password && updated.pegawai && updated.pegawai.deviceId) {
      await prisma.pegawai.update({
        where: { id: updated.pegawai.id },
        data: { deviceId: null }
      })
    }

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

    const defaultPass = "Tiara123"
    const hashedPassword = await bcrypt.hash(defaultPass, 10)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true // Paksa ganti password saat login berikutnya
      },
      include: {
        pegawai: true
      }
    })

    if (updatedUser.pegawai && updatedUser.pegawai.deviceId) {
      await prisma.pegawai.update({
        where: { id: updatedUser.pegawai.id },
        data: { deviceId: null }
      })
    }

    revalidatePath("/settings/users")
    return { success: true, message: `Password berhasil direset ke default (${defaultPass}). Perangkat lama telah di-unlink.` }
  } catch (error: any) {
    return { error: error.message }
  }
}
