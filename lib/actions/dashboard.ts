'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  try {
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
    const checkInDateStart = new Date(`${todayStr}T00:00:00+08:00`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999+08:00`)
    const targetDateDb = new Date(`${todayStr}T00:00:00.000Z`)
    const sevenDaysAgoStart = new Date(checkInDateStart)
    sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 6)
    sevenDaysAgoStart.setHours(0, 0, 0, 0)

    const [
      totalPegawai,
      totalUser,
      cuti, mutasi, kgb, pangkat,
      absensiToday,
      kontrakTerdekat,
      allPegawaiActive,
      // NEW: Chart Data
      attendanceRaw,
      cuti7Days,
      payrollRaw,
      unitCounts,
      attendance30Days,
      recentAbsensiRaw,
      pegawaiCutiCount,
      pegawaiSPCount
    ] = await Promise.all([
      prisma.pegawai.count({ where: { status: 'AKTIF' } }),
      prisma.user.count(),
      prisma.cuti.count({ where: { status: 'PENDING' } }),
      prisma.mutasi.count({ where: { status: 'PENDING' } }),
      prisma.kGB.count({ where: { status: 'PENDING' } }),
      prisma.kenaikanPangkat.count({ where: { status: 'PENDING' } }),
      prisma.absensi.findMany({
        where: {
          OR: [
            { tanggal: { gte: checkInDateStart, lte: checkInDateEnd } },
            { tanggal: targetDateDb },
            { jamMasuk: { gte: checkInDateStart, lte: checkInDateEnd } }
          ]
        }
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
        where: { tanggal: { gte: sevenDaysAgoStart, lte: checkInDateEnd } },
        select: { tanggal: true, status: true, pegawaiId: true }
      }),
      // Approved Cuti 7 Days
      prisma.cuti.findMany({
        where: {
          status: 'APPROVED',
          tanggalMulai: { lte: checkInDateEnd },
          tanggalSelesai: { gte: sevenDaysAgoStart }
        },
        select: { tanggalMulai: true, tanggalSelesai: true, jenisCuti: true, pegawaiId: true }
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
      }),
      // Aktivitas Terakhir (Recent Attendance / Activity Logs)
      prisma.absensi.findMany({
        take: 35,
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
        include: {
          pegawai: {
            select: {
              id: true,
              nama: true,
              jabatan: true,
              fotoUrl: true,
              bidang: { select: { nama: true } }
            }
          }
        }
      }),
      // Moved here from separate Promise.all to eliminate waterfall
      prisma.cuti.count({ where: { status: 'APPROVED', tanggalMulai: { lte: new Date() }, tanggalSelesai: { gte: new Date() } } }),
      prisma.pegawai.count({ where: { sp: { not: null }, status: 'AKTIF' } }),
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat

    // 1. Kehadiran Hari Ini
    const hadir = absensiToday.filter(a => a.status === 'HADIR').length
    const terlambat = absensiToday.filter(a => a.status === 'TERLAMBAT').length
    const sakitCuti = absensiToday.filter(a => a.status === 'SAKIT' || a.status === 'CUTI' || a.status === 'IZIN').length
    const alphaAction = absensiToday.filter(a => a.status === 'ALPA').length
    
    // Cek apakah hari ini weekend (Sabtu/Minggu)
    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6
    const belumAbsen = isWeekend ? 0 : Math.max(0, totalPegawai - (hadir + terlambat + sakitCuti + alphaAction))

    // 2. Kontrak Akan Habis
    const kontrakHampirHabis = kontrakTerdekat.map((k: any) => {
      const sisahari = Math.ceil((new Date(k.tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return { ...k, sisaHari: sisahari }
    })

    // 3. Process Chart Data
    // Attendance Trend (7 days)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgoStart)
      d.setDate(d.getDate() + i)
      const dStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
      const dayName = days[d.getDay()]
      
      const isDayWeekend = d.getDay() === 0 || d.getDay() === 6
      const isToday = dStr === todayStr
      
      const dayData = attendanceRaw.filter(a => {
        const aStr = a.tanggal.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
        return aStr === dStr
      })

      // Pegawai yang sedang Cuti/Izin resmi yang disetujui (Cuti model)
      const activeCuti = cuti7Days.filter(c => {
        const cStart = new Date(c.tanggalMulai).toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
        const cEnd = new Date(c.tanggalSelesai).toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
        return dStr >= cStart && dStr <= cEnd
      })

      const hadirCount = dayData.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length
      
      const explicitIzinSakit = dayData.filter(a => a.status === 'IZIN' || a.status === 'SAKIT').length
      const cutiApprovedIzin = activeCuti.filter(c => {
        const j = (c.jenisCuti || '').toLowerCase()
        return j.includes('izin') || j.includes('sakit')
      }).length
      const izinCount = explicitIzinSakit + cutiApprovedIzin

      const explicitCuti = dayData.filter(a => a.status === 'CUTI').length
      const cutiApprovedOther = activeCuti.filter(c => {
        const j = (c.jenisCuti || '').toLowerCase()
        return !j.includes('izin') && !j.includes('sakit')
      }).length
      const cutiCount = explicitCuti + cutiApprovedOther

      const explicitAlpha = dayData.filter(a => a.status === 'ALPA').length
      
      // Hari kerja lampau: jika pegawai aktif tidak hadir dan tidak cuti/izin, terhitung ALPA
      const recordedCount = hadirCount + izinCount + cutiCount + explicitAlpha
      const unrecordedAlpha = (!isDayWeekend && !isToday && recordedCount > 0)
        ? Math.max(0, totalPegawai - recordedCount)
        : 0
      const alphaCount = explicitAlpha + unrecordedAlpha

      // Hari ini: pegawai yang belum absen terhitung Belum Absen
      const belumAbsenCount = (!isDayWeekend && isToday)
        ? Math.max(0, totalPegawai - (hadirCount + izinCount + cutiCount + explicitAlpha))
        : 0

      const totalHarian = hadirCount + izinCount + cutiCount + alphaCount
      const rateHarian = totalHarian > 0 ? Number(((hadirCount / totalHarian) * 100).toFixed(1)) : 0

      return {
        day: dayName,
        date: dStr,
        hadir: hadirCount,
        izin: izinCount,
        cuti: cutiCount,
        alpha: alphaCount,
        belumAbsen: belumAbsenCount,
        total: totalHarian,
        rate: rateHarian,
        isWeekend: isDayWeekend,
        isToday
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
    const unitPalette = ['#3b82f6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']
    const unitDistribution = unitCounts
      .filter(u => u._count.pegawai > 0)
      .map((u, i) => ({
        name: u.nama,
        value: u._count.pegawai,
        color: unitPalette[i % unitPalette.length]
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

    // Ulang Tahun Bulan Ini
    const currentMonth = new Date().getMonth()
    const ulangTahunBulanIni = allPegawaiActive
      .filter((p: any) => p.tanggalLahir && new Date(p.tanggalLahir).getMonth() === currentMonth)
      .map((p: any) => {
        const d = new Date(p.tanggalLahir)
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        const initials = p.nama.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
        // Simple distinct colors
        const colors = ["bg-blue-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-violet-500", "bg-rose-500"]
        const hash = p.nama.length
        const color = colors[hash % colors.length]
        
        return {
          id: p.id,
          nama: p.nama,
          jabatan: p.jabatan || "—",
          tanggal: dateStr,
          initials,
          color,
          tglNum: d.getDate()
        }
      })
      .sort((a, b) => a.tglNum - b.tglNum)

    // 5. Data Pendukung lainnya (sudah dimuat dalam Promise.all utama di atas)

    // 6. Format Aktivitas Terakhir (Live Recent Activities Feed dengan Absen Siang & Zona WITA)
    const formatTimeWita = (d: Date | string | null | undefined) => {
      if (!d) return null
      const dt = typeof d === 'string' ? new Date(d) : d
      if (isNaN(dt.getTime())) return null
      return dt.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar',
        hour12: false
      }).replace('.', ':')
    }

    const activityEvents: any[] = []

    if (recentAbsensiRaw && recentAbsensiRaw.length > 0) {
      recentAbsensiRaw.forEach((a: any) => {
        const pegawai = a.pegawai
        if (!pegawai) return

        const baseItem = {
          pegawaiId: a.pegawaiId,
          nama: pegawai.nama || 'Pegawai',
          jabatan: pegawai.jabatan || 'Staf',
          bidang: pegawai.bidang?.nama || 'Operasional',
          fotoUrl: pegawai.fotoUrl || null,
          metode: a.metode || 'SELFIE',
        }

        // 1. Event Check-out / Pulang
        if (a.jamKeluar) {
          const t = new Date(a.jamKeluar).getTime()
          activityEvents.push({
            ...baseItem,
            id: `${a.id}_pulang`,
            tipe: 'PULANG',
            label: 'Presensi Pulang',
            statusBadge: 'Presensi Pulang',
            variant: 'info' as const,
            waktu: formatTimeWita(a.jamKeluar),
            timestamp: t
          })
        }

        // 2. Event Absen Siang
        if (a.jamSiang) {
          const t = new Date(a.jamSiang).getTime()
          activityEvents.push({
            ...baseItem,
            id: `${a.id}_siang`,
            tipe: 'SIANG',
            label: 'Presensi Siang',
            statusBadge: 'Presensi Siang',
            variant: 'purple' as const,
            waktu: formatTimeWita(a.jamSiang),
            timestamp: t
          })
        }

        // 3. Event Check-in Pagi
        if (a.jamMasuk) {
          const t = new Date(a.jamMasuk).getTime()
          const isTerlambat = a.status === 'TERLAMBAT'
          activityEvents.push({
            ...baseItem,
            id: `${a.id}_masuk`,
            tipe: isTerlambat ? 'TERLAMBAT' : 'MASUK',
            label: 'Presensi Masuk',
            statusBadge: isTerlambat ? 'Terlambat' : 'Tepat Waktu',
            variant: isTerlambat ? ('warning' as const) : ('success' as const),
            waktu: formatTimeWita(a.jamMasuk),
            timestamp: t
          })
        }

        // 4. Jika status IZIN/SAKIT/CUTI tanpa jam punch
        if (!a.jamMasuk && !a.jamSiang && !a.jamKeluar) {
          const eventTime = a.createdAt || a.tanggal
          const t = new Date(eventTime).getTime()
          let label = 'Presensi Tercatat'
          let statusBadge = a.status
          let variant: 'success' | 'warning' | 'info' | 'purple' | 'neutral' = 'neutral'

          if (a.status === 'CUTI') {
            label = 'Pengajuan Cuti'
            statusBadge = 'Cuti Aktif'
          } else if (a.status === 'IZIN' || a.status === 'SAKIT') {
            label = `Izin / ${a.status === 'SAKIT' ? 'Sakit' : 'Dispensasi'}`
            statusBadge = 'Tercatat'
          }

          activityEvents.push({
            ...baseItem,
            id: `${a.id}_status`,
            tipe: a.status,
            label,
            statusBadge,
            variant,
            waktu: formatTimeWita(eventTime),
            timestamp: t
          })
        }
      })
    }

    // Urutkan berdasarkan waktu terkini secara descending (paling baru di atas)
    activityEvents.sort((a, b) => b.timestamp - a.timestamp)

    const aktivitasTerakhir = activityEvents.length > 0
      ? activityEvents
      : [
          {
            id: 'mock-1',
            pegawaiId: '1',
            nama: 'Budi Santoso',
            jabatan: 'Operator Transmisi',
            bidang: 'Distribusi & Transmisi',
            fotoUrl: null,
            tipe: 'MASUK',
            label: 'Presensi Masuk',
            statusBadge: 'Tepat Waktu',
            variant: 'success',
            metode: 'FINGERPRINT',
            waktu: '07:45',
            timestamp: Date.now() - 1000 * 60 * 12
          },
          {
            id: 'mock-2',
            pegawaiId: '2',
            nama: 'Dewi Anggraini',
            jabatan: 'Analis Keuangan',
            bidang: 'Keuangan & Akuntansi',
            fotoUrl: null,
            tipe: 'MASUK',
            label: 'Presensi Masuk',
            statusBadge: 'Tepat Waktu',
            variant: 'success',
            metode: 'SELFIE',
            waktu: '07:50',
            timestamp: Date.now() - 1000 * 60 * 25
          },
          {
            id: 'mock-3',
            pegawaiId: '3',
            nama: 'Rahmat Hidayat',
            jabatan: 'Teknisi Jaringan',
            bidang: 'Pelayanan Teknik',
            fotoUrl: null,
            tipe: 'TERLAMBAT',
            label: 'Presensi Masuk',
            statusBadge: 'Terlambat 12m',
            variant: 'warning',
            metode: 'SELFIE',
            waktu: '08:12',
            timestamp: Date.now() - 1000 * 60 * 45
          },
          {
            id: 'mock-4',
            pegawaiId: '4',
            nama: 'Siti Aminah',
            jabatan: 'Staf Administrasi HRD',
            bidang: 'SDM & Umum',
            fotoUrl: null,
            tipe: 'IZIN',
            label: 'Izin Sakit',
            statusBadge: 'Surat Terlampir',
            variant: 'neutral',
            metode: 'SISTEM',
            waktu: '08:30',
            timestamp: Date.now() - 1000 * 60 * 60
          }
        ]

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
        alpha: alphaAction,
        belumAbsen,
        persenHadir: totalPegawai > 0 ? Math.round(((hadir + terlambat) / totalPegawai) * 100) : 0
      },
      // Chart props
      analytics: {
        totalPegawai,
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
      ulangTahunBulanIni: ulangTahunBulanIni.slice(0, 5),
      aktivitasTerakhir: aktivitasTerakhir.slice(0, 8),
    }
  } catch (error) {
    console.warn("Database failed, returning mock stats for dashboard", error)
    return {
      totalPegawai: 0, totalUser: 0, approvalPending: 0, isDemo: true,
      kehadiranHariIni: { total: 0, hadir: 0, terlambat: 0, sakitCuti: 0, belumAlpa: 0, persenHadir: 0 },
      kontrakHampirHabis: [], pensiunTerdekat: [], ulangTahunBulanIni: []
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

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }) // YYYY-MM-DD WITA
    const checkInDateStart = new Date(`${todayStr}T00:00:00+08:00`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999+08:00`)
    const targetDateDb = new Date(`${todayStr}T00:00:00.000Z`)

    const [absensiToday, latestPayroll, cuti, mutasi, kgb, pangkat, sp] = await Promise.all([
      prisma.absensi.findFirst({
        where: {
          pegawaiId,
          OR: [
            { tanggal: { gte: checkInDateStart, lte: checkInDateEnd } },
            { tanggal: targetDateDb },
            { jamMasuk: { gte: checkInDateStart, lte: checkInDateEnd } }
          ]
        }
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

    const formatWitaTime = (d: Date | string | null | undefined) => {
      if (!d) return null
      const dt = typeof d === 'string' ? new Date(d) : d
      return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }).replace('.', ':')
    }

    return {
      sisaCuti: (pegawai as any).saldoCuti ?? 12,
      statusAbsensi: absensiToday ? absensiToday.status : "Belum Absen",
      waktuAbsen: absensiToday ? (absensiToday.jamMasuk ? formatWitaTime(absensiToday.jamMasuk) : null) : null,
      gajiTerbaru: latestPayroll ? Number(latestPayroll.total) : (Number((pegawai as any).gajiPokok || 0) + Number((pegawai as any).tunjangan || 0)),
      periodeGaji: latestPayroll ? new Date(latestPayroll.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' }) : "Bulan Ini",
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
