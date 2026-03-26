'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth, parse } from "date-fns"
import { logAudit } from "./audit-log"
import { prosesPPh21Batch } from "./pph21"

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

// ============ GET PAYROLL PEGAWAI FOR A SPECIFIC MONTH ============
export async function getPayrollList(periodStr: string) {
  const { start, end } = getMonthBounds(periodStr)

  // Fetch all active employees (and maybe those who have payroll this month even if inactive)
  const pegawai = await prisma.pegawai.findMany({
    where: {
      OR: [
        { status: "AKTIF" },
        { payroll: { some: { bulan: { gte: start, lte: end } } } }
      ]
    },
    include: {
      bidang: true,
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

  // Pre-fetch settings for draft calculations
  const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
  const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
  const [targetH, targetM] = jamMasukSetting.split(":").map(Number)
  
  const dendaTerlambatPerKejadian = pengaturan?.dendaTerlambat || 5000
  const batasTerlambatDenda = pengaturan?.batasTerlambatDenda || 5
  const dendaAlpaPerHari = pengaturan?.dendaAlpa || 7500
  const tunjanganTransportLocked = pengaturan?.tunjanganTransport || 120000
  const batasAlpaLenyapTransport = pengaturan?.batasAlpaDendaTransport || 3

  // Format the response and include approved overtime (Lembur)
  const results = await Promise.all(pegawai.map(async (emp) => {
    const pr = emp.payroll.length > 0 ? emp.payroll[0] : null
    const baseGaji = Number(emp.gajiPokok || 0)
    const baseTunjangan = Number(emp.tunjangan || 0)
    
    let calculatedPotongan = 0

    if (!pr) {
      // Calculate draft penalties
      const absensiBulanIni = await prisma.absensi.findMany({
        where: {
          pegawaiId: emp.id,
          tanggal: { gte: start, lte: end }
        }
      })

      let countTerlambatDenda = 0
      let countAlpa = 0

      absensiBulanIni.forEach(abs => {
        if (abs.status === "ALPA") {
          countAlpa++
        } else if (abs.status === "TERLAMBAT" && abs.jamMasuk) {
          const checkIn = new Date(abs.jamMasuk)
          const scheduled = new Date(checkIn)
          scheduled.setHours(targetH, targetM, 0, 0)
          
          const diffMins = Math.floor((checkIn.getTime() - scheduled.getTime()) / 60000)
          if (diffMins > batasTerlambatDenda) {
            countTerlambatDenda++
          }
        }
      })

      const totalDendaTerlambat = countTerlambatDenda * dendaTerlambatPerKejadian
      const totalDendaAlpa = countAlpa * dendaAlpaPerHari
      const penaltiTransport = countAlpa >= batasAlpaLenyapTransport ? tunjanganTransportLocked : 0
      
      calculatedPotongan = totalDendaTerlambat + totalDendaAlpa + penaltiTransport
    }

    const gajiPokok = pr ? Number(pr.gajiPokok) : baseGaji
    const tunjangan = pr ? Number(pr.tunjangan) : baseTunjangan
    const potongan = pr ? Number(pr.potongan) : calculatedPotongan

    // Fetch approved overtime pay for this employee in this month
    const lemburApproved = await (prisma as any).lembur.findMany({
      where: { pegawaiId: emp.id, status: "APPROVED", tanggal: { gte: start, lte: end } }
    })
    const lemburBayar = lemburApproved.reduce((s: number, l: any) => s + Number(l.totalBayar), 0)

    return {
      pegawaiId: emp.id,
      nik: emp.nik,
      nama: emp.nama,
      unit: emp.bidang?.nama || "Umum",
      golongan: emp.golongan,
      
      gajiPokok,
      tunjangan,
      potongan,
      lembur: lemburBayar,
      
      gajiBersih: (pr ? Number(pr.total) : (gajiPokok + tunjangan - potongan)) + lemburBayar,
      status: pr ? "approved" : "draft",
      
      payrollId: pr?.id
    }
  }))

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
    // Only if it's considered a base salary update, which is usually the case when HR edits it here
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
      }
    })

    // Batch create their default payroll
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    const [targetH, targetM] = jamMasukSetting.split(":").map(Number)
    
    const dendaTerlambatPerKejadian = pengaturan?.dendaTerlambat || 5000
    const batasTerlambatDenda = pengaturan?.batasTerlambatDenda || 5
    const dendaAlpaPerHari = pengaturan?.dendaAlpa || 7500
    const tunjanganTransportLocked = pengaturan?.tunjanganTransport || 120000
    const batasAlpaLenyapTransport = pengaturan?.batasAlpaDendaTransport || 3

    const batch = await Promise.all(employees.map(async (emp) => {
      // Hitung keterlambatan dan alpa bulan ini
      const absensiBulanIni = await prisma.absensi.findMany({
        where: {
          pegawaiId: emp.id,
          tanggal: { gte: start, lte: end }
        }
      })

      let countTerlambatDenda = 0
      let countAlpa = 0

      absensiBulanIni.forEach(abs => {
        if (abs.status === "ALPA") {
          countAlpa++
        } else if (abs.status === "TERLAMBAT" && abs.jamMasuk) {
          const checkIn = new Date(abs.jamMasuk)
          const scheduled = new Date(checkIn)
          scheduled.setHours(targetH, targetM, 0, 0)
          
          const diffMins = Math.floor((checkIn.getTime() - scheduled.getTime()) / 60000)
          if (diffMins > batasTerlambatDenda) {
            countTerlambatDenda++
          }
        }
      })

      const totalDendaTerlambat = countTerlambatDenda * dendaTerlambatPerKejadian
      const totalDendaAlpa = countAlpa * dendaAlpaPerHari
      const penaltiTransport = countAlpa >= batasAlpaLenyapTransport ? tunjanganTransportLocked : 0

      const gPokok = Number(emp.gajiPokok || 0)
      const tunj = Number(emp.tunjangan || 0)
      const pot = totalDendaTerlambat + totalDendaAlpa + penaltiTransport
      
      return {
        pegawaiId: emp.id,
        bulan: date,
        gajiPokok: gPokok,
        tunjangan: tunj,
        potongan: pot,
        total: gPokok + tunj - pot
      }
    }))

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
  if (!session?.user?.email) return null

  const { start, end } = getMonthBounds(periodStr)

  const pegawai = await prisma.pegawai.findUnique({
    where: { email: session.user.email },
    include: {
      bidang: true,
      payroll: {
        where: {
          bulan: { gte: start, lte: end }
        }
      }
    }
  })

  if (!pegawai) return null

  // Fetch approved overtime for this user
  const lemburApproved = await (prisma as any).lembur.findMany({
    where: { pegawaiId: pegawai.id, status: "APPROVED", tanggal: { gte: start, lte: end } }
  })
  const lemburBayar = lemburApproved.reduce((s: number, l: any) => s + Number(l.totalBayar), 0)

  const pr = pegawai.payroll.length > 0 ? pegawai.payroll[0] : null
  const baseGaji = Number(pegawai.gajiPokok || 0)
  const baseTunjangan = Number(pegawai.tunjangan || 0)

  return {
    pegawaiId: pegawai.id,
    nik: pegawai.nik,
    nama: pegawai.nama,
    unit: pegawai.bidang?.nama || "Umum",
    golongan: pegawai.golongan,
    bank: pegawai.bank || "Tunai",
    noRekening: pegawai.noRekening || "-",
    gajiPokok: pr ? Number(pr.gajiPokok) : baseGaji,
    tunjangan: pr ? Number(pr.tunjangan) : baseTunjangan,
    potongan: pr ? Number(pr.potongan) : 0,
    lembur: lemburBayar,
    gajiBersih: (pr ? Number(pr.total) : (baseGaji + baseTunjangan)) + lemburBayar,
    status: pr ? "approved" : "draft",
    payrollId: pr?.id
  }
}
