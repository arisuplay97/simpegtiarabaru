import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hitungIndeksPegawai } from "@/lib/actions/indeks"
import { parseTitikKoordinat, hitungJarak } from "@/lib/data/lokasi-store"
import { isCabangEmployee } from "@/lib/utils/pegawai-cabang"

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
  return hitungJarak(lat1, lon1, lat2, lon2)
}

// In-flight concurrency lock untuk mencegah double-tap / duplicate requests
const inFlightPegawai = new Set<string>()

// Short TTL In-Memory Cache (60s) agar tidak query ulang pengaturan & lokasi statis saat ratusan pegawai absen bersamaan
let cachedPengaturan: any = null
let cachedPengaturanExpires = 0

async function getCachedPengaturan() {
  const now = Date.now()
  if (cachedPengaturan && now < cachedPengaturanExpires) {
    return cachedPengaturan
  }
  cachedPengaturan = await prisma.pengaturan.findFirst()
  cachedPengaturanExpires = now + 60_000
  return cachedPengaturan
}

let cachedActiveLocations: any[] | null = null
let cachedLocationsExpires = 0

async function getCachedActiveLocations() {
  const now = Date.now()
  if (cachedActiveLocations && now < cachedLocationsExpires) {
    return cachedActiveLocations
  }
  cachedActiveLocations = await prisma.lokasiAbsensi.findMany({ where: { aktif: true } })
  cachedLocationsExpires = now + 60_000
  return cachedActiveLocations
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    if (!userId) return NextResponse.json({ error: "ID User tidak ditemukan" }, { status: 400 })

    const pegawai = await prisma.pegawai.findUnique({ 
      where: { userId },
      include: { lokasiAbsensi: true, bidang: true }
    })
    if (!pegawai) return NextResponse.json({ error: "Profil pegawai tidak ditemukan. Hubungi HRD." }, { status: 400 })

    const pegawaiId = pegawai.id

    // Proteksi Concurrency: Cegah duplikasi jika user menekan tombol berulang kali dalam milidetik
    if (inFlightPegawai.has(pegawaiId)) {
      return NextResponse.json({ error: "Presensi Anda sedang diproses. Mohon tunggu sebentar." }, { status: 429 })
    }
    inFlightPegawai.add(pegawaiId)

    try {
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
      
      // Radius check logic (mendukung multi-titik koordinat per lokasi)
      if (!pegawai.bebasAbsensi) {
        if (pegawai.lokasiAbsensi) {
          // Jika pegawai terikat pada satu Lokasi spesifik
          const allPoints = parseTitikKoordinat(pegawai.lokasiAbsensi as any)
          let isWithinRadius = false
          let closestDistance = Infinity
          let matchedPointName = ""

          for (const pt of allPoints) {
            const distance = hitungJarak(latitude, longitude, pt.latitude, pt.longitude)
            if (distance < closestDistance) closestDistance = distance
            const effectiveRadius = pt.radius ?? pegawai.lokasiAbsensi.radius
            if (distance <= effectiveRadius) {
              isWithinRadius = true
              matchedPointName = pt.nama
              break
            }
          }

          if (!isWithinRadius) {
            return NextResponse.json({ 
              error: `Anda berada di luar jangkauan area absen (${pegawai.lokasiAbsensi.nama}). Jarak terdekat: ${Math.round(closestDistance)}m (Maks: ${pegawai.lokasiAbsensi.radius}m).` 
            }, { status: 400 })
          }
        } else {
          // Jika pegawai menggunakan opsi "Semua Lokasi Aktif (Default)"
          const allLocations = await getCachedActiveLocations()

          if (allLocations && allLocations.length > 0) {
            let isValidLocation = false
            let closestDistance = Infinity

            for (const loc of allLocations) {
              const allPoints = parseTitikKoordinat(loc as any)
              for (const pt of allPoints) {
                const distance = hitungJarak(latitude, longitude, pt.latitude, pt.longitude)
                if (distance < closestDistance) closestDistance = distance
                const effectiveRadius = pt.radius ?? loc.radius
                if (distance <= effectiveRadius) {
                  isValidLocation = true
                  break
                }
              }
              if (isValidLocation) break
            }

            if (!isValidLocation) {
              return NextResponse.json({ 
                error: `Anda berada di luar jangkauan area absen manapun. Jarak terdekat ke lokasi kantor/titik absensi: ${Math.round(closestDistance)}m.` 
              }, { status: 400 })
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

    const pengaturan: any = await getCachedPengaturan()
    const isCabang = isCabangEmployee(pegawai)
    
    // Konversi waktu sekarang (Vercel UTC) ke WITA agar pengecekan jam valid
    const witaString = now.toLocaleString("en-US", { timeZone: "Asia/Makassar" })
    const witaNow = new Date(witaString)
    const dayOfWeek = witaNow.getDay() // 0 = Minggu, 6 = Sabtu
    const currentHour = witaNow.getHours()
    const currentMinute = witaNow.getMinutes()
    const currentTotalM = currentHour * 60 + currentMinute

    // Validasi Hari Libur
    if (dayOfWeek === 0) {
      return NextResponse.json({ error: "Hari Minggu adalah hari libur operasional. Presensi ditutup." }, { status: 400 })
    }

    if (dayOfWeek === 6 && !isCabang && !pegawai.bebasAbsensi) {
      return NextResponse.json({ error: "Hari Sabtu adalah hari libur untuk kantor pusat. Presensi hari Sabtu khusus pegawai kantor cabang." }, { status: 400 })
    }

    let mulaiMasukStr = pengaturan?.mulaiAbsenMasuk || "06:30"
    let batasMasukStr = pengaturan?.batasAbsenMasuk || "14:00"
    let mulaiPulangStr = pengaturan?.mulaiAbsenPulang || "15:00"
    let batasPulangStr = pengaturan?.batasAbsenPulang || "18:00"
    let jamMasukSetting = pengaturan?.jamMasuk || "08:00"

    if (isCabang || (dayOfWeek === 6 && pegawai.bebasAbsensi)) {
      if (dayOfWeek === 6) {
        // Khusus Hari Sabtu Kantor Cabang / Bebas Absensi
        mulaiMasukStr = pengaturan?.mulaiMasukSabtuCabang || "06:30"
        batasMasukStr = pengaturan?.batasMasukSabtuCabang || "11:00"
        mulaiPulangStr = pengaturan?.mulaiPulangSabtuCabang || "12:00"
        batasPulangStr = pengaturan?.batasPulangSabtuCabang || "15:00"
        jamMasukSetting = pengaturan?.jamMasukSabtuCabang || "08:00"
      } else {
        // Hari Biasa Kantor Cabang (Senin - Jumat)
        mulaiMasukStr = pengaturan?.mulaiAbsenMasukCabang || pengaturan?.mulaiAbsenMasuk || "06:30"
        batasMasukStr = pengaturan?.batasAbsenMasukCabang || pengaturan?.batasAbsenMasuk || "14:00"
        mulaiPulangStr = pengaturan?.mulaiAbsenPulangCabang || pengaturan?.mulaiAbsenPulang || "15:00"
        batasPulangStr = pengaturan?.batasAbsenPulangCabang || pengaturan?.batasAbsenPulang || "18:00"
        jamMasukSetting = pengaturan?.jamMasukCabang || pengaturan?.jamMasuk || "08:00"
      }
    }

    const [mulaiMasukH, mulaiMasukM = 0] = mulaiMasukStr.split(":").map(Number)
    const [batasMasukH, batasMasukM = 0] = batasMasukStr.split(":").map(Number)
    const [mulaiPulangH, mulaiPulangM = 0] = mulaiPulangStr.split(":").map(Number)
    const [batasPulangH, batasPulangM = 0] = batasPulangStr.split(":").map(Number)

    const mulaiMasukTotalM = mulaiMasukH * 60 + mulaiMasukM
    const batasMasukTotalM = batasMasukH * 60 + batasMasukM
    const mulaiPulangTotalM = mulaiPulangH * 60 + mulaiPulangM
    const batasPulangTotalM = batasPulangH * 60 + batasPulangM

    const isCheckOut = existing && existing.jamMasuk && !existing.jamKeluar

    if (!isCheckOut) {
      // Validasi jam buka & batas check-in
      if (currentTotalM < mulaiMasukTotalM) {
        return NextResponse.json({ error: `Sesi check-in belum dibuka. Absensi baru bisa dilakukan mulai pukul ${mulaiMasukStr}.` }, { status: 400 })
      }
      if (currentTotalM > batasMasukTotalM) {
        return NextResponse.json({ error: `Sesi check-in hari ini sudah ditutup sejak pukul ${batasMasukStr}.` }, { status: 400 })
      }
    } else {
      if (currentTotalM < mulaiPulangTotalM) {
        return NextResponse.json({ error: `Maaf, belum waktunya pulang. Sesi check-out baru akan dibuka pukul ${mulaiPulangStr}.` }, { status: 400 })
      }
      if (currentTotalM > batasPulangTotalM) {
        return NextResponse.json({ error: `Sesi check-out sudah berakhir pada pukul ${batasPulangStr}.` }, { status: 400 })
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
      // Asynchronous non-blocking: jalankan kalkulasi indeks di background agar respon ke HP instan (< 100ms)
      hitungIndeksPegawai(pegawaiId, now.getMonth() + 1, now.getFullYear()).catch(err => {
        console.error("[BG_INDEX] Error hitungIndeksPegawai checkout:", err)
      })
      return NextResponse.json({ success: true, status: updated.status, tipe: "CHECK_OUT" })
    }

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
      // Asynchronous non-blocking
      hitungIndeksPegawai(pegawaiId, now.getMonth() + 1, now.getFullYear()).catch(err => {
        console.error("[BG_INDEX] Error hitungIndeksPegawai checkin update:", err)
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
      // Asynchronous non-blocking
      hitungIndeksPegawai(pegawaiId, now.getMonth() + 1, now.getFullYear()).catch(err => {
        console.error("[BG_INDEX] Error hitungIndeksPegawai checkin create:", err)
      })
      return NextResponse.json({ success: true, status: created.status, tipe: "CHECK_IN" })
    }

    } finally {
      inFlightPegawai.delete(pegawaiId)
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan sistem" }, { status: 500 })
  }
}
