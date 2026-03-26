import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SECURITY FIX: Hapus logika demo-user yang bisa mengekspos data pegawai sembarang
    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      select: { id: true, nama: true }
    })

    if (!pegawai) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(pegawai)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
