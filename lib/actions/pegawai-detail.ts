'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TingkatPendidikan } from "@prisma/client"

export async function getEmployeeProfile(pegawaiId: string) {
  const pegawai = await prisma.pegawai.findUnique({
    where: { id: pegawaiId },
    include: {
      bidang: true,
      user: { select: { email: true, role: true } },
      keluarga: { orderBy: { createdAt: 'asc' } },
      pendidikan: { orderBy: { tahunLulus: 'desc' } },
      riwayatJabatan: { orderBy: { tanggalMulai: 'desc' } },
      riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' } },
      pelatihan: { orderBy: { tahun: 'desc' } },
      dokumen: { orderBy: { createdAt: 'desc' } },
    }
  })

  return pegawai
}

// ==== KELUARGA ====
export async function addKeluarga(pegawaiId: string, data: any) {
  try {
    await prisma.pegawaiKeluarga.create({
      data: {
        pegawaiId,
        nama: data.nama,
        hubungan: data.hubungan,
        pekerjaan: data.pekerjaan,
        telepon: data.telepon
      }
    })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteKeluarga(id: string, pegawaiId: string) {
  try {
    await prisma.pegawaiKeluarga.delete({ where: { id } })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ==== PENDIDIKAN ====
export async function addPendidikan(pegawaiId: string, data: any) {
  try {
    await prisma.pegawaiPendidikan.create({
      data: {
        pegawaiId,
        tingkat: data.tingkat as TingkatPendidikan,
        institusi: data.institusi,
        jurusan: data.jurusan,
        tahunLulus: data.tahunLulus
      }
    })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deletePendidikan(id: string, pegawaiId: string) {
  try {
    await prisma.pegawaiPendidikan.delete({ where: { id } })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ==== JABATAN ====
export async function addRiwayatJabatan(pegawaiId: string, data: any) {
  try {
    await prisma.pegawaiJabatan.create({
      data: {
        pegawaiId,
        jabatan: data.jabatan,
        unitDefinitif: data.unitDefinitif,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : null
      }
    })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteRiwayatJabatan(id: string, pegawaiId: string) {
  try {
    await prisma.pegawaiJabatan.delete({ where: { id } })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ==== PANGKAT ====
export async function addRiwayatPangkat(pegawaiId: string, data: any) {
  try {
    await prisma.pegawaiPangkat.create({
      data: {
        pegawaiId,
        pangkat: data.pangkat,
        golongan: data.golongan,
        tanggalBerlaku: new Date(data.tanggalBerlaku),
        nomorSK: data.nomorSK
      }
    })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteRiwayatPangkat(id: string, pegawaiId: string) {
  try {
    await prisma.pegawaiPangkat.delete({ where: { id } })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ==== PELATIHAN ====
export async function addPelatihan(pegawaiId: string, data: any) {
  try {
    await prisma.pegawaiPelatihan.create({
      data: {
        pegawaiId,
        namaPelatihan: data.namaPelatihan,
        penyelenggara: data.penyelenggara,
        tahun: data.tahun
      }
    })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deletePelatihan(id: string, pegawaiId: string) {
  try {
    await prisma.pegawaiPelatihan.delete({ where: { id } })
    revalidatePath(`/pegawai/${pegawaiId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
