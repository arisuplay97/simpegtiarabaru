import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const pegawaiId = (session.user as any).pegawaiId || (session.user as any).id
    if (!pegawaiId) return NextResponse.json({ error: "ID Pegawai tidak ditemukan" }, { status: 400 })

    const formData = await req.formData()
    const foto = formData.get("foto") as File | null
    const latitude = formData.get("latitude") as string | null
    const longitude = formData.get("longitude") as string | null

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.absensi.findFirst({
      where: { pegawaiId, tanggal: { gte: todayStart, lte: todayEnd } }
    })

    if (existing && existing.jamKeluar) {
      return NextResponse.json({ error: "Anda sudah check-in dan check-out hari ini" }, { status: 400 })
    }

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

    if (existing && !existing.jamKeluar) {
      // PROSES CHECK-OUT
      const updated = await prisma.absensi.update({
        where: { id: existing.id },
        data: {
          jamKeluar: now,
          ...(fotoUrl ? { fotoKeluarUrl: fotoUrl } : {}),
        }
      })
      return NextResponse.json({ success: true, status: updated.status, tipe: "CHECK_OUT" })
    }

    // PROSES CHECK-IN
    const pengaturan = await prisma.pengaturan.findFirst()
    const jamMasukSetting = pengaturan?.jamMasuk || "08:00"
    const batasTerlambat = pengaturan?.batasTerlambat || 0
    const [jh, jm] = jamMasukSetting.split(":").map(Number)
    const limitMasuk = new Date(now)
    limitMasuk.setHours(jh, jm + batasTerlambat, 0, 0)

    const statusAbsen = now > limitMasuk ? "TERLAMBAT" : "HADIR"

    const created = await prisma.absensi.create({
      data: {
        pegawaiId,
        tanggal: new Date(todayStart),
        status: statusAbsen,
        metode: "SELFIE",
        jamMasuk: now,
        ...(fotoUrl ? { fotoMasukUrl: fotoUrl } : {}),
        ...(latitude && longitude ? { lokasiMasuk: `${latitude},${longitude}` } : {}),
      }
    })

    return NextResponse.json({ success: true, status: created.status, tipe: "CHECK_IN" })
  } catch (err: any) {
    console.error("Selfie API error:", err)
    return NextResponse.json({ error: err.message || "Terjadi kesalahan sistem" }, { status: 500 })
  }
}
