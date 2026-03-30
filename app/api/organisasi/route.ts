import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [bidangAll, totalPegawai] = await Promise.all([
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
    ])

    // Identifikasi bidang Direksi (berdasarkan nama/kode)
    const bidangDireksi = bidangAll.find(b =>
      b.nama.toLowerCase().includes("direksi") || b.kode?.toLowerCase() === "dir"
    )

    // Direksi = user role DIREKSI ATAU pegawai di bidang Direksi dengan jabatan mengandung "Direktur"/"Dirut"
    const direksiList = await prisma.pegawai.findMany({
      where: {
        status: "AKTIF",
        OR: [
          { user: { role: "DIREKSI" } },
          ...(bidangDireksi
            ? [{ bidangId: bidangDireksi.id, jabatan: { contains: "Direktur", mode: "insensitive" as const } }]
            : []),
        ],
      },
      select: { id: true, nama: true, jabatan: true, tipeJabatan: true, fotoUrl: true, atasanLangsung: true },
      orderBy: { jabatan: "asc" },
    })

    // Exclude bidang Direksi dari tree utama
    const bidangList = bidangAll.filter(b =>
      !b.nama.toLowerCase().includes("direksi") && b.kode?.toLowerCase() !== "dir"
    )

    const totalJabatan = await prisma.pegawai
      .findMany({ where: { status: "AKTIF" }, select: { jabatan: true }, distinct: ["jabatan"] })
      .then(r => r.length)

    return NextResponse.json({
      direksiList,
      bidangList,
      stats: { totalPegawai, totalBidang: bidangList.length, totalJabatan },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
