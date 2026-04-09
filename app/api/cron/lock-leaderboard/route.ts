import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hitungIndeksPegawai } from "@/lib/actions/indeks"

// Endpoint ini dipanggil awal bulan untuk FINALISASI skor bulan lalu
// Contoh via Vercel Cron: "0 1 1 * *" (jam 01:00 tanggal 1 tiap bulan)
// Atau bisa dipanggil manual dari HRD dengan secret key

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get("secret")

    // Keamanan: harus pakai secret key yang sama dengan env
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    // Hitung bulan yang mau di-lock = bulan lalu
    const lockBulan = now.getMonth() === 0 ? 12 : now.getMonth()
    const lockTahun = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    // Override bulan/tahun jika di-pass manual
    const manualBulan = searchParams.get("bulan") ? parseInt(searchParams.get("bulan")!) : null
    const manualTahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : null
    const b = manualBulan || lockBulan
    const t = manualTahun || lockTahun

    // 1. Finalize skor SEMUA pegawai aktif untuk bulan yang di-lock
    const pegawaiAktif = await prisma.pegawai.findMany({
      where: { status: 'AKTIF' },
      select: { id: true }
    })

    let success = 0, failed = 0
    const chunkSize = 5
    for (let i = 0; i < pegawaiAktif.length; i += chunkSize) {
      const chunk = pegawaiAktif.slice(i, i + chunkSize)
      const results = await Promise.all(chunk.map(p => hitungIndeksPegawai(p.id, b, t)))
      results.forEach(r => { if ((r as any).success) success++; else failed++ })
    }

    // 2. Ambil Top 10 dari bulan yang di-lock
    const top10 = await prisma.indeksPegawai.findMany({
      where: { bulan: b, tahun: t },
      include: {
        pegawai: { select: { nama: true, jabatan: true, fotoUrl: true, bidang: { select: { nama: true } } } }
      },
      orderBy: { totalSkor: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      message: `Leaderboard bulan ${b}/${t} berhasil di-lock.`,
      processed: success,
      failed,
      top10: top10.map((r, idx) => ({
        rank: idx + 1,
        nama: r.pegawai.nama,
        jabatan: r.pegawai.jabatan,
        unit: r.pegawai.bidang?.nama || "—",
        totalSkor: r.totalSkor,
        predikat: r.predikat,
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
