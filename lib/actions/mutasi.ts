'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TipeMutasi, StatusMutasi } from "@prisma/client"

export async function getMutasiList() {
  const mutasiList = await prisma.mutasi.findMany({
    include: {
      pegawai: { select: { nama: true, nik: true } },
      approvedBy: { select: { nama: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return mutasiList.map(m => ({
    id: m.id,
    nik: m.pegawai.nik,
    namaPegawai: m.pegawai.nama,
    inisial: (m.pegawai.nama || "P").substring(0, 2).toUpperCase(),
    unitAsal: m.unitAsal,
    jabatanAsal: m.jabatanAsal,
    unitTujuan: m.unitTujuan,
    jabatanTujuan: m.jabatanTujuan,
    type: m.type.toLowerCase() as any, // "mutasi" | "promosi" | "demosi" | "rotasi"
    alasan: m.alasan,
    tanggalPengajuan: m.createdAt.toISOString().split('T')[0],
    tanggalEfektif: m.tanggalEfektif.toISOString().split('T')[0],
    status: m.status.toLowerCase() as any, // "pending" | "approved" | "rejected"
    approvedBy: m.approvedBy?.nama,
    approvedAt: m.updatedAt.toISOString().split('T')[0], 
    catatanApproval: m.catatan || "",
    nomorSK: m.nomorSK || "",
    pegawaiId: m.pegawaiId
  }))
}

export async function saveMutasi(data: {
  pegawaiId: string
  type: string
  unitTujuan: string
  jabatanTujuan: string
  alasan: string
  tanggalEfektif: string
}) {
  try {
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: data.pegawaiId },
      include: { bidang: true }
    })

    if (!pegawai) throw new Error("Pegawai tidak ditemukan")

    // Map the string type to the enum
    let mappedType: TipeMutasi = "MUTASI"
    if (data.type === "promosi") mappedType = "PROMOSI"
    if (data.type === "demosi") mappedType = "DEMOSI"
    if (data.type === "rotasi") mappedType = "ROTASI"

    await prisma.mutasi.create({
      data: {
        pegawaiId: pegawai.id,
        type: mappedType,
        jabatanAsal: pegawai.jabatan || "-",
        unitAsal: pegawai.bidang?.nama || "-",
        jabatanTujuan: data.jabatanTujuan,
        unitTujuan: data.unitTujuan,
        alasan: data.alasan,
        tanggalEfektif: new Date(data.tanggalEfektif),
        status: "PENDING",
      }
    })

    revalidatePath("/mutasi")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan Mutasi" }
  }
}

export async function processMutasi(id: string, isApprove: boolean, approverId: string, catatan?: string, nomorSK?: string) {
  try {
    const status: StatusMutasi = isApprove ? "APPROVED" : "REJECTED"

    await prisma.$transaction(async (tx) => {
      const updated = await tx.mutasi.update({
        where: { id },
        data: {
          status,
          approvedById: approverId,
          catatan,
          nomorSK
        }
      })

      // Jika diapprove, update data pegawai terkait unit/jabatan? 
      // Untuk HRIS nyata, ini dilakukan saat tanggal efektif.
      // Namun krn ini simulasi, kita bisa lgsung update
      if (isApprove) {
        // Find bidang id dari unit tujuan
        const bidangTarget = await tx.bidang.findFirst({
          where: { nama: updated.unitTujuan }
        })

        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: {
            jabatan: updated.jabatanTujuan,
            bidangId: bidangTarget?.id || null 
            // Jika bidang target ngga ketemu, kita set yg lama / keep null sesuai behavior HRIS sederhana
          }
        })
      }
    })

    revalidatePath("/mutasi")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses Mutasi" }
  }
}

export async function deleteMutasi(id: string) {
  try {
     await prisma.mutasi.delete({
       where: { id }
     })
     revalidatePath("/mutasi")
     return { success: true }
  } catch(error:any) {
     return { error: error.message || "Gagal menghapus Mutasi" }
  }
}
