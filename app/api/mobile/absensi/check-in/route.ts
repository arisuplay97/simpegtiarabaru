import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { put } from "@vercel/blob"

/**
 * POST /api/mobile/absensi/check-in
 * Header: Authorization: Bearer <token>
 * Body: FormData { foto: File, latitude: string, longitude: string, metode: "SELFIE"|"GPS" }
 * Returns: { success, absensi }
 */
export async function POST(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) return NextResponse.json({ error: "Bukan pegawai" }, { status: 403 })

    const formData = await req.formData()
    const foto = formData.get("foto") as File | null
    const latitude = formData.get("latitude") as string | null
    const longitude = formData.get("longitude") as string | null

    // Cek sudah absen hari ini belum (berbasis WITA UTC+8)
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
    const todayStart = new Date(`${dateStr}T00:00:00+08:00`)
    const todayEnd = new Date(`${dateStr}T23:59:59.999+08:00`)
    const targetDateDb = new Date(`${dateStr}T00:00:00.000Z`)

    const existing = await prisma.absensi.findFirst({
      where: {
        pegawaiId,
        OR: [
          { tanggal: { gte: todayStart, lte: todayEnd } },
          { tanggal: targetDateDb },
          { jamMasuk: { gte: todayStart, lte: todayEnd } }
        ]
      }
    })

    // Jika sudah check-in tapi belum check-out, proses sebagai check-out
    if (existing && !existing.jamKeluar) {
      let fotoKeluarUrl: string | null = null

      if (foto) {
        const buffer = Buffer.from(await foto.arrayBuffer())
        const blob = await put(`selfie/${pegawaiId}/keluar-${Date.now()}.jpg`, buffer, {
          access: "public",
          contentType: foto.type || "image/jpeg"
        })
        fotoKeluarUrl = blob.url
      }

      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          jamKeluar: now,
          ...(fotoKeluarUrl ? { fotoKeluarUrl } as any : {}),
        }
      })

      return NextResponse.json({
        success: true,
        tipe: "CHECK_OUT",
        absensi: {
          id: updated.id,
          status: updated.status,
          jamMasuk: updated.jamMasuk ? new Date(updated.jamMasuk).toTimeString().slice(0, 5) : null,
          jamKeluar: updated.jamKeluar ? new Date(updated.jamKeluar).toTimeString().slice(0, 5) : null,
        }
      })
    }

    // Jika sudah absen penuh hari ini
    if (existing && existing.jamKeluar) {
      return NextResponse.json({ error: "Anda sudah melakukan check-in dan check-out hari ini" }, { status: 400 })
    }

    // CHECK-IN
    let fotoMasukUrl: string | null = null
    if (foto) {
      const buffer = Buffer.from(await foto.arrayBuffer())
      const blob = await put(`selfie/${pegawaiId}/masuk-${Date.now()}.jpg`, buffer, {
        access: "public",
        contentType: foto.type || "image/jpeg"
      })
      fotoMasukUrl = blob.url
    }

    // Ambil pengaturan jam
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    const batasTerlambat = pengaturan?.batasTerlambat || 0
    const [jh, jm = 0] = jamMasukSetting.split(":").map(Number)
    const witaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }))
    const currentWitaMinutes = witaNow.getHours() * 60 + witaNow.getMinutes()
    const limitMasukMinutes = jh * 60 + jm + batasTerlambat

    const status = currentWitaMinutes > limitMasukMinutes ? "TERLAMBAT" : "HADIR"

    const created = await prisma.absensi.create({
      data: {
        pegawaiId,
        tanggal: targetDateDb,
        status: status as any,
        metode: "SELFIE",
        jamMasuk: now,
        ...(fotoMasukUrl ? { fotoMasukUrl } as any : {}),
        ...(latitude && longitude ? { lokasiMasuk: `${latitude},${longitude}` } as any : {}),
      }
    })

    return NextResponse.json({
      success: true,
      tipe: "CHECK_IN",
      absensi: {
        id: created.id,
        status: created.status,
        jamMasuk: created.jamMasuk ? new Date(created.jamMasuk).toTimeString().slice(0, 5) : null,
        jamKeluar: null,
        fotoMasukUrl,
      }
    })
  } catch (err: any) {
    console.error("Check-in error:", err)
    return NextResponse.json({ error: err.message || "Gagal proses absensi" }, { status: 500 })
  }
}
