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
        where: { status: 'AKTIF', tipeJabatan: { notIn: ['KONTRAK'] } },
        select: { 
          id: true, nama: true, jabatan: true, tanggalLahir: true, fotoUrl: true, tanggalMasuk: true,
          riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' }, take: 1, select: { tanggalBerlaku: true, pangkat: true } },
          kgb: { orderBy: { tanggalBerlaku: 'desc' }, take: 1, select: { tanggalBerlaku: true } }
        }
      })
    ])
    
    const approvalPending = cuti + mutasi + kgb + pangkat

    // 1. Kehadiran Hari Ini
    const hadir = absensiToday.filter(a => a.status === 'HADIR').length
    const terlambat = absensiToday.filter(a => a.status === 'TERLAMBAT').length
    const sakitCuti = absensiToday.filter(a => a.status === 'SAKIT' || (a.status as any) === 'CUTI').length
    const belumAlpa = totalPegawai - (hadir + terlambat + sakitCuti)

    // 2. Kontrak Akan Habis
    const kontrakHampirHabis = kontrakTerdekat.map((k: any) => {
      const sisahari = Math.ceil((new Date(k.tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return { ...k, sisaHari: sisahari }
    })

    // 3. Mendekati Pensiun (filter < 1 tahun) & Kalkulasi KGB & Pangkat Eligible
    const nowTime = new Date().getTime()
    const pensiunList: any[] = []
    const autoKgbList: any[] = []
    const autoPangkatList: any[] = []

    allPegawai.forEach(p => {
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

    // 4. Data Pendukung lainnya
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
