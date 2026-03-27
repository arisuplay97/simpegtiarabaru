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
      allPegawaiActive,
      // NEW: Chart Data
      attendanceRaw,
      payrollRaw,
      unitCounts,
      attendance30Days
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
        where: { status: 'AKTIF' },
        select: { 
          id: true, nama: true, jabatan: true, tanggalLahir: true, fotoUrl: true, tanggalMasuk: true, tipeJabatan: true,
          riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' }, take: 1, select: { tanggalBerlaku: true, pangkat: true } },
          kgb: { orderBy: { tanggalBerlaku: 'desc' }, take: 1, select: { tanggalBerlaku: true } }
        }
      }),
      // Attendance 7 Days
      prisma.absensi.findMany({
        where: { tanggal: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { tanggal: true, status: true }
      }),
      // Payroll 12 Months
      prisma.payroll.findMany({
        where: { bulan: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
        orderBy: { bulan: 'asc' }
      }),
      // Unit Distribution
      prisma.bidang.findMany({
        select: { nama: true, _count: { select: { pegawai: { where: { status: 'AKTIF' } } } } }
      }),
      // Performance - 30 Days Attendance
      prisma.absensi.findMany({
        where: { tanggal: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { status: true, pegawai: { select: { bidang: { select: { id: true, nama: true } } } } }
      })
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat

    // 1. Kehadiran Hari Ini
    const hadir = absensiToday.filter(a => a.status === 'HADIR').length
    const terlambat = absensiToday.filter(a => a.status === 'TERLAMBAT').length
    const sakitCuti = absensiToday.filter(a => a.status === 'SAKIT' || (a.status as any) === 'CUTI').length
    const belumAlpa = Math.max(0, totalPegawai - (hadir + terlambat + sakitCuti))

    // 2. Kontrak Akan Habis
    const kontrakHampirHabis = kontrakTerdekat.map((k: any) => {
      const sisahari = Math.ceil((new Date(k.tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return { ...k, sisaHari: sisahari }
    })

    // 3. Process Chart Data
    // Attendance Trend (7 days)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dStr = d.toISOString().split('T')[0]
      const dayName = days[d.getDay()]
      
      const dayData = attendanceRaw.filter(a => a.tanggal.toISOString().split('T')[0] === dStr)
      return {
        day: dayName,
        hadir: dayData.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length,
        izin: dayData.filter(a => a.status === 'IZIN').length,
        cuti: dayData.filter(a => a.status === 'CUTI').length,
        alpha: dayData.filter(a => a.status === 'ALPA').length
      }
    })

    // Payroll Trend (12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const payrollTrend = payrollRaw.reduce((acc: any[], p: any) => {
      const mIdx = new Date(p.bulan).getMonth()
      const mName = months[mIdx]
      const existing = acc.find(item => item.month === mName)
      if (existing) {
        existing.total += Number(p.total) / 1000000 // Convert to Juta
        existing.gaji += Number(p.gajiPokok) / 1000000
        existing.tunjangan += Number(p.tunjangan) / 1000000
      } else {
        acc.push({
          month: mName,
          total: Number(p.total) / 1000000,
          gaji: Number(p.gajiPokok) / 1000000,
          tunjangan: Number(p.tunjangan) / 1000000,
          lembur: 0
        })
      }
      return acc
    }, [])

    // Unit Distribution
    const unitDistribution = unitCounts
      .filter(u => u._count.pegawai > 0)
      .map((u, i) => ({
        name: u.nama,
        value: u._count.pegawai,
        color: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][i % 6]
      }))

    // Employee Status breakdown
    const types = ['TETAP', 'KONTRAK', 'STAFF']
    const employeeStatus = types.map(type => {
      const count = allPegawaiActive.filter(p => p.tipeJabatan === type || (type === 'TETAP' && p.tipeJabatan !== 'KONTRAK')).length
      return {
        status: type.charAt(0) + type.slice(1).toLowerCase(),
        count,
        percentage: totalPegawai > 0 ? Math.round((count / totalPegawai) * 100) : 0
      }
    })

    // Top Performing Units (by attendance)
    const unitPerfMap = new Map()
    attendance30Days.forEach(a => {
      if (!a.pegawai?.bidang) return
      const bName = a.pegawai.bidang.nama
      if (!unitPerfMap.has(bName)) unitPerfMap.set(bName, { total: 0, present: 0 })
      const stats = unitPerfMap.get(bName)
      stats.total++
      if (a.status === 'HADIR' || a.status === 'TERLAMBAT') stats.present++
    })
    const topPerformingUnits = Array.from(unitPerfMap.entries())
      .map(([unit, stats]) => ({
        unit,
        score: Math.round((stats.present / stats.total) * 100)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    // 4. Mendekati Pensiun (filter < 1 tahun) & Kalkulasi KGB & Pangkat Eligible
    const nowTime = new Date().getTime()
    const pensiunList: any[] = []
    const autoKgbList: any[] = []
    const autoPangkatList: any[] = []

    allPegawaiActive.forEach(p => {
      // Pensiun
      if (p.tanggalLahir) {
        const birth = new Date(p.tanggalLahir)
        const pensiunDate = new Date(birth.getFullYear() + 56, birth.getMonth(), birth.getDate())
        const sisaHariPensiun = Math.ceil((pensiunDate.getTime() - nowTime) / (1000 * 3600 * 24))
        pensiunList.push({ ...p, pensiunDate, sisaHari: sisaHariPensiun })
      }

      // KGB Eligible (Siklus 2 Tahun)
       const tmtKgbAsli = p.kgb?.[0]?.tanggalBerlaku || p.tanggalMasuk
      if (tmtKgbAsli) {
        const tmtDate = new Date(tmtKgbAsli)
        const yearsDiffKgb = (nowTime - tmtDate.getTime()) / (1000 * 3600 * 24 * 365.25)
        // Cari kelipatan 2 terdekat ke atas
        let nextMultiplierKgb = Math.ceil(yearsDiffKgb / 2) * 2;
        if (nextMultiplierKgb <= 0) nextMultiplierKgb = 2; // minimal kenaikan pertama
        
        const nextKgbDate = new Date(tmtDate.getFullYear() + nextMultiplierKgb, tmtDate.getMonth(), tmtDate.getDate())
        const sisaHariKgb = Math.ceil((nextKgbDate.getTime() - nowTime) / (1000 * 3600 * 24))
        
        // H-1 Bulan (<= 31 hari) dan belum terlewat terlalu jauh (asumsi masih nunggak kalo < 0)
        if (sisaHariKgb <= 31 && sisaHariKgb > -365) {
          autoKgbList.push({ id: p.id + '_kgb', pegawai: p, nextDate: nextKgbDate, sisaHari: sisaHariKgb })
        }
      }

      // Pangkat Eligible (Siklus 4 Tahun)
      const tmtPangkatAsli = p.riwayatPangkatDetail?.[0]?.tanggalBerlaku || p.tanggalMasuk
      if (tmtPangkatAsli) {
        const tmtDate = new Date(tmtPangkatAsli)
        const yearsDiffPangkat = (nowTime - tmtDate.getTime()) / (1000 * 3600 * 24 * 365.25)
        let nextMultiplierPangkat = Math.ceil(yearsDiffPangkat / 4) * 4;
        if (nextMultiplierPangkat <= 0) nextMultiplierPangkat = 4;
        
        const nextPangkatDate = new Date(tmtDate.getFullYear() + nextMultiplierPangkat, tmtDate.getMonth(), tmtDate.getDate())
        const sisaHariPangkat = Math.ceil((nextPangkatDate.getTime() - nowTime) / (1000 * 3600 * 24))
        
        if (sisaHariPangkat <= 31 && sisaHariPangkat > -365) {
          autoPangkatList.push({ id: p.id + '_pkt', pegawai: p, nextDate: nextPangkatDate, sisaHari: sisaHariPangkat })
        }
      }
    })
    
    const pensiunTerdekat = pensiunList
      .filter(p => p.sisaHari > 0 && p.sisaHari <= 365)
      .sort((a, b) => a.sisaHari - b.sisaHari)
      .slice(0, 10)

    // Sort ascending berdasarkan sisa hari (yang paling dekat/sudah lewat)
    autoKgbList.sort((a, b) => a.sisaHari - b.sisaHari)
    autoPangkatList.sort((a, b) => a.sisaHari - b.sisaHari)

    // 5. Data Pendukung lainnya
    const [pegawaiCutiCount, pegawaiSPCount] = await Promise.all([
      prisma.cuti.count({ where: { status: 'APPROVED', tanggalMulai: { lte: new Date() }, tanggalSelesai: { gte: new Date() } } }),
      prisma.pegawai.count({ where: { sp: { not: null }, status: 'AKTIF' } }),
    ])

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
      // Chart props
      analytics: {
        attendanceTrend,
        payrollTrend,
        unitDistribution,
        employeeStatus,
        topPerformingUnits,
        // Trend metrics (simulated if data not fully ready)
        trendMetrics: [
          { label: "Keterlambatan", value: "3.2%", change: -0.5, isPositive: true, data: [4.2, 4.0, 3.8, 3.5, 3.4, 3.2, 3.2] },
          { label: "Lembur", value: "12.5%", change: 1.2, isPositive: false, data: [10.5, 11.0, 11.5, 11.8, 12.0, 12.3, 12.5] },
          { label: "Cuti", value: "4.8%", change: 0.3, isPositive: true, data: [4.2, 4.4, 4.5, 4.6, 4.5, 4.7, 4.8] },
          { label: "Turnover", value: "2.1%", change: -0.3, isPositive: true, data: [2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1] },
        ]
      },
      kontrakHampirHabis,
      pensiunTerdekat,
      kgbEligible: autoKgbList.length,
      pangkatEligible: autoPangkatList.length,
      pegawaiCuti: pegawaiCutiCount,
      pegawaiSP: pegawaiSPCount,
      kgbList: autoKgbList.slice(0, 8),
      pangkatList: autoPangkatList.slice(0, 8),
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
