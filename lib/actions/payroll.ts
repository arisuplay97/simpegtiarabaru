'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth, parse } from "date-fns"

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

  // Format the response so the frontend receives a clean array
  return pegawai.map(emp => {
    // If they have a payroll record for this month, use it
    const pr = emp.payroll.length > 0 ? emp.payroll[0] : null

    // Otherwise, generate a draft based on their base profile
    const baseGaji = Number(emp.gajiPokok || 0)
    const baseTunjangan = Number(emp.tunjangan || 0)
    const basePotongan = 0

    return {
      pegawaiId: emp.id,
      nik: emp.nik,
      nama: emp.nama,
      unit: emp.bidang?.nama || "Umum",
      golongan: emp.golongan,
      
      // If Payroll exists in DB, use it, else use base Profile data
      gajiPokok: pr ? Number(pr.gajiPokok) : baseGaji,
      tunjangan: pr ? Number(pr.tunjangan) : baseTunjangan,
      potongan: pr ? Number(pr.potongan) : basePotongan,
      lembur: 0, // In this version, lembur is part of tunjangan or calculated separately
      
      gajiBersih: pr ? Number(pr.total) : (baseGaji + baseTunjangan - basePotongan),
      status: pr ? "approved" : "draft", // "draft" means it hasn't been saved to Payroll table yet
      
      payrollId: pr?.id
    }
  })
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
    const batch = employees.map(emp => {
      const gPokok = Number(emp.gajiPokok || 0)
      const tunj = Number(emp.tunjangan || 0)
      const pot = 0
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
    gajiBersih: pr ? Number(pr.total) : (baseGaji + baseTunjangan),
    status: pr ? "approved" : "draft",
    payrollId: pr?.id
  }
}
