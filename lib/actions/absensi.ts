"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Format YYYY-MM-DD to get start and end of day
function getTodayRange(date?: Date) {
  const targetDate = date || new Date()
  
  // Gunakan local time boundary agar record yang di-submit pagi buta (misal 06:00 local, yang masih UTC hari sblmnya) tidak terfilter
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
    // Jika pegawai belum punya deviceId, daftarkan device ini sbg perangkat utama
    let currentDeviceId = pegawai.deviceId
    if (!currentDeviceId) {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { deviceId: clientDeviceId }
      })
      currentDeviceId = clientDeviceId
    }

    // Bandingkan deviceId
    if (currentDeviceId !== clientDeviceId) {
      return { 
        error: "PERANGKAT TIDAK DIKENALI! Anda hanya bisa melakukan absensi dari perangkat utama (Ponsel) Anda sendiri. Titip absen melalui perangkat rekan dilarang keras." 
      }
    }

    // 2. ABSENSI LOGIC
    const { startOfDay, endOfDay, now } = getTodayRange()

    // Cek apakah sudah absen hari ini
    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    })

    if (checkType === "checkin") {
      if (absensiHariIni && absensiHariIni.jamMasuk) {
        return { error: "Anda sudah melakukan Check-in hari ini." }
      }

      // Hitung keterlambatan berdasarkan Pengaturan
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

      await prisma.absensi.update({
        where: { id: absensiHariIni.id },
        data: {
          jamKeluar: now
        }
      })
      return { success: "Check-out berhasil disimpan ke sistem!" }
    }

    return { error: "Aksi tidak valid" }
  } catch (error: any) {
    console.error("Absen error:", error)
    return { error: `Sistem gagal merekam absensi: ${error.message}` }
  }
}

export async function getAbsensiList(dateStart?: Date, dateEnd?: Date) {
  try {
    const whereClause: any = {}
    if (dateStart && dateEnd) {
      whereClause.tanggal = {
        gte: dateStart,
        lte: dateEnd
      }
    } else {
      // Default to today if no date range is provided
      const { startOfDay, endOfDay } = getTodayRange()
      whereClause.tanggal = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const absensiList = await prisma.absensi.findMany({
      where: whereClause,
      include: {
        pegawai: {
          include: {
            bidang: true
          }
        }
      },
      orderBy: [
        { jamMasuk: 'desc' },
        { tanggal: 'desc' }
      ]
    })
    return absensiList
  } catch (error) {
    console.error("Error fetching absensi list:", error)
    return []
  }
}
