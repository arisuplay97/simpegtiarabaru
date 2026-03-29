'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TingkatPendidikan } from "@prisma/client"

export async function getEmployeeProfile(slugOrId: string) {
  let pegawai = null;

  // 1. Coba cari berdasarkan ID persis
  pegawai = await prisma.pegawai.findUnique({
    where: { id: slugOrId },
    include: {
      bidang: true,
      subBidang: true,
      user: { select: { email: true, role: true } },
      keluarga: { orderBy: { createdAt: 'asc' } },
      pendidikan: { orderBy: { tahunLulus: 'desc' } },
      riwayatJabatan: { orderBy: { tanggalMulai: 'desc' } },
      riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' } },
      pelatihan: { orderBy: { tahun: 'desc' } },
      dokumen: { orderBy: { createdAt: 'desc' } },
      kontrak: { orderBy: { tanggalSelesai: 'desc' } },
    }
  });

  if (!pegawai && slugOrId.includes("-")) {
    // 2. Jika slug mengandung "-", mungkin ID ada di akhir
    const parts = slugOrId.split("-");
    const possibleId = parts[parts.length - 1];
    pegawai = await prisma.pegawai.findUnique({
      where: { id: possibleId },
      include: {
        bidang: true, subBidang: true, user: { select: { email: true, role: true } },
        keluarga: { orderBy: { createdAt: 'asc' } }, pendidikan: { orderBy: { tahunLulus: 'desc' } },
        riwayatJabatan: { orderBy: { tanggalMulai: 'desc' } }, riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' } },
        pelatihan: { orderBy: { tahun: 'desc' } }, dokumen: { orderBy: { createdAt: 'desc' } },
        kontrak: { orderBy: { tanggalSelesai: 'desc' } },
      }
    });
  }

  if (!pegawai) {
    // 3. Fallback: Cari menggunakan nama (replace "-" dengan spasi) mode insensitive
    const possibleName = slugOrId.replace(/-/g, " ");
    pegawai = await prisma.pegawai.findFirst({
      where: { nama: { equals: possibleName, mode: 'insensitive' } },
      include: {
        bidang: true, subBidang: true, user: { select: { email: true, role: true } },
        keluarga: { orderBy: { createdAt: 'asc' } }, pendidikan: { orderBy: { tahunLulus: 'desc' } },
        riwayatJabatan: { orderBy: { tanggalMulai: 'desc' } }, riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' } },
        pelatihan: { orderBy: { tahun: 'desc' } }, dokumen: { orderBy: { createdAt: 'desc' } },
        kontrak: { orderBy: { tanggalSelesai: 'desc' } },
      }
    });
  }

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

// ==== MOBILE PROFILE ====
export async function updateMobileProfile(pegawaiId: string, data: any) {
  try {
    const pegawai = await prisma.pegawai.findUnique({ where: { id: pegawaiId }, select: { userId: true, email: true } })
    if (!pegawai) throw new Error("Pegawai tidak ditemukan")
    
    // Jika email berubah, cek apakah sudah dipakai user lain
    if (data.email && data.email !== pegawai.email) {
      const exist = await prisma.user.findUnique({ where: { email: data.email } })
      if (exist) throw new Error("Email sudah digunakan oleh akun lain")
    }

    await prisma.$transaction(async (tx) => {
      await tx.pegawai.update({
        where: { id: pegawaiId },
        data: {
          nama: data.nama,
          tempatLahir: data.tempatLahir,
          tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
          telepon: data.telepon,
          email: data.email,
        }
      })
      await tx.user.update({
        where: { id: pegawai.userId },
        data: {
          email: data.email
        }
      })
    })

    revalidatePath("/m/profil")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
