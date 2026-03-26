"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/actions/audit-log"

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
      include: { lokasiAbsensi: true } as any
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

    if (currentDeviceId !== clientDeviceId && !(pegawai as any).bebasAbsensi) {
      return {
        error: "PERANGKAT TIDAK DIKENALI! Anda hanya bisa absen dari perangkat utama Anda."
      }
    }

    // =============================================
    // FITUR 3: VALIDASI LOKASI PER PEGAWAI
    // =============================================
    if (!(pegawai as any).bebasAbsensi) {
      if (jarakMeter === null || jarakMeter === undefined) {
        return { error: "Anda berada di luar area absensi atau GPS tidak aktif." }
      }
      
      // Jarak maksimal yang diizinkan (default 100m)
      const maxRadius = (pegawai as any).lokasiAbsensi?.radius || 100
      if (jarakMeter > maxRadius) {
         return { error: `Anda berada di luar radius absensi (${jarakMeter}m > ${maxRadius}m).` }
      }
    }

    // =============================================
    // AMBIL PENGATURAN JAM
    // =============================================
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    
    const jamMasukSetting  = pengaturan?.jamMasuk    || "08:00"
    const jamPulangSetting = pengaturan?.jamPulang   || "17:00"
    const batasCheckin     = (pengaturan as any)?.batasCheckin || "16:00"
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
      const pesanTerlambat = statusAbsensi === "TERLAMBAT"
        ? ` (Terlambat ${Math.round((now.getTime() - batasTerlambatTime.getTime()) / 60000)} menit)`
        : ""

      await prisma.absensi.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal: now,
          status: statusAbsensi,
          jamMasuk: now,
        }
      })

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
    // SECURITY: Wajib login
    const session = await auth()
    if (!session?.user) return []

    const whereClause: any = {}
    if (dateStart && dateEnd) {
      const start = new Date(dateStart); start.setHours(0, 0, 0, 0)
      const end = new Date(dateEnd); end.setHours(23, 59, 59, 999)
      whereClause.tanggal = { gte: start, lte: end }
    } else {
      const { startOfDay, endOfDay } = getTodayRange()
      whereClause.tanggal = { gte: startOfDay, lte: endOfDay }
    }

    // ROLE-BASED FILTERING — PEGAWAI hanya lihat miliknya sendiri
    if (session.user.role === "PEGAWAI") {
      const pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id }
      })
      if (pegawai) {
        whereClause.pegawaiId = pegawai.id
      }
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
      include: { pegawai: { include: { bidang: true } } },
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
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })

    return {
      pegawai: {
        id: pegawai.id,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        unit: pegawai.bidang?.nama || "Umum",
        bebasAbsensi: (pegawai as any).bebasAbsensi,
        lokasiAbsensi: (pegawai as any).lokasiAbsensi ? {
          id: (pegawai as any).lokasiAbsensi.id,
          nama: (pegawai as any).lokasiAbsensi.nama,
          latitude: (pegawai as any).lokasiAbsensi.latitude,
          longitude: (pegawai as any).lokasiAbsensi.longitude,
          radius: (pegawai as any).lokasiAbsensi.radius,
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

export async function deleteAbsensi(id: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  try {
    const absensi = await prisma.absensi.findUnique({ where: { id }, include: { pegawai: true } })
    if (!absensi) return { error: "Data tidak ditemukan" }

    await prisma.absensi.delete({ where: { id } })

    await logAudit({
      action: "DELETE",
      module: "absensi",
      targetId: id,
      targetName: `Hapus Absensi: ${absensi.pegawai.nama} (${new Date(absensi.tanggal).toLocaleDateString()})`,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Delete absensi error:", error)
    return { error: "Gagal menghapus data" }
  }
}

export async function getEmployeeAttendanceSummary(pegawaiId: string, month?: number, year?: number) {
  try {
    const now = new Date()
    const m = month ?? now.getMonth() + 1
    const y = year ?? now.getFullYear()

    const startDate = new Date(y, m - 1, 1, 0, 0, 0)
    const endDate = new Date(y, m, 0, 23, 59, 59)

    const absensi = await prisma.absensi.findMany({
      where: {
        pegawaiId,
        tanggal: { gte: startDate, lte: endDate }
      }
    })

    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    const jamPulangSetting = pengaturan?.jamPulang || "17:00"
    const [pjh, pjm] = jamPulangSetting.split(":").map(Number)

    const summary = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      terlambat: 0,
      cuti: 0,
      pulangCepat: 0,
      totalRecord: absensi.length
    }

    absensi.forEach(a => {
      // Status Mapping
      if (a.status === "HADIR") {
        summary.hadir++
      } else if (a.status === "TERLAMBAT") {
        summary.hadir++
        summary.terlambat++
      } else if (a.status === "ALPA") {
        summary.alpha++
      } else if (a.status === "SAKIT") {
        summary.sakit++
      } else if (a.status === "IZIN" as any) {
        summary.izin++
      } else if (a.status === "CUTI") {
        summary.cuti++
      }

      // Hitung pulang cepat
      if (a.jamKeluar) {
        // Asumsikan jamKeluar tersimpan dalam format String, cth: "16:45"
        let jh = 0, jm = 0
        
        // Bedakan jika jamKeluar berisi Date object (meski di prisma tipe nya date/string, parse dgn aman)
        if (typeof a.jamKeluar === 'string' && (a.jamKeluar as string).includes(':')) {
          const parts = (a.jamKeluar as string).split(':')
          jh = Number(parts[0])
          jm = Number(parts[1])
        } else if (a.jamKeluar instanceof Date) {
          jh = a.jamKeluar.getHours()
          jm = a.jamKeluar.getMinutes()
        }

        // Bandingkan jam & menit dengan setting jam pulang
        if (jh < pjh || (jh === pjh && jm < pjm)) {
          summary.pulangCepat++
        }
      }
    })

    return summary
  } catch (error) {
    console.error("Error getEmployeeAttendanceSummary:", error)
    return {
      hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0, cuti: 0, pulangCepat: 0, totalRecord: 0
    }
  }
}

export async function getSystemSettings() {
  try {
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    return {
      jamMasuk: pengaturan?.jamMasuk || "08:00",
      jamPulang: pengaturan?.jamPulang || "17:00",
      batasTerlambat: pengaturan?.batasTerlambat || 0,
      dendaTerlambat: pengaturan?.dendaTerlambat || 5000,
      batasTerlambatDenda: pengaturan?.batasTerlambatDenda || 5,
      dendaAlpa: pengaturan?.dendaAlpa || 7500,
      tunjanganTransport: pengaturan?.tunjanganTransport || 120000,
      batasAlpaDendaTransport: pengaturan?.batasAlpaDendaTransport || 3,
    }
  } catch (error) {
    console.error("Error getSystemSettings:", error)
    return {
      jamMasuk: "08:00",
      jamPulang: "17:00",
      batasTerlambat: 0,
      dendaTerlambat: 5000,
      batasTerlambatDenda: 5,
      dendaAlpa: 7500,
      tunjanganTransport: 120000,
      batasAlpaDendaTransport: 3,
    }
  }
}

export async function updateSystemSettings(data: any) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  try {
    const updated = await (prisma as any).pengaturan.update({
      where: { id: "1" },
      data: {
        jamMasuk: data.jamMasuk,
        jamPulang: data.jamPulang,
        batasTerlambat: Number(data.batasTerlambat),
        dendaTerlambat: Number(data.dendaTerlambat),
        batasTerlambatDenda: Number(data.batasTerlambatDenda),
        dendaAlpa: Number(data.dendaAlpa),
        tunjanganTransport: Number(data.tunjanganTransport),
        batasAlpaDendaTransport: Number(data.batasAlpaDendaTransport),
        namaPerusahaan: data.namaPerusahaan,
        alamatPerusahaan: data.alamatPerusahaan,
      }
    })

    revalidatePath("/settings")
    return { success: true, data: updated }
  } catch (error: any) {
    console.error("Error updateSystemSettings:", error)
    return { error: error.message || "Gagal memperbarui pengaturan" }
  }
}

// =============================================
// DELETE SEMUA ABSENSI PER BULAN (UNTUK TESTING)
// =============================================
export async function deleteAllAbsensiByMonth(monthStr: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }
    
    // Akses khusus admin
    if ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "HRD") {
      return { error: "Akses ditolak" }
    }

    const [year, month] = monthStr.split("-").map(Number)
    if (!year || !month) return { error: "Format bulan tidak valid" }

    // Dapatkan awal dan akhir bulan dari string YYYY-MM
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const result = await prisma.absensi.deleteMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    await logAudit({
      action: "DELETE",
      module: "absensi",
      targetId: "ALL",
      targetName: `Hapus Massal Absensi Periode ${monthStr} (${result.count} data)`,
    })

    revalidatePath("/absensi")
    revalidatePath("/laporan/absensi")
    return { success: true, count: result.count }
  } catch (error: any) {
    console.error("Gagal menghapus absensi massal:", error)
    return { error: error.message || "Gagal menghapus data" }
  }
}

// =============================================
// HADIRKAN SEMUA PEGAWAI PER TANGGAL (HARI LIBUR)
// =============================================
export async function markAllPresentByDate(dateStr: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }
    
    // Akses khusus admin
    if ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "HRD") {
      return { error: "Akses ditolak" }
    }

    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)

    // Dapatkan semua pegawai Aktif
    const pegawais = await prisma.pegawai.findMany({
      where: { status: "AKTIF" },
      select: { id: true, nama: true }
    })

    // Dapatkan yang sudah absen di hari tsb
    const startOfDay = new Date(targetDate)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAbsensi = await prisma.absensi.findMany({
      where: { tanggal: { gte: startOfDay, lte: endOfDay } },
      select: { pegawaiId: true }
    })
    const existingIds = new Set(existingAbsensi.map(a => a.pegawaiId))

    // Filter yang belum absen
    const toInsert = pegawais.filter(p => !existingIds.has(p.id))

    if (toInsert.length === 0) {
      return { success: true, count: 0, message: "Semua pegawai aktif sudah terdata hadir di tanggal ini." }
    }

    const settings = await getSystemSettings()
    
    const parseTimeStr = (t: string, baseDate: Date) => {
      const [h, m] = (t || "08:00").split(":").map(Number)
      const d = new Date(baseDate)
      d.setHours(h, m, 0, 0)
      return d
    }

    const jamMasuk = parseTimeStr(settings.jamMasuk, targetDate)
    const jamKeluar = parseTimeStr(settings.jamPulang, targetDate)

    const dataToInsert = toInsert.map(p => ({
      pegawaiId: p.id,
      tanggal: targetDate,
      status: "HADIR" as const,
      metode: "MANUAL" as const,
      jamMasuk,
      jamKeluar,
    }))

    const result = await prisma.absensi.createMany({
      data: dataToInsert
    })

    await logAudit({
      action: "CREATE",
      module: "absensi",
      targetId: "ALL",
      targetName: `Hadir Massal ${result.count} Pegawai pada ${dateStr}`,
    })

    revalidatePath("/absensi")
    revalidatePath("/laporan/absensi")
    return { success: true, count: result.count }
  } catch (error: any) {
    console.error("Gagal update hadir massal:", error)
    return { error: error.message || "Gagal mencatat kehadiran massal" }
  }
}
