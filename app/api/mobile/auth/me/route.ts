import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"

/**
 * GET /api/mobile/auth/me
 * Header: Authorization: Bearer <token>
 * Response: { user }
 */
export async function GET(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { pegawaiId } = auth.payload
    if (!pegawaiId) {
      return NextResponse.json({ error: "Akun ini tidak terhubung ke data pegawai" }, { status: 404 })
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
      include: {
        bidang: true,
        subBidang: true,
      }
    })

    if (!pegawai) {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({
      id: pegawai.id,
      nama: pegawai.nama,
      nik: pegawai.nik,
      jabatan: pegawai.jabatan,
      golongan: pegawai.golongan,
      pangkat: pegawai.pangkat,
      bidang: pegawai.bidang?.nama,
      subBidang: pegawai.subBidang?.nama,
      fotoUrl: pegawai.fotoUrl,
      email: pegawai.email,
      telepon: pegawai.telepon,
      status: pegawai.status,
      tanggalMasuk: pegawai.tanggalMasuk,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
