import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"

/**
 * GET /api/mobile/absensi?bulan=3&tahun=2026
 * Header: Authorization: Bearer <token>
 * Returns: list absensi pegawai bulan tertentu
 */
export async function GET(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) return NextResponse.json({ error: "Bukan pegawai" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const m = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1))
    const y = parseInt(searchParams.get("tahun") || String(now.getFullYear()))

    const startDate = new Date(y, m - 1, 1, 0, 0, 0)
    const endDate = new Date(y, m, 0, 23, 59, 59)

    const records = await prisma.absensi.findMany({
      where: { pegawaiId, tanggal: { gte: startDate, lte: endDate } },
      orderBy: { tanggal: "desc" }
    })

    const result = records.map(a => ({
      id: a.id,
      tanggal: a.tanggal.toISOString().split("T")[0],
      status: a.status,
      metode: a.metode,
      jamMasuk: a.jamMasuk ? new Date(a.jamMasuk).toTimeString().slice(0, 5) : null,
      jamKeluar: a.jamKeluar ? new Date(a.jamKeluar).toTimeString().slice(0, 5) : null,
      fotoMasukUrl: (a as any).fotoMasukUrl ?? null,
      fotoKeluarUrl: (a as any).fotoKeluarUrl ?? null,
      lokasiMasuk: (a as any).lokasiMasuk ?? null,
    }))

    return NextResponse.json({ data: result, bulan: m, tahun: y })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
