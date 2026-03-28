import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"

const formatLocal = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * GET /api/mobile/dashboard
 * Header: Authorization: Bearer <token>
 * Response: ringkasan kehadiran + status absensi hari ini
 */
export async function GET(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) {
      return NextResponse.json({ error: "Bukan pegawai" }, { status: 403 })
    }

    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    const startDate = new Date(y, m - 1, 1, 0, 0, 0)
    const endDate = new Date(y, m, 0, 23, 59, 59)

    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

    const [absensiList, absensiHariIni, pegawai] = await Promise.all([
      prisma.absensi.findMany({
        where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } }
      }),
      prisma.absensi.findFirst({
        where: { pegawaiId, tanggal: { gte: todayStart, lte: todayEnd } }
      }),
      prisma.pegawai.findUnique({
        where: { id: pegawaiId },
        select: { nama: true, jabatan: true, fotoUrl: true, bidang: { select: { nama: true } } }
      })
    ])

    // Hitung hari kerja bulan ini
    let hariKerja = 0
    const limitDate = now < endDate ? now : endDate
    for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) hariKerja++
    }

    const recordedDays = new Set<string>()
    let hadir = 0, izin = 0, sakit = 0, cuti = 0, terlambat = 0, alpha = 0

    absensiList.forEach(a => {
      const key = formatLocal(a.tanggal)
      const isWeekend = a.tanggal.getDay() === 0 || a.tanggal.getDay() === 6
      if (!isWeekend && a.tanggal <= limitDate) recordedDays.add(key)

      if (a.status === "HADIR") hadir++
      else if (a.status === "TERLAMBAT") { hadir++; terlambat++ }
      else if (a.status === "IZIN") izin++
      else if (a.status === "SAKIT") sakit++
      else if (a.status === "CUTI") cuti++
    })

    for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6 && !recordedDays.has(formatLocal(d))) alpha++
    }

    // Status absensi hari ini
    let statusHariIni = "BELUM"
    let jamMasuk: string | null = null
    let jamKeluar: string | null = null

    if (absensiHariIni) {
      statusHariIni = absensiHariIni.status
      if (absensiHariIni.jamMasuk) {
        jamMasuk = new Date(absensiHariIni.jamMasuk).toTimeString().slice(0, 5)
      }
      if (absensiHariIni.jamKeluar) {
        jamKeluar = new Date(absensiHariIni.jamKeluar).toTimeString().slice(0, 5)
      }
    }

    return NextResponse.json({
      pegawai,
      absensiHariIni: { status: statusHariIni, jamMasuk, jamKeluar },
      rekap: { hariKerja, hadir, izin, sakit, cuti, terlambat, alpha },
      bulan: `${m}/${y}`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
