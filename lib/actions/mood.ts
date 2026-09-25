"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { MoodType } from "@prisma/client"

// Helper get WITA today range
function getTodayDateDb(date?: Date) {
  const now = date || new Date()
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
  return {
    dateStr,
    targetDateDb: new Date(`${dateStr}T00:00:00.000Z`),
    startOfDay: new Date(`${dateStr}T00:00:00+08:00`),
    endOfDay: new Date(`${dateStr}T23:59:59.999+08:00`),
  }
}

/**
 * Menyimpan respon mood pegawai setelah absen pulang.
 * 100% opsional, idempotent dengan @@unique([pegawaiId, date]).
 */
export async function saveEmployeeMood(mood: MoodType) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Anda belum login." }
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!pegawai) {
      return { error: "Data pegawai tidak ditemukan." }
    }

    const { targetDateDb } = getTodayDateDb()

    const saved = await prisma.employeeMood.upsert({
      where: {
        pegawaiId_date: {
          pegawaiId: pegawai.id,
          date: targetDateDb
        }
      },
      update: {
        mood,
      },
      create: {
        pegawaiId: pegawai.id,
        date: targetDateDb,
        mood,
      }
    })

    revalidatePath("/m/dashboard")
    revalidatePath("/employee-experience")

    return { success: true, data: saved }
  } catch (error: any) {
    console.error("saveEmployeeMood error:", error)
    return { error: error.message || "Gagal menyimpan respon perasaan." }
  }
}

/**
 * Mengambil respon mood hari ini untuk pegawai yang sedang login
 */
export async function getTodayEmployeeMood() {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!pegawai) return null

    const { targetDateDb } = getTodayDateDb()

    const todayMood = await prisma.employeeMood.findUnique({
      where: {
        pegawaiId_date: {
          pegawaiId: pegawai.id,
          date: targetDateDb
        }
      },
      select: {
        mood: true,
        createdAt: true
      }
    })

    return todayMood
  } catch (error) {
    console.error("getTodayEmployeeMood error:", error)
    return null
  }
}

export interface MoodFilterOptions {
  period?: "today" | "7d" | "30d" | "custom"
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  bidangId?: string
  tipeLokasi?: "ALL" | "PUSAT" | "CABANG"
}

/**
 * Statistik agregat Employee Experience untuk HRD / Admin
 * PRIVASI: Hanya menyajikan agregasi persentase/jumlah, tanpa nama pegawai atau ranking.
 */
export async function getEmployeeExperienceStats(filters: MoodFilterOptions = {}) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Akses ditolak" }

    const role = (session.user as any).role
    if (!["SUPERADMIN", "HRD", "DIREKSI", "MANAJER"].includes(role)) {
      return { error: "Akses terbatas untuk HRD & Manajemen." }
    }

    const { period = "today", startDate: customStart, endDate: customEnd, bidangId, tipeLokasi = "ALL" } = filters

    const now = new Date()
    const { targetDateDb, dateStr: todayStr } = getTodayDateDb(now)

    let rangeStart: Date
    let rangeEnd: Date

    if (period === "today") {
      rangeStart = targetDateDb
      rangeEnd = new Date(`${todayStr}T23:59:59.999Z`)
    } else if (period === "7d") {
      const past7 = new Date(targetDateDb.getTime() - 6 * 24 * 60 * 60 * 1000)
      rangeStart = past7
      rangeEnd = new Date(`${todayStr}T23:59:59.999Z`)
    } else if (period === "30d") {
      const past30 = new Date(targetDateDb.getTime() - 29 * 24 * 60 * 60 * 1000)
      rangeStart = past30
      rangeEnd = new Date(`${todayStr}T23:59:59.999Z`)
    } else {
      rangeStart = customStart ? new Date(`${customStart}T00:00:00.000Z`) : targetDateDb
      rangeEnd = customEnd ? new Date(`${customEnd}T23:59:59.999Z`) : new Date(`${todayStr}T23:59:59.999Z`)
    }

    // Build filter pegawai
    const pegawaiWhere: any = { status: "AKTIF" }
    if (bidangId && bidangId !== "ALL") {
      pegawaiWhere.bidangId = bidangId
    }
    if (tipeLokasi === "CABANG") {
      pegawaiWhere.OR = [
        { jabatan: { contains: "Cabang", mode: "insensitive" } },
        { bidang: { nama: { contains: "Cabang", mode: "insensitive" } } },
        { lokasiAbsensi: { nama: { contains: "Cabang", mode: "insensitive" } } }
      ]
    } else if (tipeLokasi === "PUSAT") {
      pegawaiWhere.AND = [
        { jabatan: { not: { contains: "Cabang", mode: "insensitive" } } },
        { bidang: { nama: { not: { contains: "Cabang", mode: "insensitive" } } } },
        { lokasiAbsensi: { nama: { not: { contains: "Cabang", mode: "insensitive" } } } }
      ]
    }

    // Ambil mood records dalam rentang
    const moodRecords = await prisma.employeeMood.findMany({
      where: {
        date: { gte: rangeStart, lte: rangeEnd },
        pegawai: pegawaiWhere
      },
      select: {
        id: true,
        pegawaiId: true,
        date: true,
        mood: true,
      }
    })

    // Ambil absensi dalam rentang yang sama untuk korelasi & response rate
    const absensiRecords = await prisma.absensi.findMany({
      where: {
        tanggal: { gte: rangeStart, lte: rangeEnd },
        pegawai: pegawaiWhere
      },
      select: {
        pegawaiId: true,
        tanggal: true,
        status: true,
        jamMasuk: true,
        jamKeluar: true,
      }
    })

    // Hitung distribusi mood
    const totalResponses = moodRecords.length
    const counts: Record<MoodType, number> = {
      HAPPY: 0,
      NEUTRAL: 0,
      TIRED: 0,
      SAD: 0,
      ANGRY: 0
    }

    for (const m of moodRecords) {
      if (counts[m.mood] !== undefined) {
        counts[m.mood]++
      }
    }

    const percentages: Record<MoodType, number> = {
      HAPPY: totalResponses > 0 ? Math.round((counts.HAPPY / totalResponses) * 100) : 0,
      NEUTRAL: totalResponses > 0 ? Math.round((counts.NEUTRAL / totalResponses) * 100) : 0,
      TIRED: totalResponses > 0 ? Math.round((counts.TIRED / totalResponses) * 100) : 0,
      SAD: totalResponses > 0 ? Math.round((counts.SAD / totalResponses) * 100) : 0,
      ANGRY: totalResponses > 0 ? Math.round((counts.ANGRY / totalResponses) * 100) : 0,
    }

    // Dominant Mood
    let dominantMood: MoodType = "HAPPY"
    let maxCount = -1
    for (const [key, val] of Object.entries(counts)) {
      if (val > maxCount) {
        maxCount = val
        dominantMood = key as MoodType
      }
    }

    // Tingkat Respons terhadap pegawai yang Checkout / Hadir
    const checkedOutCount = absensiRecords.filter(a => a.jamKeluar).length
    const responseRate = checkedOutCount > 0 ? Math.min(100, Math.round((totalResponses / checkedOutCount) * 100)) : (totalResponses > 0 ? 100 : 0)

    // Korelasi Agregat: Mood Pegawai Tepat Waktu vs Terlambat
    const moodMapByPegawaiDate = new Map<string, MoodType>()
    for (const m of moodRecords) {
      const key = `${m.pegawaiId}_${m.date.toISOString().split("T")[0]}`
      moodMapByPegawaiDate.set(key, m.mood)
    }

    let tepatWaktuCount = 0
    let terlambatCount = 0
    const moodTepatWaktu: Record<MoodType, number> = { HAPPY: 0, NEUTRAL: 0, TIRED: 0, SAD: 0, ANGRY: 0 }
    const moodTerlambat: Record<MoodType, number> = { HAPPY: 0, NEUTRAL: 0, TIRED: 0, SAD: 0, ANGRY: 0 }

    for (const a of absensiRecords) {
      if (!a.jamMasuk) continue
      const isLate = a.status === "TERLAMBAT"
      if (isLate) terlambatCount++
      else tepatWaktuCount++

      const key = `${a.pegawaiId}_${a.tanggal.toISOString().split("T")[0]}`
      const mood = moodMapByPegawaiDate.get(key)
      if (mood) {
        if (isLate) {
          moodTerlambat[mood]++
        } else {
          moodTepatWaktu[mood]++
        }
      }
    }

    // 7-Day Trend (atau harian dalam range)
    const trendMap = new Map<string, Record<MoodType, number>>()
    const cur = new Date(rangeStart)
    while (cur <= rangeEnd) {
      const dKey = cur.toISOString().split("T")[0]
      trendMap.set(dKey, { HAPPY: 0, NEUTRAL: 0, TIRED: 0, SAD: 0, ANGRY: 0 })
      cur.setDate(cur.getDate() + 1)
    }

    for (const m of moodRecords) {
      const dKey = m.date.toISOString().split("T")[0]
      if (trendMap.has(dKey)) {
        trendMap.get(dKey)![m.mood]++
      }
    }

    const trend = Array.from(trendMap.entries()).map(([date, moodCounts]) => {
      const dayTotal = Object.values(moodCounts).reduce((a, b) => a + b, 0)
      return {
        date,
        total: dayTotal,
        ...moodCounts
      }
    })

    // List Bidang untuk dropdown filter
    const bidangList = await prisma.bidang.findMany({
      where: { aktif: true },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" }
    })

    return {
      success: true,
      data: {
        totalResponses,
        checkedOutCount,
        responseRate,
        dominantMood,
        counts,
        percentages,
        tepatWaktuCount,
        terlambatCount,
        korelasi: {
          tepatWaktu: moodTepatWaktu,
          terlambat: moodTerlambat,
        },
        trend,
        bidangList,
        period,
      }
    }
  } catch (error: any) {
    console.error("getEmployeeExperienceStats error:", error)
    return { error: error.message || "Gagal memuat data statistik Employee Experience." }
  }
}
