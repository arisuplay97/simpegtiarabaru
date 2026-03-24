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
    if (!session?.user?.id) return { error: "Anda belum login." }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      include: { lokasiAbsensi: true }
    })

    if (!pegawai) return { error: "Profil Pegawai tidak ditemukan. Hubungi HRD." }

    // =============================================
    // FITUR 2: BEBAS ABSENSI & DEVICE BINDING
    // =============================================
    let currentDeviceId = pegawai.deviceId
    if (!currentDeviceId) {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { deviceId: clientDeviceId }
      })
      currentDeviceId = clientDeviceId
    }

    if (currentDeviceId !== clientDeviceId && !pegawai.bebasAbsensi) {
      return {
        error: "PERANGKAT TIDAK DIKENALI! Anda hanya bisa absen dari perangkat utama Anda."
      }
    }

    // =============================================
    // FITUR 3: VALIDASI LOKASI PER PEGAWAI
    // =============================================
    if (!pegawai.bebasAbsensi) {
      if (jarakMeter === null || jarakMeter === undefined) {
        return { error: "Anda berada di luar area absensi atau GPS tidak aktif." }
      }
      
      // Jarak maksimal yang diizinkan (default 100m)
      const maxRadius = pegawai.lokasiAbsensi?.radius || 100
      if (jarakMeter > maxRadius) {
         return { error: `Anda berada di luar radius absensi (${jarakMeter}m > ${maxRadius}m).` }
      }
    }

    // =============================================
    // AMBIL PENGATURAN JAM
    // =============================================
    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
    
    const jamMasukSetting  = pengaturan?.jamMasuk    || "08:00"
    const jamPulangSetting = pengaturan?.jamPulang   || "17:00"
    const batasCheckin     = pengaturan?.batasCheckin || "16:00"
    const batasTerlambat   = pengaturan?.batasTerlambat || 15

    const { startOfDay, endOfDay, now } = getTodayRange()

    // =============================================
    // CEK ABSENSI HARI INI
    // =============================================
    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // =============================================
    // PROSES CHECKIN
    // =============================================
    if (checkType === "checkin") {
      if (absensiHariIni && absensiHariIni.jamMasuk) {
        return { error: "Anda sudah melakukan Check-in hari ini." }
      }

      // FITUR 1: BATAS JAM CHECKIN
      const [batasJam, batasMenit] = batasCheckin.split(":").map(Number)
      const batasCheckinTime = new Date(now)
      batasCheckinTime.setHours(batasJam, batasMenit, 0, 0)

      if (now > batasCheckinTime) {
        return {
          error: `Sudah melewati batas waktu check-in (${batasCheckin}). Silakan absen besok hari kerja.`
        }
      }

      // Hitung status: HADIR atau TERLAMBAT
      const [jamMasukH, jamMasukM] = jamMasukSetting.split(":").map(Number)
      const batasTerlambatTime = new Date(now)
      batasTerlambatTime.setHours(jamMasukH, jamMasukM + batasTerlambat, 0, 0)

      const statusAbsensi = now > batasTerlambatTime ? "TERLAMBAT" : "HADIR"

      await prisma.absensi.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal: now,
          status: statusAbsensi,
          jamMasuk: now,
        }
      })

      const pesanTerlambat = statusAbsensi === "TERLAMBAT"
        ? ` (Terlambat ${Math.round((now.getTime() - batasTerlambatTime.getTime()) / 60000)} menit)`
        : ""

      return { success: `Check-in berhasil! Status: ${statusAbsensi}${pesanTerlambat}` }

    // =============================================
    // PROSES CHECKOUT
    // =============================================
    } else if (checkType === "checkout") {
      if (!absensiHariIni) {
        return { error: "Anda belum melakukan Check-in hari ini." }
      }
      if (absensiHariIni.jamKeluar) {
        return { error: "Anda sudah melakukan Check-out hari ini." }
      }

      // Tetap gunakan validasi jam pulang minimal jika ada
      const [jamMin, menitMin] = jamPulangSetting.split(":").map(Number)
      const batasMinCheckout = new Date(now)
      batasMinCheckout.setHours(jamMin, menitMin, 0, 0)

      if (now < batasMinCheckout) {
        return { error: `Check-out belum diizinkan. Anda baru bisa checkout pukul ${jamPulangSetting}.` }
      }

      await prisma.absensi.update({
        where: { id: absensiHariIni.id },
        data: { jamKeluar: now }
      })

      return { success: "Check-out berhasil disimpan!" }
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
        unit: pegawai.bidang?.nama || "Umum",
        bebasAbsensi: pegawai.bebasAbsensi,
        lokasiAbsensi: pegawai.lokasiAbsensi ? {
          id: pegawai.lokasiAbsensi.id,
          nama: pegawai.lokasiAbsensi.nama,
          latitude: pegawai.lokasiAbsensi.latitude,
          longitude: pegawai.lokasiAbsensi.longitude,
          radius: pegawai.lokasiAbsensi.radius,
        } : null
      },
      absensi: absensiHariIni ? {
        id: absensiHariIni.id,
        status: absensiHariIni.status,
        jamMasuk: absensiHariIni.jamMasuk?.toISOString() || null,
        jamKeluar: absensiHariIni.jamKeluar?.toISOString() || null,
      } : null,
      shift: {
        jamMasuk: pengaturan?.jamMasuk || "08:00",
        jamKeluar: pengaturan?.jamPulang || "17:00",
        batasCheckin: pengaturan?.batasCheckin || "16:00",
      }
    }
  } catch (e) {
    console.error("Error getStatusAbsensiHariIni:", e)
    return null
  }
}
