'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA')
    const checkInDateStart = new Date(`${todayStr}T00:00:00.000Z`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999Z`)

    const [
      totalPegawai,
      totalUser,
      cuti, mutasi, kgb, pangkat,
      absensiToday,
      kontrakTerdekat,
      allPegawai
    ] = await Promise.all([
      prisma.pegawai.count({ where: { status: 'AKTIF' } }),
      prisma.user.count(),
      prisma.cuti.count({ where: { status: 'PENDING' } }),
      prisma.mutasi.count({ where: { status: 'PENDING' } }),
      prisma.kGB.count({ where: { status: 'PENDING' } }),
      prisma.kenaikanPangkat.count({ where: { status: 'PENDING' } }),
      prisma.absensi.findMany({
        where: { tanggal: { gte: checkInDateStart, lte: checkInDateEnd } }
      }),
      (prisma as any).kontrak.findMany({
        where: { status: 'AKTIF' },
        orderBy: { tanggalSelesai: 'asc' },
        take: 5,
        include: { pegawai: { select: { nama: true, jabatan: true, fotoUrl: true } } }
      }),
      prisma.pegawai.findMany({
        where: { status: 'AKTIF', tanggalLahir: { not: null }, tipeJabatan: { notIn: ['KONTRAK'] } },
        select: { id: true, nama: true, jabatan: true, tanggalLahir: true, fotoUrl: true }
      })
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat

    // 1. Kehadiran Hari Ini
    const hadir = absensiToday.filter(a => a.status === 'HADIR').length
    const terlambat = absensiToday.filter(a => a.status === 'TERLAMBAT').length
    const sakitCuti = absensiToday.filter(a => a.status === 'SAKIT' || a.status === 'CUTI' || a.status === 'IZIN').length
    const belumAlpa = totalPegawai - (hadir + terlambat + sakitCuti)

    // 2. Kontrak Akan Habis (Top 5 terdekat)
    // Hitung sisa hari kontrak
    const kontrakHampirHabis = kontrakTerdekat.map((k: any) => {
      const sisahari = Math.ceil((new Date(k.tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return { ...k, sisaHari: sisahari }
    })

    // 3. Mendekati Pensiun (Top 5 terdekat umur 56)
    const pensiunList = allPegawai.map(p => {
      const birth = new Date(p.tanggalLahir!)
      const pensiunDate = new Date(birth.getFullYear() + 56, birth.getMonth(), birth.getDate())
      const sisaHari = Math.ceil((pensiunDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return { ...p, pensiunDate, sisaHari }
    })
    
    // Sort ascending by remaining days and take top 5 items > 0
    const pensiunTerdekat = pensiunList
      .filter(p => p.sisaHari > 0)
      .sort((a, b) => a.sisaHari - b.sisaHari)
      .slice(0, 5)

    return {
      totalPegawai,
      totalUser,
      approvalPending: approvalPending || 0,
      detail: { cuti, mutasi, kgb, pangkat, sp: 0 },
      kehadiranHariIni: {
        total: totalPegawai,
        hadir,
        terlambat,
        sakitCuti,
        belumAlpa,
        persenHadir: totalPegawai > 0 ? Math.round(((hadir + terlambat) / totalPegawai) * 100) : 0
      },
      kontrakHampirHabis,
      pensiunTerdekat
    }
  } catch (error) {
    console.warn("Database failed, returning mock stats for dashboard", error)
    return {
      totalPegawai: 0, totalUser: 0, approvalPending: 0, isDemo: true,
      kehadiranHariIni: { total: 0, hadir: 0, terlambat: 0, sakitCuti: 0, belumAlpa: 0, persenHadir: 0 },
      kontrakHampirHabis: [], pensiunTerdekat: []
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

    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local time
    const checkInDateStart = new Date(`${todayStr}T00:00:00.000Z`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999Z`)

    const [absensiToday, latestPayroll, cuti, mutasi, kgb, pangkat, sp] = await Promise.all([
      prisma.absensi.findFirst({
        where: { pegawaiId, tanggal: { gte: checkInDateStart, lte: checkInDateEnd } }
      }),
      prisma.payroll.findFirst({
        where: { pegawaiId }, orderBy: { bulan: 'desc' }
      }),
      (prisma as any).cuti.count({ where: { pegawaiId, status: 'PENDING' } }),
      (prisma as any).mutasi.count({ where: { pegawaiId, status: 'PENDING' } }),
      (prisma as any).kGB.count({ where: { pegawaiId, status: 'PENDING' } }),
      (prisma as any).kenaikanPangkat.count({ where: { pegawaiId, status: 'PENDING' } }),
      (prisma as any).suratPeringatan.count({ where: { pegawaiId, status: 'PENDING' } }),
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
