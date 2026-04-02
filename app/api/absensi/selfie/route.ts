import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"

const MAX_FACE_FAIL = 6  // Soft block after 6 failures

// Anti-fake GPS: batas minimum akurasi yang masih diterima (meter)
const MAX_ALLOWED_ACCURACY = 300
// Batas koordinat: jika terlalu jauh dari titik mana pun di Indonesia, tolak
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

    // Cari pegawai lewat userId (bukan pegawaiId dari session karena bisa beda)
    const pegawai = await prisma.pegawai.findUnique({ where: { userId } })
    if (!pegawai) return NextResponse.json({ error: "Profil pegawai tidak ditemukan. Hubungi HRD." }, { status: 400 })

    const pegawaiId = pegawai.id

    const formData = await req.formData()
    const foto = formData.get("foto") as File | null
    const latitude = parseFloat(formData.get("latitude") as string || "0")
    const longitude = parseFloat(formData.get("longitude") as string || "0")
    const accuracy = parseFloat(formData.get("accuracy") as string || "999")
    const faceVerifiedStr = formData.get("faceVerified") as string
    const faceAttempts = parseInt(formData.get("faceAttempts") as string || "0")
    const isOfflineSync = formData.get("offlineSync") === "true"
    const offlineTimestamp = formData.get("offlineTimestamp")

    // =============================================
    // ANTI-FAKE GPS VALIDATION
    // =============================================
    if (!isOfflineSync) {
      // 1. Cek akurasi GPS (jika terlalu jelek, tolak)
      if (accuracy > MAX_ALLOWED_ACCURACY) {
        return NextResponse.json({
          error: `Akurasi GPS terlalu rendah (${Math.round(accuracy)}m). Pastikan GPS aktif dan tunggu sinyal kuat.`
        }, { status: 400 })
      }

      // 2. Cek koordinat berada di wilayah Indonesia
      if (latitude !== 0 && longitude !== 0 && !isCoordinateValid(latitude, longitude)) {
        return NextResponse.json({
          error: "Koordinat GPS tidak valid. Sistem mendeteksi lokasi di luar Indonesia."
        }, { status: 400 })
      }

      // 3. Cek akurasi terlalu sempurna (kemungkinan mock GPS)
      // GPS real HP biasanya 5-50m, jika < 3m perlu dicurigai
      if (accuracy > 0 && accuracy < 3) {
        return NextResponse.json({
          error: "GPS terlalu akurat, terindikasi menggunakan fake/mock GPS. Matikan developer mode mock location."
        }, { status: 400 })
      }
    }

    // =============================================
    // CEK ABSENSI HARI INI
    // =============================================
    // Jika offline, gunakan timestamp dari device
    const now = isOfflineSync && offlineTimestamp
      ? new Date(parseInt(offlineTimestamp as string))
      : new Date()

    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.absensi.findFirst({
      where: { pegawaiId, tanggal: { gte: todayStart, lte: todayEnd } }
    })

    if (existing && existing.jamMasuk && existing.jamKeluar) {
      return NextResponse.json({ error: "Anda sudah check-in dan check-out hari ini" }, { status: 400 })
    }

    if (existing && !existing.jamMasuk && ["CUTI", "SAKIT", "IZIN", "OFF", "LIBUR", "DINAS_LUAR", "PERJALANAN_DINAS"].includes((existing as any).status || "")) {
      return NextResponse.json({ error: `Hari ini Anda tercatat sedang ${(existing as any).status}. Anda tidak perlu melakukan absensi.` }, { status: 400 })
    }

    // =============================================
    // SERVER-SIDE TIME BOUNDARY VALIDATION
    // =============================================
    const pengaturan: any = await prisma.pengaturan.findFirst()
    const currentHour = now.getHours()
    const batasMasukH = parseInt(pengaturan?.batasAbsenMasuk?.split(":")[0] || "14")
    const mulaiPulangH = parseInt(pengaturan?.mulaiAbsenPulang?.split(":")[0] || "15")
    const batasPulangH = parseInt(pengaturan?.batasAbsenPulang?.split(":")[0] || "18")

    const isCheckOut = existing && existing.jamMasuk && !existing.jamKeluar

    if (!isCheckOut) {
      // Validasi Check-In
      if (currentHour >= batasMasukH) {
        return NextResponse.json({ error: `Sesi check-in hari ini sudah ditutup sejak pukul ${pengaturan?.batasAbsenMasuk || "14:00"}.` }, { status: 400 })
      }
    } else {
      // Validasi Check-Out
      if (currentHour < mulaiPulangH) {
        return NextResponse.json({ error: `Maaf, belum waktunya pulang. Sesi check-out baru akan dibuka pukul ${pengaturan?.mulaiAbsenPulang || "15:00"}.` }, { status: 400 })
      }
      if (currentHour >= batasPulangH) {
        return NextResponse.json({ error: `Sesi check-out sudah berakhir pada pukul ${pengaturan?.batasAbsenPulang || "18:00"}.` }, { status: 400 })
      }
    }

    // =============================================
    // UPLOAD FOTO
    // =============================================
    let fotoUrl: string | null = null
    if (foto) {
      const buffer = Buffer.from(await foto.arrayBuffer())
      const prefix = existing ? "keluar" : "masuk"
      const blob = await put(`selfie/${pegawaiId}/${prefix}-${Date.now()}.jpg`, buffer, {
        access: "public",
        contentType: foto.type || "image/jpeg"
      })
      fotoUrl = blob.url
    }

    // =============================================
    // TENTUKAN APAKAH FACE VERIFIED
    // =============================================
    const faceVerified = faceVerifiedStr === "true"
    const currentFaceFailCount = pegawai.faceFailCount || 0
    const newFaceFailCount = faceVerified ? 0 : currentFaceFailCount + faceAttempts

    // Jika pendingApproval needed (face fail >= MAX, tapi punya foto)
    const needsApproval = !faceVerified && newFaceFailCount >= MAX_FACE_FAIL
    
    // Update fail count di pegawai
    if (!faceVerified) {
      await prisma.pegawai.update({
        where: { id: pegawaiId },
        data: { faceFailCount: needsApproval ? newFaceFailCount : Math.min(newFaceFailCount, MAX_FACE_FAIL) } as any
      })
    } else {
      // Reset fail count on success
      await prisma.pegawai.update({
        where: { id: pegawaiId },
        data: { faceFailCount: 0 } as any
      })
    }

    // =============================================
    // PROSES CHECKOUT
    // =============================================
    if (existing && !existing.jamKeluar) {
      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          jamKeluar: now,
          ...(fotoUrl ? { fotoKeluarUrl: fotoUrl } : {}),
          ...(latitude && longitude ? { lokasiKeluar: `${latitude},${longitude}` } : {}),
          faceVerified: faceVerified || existing.faceVerified,
        }
      })
      return NextResponse.json({ success: true, status: updated.status, tipe: "CHECK_OUT" })
    }

    // =============================================
    // PROSES CHECK-IN
    // =============================================
    const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    const batasTerlambat = pengaturan?.batasTerlambat || 0
    const [jh, jm] = jamMasukSetting.split(":").map(Number)
    const limitMasuk = new Date(now)
    limitMasuk.setHours(jh, jm + batasTerlambat, 0, 0)

    // Jika wajah tidak lolos dan pending approval, status HADIR tapi pending
    const statusAbsen = needsApproval ? "HADIR" :
      (now > limitMasuk ? "TERLAMBAT" : "HADIR")

    if (existing && !existing.jamMasuk) {
      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          status: statusAbsen as any,
          metode: "SELFIE",
          jamMasuk: now,
          faceVerified,
          pendingApproval: needsApproval,
          offlineSync: isOfflineSync,
          ...(fotoUrl ? { fotoMasukUrl: fotoUrl } : {}),
          ...(latitude && longitude ? { lokasiMasuk: `${latitude},${longitude}` } : {}),
        } as any
      })
      return NextResponse.json({
        success: true,
        status: updated.status,
        tipe: "CHECK_IN",
        pendingApproval: needsApproval,
        faceVerified,
        ...(needsApproval ? { message: "Absensi tercatat. Karena verifikasi wajah gagal, status Anda akan ditinjau oleh HRD." } : {})
      })
    } else {
      const created = await prisma.absensi.create({
        data: {
          pegawaiId,
          tanggal: new Date(todayStart),
          status: statusAbsen as any,
          metode: "SELFIE",
          jamMasuk: now,
          faceVerified,
          pendingApproval: needsApproval,
          offlineSync: isOfflineSync,
          ...(fotoUrl ? { fotoMasukUrl: fotoUrl } : {}),
          ...(latitude && longitude ? { lokasiMasuk: `${latitude},${longitude}` } : {}),
        } as any
      })

      return NextResponse.json({
        success: true,
        status: created.status,
        tipe: "CHECK_IN",
        pendingApproval: needsApproval,
        faceVerified,
        ...(needsApproval ? { message: "Absensi tercatat. Karena verifikasi wajah gagal, status Anda akan ditinjau oleh HRD." } : {})
      })
    }

  } catch (err: any) {
    console.error("Selfie API error:", err)
    return NextResponse.json({ error: err.message || "Terjadi kesalahan sistem" }, { status: 500 })
  }
}
