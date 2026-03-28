import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"

export async function GET(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) return NextResponse.json({ error: "Bukan pegawai" }, { status: 403 })

    const cutiList = await prisma.cuti.findMany({
      where: { pegawaiId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ data: cutiList.map(c => ({
      id: c.id,
      jenis: c.jenisCuti,
      tanggalMulai: c.tanggalMulai,
      tanggalSelesai: c.tanggalSelesai,
      alasan: c.alasan,
      status: c.status,
      createdAt: c.createdAt,
    })) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) return NextResponse.json({ error: "Bukan pegawai" }, { status: 403 })

    const body = await req.json()
    const { jenisCuti, tanggalMulai, tanggalSelesai, alasan } = body

    if (!jenisCuti || !tanggalMulai || !tanggalSelesai || !alasan) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    const cuti = await prisma.cuti.create({
      data: {
        pegawaiId,
        jenisCuti,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        alasan,
        status: "PENDING",
      } as any
    })

    return NextResponse.json({ success: true, data: cuti })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
