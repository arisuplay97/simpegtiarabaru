"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/actions/audit-log"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"

// Format YYYY-MM-DD to get start and end of day
function getTodayRange(date?: Date) {
  const targetDate = date || new Date()
  
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  return { startOfDay, endOfDay, now: new Date() }
}

const formatLocal = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getSessionPegawai(session: any): Promise<any> {
  if (!session?.user) return null
  
  if (session.user.id && UUID_REGEX.test(session.user.id)) {
    const p = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      include: { lokasiAbsensi: true, bidang: true } as any
    })
    if (p) return p
  }

  const sessionPegawaiId = (session.user as any).pegawaiId
  if (sessionPegawaiId && UUID_REGEX.test(sessionPegawaiId)) {
    const p = await prisma.pegawai.findUnique({
      where: { id: sessionPegawaiId },
      include: { lokasiAbsensi: true, bidang: true } as any
    })
    if (p) return p
  }

  if (session.user.email) {
    const p = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { email: { equals: session.user.email, mode: "insensitive" } },
          { user: { email: { equals: session.user.email, mode: "insensitive" } } }
        ]
      },
      include: { lokasiAbsensi: true, bidang: true } as any
    })
    if (p) return p
  }

  return null
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

    const pegawai = await getSessionPegawai(session)

    if (!pegawai) return { error: "Profil Pegawai tidak ditemukan. Hubungi HRD." }

    const isCabang = isCabangEmployee(pegawai)
    const { startOfDay, endOfDay, now } = getTodayRange()
    const dayOfWeek = now.getDay() // 0 = Minggu, 6 = Sabtu

    // Validasi hari libur operasional
    if (dayOfWeek === 0) {
      return { error: "Hari Minggu adalah hari libur operasional. Presensi ditutup." }
    }

    if (dayOfWeek === 6 && !isCabang && !(pegawai as any).bebasAbsensi) {
      return { error: "Hari Sabtu adalah hari libur untuk kantor pusat. Presensi hari Sabtu khusus pekerja kantor cabang." }
    }

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
    
    let jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    let jamPulangSetting = pengaturan?.jamPulang || "17:00"
    let batasCheckin = (pengaturan as any)?.batasAbsenMasuk || "14:00"
    const batasTerlambat = pengaturan?.batasTerlambat || 15

    if (isCabang || (dayOfWeek === 6 && (pegawai as any).bebasAbsensi)) {
      if (dayOfWeek === 6) {
        // Pengaturan Khusus Hari Sabtu Cabang / Bebas Absensi
        jamMasukSetting = pengaturan?.jamMasukSabtuCabang || "08:00"
        jamPulangSetting = pengaturan?.jamPulangSabtuCabang || "13:00"
        batasCheckin = pengaturan?.batasMasukSabtuCabang || "11:00"
      } else {
        // Pengaturan Hari Kerja Cabang (Senin - Jumat)
        jamMasukSetting = pengaturan?.jamMasukCabang || pengaturan?.jamMasuk || "08:00"
        jamPulangSetting = pengaturan?.jamPulangCabang || pengaturan?.jamPulang || "16:30"
        batasCheckin = pengaturan?.batasAbsenMasukCabang || pengaturan?.batasAbsenMasuk || "14:00"
      }
    }

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
      const pegawai = await getSessionPegawai(session)
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
    if (!session?.user?.id && !session?.user?.email) return []

    const pegawai = await getSessionPegawai(session)
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

export async function getAbsensiSayaAndSummary(bulan?: number, tahun?: number) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) return { records: [], summary: null }

    const pegawai = await getSessionPegawai(session)
    if (!pegawai) return { records: [], summary: null }

    const records = await getAbsensiSaya(bulan, tahun)
    const summary = await getEmployeeAttendanceSummary(pegawai.id, bulan, tahun)

    return { records, summary }
  } catch (e) {
    console.error("Error getAbsensiSayaAndSummary:", e)
    return { records: [], summary: null }
  }
}

// Status absensi hari ini untuk pegawai yang login (buat ditampilkan di selfie page)
export async function getStatusAbsensiHariIni() {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) return null

    const pegawai = await getSessionPegawai(session)
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
    const isCabang = isCabangEmployee(pegawai)
    const { now } = getTodayRange()
    const dayOfWeek = now.getDay()
    const isSaturday = dayOfWeek === 6

    let jamMasukShift = pengaturan?.jamMasuk || "08:00"
    let jamKeluarShift = pengaturan?.jamPulang || "17:00"
    let batasCheckinShift = pengaturan?.batasAbsenMasuk || "14:00"

    if (isCabang) {
      if (isSaturday) {
        jamMasukShift = pengaturan?.jamMasukSabtuCabang || "08:00"
        jamKeluarShift = pengaturan?.jamPulangSabtuCabang || "13:00"
        batasCheckinShift = pengaturan?.batasMasukSabtuCabang || "11:00"
      } else {
        jamMasukShift = pengaturan?.jamMasukCabang || pengaturan?.jamMasuk || "08:00"
        jamKeluarShift = pengaturan?.jamPulangCabang || pengaturan?.jamPulang || "16:30"
        batasCheckinShift = pengaturan?.batasAbsenMasukCabang || pengaturan?.batasAbsenMasuk || "14:00"
      }
    }

    return {
      pegawai: {
        id: pegawai.id,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        unit: pegawai.bidang?.nama || "Umum",
        isCabang,
        bebasAbsensi: (pegawai as any).bebasAbsensi,
        lokasiAbsensi: (pegawai as any).lokasiAbsensi ? {
          id: (pegawai as any).lokasiAbsensi.id,
          nama: (pegawai as any).lokasiAbsensi.nama,
          tipe: (pegawai as any).lokasiAbsensi.tipe,
          alamat: (pegawai as any).lokasiAbsensi.alamat,
          latitude: (pegawai as any).lokasiAbsensi.latitude,
          longitude: (pegawai as any).lokasiAbsensi.longitude,
          radius: (pegawai as any).lokasiAbsensi.radius,
          titikKoordinat: (pegawai as any).lokasiAbsensi.titikKoordinat,
        } : null
      },
      absensi: absensiHariIni ? {
        id: absensiHariIni.id,
        status: absensiHariIni.status,
        jamMasuk: absensiHariIni.jamMasuk?.toISOString() || null,
        jamKeluar: absensiHariIni.jamKeluar?.toISOString() || null,
      } : null,
      shift: {
        jamMasuk: jamMasukShift,
        jamKeluar: jamKeluarShift,
        batasCheckin: batasCheckinShift,
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

// ============================================================
// UPDATE ABSENSI (Edit status, jam masuk, jam keluar)
// ============================================================
export async function updateAbsensi(
  id: string,
  data: {
    status?: string
    jamMasuk?: string | null
    jamKeluar?: string | null
  }
) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }
    if (!["SUPERADMIN", "HRD", "ADMIN"].includes((session.user as any).role)) {
      return { error: "Akses ditolak" }
    }

    // Ambil absensi existing untuk mendapatkan tanggal referensi
    const existing = await prisma.absensi.findUnique({
      where: { id },
      include: { pegawai: true }
    })
    if (!existing) return { error: "Data absensi tidak ditemukan" }

    const updateData: any = {}

    // Update status — map format UI ke enum DB
    if (data.status) {
      const statusMap: Record<string, string> = {
        hadir: "HADIR", izin: "IZIN", sakit: "SAKIT",
        cuti: "CUTI", alpha: "ALPHA", dinas: "DINAS"
      }
      updateData.status = statusMap[data.status] ?? data.status.toUpperCase()
    }

    // Update jam masuk jika diisi (input dalam WITA = UTC+8, simpan sebagai UTC)
    if (data.jamMasuk !== undefined) {
      if (data.jamMasuk) {
        const [h, m] = data.jamMasuk.split(":").map(Number)
        const dt = new Date(existing.tanggal)
        // Set jam dalam UTC, lalu kurangi 8 jam untuk konversi dari WITA ke UTC
        dt.setUTCHours(h, m, 0, 0)
        dt.setTime(dt.getTime() - 8 * 60 * 60 * 1000)
        updateData.jamMasuk = dt
      } else {
        updateData.jamMasuk = null
      }
    }

    // Update jam keluar jika diisi (input dalam WITA = UTC+8, simpan sebagai UTC)
    if (data.jamKeluar !== undefined) {
      if (data.jamKeluar) {
        const [h, m] = data.jamKeluar.split(":").map(Number)
        const dt = new Date(existing.tanggal)
        // Set jam dalam UTC, lalu kurangi 8 jam untuk konversi dari WITA ke UTC
        dt.setUTCHours(h, m, 0, 0)
        dt.setTime(dt.getTime() - 8 * 60 * 60 * 1000)
        updateData.jamKeluar = dt
      } else {
        updateData.jamKeluar = null
      }
    }

    await prisma.absensi.update({ where: { id }, data: updateData })

    await logAudit({
      action: "UPDATE",
      module: "absensi",
      targetId: id,
      targetName: `Edit Absensi: ${existing.pegawai.nama} — ${updateData.status || ""}`,
      newData: updateData as any,
    })

    revalidatePath("/absensi")
    return { success: true }
  } catch (error: any) {
    console.error("Update absensi error:", error)
    return { error: error.message || "Gagal mengubah data absensi" }
  }
}



export async function getEmployeeAttendanceSummary(pegawaiId: string, month?: number, year?: number) {
  try {
    if (!pegawaiId || !UUID_REGEX.test(pegawaiId)) {
      return {
        isCabang: false,
        isSabtuCabang: false,
        hariKerjaAktif: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0, cuti: 0, pulangCepat: 0, totalRecord: 0,
        waktuAbsen: "--:-- - --:--", sudahAbsenMasuk: false, sudahAbsenPulang: false,
        jamMasuk: "08:00", jamPulang: "17:00",
        batasAbsenMasuk: "14:00", mulaiAbsenPulang: "15:00", batasAbsenPulang: "18:00"
      }
    }

    const now = new Date()
    const m = month ?? now.getMonth() + 1
    const y = year ?? now.getFullYear()

    const startDate = new Date(y, m - 1, 1, 0, 0, 0)
    const endDate = new Date(y, m, 0, 23, 59, 59)
    
    const isCurrentMonth = (m === now.getMonth() + 1 && y === now.getFullYear())
    const limitDate = isCurrentMonth ? now : endDate
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
      include: { bidang: true, lokasiAbsensi: true }
    })
    const isCabang = isCabangEmployee(pegawai)

    let hariKerjaAktif = 0
    for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (isCabang) {
        // Cabang kerja Senin - Sabtu (Minggu libur)
        if (day !== 0) hariKerjaAktif++
      } else {
        // Kantor Pusat kerja Senin - Jumat (Sabtu & Minggu libur)
        if (day !== 0 && day !== 6) hariKerjaAktif++
      }
    }

    const absensi = await prisma.absensi.findMany({
      where: {
        pegawaiId,
        tanggal: { gte: startDate, lte: endDate }
      }
    })

    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    const dayOfWeekToday = now.getDay()
    const isTodaySaturday = dayOfWeekToday === 6

    let jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    let jamPulangSetting = pengaturan?.jamPulang || "17:00"
    let batasAbsenMasuk = pengaturan?.batasAbsenMasuk || "14:00"
    let mulaiAbsenPulang = pengaturan?.mulaiAbsenPulang || "15:00"
    let batasAbsenPulang = pengaturan?.batasAbsenPulang || "18:00"

    if (isCabang) {
      if (isTodaySaturday) {
        // Khusus Hari Sabtu Kantor Cabang
        jamMasukSetting = pengaturan?.jamMasukSabtuCabang || "08:00"
        jamPulangSetting = pengaturan?.jamPulangSabtuCabang || "13:00"
        batasAbsenMasuk = pengaturan?.batasMasukSabtuCabang || "11:00"
        mulaiAbsenPulang = pengaturan?.mulaiPulangSabtuCabang || "12:00"
        batasAbsenPulang = pengaturan?.batasPulangSabtuCabang || "15:00"
      } else {
        // Hari Kerja Biasa Kantor Cabang (Senin - Jumat)
        jamMasukSetting = pengaturan?.jamMasukCabang || pengaturan?.jamMasuk || "08:00"
        jamPulangSetting = pengaturan?.jamPulangCabang || pengaturan?.jamPulang || "16:30"
        batasAbsenMasuk = pengaturan?.batasAbsenMasukCabang || pengaturan?.batasAbsenMasuk || "14:00"
        mulaiAbsenPulang = pengaturan?.mulaiAbsenPulangCabang || pengaturan?.mulaiAbsenPulang || "15:00"
        batasAbsenPulang = pengaturan?.batasAbsenPulangCabang || pengaturan?.batasAbsenPulang || "18:00"
      }
    }

    const [pjh, pjm] = jamPulangSetting.split(":").map(Number)

    // Rentang hari ini (sinkron baik server UTC maupun zona waktu WITA)
    const _todayStart = new Date(now)
    _todayStart.setHours(0, 0, 0, 0)
    const _todayEnd = new Date(now)
    _todayEnd.setHours(23, 59, 59, 999)

    const witaOffset = 8 * 60 // UTC+8
    const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const witaNow = new Date(nowUtc + (witaOffset * 60000))
    const witaStart = new Date(witaNow)
    witaStart.setHours(0, 0, 0, 0)
    const witaEnd = new Date(witaNow)
    witaEnd.setHours(23, 59, 59, 999)

    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId,
        OR: [
          { tanggal: { gte: _todayStart, lte: _todayEnd } },
          { tanggal: { gte: witaStart, lte: witaEnd } },
          { jamMasuk: { gte: _todayStart, lte: _todayEnd } },
          { jamMasuk: { gte: witaStart, lte: witaEnd } }
        ]
      },
      orderBy: { tanggal: 'desc' }
    })

    const formatTime = (d: Date | string | null | undefined) => {
      if (!d) return "--:--"
      const dt = typeof d === "string" ? new Date(d) : d
      const timeStr = dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" })
      return timeStr.replace(".", ":")
    }

    let waktuAbsen = "--:-- - --:--"
    if (absensiHariIni) {
      if (absensiHariIni.status === "CUTI") {
        waktuAbsen = "CUTI - CUTI"
      } else {
        waktuAbsen = `${formatTime(absensiHariIni.jamMasuk)} - ${absensiHariIni.jamKeluar ? formatTime(absensiHariIni.jamKeluar) : "--:--"}`
      }
    }

    const summary = {
      isCabang,
      isSabtuCabang: isCabang && isTodaySaturday,
      hariKerjaAktif,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      terlambat: 0,
      cuti: 0,
      pulangCepat: 0,
      totalRecord: absensi.length,
      waktuAbsen,
      sudahAbsenMasuk: !!absensiHariIni?.jamMasuk,
      sudahAbsenPulang: !!absensiHariIni?.jamKeluar,
      jamMasuk: jamMasukSetting,
      jamPulang: jamPulangSetting,
      batasAbsenMasuk,
      mulaiAbsenPulang,
      batasAbsenPulang,
    }

    const recordedDays = new Set<string>()

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

      // Record present day for auto-alpha calculation
      if (a.tanggal <= limitDate) {
        const isOffDay = isCabang ? (a.tanggal.getDay() === 0) : (a.tanggal.getDay() === 0 || a.tanggal.getDay() === 6)
        if (!isOffDay) {
          recordedDays.add(formatLocal(a.tanggal))
        }
      }

      // Hitung pulang cepat
      if (a.jamKeluar) {
        let jh = 0, jm = 0
        if (typeof a.jamKeluar === 'string' && (a.jamKeluar as string).includes(':')) {
          const parts = (a.jamKeluar as string).split(':')
          jh = Number(parts[0])
          jm = Number(parts[1])
        } else if (a.jamKeluar instanceof Date) {
          const witaString = (a.jamKeluar as Date).toLocaleString("en-US", { timeZone: "Asia/Makassar" })
          const witaDate = new Date(witaString)
          jh = witaDate.getHours()
          jm = witaDate.getMinutes()
        }

        if (jh < pjh || (jh === pjh && jm < pjm)) {
          summary.pulangCepat++
        }
      }
    })

    // Kalkulasi Mangkir (Alpa) Otomatis di Hari Kerja
    let autoAlpha = 0
    for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      const isWorkday = isCabang ? (day !== 0) : (day !== 0 && day !== 6)
      if (isWorkday) {
        if (!recordedDays.has(formatLocal(d))) {
           autoAlpha++
        }
      }
    }
    
    summary.alpha += autoAlpha

    return summary
  } catch (error) {
    console.error("Error getEmployeeAttendanceSummary:", error)
    return {
      isCabang: false,
      isSabtuCabang: false,
      hariKerjaAktif: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0, cuti: 0, pulangCepat: 0, totalRecord: 0,
      waktuAbsen: "--:-- - --:--", sudahAbsenMasuk: false, sudahAbsenPulang: false,
      jamMasuk: "08:00", jamPulang: "17:00",
      batasAbsenMasuk: "14:00", mulaiAbsenPulang: "15:00", batasAbsenPulang: "18:00"
    }
  }
}

export async function getSystemSettings() {
  try {
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    return {
      jamMasuk: pengaturan?.jamMasuk || "08:00",
      jamPulang: pengaturan?.jamPulang || "17:00",
      mulaiAbsenMasuk: pengaturan?.mulaiAbsenMasuk || "06:30",
      batasAbsenMasuk: pengaturan?.batasAbsenMasuk || "14:00",
      mulaiAbsenPulang: pengaturan?.mulaiAbsenPulang || "15:00",
      batasAbsenPulang: pengaturan?.batasAbsenPulang || "18:00",
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
      mulaiAbsenMasuk: "06:30",
      batasAbsenMasuk: "14:00",
      mulaiAbsenPulang: "15:00",
      batasAbsenPulang: "18:00",
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
        mulaiAbsenMasuk: data.mulaiAbsenMasuk,
        batasAbsenMasuk: data.batasAbsenMasuk,
        mulaiAbsenPulang: data.mulaiAbsenPulang,
        batasAbsenPulang: data.batasAbsenPulang,
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

// ============================================================
// REKAP BULANAN: Untuk tab Rekap Bulanan di Admin Dashboard
// ============================================================
export async function getRekapBulanan(bulan: number, tahun: number) {
  try {
    const session = await auth()
    if (!session?.user) return []

    const now = new Date()
    const startDate = new Date(tahun, bulan - 1, 1, 0, 0, 0)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

    const isCurrentMonth = (bulan === now.getMonth() + 1 && tahun === now.getFullYear())
    const limitDate = isCurrentMonth ? now : endDate

    let hariKerjaAktif = 0
    for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) hariKerjaAktif++
    }

    // Hitung total hari kerja sebulan utuh (untuk label UI summary)
    let totalHariKerja = 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) totalHariKerja++
    }

    // Ambil SEMUA pegawai aktif
    const pegawais = await prisma.pegawai.findMany({
      where: { status: "AKTIF" },
      include: { bidang: true, lokasiAbsensi: true }
    })

    // Ambil semua absensi dalam bulan ini
    const absensiList = await prisma.absensi.findMany({
      where: { tanggal: { gte: startDate, lte: endDate } },
    })

    const pegawaiMap: Record<string, any> = {}
    const recordedDates: Record<string, Set<string>> = {}
    
    // Inisialisasi dictionary Pegawai
    for (const p of pegawais) {
      const isCabang = isCabangEmployee(p)
      let employeeWorkdays = 0
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay()
        if (isCabang ? (day !== 0) : (day !== 0 && day !== 6)) employeeWorkdays++
      }

      let employeeActiveWorkdays = 0
      for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay()
        if (isCabang ? (day !== 0) : (day !== 0 && day !== 6)) employeeActiveWorkdays++
      }

      pegawaiMap[p.id] = {
        id: p.id,
        nama: p.nama,
        bidang: p.bidang?.nama || "-",
        jabatan: p.jabatan,
        isCabang,
        hadir: 0,
        alpha: 0,
        izin: 0,
        sakit: 0,
        cuti: 0,
        dinas: 0,
        terlambat: 0,
        totalJamMenit: 0,
        hariKerja: employeeWorkdays,
        hariKerjaAktif: employeeActiveWorkdays,
      }
      recordedDates[p.id] = new Set()
    }

    // Agregasi row
    for (const a of absensiList) {
      const pid = a.pegawaiId
      if (!pegawaiMap[pid]) {
        pegawaiMap[pid] = {
          id: pid,
          nama: "Pegawai Non-Aktif",
          bidang: "-",
          jabatan: "-",
          isCabang: false,
          hadir: 0, alpha: 0, izin: 0, sakit: 0, cuti: 0, dinas: 0, terlambat: 0, totalJamMenit: 0,
          hariKerja: totalHariKerja,
          hariKerjaAktif: hariKerjaAktif
        }
        recordedDates[pid] = new Set()
      }

      const r = pegawaiMap[pid]
      const status = a.status as any
      const isOffDay = r.isCabang ? (a.tanggal.getDay() === 0) : (a.tanggal.getDay() === 0 || a.tanggal.getDay() === 6)
      
      if (a.tanggal <= limitDate && !isOffDay) {
        recordedDates[pid].add(formatLocal(a.tanggal))
      }

      switch (status) {
        case "HADIR":    r.hadir++;    break
        case "TERLAMBAT": r.hadir++; r.terlambat++; break
        case "ALPHA":    r.alpha++;    break
        case "IZIN":     r.izin++;     break
        case "SAKIT":    r.sakit++;    break
        case "CUTI":     r.cuti++;     break
        case "DINAS":    r.dinas++;    break
      }
      
      if (a.jamMasuk && a.jamKeluar) {
        const diffMs = new Date(a.jamKeluar).getTime() - new Date(a.jamMasuk).getTime()
        if (diffMs > 0) r.totalJamMenit += Math.floor(diffMs / 60000)
      }
    }

    // Kalkulasi Mangkir (Alpa) Otomatis di Hari Kerja masing-masing
    for (const pid in pegawaiMap) {
      const r = pegawaiMap[pid]
      const rec = recordedDates[pid] || new Set()
      let missingCount = 0

      for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay()
        const isWorkday = r.isCabang ? (day !== 0) : (day !== 0 && day !== 6)
        if (isWorkday && !rec.has(formatLocal(d))) {
          missingCount++
        }
      }
      r.alpha += missingCount
    }


    return Object.values(pegawaiMap).sort((a: any, b: any) =>
      a.nama.localeCompare(b.nama)
    )
  } catch (e: any) {
    console.error("getRekapBulanan error:", e)
    return []
  }
}

// =============================================
// TAMBAH ABSENSI MANUAL (ADMIN)
// =============================================
export async function createAbsensiManual(data: { pegawaiId: string, tanggal: string, status: string, jamMasuk?: string, jamKeluar?: string }) {
  try {
    const session = await auth()
    if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
      return { error: "Akses ditolak" }
    }

    const { pegawaiId, tanggal, status, jamMasuk, jamKeluar } = data
    if (!pegawaiId || !tanggal || !status) return { error: "Data tidak lengkap" }

    const dateObj = new Date(tanggal)
    dateObj.setHours(8, 0, 0, 0)

    const statusMap: Record<string, string> = {
      hadir: "HADIR", izin: "IZIN", sakit: "SAKIT",
      cuti: "CUTI", alpha: "ALPHA", dinas: "DINAS"
    }
    const dbStatus = statusMap[status] ?? status.toUpperCase()

    let jMasuk = null
    let jKeluar = null

    if (jamMasuk) {
      const [h, m] = jamMasuk.split(":").map(Number)
      jMasuk = new Date(dateObj)
      jMasuk.setHours(h, m, 0, 0)
    }
    if (jamKeluar) {
      const [h, m] = jamKeluar.split(":").map(Number)
      jKeluar = new Date(dateObj)
      jKeluar.setHours(h, m, 0, 0)
    }

    const startOfDay = new Date(dateObj)
    startOfDay.setHours(0,0,0,0)
    const endOfDay = new Date(dateObj)
    endOfDay.setHours(23,59,59,999)

    const existing = await prisma.absensi.findFirst({
      where: {
        pegawaiId,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    if (existing) {
      return { error: "Pegawai sudah memiliki data di tanggal tersebut. Silakan gunakan fitur Edit." }
    }

    const absensi = await prisma.absensi.create({
      data: {
        pegawaiId,
        tanggal: dateObj,
        status: dbStatus as any,
        metode: "MANUAL",
        jamMasuk: jMasuk,
        jamKeluar: jKeluar
      },
      include: { pegawai: true }
    })

    await logAudit({
      action: "CREATE",
      module: "absensi",
      targetId: absensi.id,
      targetName: `Tambah Absensi: ${absensi.pegawai.nama} — ${dbStatus}`,
      newData: absensi as any,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Create absensi error:", error)
    return { error: error.message || "Gagal membuat data absensi" }
  }
}

// ─── LIVE RADAR KEHADIRAN HARI INI (HRD / ADMIN MOBILE PWA) ────
export async function getLiveRadarKehadiran(filterBidangId?: string, search?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const { startOfDay, endOfDay } = getTodayRange()

    // 1. Ambil seluruh pegawai aktif
    const pegawaiList = await prisma.pegawai.findMany({
      where: {
        status: "AKTIF",
        ...(filterBidangId && filterBidangId !== "all" ? { bidangId: filterBidangId } : {}),
        ...(search ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { nik: { contains: search, mode: "insensitive" } },
            { jabatan: { contains: search, mode: "insensitive" } },
          ]
        } : {})
      },
      include: {
        bidang: true,
        subBidang: true,
      },
      orderBy: { nama: "asc" }
    })

    // 2. Ambil absensi hari ini
    const absensiHariIni = await prisma.absensi.findMany({
      where: {
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // 3. Ambil cuti/izin aktif hari ini
    const cutiHariIni = await prisma.cuti.findMany({
      where: {
        status: "APPROVED",
        tanggalMulai: { lte: endOfDay },
        tanggalSelesai: { gte: startOfDay }
      }
    })

    const absensiMap = new Map<string, any>()
    absensiHariIni.forEach(a => absensiMap.set(a.pegawaiId, a))

    const cutiMap = new Map<string, any>()
    cutiHariIni.forEach(c => cutiMap.set(c.pegawaiId, c))

    let countHadirTepat = 0
    let countHadirTerlambat = 0
    let countBelumAbsen = 0
    let countCutiIzin = 0

    const items = pegawaiList.map(p => {
      const abs = absensiMap.get(p.id)
      const cuti = cutiMap.get(p.id)

      let radarStatus: "TEPAT_WAKTU" | "TERLAMBAT" | "CUTI_IZIN" | "BELUM_ABSEN" = "BELUM_ABSEN"
      let statusLabel = "Belum Presensi"
      let jamMasukStr: string | null = null
      let jamKeluarStr: string | null = null

      if (abs && abs.jamMasuk) {
        jamMasukStr = new Date(abs.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        if (abs.jamKeluar) {
          jamKeluarStr = new Date(abs.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }

        if (abs.status === "TERLAMBAT") {
          radarStatus = "TERLAMBAT"
          statusLabel = "Terlambat"
          countHadirTerlambat++
        } else {
          radarStatus = "TEPAT_WAKTU"
          statusLabel = "Tepat Waktu"
          countHadirTepat++
        }
      } else if (cuti) {
        radarStatus = "CUTI_IZIN"
        statusLabel = cuti.jenisCuti?.replace("_", " ") || "Cuti / Izin"
        countCutiIzin++
      } else {
        countBelumAbsen++
      }

      return {
        id: p.id,
        nama: p.nama,
        nik: p.nik,
        jabatan: p.jabatan,
        bidang: p.bidang?.nama || null,
        subBidang: p.subBidang?.nama || null,
        telepon: p.telepon || null,
        fotoUrl: p.fotoUrl || null,
        radarStatus,
        statusLabel,
        jamMasuk: jamMasukStr,
        jamKeluar: jamKeluarStr,
        metode: abs?.metode || null,
      }
    })

    const totalPegawai = pegawaiList.length
    const totalHadir = countHadirTepat + countHadirTerlambat
    const persentaseKehadiran = totalPegawai > 0 ? Math.round((totalHadir / totalPegawai) * 100) : 0

    return {
      success: true,
      summary: {
        totalPegawai,
        totalHadir,
        countHadirTepat,
        countHadirTerlambat,
        countBelumAbsen,
        countCutiIzin,
        persentaseKehadiran,
      },
      items,
    }
  } catch (error: any) {
    console.error("getLiveRadarKehadiran error:", error)
    return { error: error.message || "Gagal memuat radar kehadiran" }
  }
}
