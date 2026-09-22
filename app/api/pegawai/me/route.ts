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

    const includeObj = {
      bidang: true,
      subBidang: true,
      lokasiAbsensi: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        }
      }
    }

    // 1. Coba cari berdasarkan userId jika UUID valid
    if (session.user.id && UUID_REGEX.test(session.user.id)) {
      pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id },
        include: includeObj
      })
    }

    // 2. Fallback berdasarkan pegawaiId jika ada di session
    const sessionPegawaiId = (session.user as any).pegawaiId
    if (!pegawai && sessionPegawaiId && UUID_REGEX.test(sessionPegawaiId)) {
      pegawai = await prisma.pegawai.findUnique({
        where: { id: sessionPegawaiId },
        include: includeObj
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
        include: includeObj
      })
    }

    if (!pegawai) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const role = (pegawai as any).user?.role || (session.user as any)?.role || "PEGAWAI"

    return NextResponse.json({
      ...pegawai,
      role
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
