'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Pegawai, SuratPeringatan } from "@prisma/client"

export async function getSPList() {
  const allPegawai = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      bidang: true,
      suratPeringatan: {
        orderBy: { tanggalDiberikan: 'desc' }
      }
    },
    orderBy: { nama: 'asc' }
  })

  return allPegawai.map(emp => {
    const sp = emp.suratPeringatan.length > 0 ? emp.suratPeringatan[0] : null
    
    // Determine active SP 
    const now = new Date()
    let isActive = false
    let currentSP: SuratPeringatan | null = null

    if (sp && new Date(sp.tanggalBerakhir) >= now) {
      isActive = true
      currentSP = sp
    }

    return {
      id: emp.id,
      name: emp.nama,
      nik: emp.nik,
      jabatan: emp.jabatan || "-",
      unit: emp.bidang?.nama || "Umum",
      status: isActive ? currentSP!.tingkat : "Tidak Ada SP",
      issuedAt: isActive ? currentSP!.tanggalDiberikan.toISOString().split('T')[0] : "-",
      expiredAt: isActive ? currentSP!.tanggalBerakhir.toISOString().split('T')[0] : "-",
      reason: isActive ? currentSP!.alasan : "Tidak ada catatan pelanggaran aktif",
      spId: isActive ? currentSP!.id : null, 
      // Attach history for detailed view if needed
      history: emp.suratPeringatan
    }
  })
}

export async function getPegawaiForSP() {
  const pegawais = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: { bidang: true },
    orderBy: { nama: 'asc' }
  })

  return pegawais.map(p => ({
    id: p.id,
    name: p.nama,
    nik: p.nik,
    unit: p.bidang?.nama || "Umum"
  }))
}

export async function saveSP(data: {
  spId?: string
  pegawaiId: string
  tingkat: string
  tanggalDiberikan: string
  tanggalBerakhir: string
  alasan: string
}) {
  try {
    if (data.spId) {
       await prisma.suratPeringatan.update({
         where: { id: data.spId },
         data: {
           tingkat: data.tingkat,
           tanggalDiberikan: new Date(data.tanggalDiberikan),
           tanggalBerakhir: new Date(data.tanggalBerakhir),
           alasan: data.alasan,
         }
       })
    } else {
       await prisma.suratPeringatan.create({
         data: {
           pegawaiId: data.pegawaiId,
           tingkat: data.tingkat,
           tanggalDiberikan: new Date(data.tanggalDiberikan),
           tanggalBerakhir: new Date(data.tanggalBerakhir),
           alasan: data.alasan,
         }
       })
    }

    revalidatePath("/sp")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan data Surat Peringatan" }
  }
}

export async function deleteSP(spId: string) {
  try {
    await prisma.suratPeringatan.delete({
      where: { id: spId }
    })
    revalidatePath("/sp")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus data Surat Peringatan" }
  }
}
