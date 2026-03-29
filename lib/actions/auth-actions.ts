'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"

export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password minimal 8 karakter" }
  }

  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return { error: "Tidak terautentikasi" }

  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    })
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal mengganti password: " + error.message }
  }
}

export async function changePasswordWithVerification(currentPassword: string, newPassword: string) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return { error: "Tidak terautentikasi" }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: "User tidak ditemukan" }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return { error: "Password saat ini salah!" }

    if (!newPassword || newPassword.length < 8) {
      return { error: "Password baru minimal 8 karakter" }
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    })
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal mengganti password: " + error.message }
  }
}
