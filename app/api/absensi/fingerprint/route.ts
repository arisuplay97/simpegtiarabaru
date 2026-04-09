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

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000 // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    if (!userId) return NextResponse.json({ error: "ID User tidak ditemukan" }, { status: 400 })

    const pegawai = await prisma.pegawai.findUnique({ 
      where: { userId },
      include: { lokasiAbsensi: true }
    })
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
      
      // Radius check logic
      if (!pegawai.bebasAbsensi) {
        if (pegawai.lokasiAbsensi) {
          // Jika pegawai terikat pada satu Lokasi spesifik
          const distance = getDistanceFromLatLonInM(
            latitude, 
            longitude, 
            pegawai.lokasiAbsensi.latitude, 
            pegawai.lokasiAbsensi.longitude
          )
          
          if (distance > pegawai.lokasiAbsensi.radius) {
            return NextResponse.json({ error: `Anda berada di luar jangkauan absen. Jarak: ${Math.round(distance)}m (Maks: ${pegawai.lokasiAbsensi.radius}m dari kantor/lokasi).` }, { status: 400 })
          }
        } else {
          // Jika pegawai menggunakan opsi "Semua Lokasi Aktif (Default)"
          const allLocations = await prisma.lokasiAbsensi.findMany({ where: { aktif: true } })
          
          if (allLocations.length > 0) {
            let isValidLocation = false;
            let closestDistance = Infinity;

            for (const loc of allLocations) {
              const distance = getDistanceFromLatLonInM(latitude, longitude, loc.latitude, loc.longitude);
              if (distance < closestDistance) closestDistance = distance;
              if (distance <= loc.radius) {
                isValidLocation = true;
                break;
              }
            }

            if (!isValidLocation) {
              return NextResponse.json({ error: `Anda berada di luar jangkauan area absen manapun. Jarak terdekat ke kantor adalah ${Math.round(closestDistance)}m.` }, { status: 400 })
            }
          }
        }
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

    const pengaturan: any = await prisma.pengaturan.findFirst()
    
    // Konversi waktu sekarang (Vercel UTC) ke WITA agar pengecekan jam valid
    const witaString = now.toLocaleString("en-US", { timeZone: "Asia/Makassar" });
    const witaNow = new Date(witaString);
    const currentHour = witaNow.getHours();
    const currentMinute = witaNow.getMinutes();

    const mulaiMasukH = parseInt(pengaturan?.mulaiAbsenMasuk?.split(":")[0] || "6")
    const mulaiMasukM = parseInt(pengaturan?.mulaiAbsenMasuk?.split(":")[1] || "30")
    const batasMasukH = parseInt(pengaturan?.batasAbsenMasuk?.split(":")[0] || "14")
    const mulaiPulangH = parseInt(pengaturan?.mulaiAbsenPulang?.split(":")[0] || "15")
    const batasPulangH = parseInt(pengaturan?.batasAbsenPulang?.split(":")[0] || "18")

    const isCheckOut = existing && existing.jamMasuk && !existing.jamKeluar

    if (!isCheckOut) {
      // Validasi jam paling pagi (tidak boleh absen tengah malam)
      if (currentHour < mulaiMasukH || (currentHour === mulaiMasukH && currentMinute < mulaiMasukM)) {
        return NextResponse.json({ error: `Sesi check-in belum dibuka. Absensi baru bisa dilakukan mulai pukul ${pengaturan?.mulaiAbsenMasuk || "06:30"}.` }, { status: 400 })
      }
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
