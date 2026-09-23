'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TipeMutasi, StatusMutasi } from "@prisma/client"
import { logAudit } from "./audit-log"

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

    const result = await prisma.mutasi.create({
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

    await logAudit({
      action: "CREATE",
      module: "mutasi",
      targetId: result.id,
      targetName: `Mutasi ${pegawai.nama}`,
      newData: result as any
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

    // Resolve approver pegawai ID safely (if User.id or Pegawai.id is passed)
    let actualApproverId: string | null = null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (approverId && uuidRegex.test(approverId.trim())) {
      const cleanId = approverId.trim()
      const pDirect = await prisma.pegawai.findUnique({ where: { id: cleanId }, select: { id: true } })
      if (pDirect) {
        actualApproverId = pDirect.id
      } else {
        const pByUser = await prisma.pegawai.findUnique({ where: { userId: cleanId }, select: { id: true } })
        if (pByUser) {
          actualApproverId = pByUser.id
        }
      }
    }

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const updated = await tx.mutasi.update({
        where: { id },
        data: {
          status,
          approvedById: actualApproverId,
          catatan,
          nomorSK
        }
      })

      if (isApprove) {
        // Find bidang id dari unit tujuan secara case-insensitive
        const cleanUnit = (updated.unitTujuan || "").trim()
        const bidangTarget = await tx.bidang.findFirst({
          where: {
            nama: { equals: cleanUnit, mode: 'insensitive' }
          }
        })

        // Auto update tipeJabatan jika relevan
        let newTipeJabatan: any = undefined
        const lowJab = updated.jabatanTujuan.toLowerCase()
        if (lowJab.includes("kepala bidang") || lowJab.includes("kabid")) newTipeJabatan = "KEPALA_BIDANG"
        else if (lowJab.includes("kepala cabang") || lowJab.includes("kacab")) newTipeJabatan = "KEPALA_CABANG"
        else if (lowJab.includes("kasubbid") || lowJab.includes("kepala sub")) {
          newTipeJabatan = lowJab.includes("cabang") ? "KASUBBID_CABANG" : "KASUBBID"
        } else if (lowJab.includes("cabang")) {
          newTipeJabatan = "STAFF_CABANG"
        }

        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: {
            jabatan: updated.jabatanTujuan,
            ...(bidangTarget ? { bidangId: bidangTarget.id } : {}),
            ...(newTipeJabatan ? { tipeJabatan: newTipeJabatan } : {})
          }
        })

        // Otomatis catat ke Riwayat Jabatan
        await tx.pegawaiJabatan.updateMany({
          where: {
            pegawaiId: updated.pegawaiId,
            tanggalSelesai: null
          },
          data: {
            tanggalSelesai: updated.tanggalEfektif
          }
        })

        await tx.pegawaiJabatan.create({
          data: {
            pegawaiId: updated.pegawaiId,
            jabatan: updated.jabatanTujuan,
            unitDefinitif: updated.unitTujuan,
            tanggalMulai: updated.tanggalEfektif,
            tanggalSelesai: null
          }
        })
      }

      return updated
    })

    await logAudit({
      action: isApprove ? "APPROVE" : "REJECT",
      module: "mutasi",
      targetId: id,
      targetName: `Proses Mutasi ${id}`,
    })

    revalidatePath("/mutasi")
    revalidatePath(`/pegawai/${updatedRecord.pegawaiId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses Mutasi" }
  }
}

export async function deleteMutasi(id: string) {
  try {
     const old = await prisma.mutasi.findUnique({ where: { id } })
     await prisma.mutasi.delete({
       where: { id }
     })

     await logAudit({
       action: "DELETE",
       module: "mutasi",
       targetId: id,
       targetName: `Hapus Mutasi ${old?.pegawaiId || id}`,
       oldData: old as any
     })

     revalidatePath("/mutasi")
     return { success: true }
  } catch(error:any) {
     return { error: error.message || "Gagal menghapus Mutasi" }
  }
}
