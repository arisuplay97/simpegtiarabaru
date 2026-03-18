'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  const totalPegawai = await prisma.pegawai.count()
  const totalUser = await prisma.user.count()
  const approvalPending = await prisma.cuti.count({ where: { status: 'PENDING' } })
  // Add more stats as needed

  return {
    totalPegawai,
    totalUser,
    approvalPending
  }
}
