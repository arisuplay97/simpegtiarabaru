'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth, parse } from "date-fns"
import { logAudit } from "./audit-log"
import { prosesPPh21Batch } from "./pph21"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"

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

  // Batch query absensi, approved cuti, and approved lembur for this period to eliminate N+1 latency
  const [allAbsensi, allApprovedCuti, allApprovedLembur] = await Promise.all([
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
    })
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

  // Format the response and calculate dynamic draft penalties
  const results = pegawai.map((emp) => {
    const pr = emp.payroll.length > 0 ? emp.payroll[0] : null
    const baseGaji = Number(emp.gajiPokok || 0)
    const baseTunjangan = Number(emp.tunjangan || 0)

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
    return { error: error.message || "Gagal memperbarui pengaturan payroll" }
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

    // Batch query absensi and approved cuti for all employees to eliminate N+1 latency
    const [allAbsensi, allApprovedCuti] = await Promise.all([
      prisma.absensi.findMany({
        where: { tanggal: { gte: start, lte: end } }
      }),
      prisma.cuti.findMany({
        where: {
          status: "APPROVED",
          tanggalMulai: { lte: end },
          tanggalSelesai: { gte: start }
        }
      })
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

    const batch = employees.map((emp) => {
      const penalty = calculateAttendancePenalty({
        pegawai: emp,
        start,
        end,
        pengaturan,
        absensiList: absensiByPegawai[emp.id] || [],
        cutiList: cutiByPegawai[emp.id] || []
      })

      const gPokok = Number(emp.gajiPokok || 0)
      const tunj = Number(emp.tunjangan || 0)
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
