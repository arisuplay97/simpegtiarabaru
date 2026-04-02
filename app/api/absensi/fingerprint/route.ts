import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Anti-fake GPS: batas minimum akurasi yang masih diterima (meter)
const MAX_ALLOWED_ACCURACY = 300
// Batas koordinat Indonesia
const INDONESIA_LAT_MIN = -11.0
const INDONESIA_LAT_MAX = 6.0
const INDONESIA_LNG_MIN = 95.0
const INDONESIA_LNG_MAX = 141.0

function isCoordinateValid(lat: number, lng: number): boolean {
  return (
    lat >= INDONESIA_LAT_MIN && lat <= INDONESIA_LAT_MAX &&
    lng >= INDONESIA_LNG_MIN && lng <= INDONESIA_LNG_MAX
  )
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    if (!userId) return NextResponse.json({ error: "ID User tidak ditemukan" }, { status: 400 })

    const pegawai = await prisma.pegawai.findUnique({ where: { userId } })
    if (!pegawai) return NextResponse.json({ error: "Profil pegawai tidak ditemukan. Hubungi HRD." }, { status: 400 })

    const pegawaiId = pegawai.id
    const body = await req.json()
    const { latitude = 0, longitude = 0, accuracy = 999, offlineSync = false, offlineTimestamp } = body

    if (!offlineSync) {
      if (accuracy > MAX_ALLOWED_ACCURACY) {
        return NextResponse.json({ error: `Akurasi GPS terlalu rendah (${Math.round(accuracy)}m). Pastikan GPS aktif.` }, { status: 400 })
      }
      if (latitude !== 0 && longitude !== 0 && !isCoordinateValid(latitude, longitude)) {
        return NextResponse.json({ error: "Koordinat GPS tidak valid. Sistem mendeteksi lokasi di luar wilayah wajar." }, { status: 400 })
      }
      if (accuracy > 0 && accuracy < 3) {
        return NextResponse.json({ error: "GPS terlalu akurat, terindikasi menggunakan fake/mock GPS." }, { status: 400 })
      }
    }

    const now = offlineSync && offlineTimestamp ? new Date(offlineTimestamp) : new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.absensi.findFirst({
      where: { pegawaiId, tanggal: { gte: todayStart, lte: todayEnd } }
    }) as any

    if (existing && existing.jamMasuk && existing.jamKeluar) {
      return NextResponse.json({ error: "Anda sudah check-in dan check-out hari ini" }, { status: 400 })
    }

    if (existing && !existing.jamMasuk && ["CUTI", "SAKIT", "IZIN", "OFF", "LIBUR", "DINAS_LUAR", "PERJALANAN_DINAS"].includes(existing.status || "")) {
      return NextResponse.json({ error: `Hari ini Anda tercatat sedang ${existing.status}. Anda tidak perlu melakukan absensi.` }, { status: 400 })
    }

    const pengaturan: any = await prisma.pengaturan.findFirst()
    const currentHour = now.getHours()
    const batasMasukH = parseInt(pengaturan?.batasAbsenMasuk?.split(":")[0] || "14")
    const mulaiPulangH = parseInt(pengaturan?.mulaiAbsenPulang?.split(":")[0] || "15")
    const batasPulangH = parseInt(pengaturan?.batasAbsenPulang?.split(":")[0] || "18")

    const isCheckOut = existing && existing.jamMasuk && !existing.jamKeluar

    if (!isCheckOut) {
      if (currentHour >= batasMasukH) {
        return NextResponse.json({ error: `Sesi check-in hari ini sudah ditutup sejak pukul ${pengaturan?.batasAbsenMasuk || "14:00"}.` }, { status: 400 })
      }
    } else {
      if (currentHour < mulaiPulangH) {
        return NextResponse.json({ error: `Maaf, belum waktunya pulang. Sesi check-out baru akan dibuka pukul ${pengaturan?.mulaiAbsenPulang || "15:00"}.` }, { status: 400 })
      }
      if (currentHour >= batasPulangH) {
        return NextResponse.json({ error: `Sesi check-out sudah berakhir pada pukul ${pengaturan?.batasAbsenPulang || "18:00"}.` }, { status: 400 })
      }
    }

    if (isCheckOut) {
      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          jamKeluar: now,
          lokasiKeluar: `${latitude},${longitude}`,
        } as any
      })
      return NextResponse.json({ success: true, status: updated.status, tipe: "CHECK_OUT" })
    }

    const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    const batasTerlambat = pengaturan?.batasTerlambat || 0
    const [jh, jm] = jamMasukSetting.split(":").map(Number)
    const limitMasuk = new Date(now)
    limitMasuk.setHours(jh, jm + batasTerlambat, 0, 0)

    const statusAbsen = now > limitMasuk ? "TERLAMBAT" : "HADIR"

    if (existing && !existing.jamMasuk) {
      // Overwrite cron empty record
      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          status: statusAbsen as any,
          metode: "FINGERPRINT",
          jamMasuk: now,
          faceVerified: true, 
          offlineSync,
          lokasiMasuk: `${latitude},${longitude}`,
        } as any
      })
      return NextResponse.json({ success: true, status: updated.status, tipe: "CHECK_IN" })
    } else {
      const created = await prisma.absensi.create({
        data: {
          pegawaiId,
          tanggal: new Date(todayStart),
          status: statusAbsen as any,
          metode: "FINGERPRINT",
          jamMasuk: now,
          faceVerified: true, 
          offlineSync,
          lokasiMasuk: `${latitude},${longitude}`,
        } as any
      })
      return NextResponse.json({ success: true, status: created.status, tipe: "CHECK_IN" })
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan sistem" }, { status: 500 })
  }
}
