'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const totalPegawai = await prisma.pegawai.count()
    const totalUser = await prisma.user.count()
    const approvalPending = await prisma.cuti.count({ where: { status: 'PENDING' } })
    
    return {
      totalPegawai,
      totalUser,
      approvalPending
    }
  } catch (error) {
    console.warn("Database failed, returning mock stats for dashboard")
    return {
      totalPegawai: 156,
      totalUser: 4,
      approvalPending: 8,
      isDemo: true
    }
  }
}
