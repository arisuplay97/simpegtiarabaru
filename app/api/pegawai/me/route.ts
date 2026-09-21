import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let pegawai = null

    // 1. Coba cari berdasarkan userId jika UUID valid
    if (session.user.id && UUID_REGEX.test(session.user.id)) {
      pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id },
        include: {
          bidang: true,
          subBidang: true,
          lokasiAbsensi: true
        }
      })
    }

    // 2. Fallback berdasarkan pegawaiId jika ada di session
    const sessionPegawaiId = (session.user as any).pegawaiId
    if (!pegawai && sessionPegawaiId && UUID_REGEX.test(sessionPegawaiId)) {
      pegawai = await prisma.pegawai.findUnique({
        where: { id: sessionPegawaiId },
        include: {
          bidang: true,
          subBidang: true,
          lokasiAbsensi: true
        }
      })
    }

    // 3. Fallback berdasarkan email session
    if (!pegawai && session.user.email) {
      pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { email: { equals: session.user.email, mode: "insensitive" } },
            { user: { email: { equals: session.user.email, mode: "insensitive" } } }
          ]
        },
        include: {
          bidang: true,
          subBidang: true,
          lokasiAbsensi: true
        }
      })
    }

    if (!pegawai) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(pegawai)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
