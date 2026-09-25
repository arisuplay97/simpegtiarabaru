'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"

// ============================================================
// ALGORITMA SKOR MURNI ABSENSI (Bobot Total 100)
// ============================================================
// Disiplin Kehadiran  : 50 poin
// Ketepatan Waktu     : 30 poin
// Absensi Bersih      : 20 poin
// Perilaku / SP       : Dihilangkan (Fokus 100% pada Absensi)

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

// Helper: hitung hari kerja aktif dari tanggal awal s/d akhir (membedakan pusat 5 hari vs cabang 6 hari)
function hitungHariKerja(start: Date, end: Date, isCabang: boolean = false): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (isCabang) {
      if (day !== 0) count++ // Cabang: Senin s.d. Sabtu
    } else {
      if (day !== 0 && day !== 6) count++ // Pusat: Senin s.d. Jumat
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function formatLocal(d: Date) {
  const dWita = new Date(d.getTime() + 8 * 60 * 60 * 1000) // WITA (UTC+8)
  const y = dWita.getUTCFullYear()
  const m = String(dWita.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dWita.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ============================================================
// HITUNG INDEKS SATU PEGAWAI (upsert supaya idempoten)
// ============================================================
export async function hitungIndeksPegawai(pegawaiId: string, bulan: number, tahun: number) {
  try {
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
      include: { lokasiAbsensi: true, bidang: true }
    })
    if (!pegawai) return { error: "Pegawai tidak ditemukan" }

    const isCabang = isCabangEmployee(pegawai)

    const startDate = new Date(tahun, bulan - 1, 1, 0, 0, 0)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)
    const now = new Date()
    const isCurrentMonth = (bulan === now.getMonth() + 1 && tahun === now.getFullYear())
    const limitDate = isCurrentMonth ? now : endDate

    const hariKerja = hitungHariKerja(startDate, limitDate, isCabang)

    const absensi = await prisma.absensi.findMany({
      where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } }
    })

    const cutiPegawai = await (prisma as any).cuti.findMany({
      where: {
        pegawaiId,
        status: 'APPROVED',
        tanggalMulai: { lte: limitDate },
        tanggalSelesai: { gte: startDate }
      }
    })

    const absensiSet = new Set(absensi.map(a => formatLocal(a.tanggal)))
    
    // Anggap hari cuti sebagai hari yang "tercatat" (bukan alpha)
    cutiPegawai.forEach((c: any) => {
      const cur = new Date(Math.max(startDate.getTime(), new Date(c.tanggalMulai).getTime()))
      const end = new Date(Math.min(limitDate.getTime(), new Date(c.tanggalSelesai).getTime()))
      while (cur <= end) {
        absensiSet.add(formatLocal(cur))
        cur.setDate(cur.getDate() + 1)
      }
    })

    // Hitung hari kerja yang sudah lewat tapi tidak ada record absensi/cuti
    let unrecordedCount = 0
    const curDate = new Date(startDate)
    // Kalau bulan berjalan, jangan hitung "hari ini" sebagai alpha unrecorded jika belum absen (beri kelonggaran)
    // Jadi limitnya adalah kemarin jika bulan berjalan
    const limitDateAlpha = isCurrentMonth ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : limitDate
    
    while (curDate <= limitDateAlpha) {
      const day = curDate.getDay()
      const isWorkday = isCabang ? (day !== 0) : (day !== 0 && day !== 6)
      if (isWorkday) {
        const dateStr = formatLocal(curDate)
        if (!absensiSet.has(dateStr)) {
          unrecordedCount++
        }
      }
      curDate.setDate(curDate.getDate() + 1)
    }

    const hadirCount = absensi.filter(a => a.status === 'HADIR' || a.status === 'TERLAMBAT').length
    const terlambatCount = absensi.filter(a => a.status === 'TERLAMBAT').length
    // Alpha = explicit di DB + unrecorded
    const alphaCount = absensi.filter(a => a.status === 'ALPA').length + unrecordedCount
    const spAktif = !!pegawai.sp

    // Perbaikan Bug: Kurangi hari kerja jika ada izin, sakit, atau cuti legal agar pembagi lebih adil
    const excusedCount = absensi.filter(a => ['CUTI', 'SAKIT', 'IZIN'].includes(a.status)).length 
    const hariKerjaWajib = hariKerja > excusedCount ? hariKerja - excusedCount : 0

    // Hitung ketidakhadiran per sesi (Pagi / Siang / Sore)
    // Pusat: 3 sesi (Pagi, Siang, Sore)
    // Cabang: 2 sesi (Pagi, Sore)
    const todayStr = formatLocal(now)
    const nowWita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const currentHourWita = nowWita.getUTCHours()
    const currentMinWita = nowWita.getUTCMinutes()
    const currentTotalMinWita = currentHourWita * 60 + currentMinWita

    let missedSessionsCount = 0

    for (const a of absensi) {
      if (['CUTI', 'SAKIT', 'IZIN', 'ALPA'].includes(a.status)) continue

      const aDateStr = formatLocal(a.tanggal)
      const isToday = aDateStr === todayStr

      // Sesi Pagi (jamMasuk)
      if (!a.jamMasuk) {
        if (!isToday || currentTotalMinWita > 14 * 60) {
          missedSessionsCount++
        }
      }

      // Sesi Siang (jamSiang) - khusus Kantor Pusat
      if (!isCabang) {
        if (!a.jamSiang) {
          if (!isToday || currentTotalMinWita > 14 * 60) {
            missedSessionsCount++
          }
        }
      }

      // Sesi Sore (jamKeluar)
      if (!a.jamKeluar) {
        if (!isToday) {
          missedSessionsCount++
        } else if (currentTotalMinWita > 21 * 60) {
          missedSessionsCount++
        }
      }
    }

    // ─── Skor Komponen ───
    // Rasio hadir: seberapa konsisten pegawai hadir dari total wajib hadir
    const rasioHadir = hariKerjaWajib > 0 ? Math.min(1, hadirCount / hariKerjaWajib) : (excusedCount >= hariKerja && hariKerja > 0 ? 1 : 0)

    // Skor Kehadiran (50 poin): proporsi hari hadir dibanding wajib hadir
    const skorKehadiran = hariKerjaWajib > 0
      ? Math.min(50, (hadirCount / hariKerjaWajib) * 50)
      : (hadirCount > 0 ? 50 : (hariKerja > 0 && excusedCount >= hariKerja ? 50 : 0))

    // Skor Ketepatan (30 poin): FIX — dikalikan rasioHadir agar tidak bisa
    // mendapat nilai penuh jika jarang hadir (banyak alpha tetapi tepat waktu)
    const skorKetepatan = hadirCount > 0
      ? Math.min(30, ((hadirCount - terlambatCount) / hadirCount) * 30 * rasioHadir)
      : (hariKerjaWajib === 0 && excusedCount >= hariKerja ? 30 : 0)

    // Skor Absen Bersih (20 poin): alpha -5/hari, terlambat -1/kejadian, tidak hadir per sesi (pagi/siang/sore) -2/kejadian
    const skorAbsenBersih = Math.max(0, 20 - (alphaCount * 5) - (terlambatCount * 1) - (missedSessionsCount * 2))

    // Penilaian Perilaku / SP dihilangkan (fokus murni 100% pada absensi)
    const skorPerilaku = 0

    const totalSkor = Math.min(100, Math.round(
      (skorKehadiran + skorKetepatan + skorAbsenBersih) * 10
    ) / 10)

    const predikat = getPredikat(totalSkor)

    const result = await prisma.indeksPegawai.upsert({
      where: { pegawaiId_bulan_tahun: { pegawaiId, bulan, tahun } },
      update: {
        skorKehadiran, skorKetepatan, skorAbsenBersih, skorPerilaku,
        totalSkor, predikat, hariKerja, hadirCount, terlambatCount, alphaCount, missedSessionsCount, spAktif
      },
      create: {
        pegawaiId, bulan, tahun,
        skorKehadiran, skorKetepatan, skorAbsenBersih, skorPerilaku,
        totalSkor, predikat, hariKerja, hadirCount, terlambatCount, alphaCount, missedSessionsCount, spAktif
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
// LEADERBOARD: Top 10 skor real-time bulan ini
// Auto-recalculate skor semua pegawai aktif sebelum return
// ============================================================
export async function getLeaderboard(bulan?: number, tahun?: number) {
  try {
    const now = new Date()
    const b = bulan || now.getMonth() + 1
    const t = tahun || now.getFullYear()

    // Periksa apakah data indeks bulan ini sudah ada (baca cache, jangan recalc semua setiap load)
    const existingCount = await prisma.indeksPegawai.count({
      where: { bulan: b, tahun: t }
    })

    // Hanya auto-recalc jika BELUM ADA data sama sekali untuk bulan ini
    // Untuk update rutin, gunakan hitungIndeksSemuaPegawai() secara manual/scheduled
    if (existingCount === 0) {
      const pegawaiAktif = await prisma.pegawai.findMany({
        where: { status: 'AKTIF' },
        select: { id: true }
      })
      const chunkSize = 10
      for (let i = 0; i < pegawaiAktif.length; i += chunkSize) {
        const chunk = pegawaiAktif.slice(i, i + chunkSize)
        await Promise.all(chunk.map(p => hitungIndeksPegawai(p.id, b, t)))
      }
    }

    const rows = await prisma.indeksPegawai.findMany({
      where: { bulan: b, tahun: t },
      include: {
        pegawai: {
          select: { id: true, nama: true, jabatan: true, fotoUrl: true, bidang: { select: { nama: true } } }
        }
      },
      orderBy: { totalSkor: 'desc' },
      take: 10
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
      // Top 10 di leaderboard merupakan pegawai yang disiplin absen, jangan beri label "Sangat Kurang" atau "Kurang"
      let predLabel = getPredikatLabel(r.predikat)
      if (r.predikat === "SANGAT_KURANG" || r.predikat === "KURANG" || !predLabel) {
        predLabel = idx === 0 ? "Top 1 Teladan" : idx === 1 ? "Top 2 Teladan" : idx === 2 ? "Top 3 Teladan" : "Disiplin"
      }

      return {
        rank: idx + 1,
        pegawaiId: r.pegawaiId,
        nama: r.pegawai.nama,
        jabatan: r.pegawai.jabatan,
        unit: r.pegawai.bidang?.nama || "—",
        fotoUrl: r.pegawai.fotoUrl,
        totalSkor: r.totalSkor,
        predikat: r.predikat,
        predikatLabel: predLabel,
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
      // Jangan masukkan Direksi ke dalam ranking unit
      if (unit.nama.trim().toLowerCase().includes("direksi")) return
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

    // 1. Top Disiplin — Top 10 skor tertinggi (minimal skor 75)
    rows.filter(r => r.totalSkor >= 75).slice(0, 10).forEach(r => {
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

    // 3. Zero Late — tidak pernah terlambat (minimal hadir 10 hari / 50% hari kerja agar fair)
    rows.filter(r => r.terlambatCount === 0 && r.hadirCount >= Math.min(10, r.hariKerja * 0.5)).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "ZERO_LATE", bulan, tahun,
        deskripsi: `Tidak pernah terlambat selama ${r.hadirCount} hari kehadiran riil`
      })
    })

    // 4. Top Performer — skor >= 90
    rows.filter(r => r.totalSkor >= 90).forEach(r => {
      badgesToCreate.push({
        pegawaiId: r.pegawaiId, jenis: "TOP_PERFORMER", bulan, tahun,
        deskripsi: `Performa sangat baik dengan skor ${r.totalSkor}/100`
      })
    })

    // 5. Terbaik Unit — rank 1 di unit masing-masing (minimal skor 70)
    const unitBest = new Map<string, typeof rows[0]>()
    rows.filter(r => r.totalSkor >= 70).forEach(r => {
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

    // Hapus badge lama di bulan & tahun ini agar tidak ada badge "nyangkut" dari proses sebelumnya
    await prisma.badgePegawai.deleteMany({
      where: { bulan, tahun }
    })

    // Upsert semua badge baru
    let created = 0
    for (const badge of badgesToCreate) {
      await prisma.badgePegawai.create({
        data: badge
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

    // Parallel fetch: absensi + cuti + pegawai
    const [absensiList, cutiList, pegawaiData] = await Promise.all([
      prisma.absensi.findMany({
        where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } }
      }),
      (prisma as any).cuti.findMany({
        where: {
          pegawaiId,
          tanggalMulai: { lte: endDate },
          tanggalSelesai: { gte: startDate }
        }
      }),
      prisma.pegawai.findUnique({
        where: { id: pegawaiId },
        select: {
          id: true,
          nama: true,
          nik: true,
          jabatan: true,
          fotoUrl: true,
          bidang: { select: { nama: true } },
          subBidang: { select: { nama: true } }
        }
      })
    ])

    // Build a day map
    const dayMap: Record<string, any> = {}

    absensiList.forEach((a: any) => {
      const key = formatLocal(a.tanggal)
      dayMap[key] = {
        tanggal: key,
        status: a.status,
        jamMasuk: a.jamMasuk,
        jamSiang: a.jamSiang,
        jamKeluar: a.jamKeluar,
        fotoMasukUrl: a.fotoMasukUrl,
        fotoSiangUrl: a.fotoSiangUrl,
        fotoKeluarUrl: a.fotoKeluarUrl,
        lokasiMasuk: a.lokasiMasuk,
        lokasiSiang: a.lokasiSiang,
        lokasiKeluar: a.lokasiKeluar,
        keterangan: a.status === 'TERLAMBAT' ? 'Terlambat Masuk' : a.status === 'HADIR' ? 'Hadir Tepat Waktu' : a.status,
        source: "absensi"
      }
    })

    cutiList.forEach((c: any) => {
      const cur = new Date(c.tanggalMulai)
      const end = new Date(c.tanggalSelesai)
      while (cur <= end) {
        const key = formatLocal(cur)
        if (!dayMap[key]) {
          const jenisLower = (c.jenisCuti || "").toLowerCase()
          const rawStatus = c.status === 'APPROVED'
            ? (jenisLower.includes('sakit') ? 'SAKIT' : jenisLower.includes('izin') ? 'IZIN' : 'CUTI')
            : 'CUTI_PENDING'

          dayMap[key] = {
            tanggal: key,
            status: rawStatus,
            jenisCuti: c.jenisCuti,
            keterangan: c.alasan || c.jenisCuti || 'Pengajuan Cuti',
            source: "cuti"
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    })

    // Sinkronisasi Alpha: Tambahkan ALPA otomatis untuk hari kerja tanpa kehadiran/cuti
    const now = new Date()
    const isCurrentMonth = (bulan === now.getMonth() + 1) && (tahun === now.getFullYear())
    // Batas cek alpha otomatis (max H-1 jika bulan berjalan)
    const limitDateAlpha = isCurrentMonth ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : endDate
    
    let curAlphaDate = new Date(startDate)
    while (curAlphaDate <= limitDateAlpha) {
      const day = curAlphaDate.getDay()
      if (day !== 0 && day !== 6) { // Bukan akhir pekan (Minggu/Sabtu)
        const key = formatLocal(curAlphaDate)
        if (!dayMap[key]) {
          // Hari kerja tanpa absen dan cuti = ALPA otomatis
          dayMap[key] = {
            tanggal: key,
            status: 'ALPA',
            keterangan: 'Alpha (Tanpa Keterangan)',
            source: 'system'
          }
        }
      }
      curAlphaDate.setDate(curAlphaDate.getDate() + 1)
    }

    // Summary
    const values = Object.values(dayMap)
    const totalHariKerja = hitungHariKerja(startDate, endDate)
    const summary = {
      hadir: values.filter(v => v.status === 'HADIR').length,
      terlambat: values.filter(v => v.status === 'TERLAMBAT').length,
      cuti: values.filter(v => v.status === 'CUTI' || v.status === 'CUTI_PENDING').length,
      izin: values.filter(v => v.status === 'IZIN').length,
      sakit: values.filter(v => v.status === 'SAKIT').length,
      alpha: values.filter(v => v.status === 'ALPA').length,
      totalHariKerja,
    }

    return { dayMap, summary, pegawai: pegawaiData }
  } catch (error) {
    return { dayMap: {}, summary: {}, pegawai: null }
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
