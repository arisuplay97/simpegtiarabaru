"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"
import { revalidatePath } from "next/cache"
import { getSystemSettings } from "@/lib/actions/absensi"

export interface MatrixDayStatus {
  day: number
  dateStr: string
  code: "H" | "T" | "C" | "I" | "S" | "L" | "A" | "-"
  statusLabel: string
  jamMasuk?: string | null
  jamSiang?: string | null
  jamKeluar?: string | null
  keterangan?: string | null
  isWeekend: boolean
  isPast: boolean
  isToday: boolean
}

export interface PegawaiMatrixRow {
  id: string
  nik: string
  nama: string
  fotoUrl?: string | null
  departemen: string
  bidangId?: string | null
  cabang: string
  cabangId?: string | null
  jabatan: string
  days: Record<number, MatrixDayStatus>
  totalHadir: number
  totalTerlambat: number
  totalCuti: number
  totalIzin: number
  totalSakit: number
  totalLibur: number
  totalAlpha: number
  totalHariKerja: number
}

export interface KalenderMatrixResponse {
  success: boolean
  error?: string
  bulan: number
  tahun: number
  totalDays: number
  daysInfo: Array<{
    day: number
    dayName: string
    isWeekend: boolean
    dateStr: string
  }>
  rows: PegawaiMatrixRow[]
  departemenList: Array<{ id: string; nama: string }>
  cabangList: Array<{ id: string; nama: string }>
  summary: {
    totalPegawai: number
    totalHadir: number
    totalTerlambat: number
    totalIzinSakit: number
    totalCuti: number
    totalAlpha: number
  }
}

function formatLocal(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d
  return dt.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
}

function formatTimeWita(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return null
  return dt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
    hour12: false
  }).replace(".", ":")
}

export async function getKalenderMatrix(
  bulan: number,
  tahun: number
): Promise<KalenderMatrixResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: "Sesi telah berakhir, silakan login kembali.",
        bulan,
        tahun,
        totalDays: 0,
        daysInfo: [],
        rows: [],
        departemenList: [],
        cabangList: [],
        summary: {
          totalPegawai: 0,
          totalHadir: 0,
          totalTerlambat: 0,
          totalIzinSakit: 0,
          totalCuti: 0,
          totalAlpha: 0,
        },
      }
    }

    const totalDaysInMonth = new Date(tahun, bulan, 0).getDate()
    // Toleransi rentang agar menangkap baik record berformat UTC midnight maupun WITA
    const startDate = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0) - 24 * 60 * 60 * 1000)
    const endDate = new Date(Date.UTC(tahun, bulan, 0, 23, 59, 59, 999) + 24 * 60 * 60 * 1000)

    const now = new Date()
    const todayStr = formatLocal(now)
    const curWitaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }))
    const isCurrentMonth =
      bulan === curWitaDate.getMonth() + 1 && tahun === curWitaDate.getFullYear()

    // Day names in Indonesian
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

    const daysInfo = []
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const curDate = new Date(`${dateStr}T12:00:00+08:00`)
      const dayOfWeek = curDate.getDay() // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      daysInfo.push({
        day,
        dayName: dayNames[dayOfWeek],
        isWeekend,
        dateStr,
      })
    }

    // Parallel fetch: Pegawai, Absensi, Cuti, Bidang, Lokasi
    const [pegawais, absensiList, cutiList, bidangList, lokasiList] =
      await Promise.all([
        prisma.pegawai.findMany({
          where: { status: "AKTIF" },
          select: {
            id: true,
            nik: true,
            nama: true,
            fotoUrl: true,
            jabatan: true,
            bidangId: true,
            bidang: { select: { id: true, nama: true } },
            lokasiAbsensiId: true,
            lokasiAbsensi: { select: { id: true, nama: true, tipe: true } },
            bebasAbsensi: true,
          },
          orderBy: { nama: "asc" },
        }),
        prisma.absensi.findMany({
          where: {
            tanggal: { gte: startDate, lte: endDate },
          },
          select: {
            id: true,
            pegawaiId: true,
            tanggal: true,
            status: true,
            jamMasuk: true,
            jamSiang: true,
            jamKeluar: true,
            lokasiMasuk: true,
            lokasiSiang: true,
            lokasiKeluar: true,
          },
        }),
        (prisma as any).cuti.findMany({
          where: {
            status: "APPROVED",
            tanggalMulai: { lte: endDate },
            tanggalSelesai: { gte: startDate },
          },
          select: {
            pegawaiId: true,
            tanggalMulai: true,
            tanggalSelesai: true,
            jenisCuti: true,
            alasan: true,
          },
        }),
        prisma.bidang.findMany({
          where: { aktif: true },
          select: { id: true, nama: true },
          orderBy: { nama: "asc" },
        }),
        prisma.lokasiAbsensi.findMany({
          where: { aktif: true },
          select: { id: true, nama: true },
          orderBy: { nama: "asc" },
        }),
      ])

    // Build Absensi Map: [pegawaiId][dateStr] = absensi
    const absensiMap: Record<string, Record<string, any>> = {}
    for (const a of absensiList) {
      const dateKey = formatLocal(new Date(a.tanggal))
      if (!absensiMap[a.pegawaiId]) absensiMap[a.pegawaiId] = {}
      absensiMap[a.pegawaiId][dateKey] = a
    }

    // Build Cuti Map: [pegawaiId][dateStr] = cuti
    const cutiMap: Record<string, Record<string, any>> = {}
    for (const c of cutiList) {
      const cur = new Date(c.tanggalMulai)
      const end = new Date(c.tanggalSelesai)
      while (cur <= end) {
        const dateKey = formatLocal(cur)
        if (!cutiMap[c.pegawaiId]) cutiMap[c.pegawaiId] = {}
        cutiMap[c.pegawaiId][dateKey] = c
        cur.setDate(cur.getDate() + 1)
      }
    }

    let grandHadir = 0
    let grandTerlambat = 0
    let grandIzinSakit = 0
    let grandCuti = 0
    let grandAlpha = 0

    const rows: PegawaiMatrixRow[] = pegawais.map((p) => {
      const isCabang = isCabangEmployee(p)
      const days: Record<number, MatrixDayStatus> = {}

      let totalHadir = 0
      let totalTerlambat = 0
      let totalCuti = 0
      let totalIzin = 0
      let totalSakit = 0
      let totalLibur = 0
      let totalAlpha = 0
      let totalHariKerja = 0

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const curDate = new Date(tahun, bulan - 1, day)
        const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const dayOfWeek = curDate.getDay() // 0 = Min, 6 = Sab
        const isWeekend = isCabang ? dayOfWeek === 0 : dayOfWeek === 0 || dayOfWeek === 6
        const isPast = dateStr < todayStr
        const isToday = dateStr === todayStr

        if (!isWeekend) {
          totalHariKerja++
        }

        const absRecord = absensiMap[p.id]?.[dateStr]
        const cutiRecord = cutiMap[p.id]?.[dateStr]

        let code: "H" | "T" | "C" | "I" | "S" | "L" | "A" | "-" = "-"
        let statusLabel = "Hari Belum Berjalan"
        let jamMasukStr: string | null = null
        let jamSiangStr: string | null = null
        let jamKeluarStr: string | null = null
        let keterangan: string | null = null

        if (absRecord) {
          if (absRecord.jamMasuk) jamMasukStr = formatTimeWita(absRecord.jamMasuk)
          if (absRecord.jamSiang) jamSiangStr = formatTimeWita(absRecord.jamSiang)
          if (absRecord.jamKeluar) jamKeluarStr = formatTimeWita(absRecord.jamKeluar)

          if (absRecord.status === "HADIR") {
            code = "H"
            statusLabel = "Hadir Tepat Waktu"
            totalHadir++
            grandHadir++
          } else if (absRecord.status === "TERLAMBAT") {
            code = "T"
            statusLabel = "Terlambat"
            totalTerlambat++
            grandTerlambat++
          } else if (absRecord.status === "SAKIT") {
            code = "S"
            statusLabel = "Sakit"
            totalSakit++
            grandIzinSakit++
          } else if (absRecord.status === "IZIN" || absRecord.status === "DINAS") {
            code = "I"
            statusLabel = absRecord.status === "DINAS" ? "Dinas Luar" : "Izin"
            totalIzin++
            grandIzinSakit++
          } else if (absRecord.status === "CUTI") {
            code = "C"
            statusLabel = "Cuti"
            totalCuti++
            grandCuti++
          } else if (absRecord.status === "ALPA") {
            code = "A"
            statusLabel = "Alpha"
            totalAlpha++
            grandAlpha++
          }
        } else if (cutiRecord) {
          const jenisLower = (cutiRecord.jenisCuti || "").toLowerCase()
          keterangan = cutiRecord.alasan || cutiRecord.jenisCuti
          if (jenisLower.includes("sakit")) {
            code = "S"
            statusLabel = "Sakit (Pengajuan)"
            totalSakit++
            grandIzinSakit++
          } else if (jenisLower.includes("izin")) {
            code = "I"
            statusLabel = "Izin (Pengajuan)"
            totalIzin++
            grandIzinSakit++
          } else {
            code = "C"
            statusLabel = `Cuti: ${cutiRecord.jenisCuti}`
            totalCuti++
            grandCuti++
          }
        } else if (isWeekend) {
          code = "L"
          statusLabel = "Libur Akhir Pekan"
          totalLibur++
        } else if (p.bebasAbsensi) {
          // Pegawai dengan status bebas absensi (direksi/khusus) tidak diakumulasi sebagai Alpha
          code = "-"
          statusLabel = "Bebas Absensi"
        } else if (isPast) {
          code = "A"
          statusLabel = "Alpha (Tidak Hadir)"
          totalAlpha++
          grandAlpha++
        } else if (isToday) {
          code = "-"
          statusLabel = "Belum Absen Hari Ini"
        } else {
          code = "-"
          statusLabel = "Mendatang"
        }

        days[day] = {
          day,
          dateStr,
          code,
          statusLabel,
          jamMasuk: jamMasukStr,
          jamSiang: jamSiangStr,
          jamKeluar: jamKeluarStr,
          keterangan,
          isWeekend,
          isPast,
          isToday,
        }
      }

      return {
        id: p.id,
        nik: p.nik || `EMP-${p.id.slice(0, 5).toUpperCase()}`,
        nama: p.nama,
        fotoUrl: p.fotoUrl,
        departemen: p.bidang?.nama || "Umum",
        bidangId: p.bidangId,
        cabang: p.lokasiAbsensi?.nama || (isCabang ? "Kantor Cabang" : "Kantor Pusat"),
        cabangId: p.lokasiAbsensiId,
        jabatan: p.jabatan || "Staff",
        days,
        totalHadir,
        totalTerlambat,
        totalCuti,
        totalIzin,
        totalSakit,
        totalLibur,
        totalAlpha,
        totalHariKerja,
      }
    })

    return {
      success: true,
      bulan,
      tahun,
      totalDays: totalDaysInMonth,
      daysInfo,
      rows,
      departemenList: bidangList,
      cabangList: lokasiList,
      summary: {
        totalPegawai: pegawais.length,
        totalHadir: grandHadir,
        totalTerlambat: grandTerlambat,
        totalIzinSakit: grandIzinSakit,
        totalCuti: grandCuti,
        totalAlpha: grandAlpha,
      },
    }
  } catch (error: any) {
    console.error("getKalenderMatrix error:", error)
    return {
      success: false,
      error: error.message || "Gagal memuat matriks kehadiran",
      bulan,
      tahun,
      totalDays: 0,
      daysInfo: [],
      rows: [],
      departemenList: [],
      cabangList: [],
      summary: {
        totalPegawai: 0,
        totalHadir: 0,
        totalTerlambat: 0,
        totalIzinSakit: 0,
        totalCuti: 0,
        totalAlpha: 0,
      },
    }
  }
}

// ============================================================
// ISI OTOMATIS SISA HARI (H)
// Mengisi kehadiran (Hadir) untuk hari kerja yang tersisa di bulan
// ============================================================
export async function isiOtomatisSisaHariMatrix(bulan: number, tahun: number) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Belum login" }

    const role = (session.user as any).role
    if (role !== "SUPERADMIN" && role !== "HRD" && role !== "DIREKTUR") {
      return { success: false, error: "Akses ditolak. Fitur ini khusus Admin / HRD." }
    }

    const now = new Date()
    const nowWita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const todayDay = nowWita.getUTCDate()
    const totalDaysInMonth = new Date(tahun, bulan, 0).getDate()

    const isCurrentMonth =
      bulan === nowWita.getUTCMonth() + 1 && tahun === nowWita.getUTCFullYear()
    const startDay = isCurrentMonth ? todayDay : 1

    const pegawais = await prisma.pegawai.findMany({
      where: { status: "AKTIF" },
      select: { id: true, lokasiAbsensi: true },
    })

    const startDate = new Date(tahun, bulan - 1, startDay, 0, 0, 0)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

    const [existingAbsensi, existingCuti] = await Promise.all([
      prisma.absensi.findMany({
        where: { tanggal: { gte: startDate, lte: endDate } },
        select: { pegawaiId: true, tanggal: true },
      }),
      (prisma as any).cuti.findMany({
        where: {
          status: "APPROVED",
          tanggalMulai: { lte: endDate },
          tanggalSelesai: { gte: startDate },
        },
        select: { pegawaiId: true, tanggalMulai: true, tanggalSelesai: true },
      }),
    ])

    const existingSet = new Set<string>()
    for (const a of existingAbsensi) {
      existingSet.add(`${a.pegawaiId}_${formatLocal(new Date(a.tanggal))}`)
    }
    for (const c of existingCuti) {
      const cur = new Date(c.tanggalMulai)
      const end = new Date(c.tanggalSelesai)
      while (cur <= end) {
        existingSet.add(`${c.pegawaiId}_${formatLocal(cur)}`)
        cur.setDate(cur.getDate() + 1)
      }
    }

    const settings = await getSystemSettings()
    const [hMasuk, mMasuk] = (settings.jamMasuk || "08:00").split(":").map(Number)
    const [hPulang, mPulang] = (settings.jamPulang || "17:00").split(":").map(Number)

    const toInsert: Array<{
      pegawaiId: string
      tanggal: Date
      status: "HADIR"
      metode: "MANUAL"
      jamMasuk: Date
      jamSiang?: Date | null
      jamKeluar: Date
    }> = []

    for (let day = startDay; day <= totalDaysInMonth; day++) {
      const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const curDate = new Date(`${dateStr}T12:00:00+08:00`)
      const dayOfWeek = curDate.getDay()

      for (const p of pegawais) {
        const isCabang = isCabangEmployee(p)
        const isWeekend = isCabang ? dayOfWeek === 0 : dayOfWeek === 0 || dayOfWeek === 6
        if (isWeekend) continue // Jangan isi hari libur

        const key = `${p.id}_${dateStr}`
        if (!existingSet.has(key)) {
          const tMasuk = new Date(`${dateStr}T${String(hMasuk).padStart(2, "0")}:${String(mMasuk).padStart(2, "0")}:00+08:00`)
          const tSiang = new Date(`${dateStr}T12:15:00+08:00`)
          const tPulang = new Date(`${dateStr}T${String(hPulang).padStart(2, "0")}:${String(mPulang).padStart(2, "0")}:00+08:00`)
          const targetTanggalDb = new Date(`${dateStr}T00:00:00.000Z`)

          toInsert.push({
            pegawaiId: p.id,
            tanggal: targetTanggalDb,
            status: "HADIR",
            metode: "MANUAL",
            jamMasuk: tMasuk,
            jamSiang: isCabang ? null : tSiang,
            jamKeluar: tPulang,
          })
          existingSet.add(key)
        }
      }
    }

    if (toInsert.length === 0) {
      return {
        success: true,
        count: 0,
        message: "Tidak ada sisa hari kerja yang perlu diisi otomatis.",
      }
    }

    // Insert in batches of 500
    const chunkSize = 500
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      await prisma.absensi.createMany({
        data: chunk,
      })
    }

    revalidatePath("/kalender")
    return {
      success: true,
      count: toInsert.length,
      message: `Berhasil mengisi otomatis ${toInsert.length} data kehadiran (Hadir) untuk sisa hari kerja bulan ini.`,
    }
  } catch (error: any) {
    console.error("isiOtomatisSisaHariMatrix error:", error)
    return {
      success: false,
      error: error.message || "Gagal mengisi otomatis sisa hari",
    }
  }
}
