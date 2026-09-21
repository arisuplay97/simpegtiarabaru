"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const formasiSchema = z.object({
  id: z.string().optional(),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  bidangId: z.string().min(1, "Unit kerja wajib dipilih"),
  kebutuhan: z.number().min(1, "Kebutuhan minimal 1"),
})

export async function getFormasiList() {
  try {
    const [formasi, activePegawai] = await Promise.all([
      prisma.formasiJabatan.findMany({
        include: { bidang: true },
        orderBy: [
          { bidang: { nama: 'asc' } },
          { jabatan: 'asc' }
        ]
      }),
      prisma.pegawai.findMany({
        where: { status: "AKTIF" },
        select: { jabatan: true, bidangId: true }
      })
    ])

    // Build count maps: jabatan+bidangId specific, and jabatan-only
    const countByJabBid = new Map<string, number>()
    const countByJab = new Map<string, number>()
    for (const p of activePegawai) {
      if (!p.jabatan) continue
      const jab = p.jabatan.trim().toLowerCase()
      const k = `${jab}|||${p.bidangId || ""}`
      countByJabBid.set(k, (countByJabBid.get(k) || 0) + 1)
      countByJab.set(jab, (countByJab.get(jab) || 0) + 1)
    }

    const result = formasi.map((f: any) => {
      const jab = (f.jabatan || "").trim().toLowerCase()
      const terisi = f.bidangId
        ? (countByJabBid.get(`${jab}|||${f.bidangId}`) || 0)
        : (countByJab.get(jab) || 0)
      const kebutuhan = Math.max(1, f.kebutuhan || 1)
      let statusEnum = "penuh"
      if (terisi < kebutuhan) statusEnum = "kurang"
      else if (terisi > kebutuhan) statusEnum = "lebih"

      return {
        ...f,
        kebutuhan,
        terisi,
        kosong: Math.max(0, kebutuhan - terisi),
        selisih: terisi - kebutuhan,
        statusEnum
      }
    })

    return result
  } catch (error) {
    console.error("Failed to get formasi", error)
    return []
  }
}

export async function upsertFormasi(data: z.infer<typeof formasiSchema>) {
  try {
    const parsed = formasiSchema.parse(data)
    
    if (parsed.id) {
      await prisma.formasiJabatan.update({
        where: { id: parsed.id },
        data: {
          jabatan: parsed.jabatan,
          bidangId: parsed.bidangId || null,
          kebutuhan: parsed.kebutuhan,
        }
      })
    } else {
      await prisma.formasiJabatan.create({
        data: {
          jabatan: parsed.jabatan,
          bidangId: parsed.bidangId || null,
          kebutuhan: parsed.kebutuhan,
        }
      })
    }
    revalidatePath("/formasi")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFormasi(id: string) {
  try {
    await prisma.formasiJabatan.delete({
      where: { id }
    })
    revalidatePath("/formasi")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Gagal menghapus formasi" }
  }
}

export async function autoGenerateFormasi() {
  try {
    const pegawai = await prisma.pegawai.findMany({
      where: { status: "AKTIF" },
      select: { jabatan: true, bidangId: true }
    })

    const counts: Record<string, { jabatan: string; bidangId: string | null; count: number }> = {}

    pegawai.forEach(p => {
      if (!p.jabatan || !p.jabatan.trim()) return
      const k = `${p.jabatan.trim().toLowerCase()}|||${p.bidangId || "null"}`
      if (!counts[k]) {
        counts[k] = { jabatan: p.jabatan.trim(), bidangId: p.bidangId, count: 0 }
      }
      counts[k].count++
    })

    const existing = await prisma.formasiJabatan.findMany({
      select: { id: true, jabatan: true, bidangId: true, kebutuhan: true }
    })
    const existingMap = new Map(
      existing.map(e => [
        `${e.jabatan.trim().toLowerCase()}|||${e.bidangId || "null"}`,
        e
      ])
    )

    let added = 0
    let updated = 0
    for (const val of Object.values(counts)) {
      const k = `${val.jabatan.toLowerCase()}|||${val.bidangId || "null"}`
      const ext = existingMap.get(k)
      if (!ext) {
        await prisma.formasiJabatan.create({
          data: {
            jabatan: val.jabatan,
            bidangId: val.bidangId,
            kebutuhan: val.count,
          }
        })
        added++
      } else if (ext.kebutuhan < val.count) {
        await prisma.formasiJabatan.update({
          where: { id: ext.id },
          data: { kebutuhan: val.count }
        })
        updated++
      }
    }

    revalidatePath("/formasi")
    return { success: true, added, updated }
  } catch (error: any) {
    console.error("autoGenerateFormasi error:", error)
    return { success: false, error: "Gagal auto-generate formasi" }
  }
}

