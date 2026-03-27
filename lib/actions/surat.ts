'use server'
// lib/actions/surat.ts — Server actions ONLY (async)

import { prisma } from "@/lib/prisma"

// ============ NOMOR SURAT SEQUENTIAL (MAX-BASED, tidak reset saat delete) ============
export async function generateNomorSurat(
  kode: string = "PERUMDAM-TIARA"
): Promise<string> {
  const bulan = [
    "", "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII"
  ]
  const now = new Date()
  const bln = bulan[now.getMonth() + 1]
  const thn = now.getFullYear()

  // Ambil semua nomor yang cocok bulan & tahun ini
  const existing = await prisma.arsipSurat.findMany({
    where: { nomorSurat: { contains: `/${bln}/${thn}` } },
    select: { nomorSurat: true }
  })

  // Cari nomor urut TERTINGGI yang sudah ada, bukan COUNT (agar tak reset saat delete)
  let maxUrut = 0
  for (const s of existing) {
    const match = s.nomorSurat.match(/^(\d+)\//)
    if (match) maxUrut = Math.max(maxUrut, parseInt(match[1]))
  }
  const nomorUrut = String(maxUrut + 1).padStart(3, "0")
  return `${nomorUrut}/${kode}/${bln}/${thn}`
}

// ============ SIMPAN ARSIP SURAT ============
export async function saveArsipSurat(payload: {
  nomorSurat: string
  jenisSurat: string
  perihal: string
  tanggalSurat: string
  kepada?: string
  namaPenandatangan: string
  nikPenandatangan?: string
  jabatanPenandatangan: string
  dataLengkap?: Record<string, any>
}) {
  try {
    await prisma.arsipSurat.create({ data: payload })
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan arsip surat" }
  }
}

// ============ GET ARSIP SURAT ============
export async function getArsipSurat(jenis?: string) {
  try {
    const list = await prisma.arsipSurat.findMany({
      where: jenis ? { jenisSurat: jenis } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return list
  } catch {
    return []
  }
}

// ============ HAPUS ARSIP SURAT ============
export async function deleteArsipSurat(id: string) {
  try {
    await prisma.arsipSurat.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus arsip" }
  }
}
