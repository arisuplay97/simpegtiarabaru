'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth, parse } from "date-fns"
import { logAudit } from "./audit-log"
import { prosesPPh21Batch } from "./pph21"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"
import { normalizeGolonganKey } from "@/lib/utils"

// Helper to format date into YYYY-MM-DD in WITA (UTC+8)
function formatLocal(d: Date) {
  const dWita = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const y = dWita.getUTCFullYear()
  const m = String(dWita.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dWita.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

// Helper to get month boundaries from a string like "2026-03" or "mar-2026"
function getMonthBounds(periodStr: string) {
  // If periodStr is like "mar-2026", convert it to a Date
  let date: Date
  if (periodStr.includes("-") && isNaN(parseInt(periodStr.split("-")[0]))) {
    const [monthIdx, year] = periodStr.split("-")
    const months = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"]
    const monthIndex = months.indexOf(monthIdx)
    date = new Date(parseInt(year), monthIndex >= 0 ? monthIndex : 0, 1)
  } else {
    // try to parse as YYYY-MM
    date = new Date(periodStr + "-01")
  }
  
  if (isNaN(date.getTime())) {
    date = new Date()
  }

  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
    date
  }
}

// ============ REUSABLE ATTENDANCE PENALTY CALCULATION ============
function calculateAttendancePenalty({
  pegawai,
  start,
  end,
  pengaturan,
  absensiList,
  cutiList,
}: {
  pegawai: any
  start: Date
  end: Date
  pengaturan: any
  absensiList: any[]
  cutiList: any[]
}) {
  const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
  const [targetH, targetM] = jamMasukSetting.split(":").map(Number)

  const dendaTerlambatPerKejadian = Number(pengaturan?.dendaTerlambat ?? 5000)
  const batasTerlambatDenda = Number(pengaturan?.batasTerlambatDenda ?? 5)
  const dendaAlpaPerHari = Number(pengaturan?.dendaAlpa ?? 7500)
  const tunjanganTransportLocked = Number(pengaturan?.tunjanganTransport ?? 120000)
  const batasAlpaLenyapTransport = Number(pengaturan?.batasAlpaDendaTransport ?? 3)

  // 1. Kumpulkan tanggal yang tercatat presensi dan alpa eksplisit
  const recordedDates = new Set<string>()
  const explicitAlpaDates = new Set<string>()
  let countTerlambatDenda = 0

  for (const abs of absensiList) {
    const dateKey = formatLocal(new Date(abs.tanggal))
    if (abs.status === "ALPA") {
      explicitAlpaDates.add(dateKey)
    } else {
      recordedDates.add(dateKey)
    }

    if (abs.status === "TERLAMBAT" && abs.jamMasuk) {
      const checkIn = new Date(abs.jamMasuk)
      const scheduled = new Date(checkIn)
      scheduled.setHours(targetH, targetM, 0, 0)

      const diffMins = Math.floor((checkIn.getTime() - scheduled.getTime()) / 60000)
      if (diffMins > batasTerlambatDenda) {
        countTerlambatDenda++
      }
    }
  }

  // 2. Kumpulkan tanggal permohonan cuti/izin/sakit yang sudah di-APPROVED
  for (const c of cutiList) {
    let cur = new Date(Math.max(new Date(c.tanggalMulai).getTime(), start.getTime()))
    const endC = new Date(Math.min(new Date(c.tanggalSelesai).getTime(), end.getTime()))
    while (cur <= endC) {
      recordedDates.add(formatLocal(cur))
      cur.setDate(cur.getDate() + 1)
    }
  }

  // 3. Evaluasi hari kerja yang belum ada presensinya (Auto-Alpha / Mangkir)
  const now = new Date()
  const nowWita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const todayStr = formatLocal(now)

  const isCabang = isCabangEmployee(pegawai)
  let unrecordedAlpaCount = 0

  const totalDaysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const curDate = new Date(start.getFullYear(), start.getMonth(), day)
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Hari di masa depan tidak boleh dihitung alpa
    if (dateStr > todayStr) {
      continue
    }

    const dayOfWeek = curDate.getDay() // 0 = Minggu, 6 = Sabtu
    const isWeekend = isCabang ? (dayOfWeek === 0) : (dayOfWeek === 0 || dayOfWeek === 6)

    if (!isWeekend) {
      // Jika hari ini, beri toleransi sebelum jam pulang kerja usai
      if (dateStr === todayStr) {
        const jamPulangSetting = isCabang && dayOfWeek === 6
          ? (pengaturan?.jamPulangSabtuCabang || "13:00")
          : (pengaturan?.jamPulang || "17:00")
        const [pjH, pjM] = jamPulangSetting.split(":").map(Number)
        const currentHourWita = nowWita.getUTCHours()
        const currentMinWita = nowWita.getUTCMinutes()
        const isAfterWorkingHours = currentHourWita > pjH || (currentHourWita === pjH && currentMinWita >= pjM)

        if (!isAfterWorkingHours) {
          continue
        }
      }

      // Jika tidak ada presensi/cuti sah dan belum tercatat alpa eksplisit
      if (!recordedDates.has(dateStr) && !explicitAlpaDates.has(dateStr)) {
        unrecordedAlpaCount++
      }
    }
  }

  const countAlpa = explicitAlpaDates.size + unrecordedAlpaCount
  const totalDendaTerlambat = countTerlambatDenda * dendaTerlambatPerKejadian
  const totalDendaAlpa = countAlpa * dendaAlpaPerHari
  const penaltiTransport = countAlpa >= batasAlpaLenyapTransport ? tunjanganTransportLocked : 0

  const totalPotongan = totalDendaTerlambat + totalDendaAlpa + penaltiTransport

  return {
    countAlpa,
    countTerlambatDenda,
    totalDendaTerlambat,
    totalDendaAlpa,
    penaltiTransport,
    totalPotongan
  }
}

// ============ GET PAYROLL PEGAWAI FOR A SPECIFIC MONTH ============
export async function getPayrollList(periodStr: string) {
  const { start, end } = getMonthBounds(periodStr)

  // Fetch all active employees (and those who have payroll this month even if inactive)
  const pegawai = await prisma.pegawai.findMany({
    where: {
      OR: [
        { status: "AKTIF" },
        { payroll: { some: { bulan: { gte: start, lte: end } } } }
      ]
    },
    include: {
      bidang: true,
      lokasiAbsensi: true,
      payroll: {
        where: {
          bulan: {
            gte: start,
            lte: end
          }
        }
      }
    },
    orderBy: { nama: 'asc' }
  })

  // Pre-fetch settings for calculations
  const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })

  // Batch query absensi, approved cuti, approved lembur, and salary standards
  const [allAbsensi, allApprovedCuti, allApprovedLembur, allStandar] = await Promise.all([
    prisma.absensi.findMany({
      where: { tanggal: { gte: start, lte: end } }
    }),
    prisma.cuti.findMany({
      where: {
        status: "APPROVED",
        tanggalMulai: { lte: end },
        tanggalSelesai: { gte: start }
      }
    }),
    (prisma as any).lembur.findMany({
      where: {
        status: "APPROVED",
        tanggal: { gte: start, lte: end }
      }
    }),
    (prisma as any).standarGajiPangkat.findMany()
  ])

  // Group by pegawaiId
  const absensiByPegawai: Record<string, any[]> = {}
  for (const a of allAbsensi) {
    if (!absensiByPegawai[a.pegawaiId]) absensiByPegawai[a.pegawaiId] = []
    absensiByPegawai[a.pegawaiId].push(a)
  }

  const cutiByPegawai: Record<string, any[]> = {}
  for (const c of allApprovedCuti) {
    if (!cutiByPegawai[c.pegawaiId]) cutiByPegawai[c.pegawaiId] = []
    cutiByPegawai[c.pegawaiId].push(c)
  }

  const lemburByPegawai: Record<string, any[]> = {}
  for (const l of allApprovedLembur) {
    if (!lemburByPegawai[l.pegawaiId]) lemburByPegawai[l.pegawaiId] = []
    lemburByPegawai[l.pegawaiId].push(l)
  }

  // Standar gaji map by Golongan (supports flexible Gol A/I, A/1, etc.)
  const standarMap: Record<string, { gajiPokok: number, tunjangan: number, pangkat: string }> = {}
  for (const s of allStandar) {
    const rawKey = (s.golongan || "").toUpperCase().trim()
    const normKey = normalizeGolonganKey(s.golongan)
    const val = {
      gajiPokok: Number(s.gajiPokok),
      tunjangan: Number(s.tunjangan),
      pangkat: s.pangkat
    }
    standarMap[rawKey] = val
    standarMap[normKey] = val
  }

  // Format the response and calculate dynamic draft penalties
  const results = pegawai.map((emp) => {
    const pr = emp.payroll.length > 0 ? emp.payroll[0] : null
    let baseGaji = Number(emp.gajiPokok || 0)
    let baseTunjangan = Number(emp.tunjangan || 0)

    // Fallback ke standar pangkat jika pegawai belum memiliki nominal di profile
    if (baseGaji === 0 && emp.golongan) {
      const std = standarMap[emp.golongan.toUpperCase().trim()] || standarMap[normalizeGolonganKey(emp.golongan)]
      if (std) {
        baseGaji = std.gajiPokok
        if (baseTunjangan === 0) baseTunjangan = std.tunjangan
      }
    }

    let penaltyInfo: ReturnType<typeof calculateAttendancePenalty> | null = null
    let calculatedPotongan = 0

    if (!pr) {
      penaltyInfo = calculateAttendancePenalty({
        pegawai: emp,
        start,
        end,
        pengaturan,
        absensiList: absensiByPegawai[emp.id] || [],
        cutiList: cutiByPegawai[emp.id] || []
      })
      calculatedPotongan = penaltyInfo.totalPotongan
    }

    const gajiPokok = pr ? Number(pr.gajiPokok) : baseGaji
    const tunjangan = pr ? Number(pr.tunjangan) : baseTunjangan
    const potongan = pr ? Number(pr.potongan) : calculatedPotongan

    const empLembur = lemburByPegawai[emp.id] || []
    const lemburBayar = empLembur.reduce((s: number, l: any) => s + Number(l.totalBayar || 0), 0)

    const bpjsKesPct = pengaturan?.bpjsKesehatanPcs ? Number(pengaturan.bpjsKesehatanPcs) / 100 : 0.01
    const bpjsTkPct = pengaturan?.bpjsTkPcs ? Number(pengaturan.bpjsTkPcs) / 100 : 0.02
    const bpjsKes = Math.round(gajiPokok * bpjsKesPct)
    const bpjsTk = Math.round(gajiPokok * bpjsTkPct)

    return {
      pegawaiId: emp.id,
      nik: emp.nik,
      nama: emp.nama,
      fotoUrl: emp.fotoUrl,
      unit: emp.bidang?.nama || "Umum",
      golongan: emp.golongan,
      jabatan: emp.jabatan || "-",

      gajiPokok,
      tunjangan,
      potongan,
      lembur: lemburBayar,

      gajiBersih: (pr ? Number(pr.total) : (gajiPokok + tunjangan - potongan)) + lemburBayar,
      status: pr ? "approved" : "draft",

      payrollId: pr?.id,
      countAlpa: penaltyInfo?.countAlpa,
      dendaAlpa: penaltyInfo?.totalDendaAlpa,
      countTerlambatDenda: penaltyInfo?.countTerlambatDenda,
      dendaTerlambat: penaltyInfo?.totalDendaTerlambat,
      penaltiTransport: penaltyInfo?.penaltiTransport,
      bpjsKes,
      bpjsTk,
    }
  })

  return results
}

// ============ UPSERT PAYROLL (Save Edit) ============
export async function savePayroll(data: {
  pegawaiId: string
  periodStr: string
  gajiPokok: number
  tunjangan: number
  potongan: number
}) {
  try {
    const { date, start, end } = getMonthBounds(data.periodStr)
    const total = data.gajiPokok + data.tunjangan - data.potongan

    // Check if payroll already exists for this month
    const existing = await prisma.payroll.findFirst({
      where: {
        pegawaiId: data.pegawaiId,
        bulan: { gte: start, lte: end }
      }
    })

    if (existing) {
      await prisma.payroll.update({
        where: { id: existing.id },
        data: {
          gajiPokok: data.gajiPokok,
          tunjangan: data.tunjangan,
          potongan: data.potongan,
          total: total
        }
      })
    } else {
      await prisma.payroll.create({
        data: {
          pegawaiId: data.pegawaiId,
          bulan: date,
          gajiPokok: data.gajiPokok,
          tunjangan: data.tunjangan,
          potongan: data.potongan,
          total: total
        }
      })
    }

    // ALSO update the Employee's base profile so it sticks for future months
    await prisma.pegawai.update({
      where: { id: data.pegawaiId },
      data: {
        gajiPokok: data.gajiPokok,
        tunjangan: data.tunjangan
      }
    })

    await logAudit({
      action: existing ? "UPDATE" : "CREATE",
      module: "payroll",
      targetId: data.pegawaiId,
      targetName: `Payroll ${data.periodStr}`,
      newData: { ...data, total } as any,
    })

    revalidatePath("/payroll")
    return { success: true }
  } catch (error: any) {
    console.error("Error saving payroll:", error)
    return { error: error.message || "Terjadi kesalahan saat menyimpan payroll" }
  }
}

// ============ GET PAYROLL SETTINGS ============
export async function getPayrollSettings() {
  const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
  return {
    dendaAlpa: Number(pengaturan?.dendaAlpa ?? 7500),
    batasAlpaDendaTransport: Number(pengaturan?.batasAlpaDendaTransport ?? 3),
    tunjanganTransport: Number(pengaturan?.tunjanganTransport ?? 120000),
    dendaTerlambat: Number(pengaturan?.dendaTerlambat ?? 5000),
    batasTerlambatDenda: Number(pengaturan?.batasTerlambatDenda ?? 5),
    bpjsKesehatanPcs: Number(pengaturan?.bpjsKesehatanPcs ?? 1.0),
    bpjsTkPcs: Number(pengaturan?.bpjsTkPcs ?? 2.0),
    tanggalGajian: Number(pengaturan?.tanggalGajian ?? 25),
  }
}

// ============ UPDATE PAYROLL SETTINGS ============
export async function updatePayrollSettings(data: {
  dendaAlpa: number
  batasAlpaDendaTransport: number
  tunjanganTransport: number
  dendaTerlambat: number
  batasTerlambatDenda: number
  bpjsKesehatanPcs: number
  bpjsTkPcs: number
  tanggalGajian: number
}) {
  try {
    await (prisma as any).pengaturan.upsert({
      where: { id: "1" },
      update: {
        dendaAlpa: Number(data.dendaAlpa),
        batasAlpaDendaTransport: Number(data.batasAlpaDendaTransport),
        tunjanganTransport: Number(data.tunjanganTransport),
        dendaTerlambat: Number(data.dendaTerlambat),
        batasTerlambatDenda: Number(data.batasTerlambatDenda),
        bpjsKesehatanPcs: Number(data.bpjsKesehatanPcs),
        bpjsTkPcs: Number(data.bpjsTkPcs),
        tanggalGajian: Number(data.tanggalGajian),
      },
      create: {
        id: "1",
        dendaAlpa: Number(data.dendaAlpa),
        batasAlpaDendaTransport: Number(data.batasAlpaDendaTransport),
        tunjanganTransport: Number(data.tunjanganTransport),
        dendaTerlambat: Number(data.dendaTerlambat),
        batasTerlambatDenda: Number(data.batasTerlambatDenda),
        bpjsKesehatanPcs: Number(data.bpjsKesehatanPcs),
        bpjsTkPcs: Number(data.bpjsTkPcs),
        tanggalGajian: Number(data.tanggalGajian),
      }
    })

    await logAudit({
      action: "UPDATE",
      module: "payroll",
      targetName: "Pengaturan Denda & Potongan Payroll",
      newData: data as any,
    })

    revalidatePath("/payroll")
    return { success: true }
  } catch (error: any) {
    console.error("Error updatePayrollSettings:", error)
    return { error: "Gagal memperbarui pengaturan payroll" }
  }
}

// ============ DEFAULT STANDAR GAJI PANGKAT ============
const DEFAULT_STANDAR_GAJI_PANGKAT = [
  // Golongan I - Juru
  { golongan: "A/I", pangkat: "Juru Muda", gajiPokok: 2100000, tunjangan: 500000, keterangan: "Pendidikan SD/SMP" },
  { golongan: "B/I", pangkat: "Juru Muda Tk. I", gajiPokok: 2350000, tunjangan: 600000, keterangan: "Pendidikan SMP Lanjutan" },
  { golongan: "C/I", pangkat: "Juru", gajiPokok: 2600000, tunjangan: 700000, keterangan: "Tingkat Lanjutan" },
  { golongan: "D/I", pangkat: "Juru Tk. I", gajiPokok: 2850000, tunjangan: 800000, keterangan: "Pangkat Tertinggi Golongan I" },

  // Golongan II - Pengatur
  { golongan: "A/II", pangkat: "Pengatur Muda", gajiPokok: 3100000, tunjangan: 900000, keterangan: "Pendidikan SMA/SMK" },
  { golongan: "B/II", pangkat: "Pengatur Muda Tk. I", gajiPokok: 3400000, tunjangan: 1050000, keterangan: "Pendidikan D1/D2" },
  { golongan: "C/II", pangkat: "Pengatur", gajiPokok: 3750000, tunjangan: 1200000, keterangan: "Pendidikan D3" },
  { golongan: "D/II", pangkat: "Pengatur Tk. I", gajiPokok: 4100000, tunjangan: 1350000, keterangan: "Pangkat Tertinggi Golongan II" },

  // Golongan III - Penata
  { golongan: "A/III", pangkat: "Penata Muda", gajiPokok: 4600000, tunjangan: 1600000, keterangan: "Pendidikan S1 / D4" },
  { golongan: "B/III", pangkat: "Penata Muda Tk. I", gajiPokok: 5100000, tunjangan: 1850000, keterangan: "Pendidikan S2 / Profesi" },
  { golongan: "C/III", pangkat: "Penata", gajiPokok: 5650000, tunjangan: 2150000, keterangan: "Penata Madya" },
  { golongan: "D/III", pangkat: "Penata Tk. I", gajiPokok: 6300000, tunjangan: 2500000, keterangan: "Pendidikan S3 / Pangkat Tertinggi Gol III" },

  // Golongan IV - Pembina
  { golongan: "A/IV", pangkat: "Pembina", gajiPokok: 7100000, tunjangan: 3000000, keterangan: "Pangkat Eselon / Pembina Madya" },
  { golongan: "B/IV", pangkat: "Pembina Tk. I", gajiPokok: 8000000, tunjangan: 3500000, keterangan: "Pembina Tingkat I" },
  { golongan: "C/IV", pangkat: "Pembina Utama Muda", gajiPokok: 9000000, tunjangan: 4100000, keterangan: "Pembina Utama Muda" },
  { golongan: "D/IV", pangkat: "Pembina Utama Madya", gajiPokok: 10200000, tunjangan: 4800000, keterangan: "Pembina Utama Madya" },
  { golongan: "E/IV", pangkat: "Pembina Utama", gajiPokok: 11500000, tunjangan: 5600000, keterangan: "Pangkat Tertinggi Struktural" },
]

// ============ GET STANDAR GAJI PANGKAT LIST ============
const RANK_HIERARCHY_ORDER: Record<string, number> = {
  "A/I": 1, "B/I": 2, "C/I": 3, "D/I": 4,
  "A/II": 5, "B/II": 6, "C/II": 7, "D/II": 8,
  "A/III": 9, "B/III": 10, "C/III": 11, "D/III": 12,
  "A/IV": 13, "B/IV": 14, "C/IV": 15, "D/IV": 16, "E/IV": 17
}

export async function getStandarGajiPangkatList() {
  try {
    let list = await (prisma as any).standarGajiPangkat.findMany()

    // Auto-seed if empty
    if (list.length === 0) {
      for (const item of DEFAULT_STANDAR_GAJI_PANGKAT) {
        await (prisma as any).standarGajiPangkat.create({
          data: {
            golongan: item.golongan,
            pangkat: item.pangkat,
            gajiPokok: item.gajiPokok,
            tunjangan: item.tunjangan,
            keterangan: item.keterangan
          }
        })
      }
      list = await (prisma as any).standarGajiPangkat.findMany()
    }

    const mapped = list.map((item: any) => ({
      id: item.id,
      golongan: item.golongan,
      pangkat: item.pangkat,
      gajiPokok: Number(item.gajiPokok),
      tunjangan: Number(item.tunjangan),
      keterangan: item.keterangan || ""
    }))

    // Sort by hierarchical rank order
    return mapped.sort((a: any, b: any) => {
      const orderA = RANK_HIERARCHY_ORDER[a.golongan.toUpperCase().trim()] || 99
      const orderB = RANK_HIERARCHY_ORDER[b.golongan.toUpperCase().trim()] || 99
      if (orderA !== orderB) return orderA - orderB
      return a.golongan.localeCompare(b.golongan)
    })
  } catch (error: any) {
    console.error("Error getStandarGajiPangkatList:", error)
    return DEFAULT_STANDAR_GAJI_PANGKAT.map((d, i) => ({ id: String(i + 1), ...d }))
  }
}

// ============ SAVE / UPDATE STANDAR GAJI PANGKAT ============
export async function saveStandarGajiPangkat(data: {
  id?: string
  golongan: string
  pangkat: string
  gajiPokok: number
  tunjangan: number
  keterangan?: string
}) {
  try {
    if (data.id) {
      await (prisma as any).standarGajiPangkat.update({
        where: { id: data.id },
        data: {
          golongan: data.golongan.trim(),
          pangkat: data.pangkat.trim(),
          gajiPokok: data.gajiPokok,
          tunjangan: data.tunjangan,
          keterangan: data.keterangan,
        }
      })
    } else {
      await (prisma as any).standarGajiPangkat.upsert({
        where: { golongan: data.golongan.trim() },
        update: {
          pangkat: data.pangkat.trim(),
          gajiPokok: data.gajiPokok,
          tunjangan: data.tunjangan,
          keterangan: data.keterangan,
        },
        create: {
          golongan: data.golongan.trim(),
          pangkat: data.pangkat.trim(),
          gajiPokok: data.gajiPokok,
          tunjangan: data.tunjangan,
          keterangan: data.keterangan,
        }
      })
    }

    await logAudit({
      action: data.id ? "UPDATE" : "CREATE",
      module: "payroll",
      targetName: `Standar Gaji ${data.golongan} (${data.pangkat})`,
      newData: data as any,
    })

    revalidatePath("/payroll")
    return { success: true }
  } catch (error: any) {
    console.error("Error saveStandarGajiPangkat:", error)
    return { error: error.message || "Gagal menyimpan standar gaji pangkat" }
  }
}

// ============ DELETE STANDAR GAJI PANGKAT ============
export async function deleteStandarGajiPangkat(id: string) {
  try {
    const deleted = await (prisma as any).standarGajiPangkat.delete({
      where: { id }
    })

    await logAudit({
      action: "DELETE",
      module: "payroll",
      targetName: `Standar Gaji ${deleted.golongan} (${deleted.pangkat})`,
    })

    revalidatePath("/payroll")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleteStandarGajiPangkat:", error)
    return { error: error.message || "Gagal menghapus standar gaji pangkat" }
  }
}

// ============ APPLY STANDAR GAJI TO ACTIVE EMPLOYEES ============
export async function applyStandarGajiToPegawai(options: { mode: "all" | "zero_only", golongan?: string }) {
  try {
    const standarList = await (prisma as any).standarGajiPangkat.findMany()
    const standarMap: Record<string, { gajiPokok: number, tunjangan: number, pangkat: string }> = {}
    
    for (const s of standarList) {
      const rawKey = (s.golongan || "").toUpperCase().trim()
      const normKey = normalizeGolonganKey(s.golongan)
      const val = {
        gajiPokok: Number(s.gajiPokok),
        tunjangan: Number(s.tunjangan),
        pangkat: s.pangkat
      }
      standarMap[rawKey] = val
      standarMap[normKey] = val
    }

    const whereClause: any = { status: "AKTIF" }
    if (options.golongan && options.golongan !== "all") {
      whereClause.golongan = options.golongan
    }

    const pegawais = await prisma.pegawai.findMany({
      where: whereClause
    })

    let updatedCount = 0
    for (const p of pegawais) {
      const golKey = (p.golongan || "").toUpperCase().trim()
      const normKey = normalizeGolonganKey(p.golongan)
      const matched = standarMap[golKey] || standarMap[normKey]

      if (matched) {
        const currentPokok = Number(p.gajiPokok || 0)
        const shouldUpdate = options.mode === "all" || currentPokok === 0

        if (shouldUpdate) {
          await prisma.pegawai.update({
            where: { id: p.id },
            data: {
              gajiPokok: matched.gajiPokok,
              tunjangan: matched.tunjangan,
              pangkat: p.pangkat && p.pangkat !== "-" ? p.pangkat : matched.pangkat
            }
          })
          updatedCount++
        }
      }
    }

    await logAudit({
      action: "UPDATE",
      module: "payroll",
      targetName: `Terapkan Standar Gaji (${updatedCount} pegawai)`,
      newData: { options, updatedCount } as any,
    })

    revalidatePath("/payroll")
    return { success: true, updatedCount }
  } catch (error: any) {
    console.error("Error applyStandarGajiToPegawai:", error)
    return { error: error.message || "Gagal menerapkan standar gaji ke pegawai" }
  }
}

// ============ PROCESS ALL PAYROLL ============
export async function processAllPayroll(periodStr: string) {
  try {
    const { start, end, date } = getMonthBounds(periodStr)
    
    // Get all active employees who don't have payroll for this month yet
    const employees = await prisma.pegawai.findMany({
      where: { 
        status: "AKTIF",
        payroll: {
          none: {
            bulan: { gte: start, lte: end }
          }
        }
      },
      include: {
        bidang: true,
        lokasiAbsensi: true
      }
    })

    // Batch create their default payroll
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })

    // Batch query absensi, approved cuti, and standards to eliminate N+1 latency
    const [allAbsensi, allApprovedCuti, allStandar] = await Promise.all([
      prisma.absensi.findMany({
        where: { tanggal: { gte: start, lte: end } }
      }),
      prisma.cuti.findMany({
        where: {
          status: "APPROVED",
          tanggalMulai: { lte: end },
          tanggalSelesai: { gte: start }
        }
      }),
      (prisma as any).standarGajiPangkat.findMany()
    ])

    const absensiByPegawai: Record<string, any[]> = {}
    for (const a of allAbsensi) {
      if (!absensiByPegawai[a.pegawaiId]) absensiByPegawai[a.pegawaiId] = []
      absensiByPegawai[a.pegawaiId].push(a)
    }

    const cutiByPegawai: Record<string, any[]> = {}
    for (const c of allApprovedCuti) {
      if (!cutiByPegawai[c.pegawaiId]) cutiByPegawai[c.pegawaiId] = []
      cutiByPegawai[c.pegawaiId].push(c)
    }

    const standarMap: Record<string, { gajiPokok: number, tunjangan: number }> = {}
    for (const s of allStandar) {
      const rawKey = (s.golongan || "").toUpperCase().trim()
      const normKey = normalizeGolonganKey(s.golongan)
      const val = {
        gajiPokok: Number(s.gajiPokok),
        tunjangan: Number(s.tunjangan)
      }
      standarMap[rawKey] = val
      standarMap[normKey] = val
    }

    const batch = employees.map((emp) => {
      let gPokok = Number(emp.gajiPokok || 0)
      let tunj = Number(emp.tunjangan || 0)

      if (gPokok === 0 && emp.golongan) {
        const std = standarMap[emp.golongan.toUpperCase().trim()] || standarMap[normalizeGolonganKey(emp.golongan)]
        if (std) {
          gPokok = std.gajiPokok
          if (tunj === 0) tunj = std.tunjangan
        }
      }

      const penalty = calculateAttendancePenalty({
        pegawai: emp,
        start,
        end,
        pengaturan,
        absensiList: absensiByPegawai[emp.id] || [],
        cutiList: cutiByPegawai[emp.id] || []
      })
      const pot = penalty.totalPotongan

      return {
        pegawaiId: emp.id,
        bulan: date,
        gajiPokok: gPokok,
        tunjangan: tunj,
        potongan: pot,
        total: gPokok + tunj - pot
      }
    })

    if (batch.length > 0) {
      await prisma.payroll.createMany({
        data: batch
      })

      await logAudit({
        action: "CREATE",
        module: "payroll",
        targetName: `Process Batch Payroll ${periodStr} (${batch.length} pegawai)`,
      })

      // OTOMATIS: Hitung PPh 21 setelah payroll beres
      await prosesPPh21Batch(periodStr)
    }

    revalidatePath("/payroll")
    return { success: true, processedCount: batch.length }
  } catch (error: any) {
    console.error("Error processing payroll:", error)
    return { error: "Gagal memproses payroll batch" }
  }
}

// ============ GET MY PAYROLL (For logged-in user Slip Gaji) ============
import { auth } from "@/lib/auth"

export async function getMyPayroll(periodStr: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { start, end } = getMonthBounds(periodStr)

  let pegawai = await prisma.pegawai.findUnique({
    where: { userId: session.user.id },
    include: {
      bidang: true,
      lokasiAbsensi: true,
      payroll: {
        where: {
          bulan: { gte: start, lte: end }
        }
      }
    }
  })

  // Fallback to email if userId is not strongly linked
  if (!pegawai && session.user.email) {
    pegawai = await prisma.pegawai.findUnique({
      where: { email: session.user.email },
      include: {
        bidang: true,
        lokasiAbsensi: true,
        payroll: { where: { bulan: { gte: start, lte: end } } }
      }
    })
  }

  if (!pegawai) return null

  // Fetch approved overtime for this user
  const lemburApproved = await (prisma as any).lembur.findMany({
    where: { pegawaiId: pegawai.id, status: "APPROVED", tanggal: { gte: start, lte: end } }
  })
  const lemburBayar = lemburApproved.reduce((s: number, l: any) => s + Number(l.totalBayar), 0)

  const pr = pegawai.payroll.length > 0 ? pegawai.payroll[0] : null
  const baseGaji = Number(pegawai.gajiPokok || 0)
  const baseTunjangan = Number(pegawai.tunjangan || 0)

  let calculatedPotongan = 0
  if (!pr) {
    const [absList, cutiList, pengaturan] = await Promise.all([
      prisma.absensi.findMany({
        where: { pegawaiId: pegawai.id, tanggal: { gte: start, lte: end } }
      }),
      prisma.cuti.findMany({
        where: {
          pegawaiId: pegawai.id,
          status: "APPROVED",
          tanggalMulai: { lte: end },
          tanggalSelesai: { gte: start }
        }
      }),
      (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    ])

    const penalty = calculateAttendancePenalty({
      pegawai,
      start,
      end,
      pengaturan,
      absensiList: absList,
      cutiList
    })
    calculatedPotongan = penalty.totalPotongan
  }

  const potongan = pr ? Number(pr.potongan) : calculatedPotongan
  const gajiBersih = (pr ? Number(pr.total) : (baseGaji + baseTunjangan - potongan)) + lemburBayar

  return {
    pegawaiId: pegawai.id,
    nik: pegawai.nik,
    nama: pegawai.nama,
    fotoUrl: pegawai.fotoUrl,
    unit: pegawai.bidang?.nama || "Umum",
    golongan: pegawai.golongan,
    bank: pegawai.bank || "Tunai",
    noRekening: pegawai.noRekening || "-",
    gajiPokok: pr ? Number(pr.gajiPokok) : baseGaji,
    tunjangan: pr ? Number(pr.tunjangan) : baseTunjangan,
    potongan,
    lembur: lemburBayar,
    gajiBersih,
    status: pr ? "approved" : "draft",
    payrollId: pr?.id
  }
}
