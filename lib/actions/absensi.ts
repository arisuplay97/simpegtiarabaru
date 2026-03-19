"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Format YYYY-MM-DD to get start and end of day
function getTodayRange() {
  const now = new Date()
  // Waktu server (UTC) mungkin beda dengan WITA/WIB, jadi kita pastikan tanggal hari ini diatur di zona waktu lokal
  // Namun untuk keamanan dasar, kita asumsikan UTC Server == Local untuk MVP, atau gunakan offset
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
  const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999))
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

      await prisma.absensi.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal: now,
          status: "HADIR",
          jamMasuk: now,
          // Ide: Simpan fotoDataUrl dan jarakMeter jika Prisma schema diupdate kelak
        }
      })
      return { success: "Check-in berhasil disimpan ke sistem!" }
      
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
