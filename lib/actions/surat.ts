'use server'
// lib/actions/surat.ts
// Server actions ONLY — hanya async functions

import { prisma } from "@/lib/prisma"

// ============ NOMOR SURAT SEQUENTIAL (DARI DB) ============
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

  const count = await prisma.arsipSurat.count({
    where: {
      nomorSurat: { contains: `/${bln}/${thn}` }
    }
  })
  const nomorUrut = String(count + 1).padStart(3, "0")
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
