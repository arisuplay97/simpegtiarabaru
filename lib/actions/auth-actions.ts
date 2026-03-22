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
