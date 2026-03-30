import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [bidangList, totalPegawai, direksiList] = await Promise.all([
      prisma.bidang.findMany({
        where: { aktif: true },
        orderBy: { nama: "asc" },
        include: {
          subBidang: {
            orderBy: { nama: "asc" },
            include: {
              pegawai: {
                where: { status: "AKTIF" },
                select: { id: true, nama: true, jabatan: true, tipeJabatan: true, fotoUrl: true },
                orderBy: { tipeJabatan: "asc" },
              },
            },
          },
          pegawai: {
            where: { status: "AKTIF" },
            select: { id: true, nama: true, jabatan: true, tipeJabatan: true, fotoUrl: true, subBidangId: true },
            orderBy: { tipeJabatan: "asc" },
          },
        },
      }),
      prisma.pegawai.count({ where: { status: "AKTIF" } }),
      // Ambil semua pegawai dengan role DIREKSI dari tabel User
      prisma.pegawai.findMany({
        where: {
          status: "AKTIF",
          user: { role: "DIREKSI" },
        },
        select: {
          id: true,
          nama: true,
          jabatan: true,
          tipeJabatan: true,
          fotoUrl: true,
          atasanLangsung: true,
        },
        orderBy: { jabatan: "asc" },
      }),
    ])

    const totalJabatan = await prisma.pegawai
      .findMany({ where: { status: "AKTIF" }, select: { jabatan: true }, distinct: ["jabatan"] })
      .then((rows) => rows.length)

    return NextResponse.json({
      bidangList,
      direksiList,
      stats: {
        totalPegawai,
        totalBidang: bidangList.length,
        totalJabatan,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
