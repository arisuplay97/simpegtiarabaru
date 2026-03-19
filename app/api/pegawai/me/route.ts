import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Untuk demo users (id = "demo-1" dst), cari berdasarkan email
    const userId = session.user.id
    let pegawai = null

    if (userId.startsWith("demo-")) {
      // Demo user — cari pegawai pertama dari database sebagai fallback
      pegawai = await prisma.pegawai.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" }
      })
    } else {
      // Real user — cari berdasarkan userId
      pegawai = await prisma.pegawai.findUnique({
        where: { userId },
        select: { id: true }
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
