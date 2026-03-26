"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { logAudit } from "./audit-log"

export async function getDokumenPegawai(pegawaiId: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const dokumen = await prisma.pegawaiDokumen.findMany({
      where: { pegawaiId },
      orderBy: { createdAt: 'desc' }
    })

    return { data: dokumen }
  } catch (error: any) {
    console.error("Gagal mengambil data dokumen:", error)
    return { error: error.message }
  }
}

export async function uploadDokumen(pegawaiId: string, payload: any, file: File) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    if (!file || file.size === 0) {
      return { error: "File dokumen kosong atau tidak valid" }
    }

    // Hanya Pegawai bersangkutan, HRD, dan SUPERADMIN yang boleh upload
    const userRole = (session.user as any).role
    if (userRole === "PEGAWAI") {
      const pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id }
      })
      if (pegawai?.id !== pegawaiId) {
        return { error: "Akses ditolak. Anda tidak bisa mengupload dokumen untuk pegawai lain." }
      }
    }

    const pegawai = await prisma.pegawai.findUnique({ where: { id: pegawaiId } })
    if (!pegawai) return { error: "Pegawai tidak ditemukan" }

    // Upload ke Vercel Blob
    const extension = file.name.split(".").pop()
    const fileName = `dokumen/${pegawai.nik}-${payload.jenisDokumen.replace(/\s+/g, "_")}-${Date.now()}.${extension}`
    
    // Max 5MB Limit Check
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Ukuran file maksimal 5MB" }
    }

    const blob = await put(fileName, file, { access: "public" })

    const newDokumen = await prisma.pegawaiDokumen.create({
      data: {
        pegawaiId,
        namaDokumen: payload.namaDokumen,
        jenisDokumen: payload.jenisDokumen,
        fileUrl: blob.url
      }
    })

    await logAudit({
      action: "CREATE",
      module: "dokumen",
      targetId: newDokumen.id,
      targetName: `Upload Dokumen: ${payload.namaDokumen}`,
      newData: newDokumen as any
    })

    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true, data: newDokumen }

  } catch (error: any) {
    console.error("Gagal mengupload dokumen:", error)
    return { error: error.message }
  }
}

export async function deleteDokumen(id: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const dokumen = await prisma.pegawaiDokumen.findUnique({
      where: { id },
      include: { pegawai: true }
    })

    if (!dokumen) return { error: "Dokumen tidak ditemukan" }

    // Akses kontrol: HRD/Admin atau Pegawai ybs
    const userRole = (session.user as any).role
    if (userRole === "PEGAWAI" && dokumen.pegawai.userId !== session.user.id) {
      return { error: "Akses ditolak" }
    }

    // Delete file from blob storage
    try {
      if (dokumen.fileUrl) await del(dokumen.fileUrl)
    } catch (e) {
      console.warn("Gagal menghapus file blob:", e)
      // Lanjutkan hapus DB meskipun blob gagal (bisa jadi file tdk ada di blob tp ada di DB)
    }

    await prisma.pegawaiDokumen.delete({ where: { id } })

    await logAudit({
      action: "DELETE",
      module: "dokumen",
      targetId: id,
      targetName: `Hapus Dokumen: ${dokumen.namaDokumen}`
    })

    revalidatePath(`/pegawai/${dokumen.pegawaiId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Gagal menghapus dokumen:", error)
    return { error: error.message }
  }
}
