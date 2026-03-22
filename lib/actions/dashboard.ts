'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const totalPegawai = await prisma.pegawai.count()
    const totalUser = await prisma.user.count()
    
    // Hitung semua pengajuan yang butuh approval
    const [cuti, mutasi, kgb, pangkat] = await Promise.all([
      prisma.cuti.count({ where: { status: 'PENDING' } }),
      prisma.mutasi.count({ where: { status: 'PENDING' } }),
      prisma.kGB.count({ where: { status: 'PENDING' } }),
      prisma.kenaikanPangkat.count({ where: { status: 'PENDING' } }),
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat
    
    return {
      totalPegawai,
      totalUser,
      approvalPending: approvalPending || 0,
      detail: { cuti, mutasi, kgb, pangkat, sp: 0 }
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

export async function getPegawaiDashboardStats(userId: string) {
  try {
    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: userId },
      select: { id: true, saldoCuti: true, gajiPokok: true, tunjangan: true }
    })

    if (!pegawai) throw new Error("Pegawai not found")
    const pegawaiId = pegawai.id

    // Get today's attendance
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local time
    const checkInDateStart = new Date(`${todayStr}T00:00:00.000Z`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999Z`)

    const absensiToday = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawaiId,
        tanggal: {
          gte: checkInDateStart,
          lte: checkInDateEnd
        }
      }
    })

    // Get latest slip gaji
    const latestPayroll = await prisma.payroll.findFirst({
      where: { pegawaiId: pegawaiId },
      orderBy: { bulan: 'desc' }
    })

    // Count pending approvals from this pegawai
    const [cuti, mutasi, kgb, pangkat, sp] = await Promise.all([
      (prisma as any).cuti.count({ where: { pegawaiId: pegawaiId, status: 'PENDING' } }),
      (prisma as any).mutasi.count({ where: { pegawaiId: pegawaiId, status: 'PENDING' } }),
      (prisma as any).kGB.count({ where: { pegawaiId: pegawaiId, status: 'PENDING' } }),
      (prisma as any).kenaikanPangkat.count({ where: { pegawaiId: pegawaiId, status: 'PENDING' } }),
      (prisma as any).suratPeringatan.count({ where: { pegawaiId: pegawaiId, status: 'PENDING' } }),
    ])

    const totalPending = cuti + mutasi + kgb + pangkat + sp

    return {
      sisaCuti: (pegawai as any).saldoCuti ?? 12,
      statusAbsensi: absensiToday ? absensiToday.status : "Belum Absen",
      waktuAbsen: absensiToday ? (absensiToday.jamMasuk ? new Date(absensiToday.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null) : null,
      gajiTerbaru: latestPayroll ? Number(latestPayroll.total) : (Number((pegawai as any).gajiPokok || 0) + Number((pegawai as any).tunjangan || 0)),
      periodeGaji: latestPayroll ? new Date(latestPayroll.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : "Bulan Ini",
      pengajuanPending: totalPending
    }
  } catch (error) {
    console.warn("Database failed for pegawai stats", error)
    return {
      sisaCuti: 0,
      statusAbsensi: "Error",
      waktuAbsen: null,
      gajiTerbaru: 0,
      periodeGaji: "-",
      pengajuanPending: 0,
      isDemo: true
    }
  }
}
