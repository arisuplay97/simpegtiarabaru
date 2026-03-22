'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const totalPegawai = await prisma.pegawai.count()
    const totalUser = await prisma.user.count()
    
    // Hitung semua pengajuan yang butuh approval
    const [cuti, mutasi, kgb, pangkat, sp] = await Promise.all([
      prisma.cuti.count({ where: { status: 'PENDING' } }),
      prisma.mutasi.count({ where: { status: 'PENDING' } }),
      prisma.kGB.count({ where: { status: 'PENDING' } }),
      prisma.kenaikanPangkat.count({ where: { status: 'PENDING' } }),
      prisma.suratPeringatan.count({ where: { status: 'PENDING' } }),
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat + sp
    
    return {
      totalPegawai,
      totalUser,
      approvalPending: approvalPending || 0,
      detail: { cuti, mutasi, kgb, pangkat, sp }
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
