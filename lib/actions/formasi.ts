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
    const formasi = await prisma.formasiJabatan.findMany({
      include: {
        bidang: true
      },
      orderBy: [
        { bidang: { nama: 'asc' } },
        { jabatan: 'asc' }
      ]
    })

    // Compute terisi
    const result = await Promise.all(formasi.map(async (f: any) => {
      const terisi = await prisma.pegawai.count({
        where: {
          jabatan: {
            equals: f.jabatan,
            mode: "insensitive"
          },
          bidangId: f.bidangId,
          status: "AKTIF"
        }
      })
      return {
        ...f,
        terisi,
        kosong: Math.max(0, f.kebutuhan - terisi),
        statusEnum: terisi >= f.kebutuhan ? "penuh" : "kurang"
      }
    }))

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
