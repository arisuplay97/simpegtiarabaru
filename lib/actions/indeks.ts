'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// ============================================================
// ALGORITMA SKOR (Bobot Total 100)
// ============================================================
// Disiplin Kehadiran  : 40 poin
// Ketepatan Waktu     : 30 poin
// Absensi Bersih      : 20 poin
// Perilaku / SP       : 10 poin

function getPredikat(skor: number): string {
  if (skor >= 90) return "SANGAT_BAIK"
  if (skor >= 80) return "BAIK"
  if (skor >= 70) return "CUKUP"
  if (skor >= 60) return "KURANG"
  return "SANGAT_KURANG"
}

function getPredikatLabel(predikat: string): string {
  const map: Record<string, string> = {
    SANGAT_BAIK: "Sangat Baik",
    BAIK: "Baik",
    CUKUP: "Cukup",
    KURANG: "Kurang",
    SANGAT_KURANG: "Sangat Kurang",
  }
  return map[predikat] || predikat
}

// Helper: hitung hari kerja aktif dari tanggal awal s/d akhir (skip Sabtu Minggu)
function hitungHariKerja(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// ============================================================
// HITUNG INDEKS SATU PEGAWAI (upsert supaya idempoten)
// ============================================================
export async function hitungIndeksPegawai(pegawaiId: string, bulan: number, tahun: number) {
  try {
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
      select: { id: true, nama: true, sp: true }
    })
    if (!pegawai) return { error: "Pegawai tidak ditemukan" }

    const startDate = new Date(tahun, bulan - 1, 1, 0, 0, 0)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)
    const now = new Date()
    const isCurrentMonth = (bulan === now.getMonth() + 1 && tahun === now.getFullYear())
    const limitDate = isCurrentMonth ? now : endDate

    const hariKerja = hitungHariKerja(startDate, limitDate)

    const absensi = await prisma.absensi.findMany({
      where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } }
    })

    const hadirCount = absensi.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length
    const terlambatCount = absensi.filter(a => a.status === 'TERLAMBAT').length
    const alphaCount = absensi.filter(a => a.status === 'ALPA').length
    const spAktif = !!pegawai.sp

    // ─── Skor Komponen ───
    const skorKehadiran = hariKerja > 0 ? Math.min(40, (hadirCount / hariKerja) * 40) : 0
    const skorKetepatan = hadirCount > 0 ? Math.min(30, ((hadirCount - terlambatCount) / hadirCount) * 30) : 0
    const skorAbsenBersih = Math.max(0, 20 - (alphaCount * 5) - (terlambatCount * 0.5))
    const skorPerilaku = spAktif ? Math.max(0, 10 - 5) : 10  // SP aktif -5 poin

    const totalSkor = Math.min(100, Math.round(
      (skorKehadiran + skorKetepatan + skorAbsenBersih + skorPerilaku) * 10
    ) / 10)

    const predikat = getPredikat(totalSkor)

    const result = await prisma.indeksPegawai.upsert({
      where: { pegawaiId_bulan_tahun: { pegawaiId, bulan, tahun } },
      update: {
        skorKehadiran, skorKetepatan, skorAbsenBersih, skorPerilaku,
        totalSkor, predikat, hariKerja, hadirCount, terlambatCount, alphaCount, spAktif
      },
      create: {
        pegawaiId, bulan, tahun,
        skorKehadiran, skorKetepatan, skorAbsenBersih, skorPerilaku,
        totalSkor, predikat, hariKerja, hadirCount, terlambatCount, alphaCount, spAktif
      }
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error("hitungIndeksPegawai error:", error)
    return { error: error.message }
  }
}

// ============================================================
// HITUNG INDEKS SEMUA PEGAWAI AKTIF
// ============================================================
export async function hitungIndeksSemuaPegawai(bulan: number, tahun: number) {
  const session = await auth()
  if (!session?.user || !['SUPERADMIN', 'HRD'].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const pegawaiList = await prisma.pegawai.findMany({
    where: { status: 'AKTIF' },
    select: { id: true }
  })

  let success = 0, failed = 0
  for (const p of pegawaiList) {
    const res = await hitungIndeksPegawai(p.id, bulan, tahun)
    if ((res as any).success) success++
    else failed++
  }

  return { success: true, processed: success, failed }
}

// ============================================================
// GET INDEKS TREN (6 bulan terakhir) untuk 1 pegawai
// ============================================================
export async function getIndeksTren(pegawaiId: string) {
  try {
    const now = new Date()
    const rows = await prisma.indeksPegawai.findMany({
      where: { pegawaiId },
      orderBy: [{ tahun: 'asc' }, { bulan: 'asc' }],
      take: 6
    })

    const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
    return rows.map(r => ({
      ...r,
      label: `${bulanNames[r.bulan - 1]} ${r.tahun}`,
      predikatLabel: getPredikatLabel(r.predikat),
    }))
  } catch (error) {
    return []
  }
}

// ============================================================
// GET INDEKS BULAN INI untuk pegawai yang login
// ============================================================
export async function getIndeksSaya() {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const pegawai = await prisma.pegawai.findUnique({ where: { userId: session.user.id } })
    if (!pegawai) return null

    const now = new Date()
    const bulan = now.getMonth() + 1
    const tahun = now.getFullYear()

    // Auto-calculate jika belum ada
    let indeks = await prisma.indeksPegawai.findUnique({
      where: { pegawaiId_bulan_tahun: { pegawaiId: pegawai.id, bulan, tahun } }
    })

    if (!indeks) {
      const res = await hitungIndeksPegawai(pegawai.id, bulan, tahun)
      if ((res as any).success) indeks = (res as any).data
    }

    if (!indeks) return null

    const tren = await getIndeksTren(pegawai.id)
    const prevIndeks = tren.length >= 2 ? tren[tren.length - 2] : null
    const delta = prevIndeks ? Number((indeks.totalSkor - prevIndeks.totalSkor).toFixed(1)) : 0

    return {
      ...indeks,
      predikatLabel: getPredikatLabel(indeks.predikat),
      delta,
      tren,
    }
  } catch (error) {
    return null
  }
}

// ============================================================
// LEADERBOARD: Top 10 skor + Top 10 Disiplin bulan ini
// ============================================================
export async function getLeaderboard(bulan?: number, tahun?: number) {
  try {
    const now = new Date()
    const b = bulan || now.getMonth() + 1
    const t = tahun || now.getFullYear()

    const rows = await prisma.indeksPegawai.findMany({
      where: { bulan: b, tahun: t },
      include: {
        pegawai: {
          select: { id: true, nama: true, jabatan: true, fotoUrl: true, bidang: { select: { nama: true } } }
        }
      },
      orderBy: { totalSkor: 'desc' },
      take: 20
    })

    const prevBulan = b === 1 ? 12 : b - 1
    const prevTahun = b === 1 ? t - 1 : t

    const prevRows = await prisma.indeksPegawai.findMany({
      where: { bulan: prevBulan, tahun: prevTahun },
      select: { pegawaiId: true, totalSkor: true }
    })
    const prevMap = new Map(prevRows.map(r => [r.pegawaiId, r.totalSkor]))

    const badges = await prisma.badgePegawai.findMany({
      where: { bulan: b, tahun: t }
    })
    const badgeMap = new Map<string, string[]>()
    badges.forEach(badge => {
      if (!badgeMap.has(badge.pegawaiId)) badgeMap.set(badge.pegawaiId, [])
      badgeMap.get(badge.pegawaiId)!.push(badge.jenis)
    })

    const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

    return rows.map((r, idx) => {
      const prev = prevMap.get(r.pegawaiId) || 0
      const delta = Number((r.totalSkor - Number(prev)).toFixed(1))
      return {
        rank: idx + 1,
        pegawaiId: r.pegawaiId,
        nama: r.pegawai.nama,
        jabatan: r.pegawai.jabatan,
        unit: r.pegawai.bidang?.nama || "—",
        fotoUrl: r.pegawai.fotoUrl,
        totalSkor: r.totalSkor,
        predikat: r.predikat,
        predikatLabel: getPredikatLabel(r.predikat),
        delta,
        badges: badgeMap.get(r.pegawaiId) || [],
        periode: `${bulanNames[b - 1]} ${t}`
      }
    })
  } catch (error) {
    console.error("getLeaderboard error:", error)
    return []
  }
}

// ============================================================
// RANKING UNIT: rata-rata skor per bidang
// ============================================================
export async function getRankingUnit(bulan?: number, tahun?: number) {
  try {
    const now = new Date()
    const b = bulan || now.getMonth() + 1
    const t = tahun || now.getFullYear()

    const rows = await prisma.indeksPegawai.findMany({
      where: { bulan: b, tahun: t },
      include: { pegawai: { select: { bidang: { select: { id: true, nama: true } } } } }
    })

    const unitMap = new Map<string, { nama: string; scores: number[]; hadirTotal: number; hariKerjaTotal: number }>()
    rows.forEach(r => {
      const unit = r.pegawai.bidang
      if (!unit) return
      if (!unitMap.has(unit.id)) unitMap.set(unit.id, { nama: unit.nama, scores: [], hadirTotal: 0, hariKerjaTotal: 0 })
      const entry = unitMap.get(unit.id)!
      entry.scores.push(r.totalSkor)
      entry.hadirTotal += r.hadirCount
      entry.hariKerjaTotal += r.hariKerja
    })

    const result = Array.from(unitMap.entries()).map(([id, data]) => {
      const avgSkor = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10 : 0
      const persenHadir = data.hariKerjaTotal > 0 ? Math.round((data.hadirTotal / data.hariKerjaTotal) * 100) : 0
      return {
        id,
        nama: data.nama,
        jumlahPegawai: data.scores.length,
        avgSkor,
        predikat: getPredikat(avgSkor),
        predikatLabel: getPredikatLabel(getPredikat(avgSkor)),
        persenHadir,
      }
    }).sort((a, b) => b.avgSkor - a.avgSkor)
    .map((r, idx) => ({ ...r, rank: idx + 1 }))

    return result
  } catch (error) {
    return []
  }
}

// ============================================================
// GENERATE BADGE BULANAN (jalankan di awal bulan baru atau manual)
// ============================================================
export async function generateBadgesBulanan(bulan: number, tahun: number) {
  const session = await auth()
  if (!session?.user || !['SUPERADMIN', 'HRD'].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  try {
    const rows = await prisma.indeksPegawai.findMany({
      where: { bulan, tahun },
      include: { pegawai: { select: { id: true, sp: true, bidang: { select: { id: true } } } } },
      orderBy: { totalSkor: 'desc' }
    })

    if (rows.length === 0) return { error: "Belum ada data indeks untuk periode ini" }

    const badgesToCreate: Array<{ pegawaiId: string; jenis: any; bulan: number; tahun: number; deskripsi: string }> = []

    // 1. Top Disiplin — Top 10 skor tertinggi
    rows.slice(0, 10).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "TOP_DISIPLIN", bulan, tahun,
        deskripsi: `Masuk 10 besar pegawai dengan skor disiplin terbaik (${r.totalSkor}/100)`
      })
    })

    // 2. Kehadiran Penuh — hadir seluruh hari kerja, tidak ada alpha, terlambat, atau izin
    rows.filter(r => r.hariKerja > 0 && r.hadirCount === r.hariKerja && r.alphaCount === 0 && r.terlambatCount === 0).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "KEHADIRAN_PENUH", bulan, tahun,
        deskripsi: `Hadir penuh ${r.hariKerja} hari kerja tanpa alpha atau keterlambatan`
      })
    })

    // 3. Zero Late — tidak pernah terlambat
    rows.filter(r => r.terlambatCount === 0 && r.hadirCount > 0).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "ZERO_LATE", bulan, tahun,
        deskripsi: `Tidak pernah terlambat selama ${r.hariKerja} hari kerja`
      })
    })

    // 4. Top Performer — skor >= 90
    rows.filter(r => r.totalSkor >= 90).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "TOP_PERFORMER", bulan, tahun,
        deskripsi: `Performa sangat baik dengan skor ${r.totalSkor}/100`
      })
    })

    // 5. Terbaik Unit — rank 1 di unit masing-masing
    const unitBest = new Map<string, typeof rows[0]>()
    rows.forEach(r => {
      const unitId = r.pegawai.bidang?.id
      if (!unitId) return
      if (!unitBest.has(unitId)) unitBest.set(unitId, r)
    })
    unitBest.forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "TERBAIK_UNIT", bulan, tahun,
        deskripsi: `Pegawai terbaik di unitnya dengan skor ${r.totalSkor}/100`
      })
    })

    // 6. Peningkatan Terbaik — kenaikan skor terbesar dibanding bulan lalu
    const prevBulan = bulan === 1 ? 12 : bulan - 1
    const prevTahun = bulan === 1 ? tahun - 1 : tahun
    const prevRows = await prisma.indeksPegawai.findMany({ where: { bulan: prevBulan, tahun: prevTahun } })
    const prevMap = new Map(prevRows.map(r => [r.pegawaiId, r.totalSkor]))

    let bestImprover: { pegawaiId: string; delta: number } | null = null
    rows.forEach(r => {
      const prev = prevMap.get(r.pegawaiId)
      if (prev === undefined) return
      const delta = r.totalSkor - Number(prev)
      if (!bestImprover || delta > bestImprover.delta) {
        bestImprover = { pegawaiId: r.pegawaiId, delta }
      }
    })

    if (bestImprover && (bestImprover as any).delta > 0) {
      badgesToCreate.push({
        pegawaiId: (bestImprover as any).pegawaiId, jenis: "PENINGKATAN_TERBAIK", bulan, tahun,
        deskripsi: `Peningkatan skor terbesar bulan ini (+${((bestImprover as any).delta).toFixed(1)} poin)`
      })
    }

    // Upsert semua badge
    let created = 0
    for (const badge of badgesToCreate) {
      await prisma.badgePegawai.upsert({
        where: { pegawaiId_jenis_bulan_tahun: { pegawaiId: badge.pegawaiId, jenis: badge.jenis, bulan: badge.bulan, tahun: badge.tahun } },
        update: { deskripsi: badge.deskripsi },
        create: badge
      })
      created++
    }

    return { success: true, created }
  } catch (error: any) {
    console.error("generateBadgesBulanan error:", error)
    return { error: error.message }
  }
}

// ============================================================
// GET BADGE AKTIF & RIWAYAT untuk pegawai yang login
// ============================================================
export async function getBadgeSaya() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { aktif: [], riwayat: [] }

    const pegawai = await prisma.pegawai.findUnique({ where: { userId: session.user.id } })
    if (!pegawai) return { aktif: [], riwayat: [] }

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const all = await prisma.badgePegawai.findMany({
      where: { pegawaiId: pegawai.id },
      orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }]
    })

    const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
    const badgeLabel = {
      TOP_DISIPLIN: "Top Disiplin",
      KEHADIRAN_PENUH: "Kehadiran Penuh",
      ZERO_LATE: "Zero Late",
      TOP_PERFORMER: "Top Performer",
      TERBAIK_UNIT: "Terbaik di Unit",
      PENINGKATAN_TERBAIK: "Peningkatan Terbaik",
    }
    const badgeColor = {
      TOP_DISIPLIN: "blue",
      KEHADIRAN_PENUH: "emerald",
      ZERO_LATE: "violet",
      TOP_PERFORMER: "amber",
      TERBAIK_UNIT: "orange",
      PENINGKATAN_TERBAIK: "teal",
    }

    const mapped = all.map(b => ({
      ...b,
      label: badgeLabel[b.jenis as keyof typeof badgeLabel] || b.jenis,
      color: badgeColor[b.jenis as keyof typeof badgeColor] || "neutral",
      periode: `${bulanNames[b.bulan - 1]} ${b.tahun}`,
      isAktif: b.bulan === bulanIni && b.tahun === tahunIni
    }))

    return {
      aktif: mapped.filter(b => b.isAktif),
      riwayat: mapped.filter(b => !b.isAktif)
    }
  } catch (error) {
    return { aktif: [], riwayat: [] }
  }
}

// ============================================================
// GET PEGAWAI PERLU PERHATIAN
// ============================================================
export async function getPegawaiPerluPerhatian() {
  try {
    const session = await auth()
    if (!session?.user || !['SUPERADMIN', 'HRD', 'DIREKSI'].includes((session.user as any).role)) {
      return []
    }

    const now = new Date()
    const bulan = now.getMonth() + 1
    const tahun = now.getFullYear()

    const rows = await prisma.indeksPegawai.findMany({
      where: { bulan, tahun },
      include: {
        pegawai: {
          select: {
            id: true, nama: true, jabatan: true, fotoUrl: true, sp: true,
            bidang: { select: { nama: true } }
          }
        }
      },
      orderBy: { totalSkor: 'asc' },
      take: 20
    })

    // Filter: skor < 70 atau alpha > 3 atau terlambat > 5
    const perluPerhatian = rows.filter(r =>
      r.totalSkor < 70 || r.alphaCount >= 3 || r.terlambatCount >= 5
    )

    return perluPerhatian.map(r => ({
      pegawaiId: r.pegawaiId,
      nama: r.pegawai.nama,
      jabatan: r.pegawai.jabatan,
      unit: r.pegawai.bidang?.nama || "—",
      fotoUrl: r.pegawai.fotoUrl,
      totalSkor: r.totalSkor,
      predikatLabel: getPredikatLabel(r.predikat),
      alphaCount: r.alphaCount,
      terlambatCount: r.terlambatCount,
      spAktif: r.spAktif,
      flags: [
        r.totalSkor < 60 ? "⚠️ Skor sangat rendah" : r.totalSkor < 70 ? "⚠️ Skor rendah" : null,
        r.alphaCount >= 5 ? "🔴 Alpha kritis" : r.alphaCount >= 3 ? "🟠 Sering alpha" : null,
        r.terlambatCount >= 10 ? "🔴 Sering terlambat" : r.terlambatCount >= 5 ? "🟠 Perlu diingatkan" : null,
        r.spAktif ? "⚠️ SP aktif" : null,
      ].filter(Boolean)
    }))
  } catch (error) {
    return []
  }
}

// ============================================================
// KALENDER: Ambil data ketidakhadiran per bulan
// ============================================================
export async function getKalenderPegawai(pegawaiId: string | null, bulan: number, tahun: number) {
  try {
    if (!pegawaiId) {
      const session = await auth()
      if (session?.user?.id) {
        const u = await prisma.pegawai.findUnique({ where: { userId: session.user.id } })
        if (u) pegawaiId = u.id
      }
    }
    if (!pegawaiId) return { dayMap: {}, summary: {} }

    const startDate = new Date(tahun, bulan - 1, 1, 0, 0, 0)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

    // Parallel fetch: absensi + cuti
    const [absensiList, cutiList] = await Promise.all([
      prisma.absensi.findMany({
        where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } }
      }),
      (prisma as any).cuti.findMany({
        where: {
          pegawaiId,
          tanggalMulai: { lte: endDate },
          tanggalSelesai: { gte: startDate }
        }
      })
    ])

    // Build a day map
    const dayMap: Record<string, any> = {}

    absensiList.forEach((a: any) => {
      const key = a.tanggal.toISOString().split('T')[0]
      dayMap[key] = {
        tanggal: key,
        status: a.status,
        jamMasuk: a.jamMasuk,
        jamKeluar: a.jamKeluar,
        source: "absensi"
      }
    })

    cutiList.forEach((c: any) => {
      const cur = new Date(c.tanggalMulai)
      const end = new Date(c.tanggalSelesai)
      while (cur <= end) {
        const key = cur.toISOString().split('T')[0]
        if (!dayMap[key]) {
          dayMap[key] = {
            tanggal: key,
            status: c.status === 'APPROVED' ? 'CUTI' : 'CUTI_PENDING',
            jenisCuti: c.jenisCuti,
            source: "cuti"
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    })

    // Summary
    const values = Object.values(dayMap)
    const summary = {
      hadir: values.filter(v => v.status === 'HADIR' || v.status === 'TERLAMBAT').length,
      terlambat: values.filter(v => v.status === 'TERLAMBAT').length,
      cuti: values.filter(v => v.status === 'CUTI').length,
      izin: values.filter(v => v.status === 'IZIN').length,
      sakit: values.filter(v => v.status === 'SAKIT').length,
      alpha: values.filter(v => v.status === 'ALPA').length,
    }

    return { dayMap, summary }
  } catch (error) {
    return { dayMap: {}, summary: {} }
  }
}

// ============================================================
// GET INDEKS PEGAWAI by ID (untuk HRD melihat detail pegawai)
// ============================================================
export async function getIndeksPegawaiById(pegawaiId: string, bulan?: number, tahun?: number) {
  try {
    const now = new Date()
    const b = bulan || now.getMonth() + 1
    const t = tahun || now.getFullYear()

    let indeks = await prisma.indeksPegawai.findUnique({
      where: { pegawaiId_bulan_tahun: { pegawaiId, bulan: b, tahun: t } }
    })

    if (!indeks) {
      const res = await hitungIndeksPegawai(pegawaiId, b, t)
      if ((res as any).success) indeks = (res as any).data
    }

    if (!indeks) return null

    const tren = await getIndeksTren(pegawaiId)
    const prevIndeks = tren.length >= 2 ? tren[tren.length - 2] : null
    const delta = prevIndeks ? Number((indeks.totalSkor - (prevIndeks as any).totalSkor).toFixed(1)) : 0

    const badges = await prisma.badgePegawai.findMany({
      where: { pegawaiId, bulan: b, tahun: t }
    })

    return { ...indeks, predikatLabel: getPredikatLabel(indeks.predikat), delta, tren, badges }
  } catch (error) {
    return null
  }
}
