"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Format YYYY-MM-DD to get start and end of day
function getTodayRange(date?: Date) {
  const targetDate = date || new Date()
  
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  return { startOfDay, endOfDay, now: new Date() }
}

export async function checkDeviceAndAbsen(
  checkType: "checkin" | "checkout",
  clientDeviceId: string,
  photoDataUrl: string, 
  jarakMeter: number | null
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Anda belum login." }
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })

    if (!pegawai) {
      return { error: "Profil Pegawai tidak ditemukan. Hubungi HRD." }
    }

    // 1. DEVICE BINDING LOGIC
    let currentDeviceId = pegawai.deviceId
    if (!currentDeviceId) {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { deviceId: clientDeviceId }
      })
      currentDeviceId = clientDeviceId
    }

    if (currentDeviceId !== clientDeviceId) {
      return { 
        error: "PERANGKAT TIDAK DIKENALI! Anda hanya bisa melakukan absensi dari perangkat utama (Ponsel) Anda sendiri. Titip absen melalui perangkat rekan dilarang keras." 
      }
    }

    // 2. ABSENSI LOGIC
    const { startOfDay, endOfDay, now } = getTodayRange()

    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    if (checkType === "checkin") {
      if (absensiHariIni && absensiHariIni.jamMasuk) {
        return { error: "Anda sudah melakukan Check-in hari ini." }
      }

      const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
      let statusAbsensi: any = "HADIR"

      if (pengaturan && pengaturan.jamMasuk) {
        const [jam, menit] = pengaturan.jamMasuk.split(":").map(Number)
        const batasTerlambatTime = new Date(now)
        batasTerlambatTime.setHours(jam, menit + (pengaturan.batasTerlambat || 0), 0, 0)

        if (now > batasTerlambatTime) {
          statusAbsensi = "TERLAMBAT"
        }
      }

      await prisma.absensi.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal: now,
          status: statusAbsensi,
          jamMasuk: now,
        }
      })
      return { success: `Check-in berhasil disimpan! Status: ${statusAbsensi}` }
      
    } else if (checkType === "checkout") {
      if (!absensiHariIni) {
        return { error: "Anda belum melakukan Check-in hari ini, tidak bisa Check-out." }
      }
      if (absensiHariIni.jamKeluar) {
        return { error: "Anda sudah melakukan Check-out hari ini." }
      }

      // Validasi jam minimum checkout dari Pengaturan (default 16:00)
      const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
      const jamKeluarConfig = pengaturan?.jamKeluar || "16:00"
      const [jamMin, menitMin] = jamKeluarConfig.split(":").map(Number)
      const batasMinCheckout = new Date(now)
      batasMinCheckout.setHours(jamMin, menitMin, 0, 0)

      if (now < batasMinCheckout) {
        const sisaMenit = Math.ceil((batasMinCheckout.getTime() - now.getTime()) / 60000)
        const sisaJam = Math.floor(sisaMenit / 60)
        const sisaMenitSisa = sisaMenit % 60
        const sisaText = sisaJam > 0 ? `${sisaJam} jam ${sisaMenitSisa} menit` : `${sisaMenit} menit`
        return {
          error: `Check-out belum diizinkan. Anda baru bisa checkout pukul ${jamKeluarConfig} (${sisaText} lagi).`
        }
      }

      await prisma.absensi.update({
        where: { id: absensiHariIni.id },
        data: { jamKeluar: now }
      })
      return { success: "Check-out berhasil disimpan ke sistem!" }
    }

    return { error: "Aksi tidak valid" }
  } catch (error: any) {
    console.error("Absen error:", error)
    return { error: `Sistem gagal merekam absensi: ${error.message}` }
  }
}

// Untuk halaman absensi umum (HRD/Admin)
export async function getAbsensiList(dateStart?: Date, dateEnd?: Date) {
  try {
    const whereClause: any = {}
    if (dateStart && dateEnd) {
      whereClause.tanggal = { gte: dateStart, lte: dateEnd }
    } else {
      const { startOfDay, endOfDay } = getTodayRange()
      whereClause.tanggal = { gte: startOfDay, lte: endOfDay }
    }

    const absensiList = await prisma.absensi.findMany({
      where: whereClause,
      include: { pegawai: { include: { bidang: true } } },
      orderBy: [{ jamMasuk: 'desc' }, { tanggal: 'desc' }]
    })
    return absensiList
  } catch (error) {
    console.error("Error fetching absensi list:", error)
    return []
  }
}

// Untuk halaman absensi VIEW PEGAWAI sendiri
export async function getAbsensiSaya(bulan?: number, tahun?: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) return []

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })
    if (!pegawai) return []

    const now = new Date()
    const month = bulan ?? now.getMonth() + 1
    const year = tahun ?? now.getFullYear()

    const startDate = new Date(year, month - 1, 1, 0, 0, 0)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    return await prisma.absensi.findMany({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startDate, lte: endDate }
      },
      orderBy: { tanggal: 'desc' }
    })
  } catch (e) {
    console.error("Error getAbsensiSaya:", e)
    return []
  }
}

// Status absensi hari ini untuk pegawai yang login (buat ditampilkan di selfie page)
export async function getStatusAbsensiHariIni() {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      include: { bidang: true }
    })
    if (!pegawai) return null

    const { startOfDay, endOfDay } = getTodayRange()
    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // Ambil jam kerja dari pengaturan
    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })

    return {
      pegawai: {
        id: pegawai.id,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        unit: pegawai.bidang?.nama || "Umum"
      },
      absensi: absensiHariIni ? {
        id: absensiHariIni.id,
        status: absensiHariIni.status,
        jamMasuk: absensiHariIni.jamMasuk?.toISOString() || null,
        jamKeluar: absensiHariIni.jamKeluar?.toISOString() || null,
      } : null,
      shift: {
        jamMasuk: pengaturan?.jamMasuk || "08:00",
        jamKeluar: pengaturan?.jamKeluar || "16:00",
      }
    }
  } catch (e) {
    console.error("Error getStatusAbsensiHariIni:", e)
    return null
  }
}
