'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TingkatPendidikan } from "@prisma/client"
import { normalizeGolonganKey } from "@/lib/utils"

export async function getEmployeeProfile(slugOrId: string) {
  if (!slugOrId) return null;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const includeDetail = {
    bidang: true,
    subBidang: true,
    user: { select: { email: true, role: true } },
    keluarga: { orderBy: { createdAt: 'asc' as const } },
    pendidikan: { orderBy: { tahunLulus: 'desc' as const } },
    riwayatJabatan: { orderBy: { tanggalMulai: 'desc' as const } },
    riwayatPangkatDetail: { orderBy: { tanggalBerlaku: 'desc' as const } },
    pelatihan: { orderBy: { tahun: 'desc' as const } },
    dokumen: { orderBy: { createdAt: 'desc' as const } },
    kontrak: { orderBy: { tanggalSelesai: 'desc' as const } },
  };

  try {
    let pegawai = null;

    // 1. Coba cari berdasarkan ID persis (jika format UUID valid)
    if (UUID_REGEX.test(slugOrId)) {
      pegawai = await prisma.pegawai.findUnique({
        where: { id: slugOrId },
        include: includeDetail,
      });
    }

    // 2. Jika slug mengandung "-", mungkin ID ada di akhir
    if (!pegawai && slugOrId.includes("-")) {
      const parts = slugOrId.split("-");
      const possibleId = parts[parts.length - 1];
      if (UUID_REGEX.test(possibleId)) {
        pegawai = await prisma.pegawai.findUnique({
          where: { id: possibleId },
          include: includeDetail,
        });
      }
    }

    // 3. Fallback: Cari menggunakan nama (replace "-" dengan spasi) mode insensitive
    if (!pegawai) {
      let possibleName = slugOrId;
      try {
        possibleName = decodeURIComponent(slugOrId);
      } catch {}
      possibleName = possibleName.replace(/-/g, " ").trim();

      pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { nama: { equals: possibleName, mode: 'insensitive' } },
            { nama: { contains: possibleName, mode: 'insensitive' } },
          ],
        },
        include: includeDetail,
      });
    }

    return pegawai;
  } catch (err) {
    console.error("Error in getEmployeeProfile:", err);
    return null;
  }
}

/**
 * Versi ringan untuk halaman profil mobile.
 * Hanya mengambil data dasar + bidang/subBidang (tanpa keluarga, pendidikan, riwayat, dll).
 * Menggabungkan 2 panggilan (/api/pegawai/me + getEmployeeProfile) jadi 1 server action.
 */
export async function getMobileProfile() {
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  if (!session?.user?.id) return null

  const pegawai = await prisma.pegawai.findUnique({
    where: { userId: session.user.id },
    include: {
      bidang: true,
      subBidang: true,
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
    const tanggalBerlaku = new Date(data.tanggalBerlaku)

    await prisma.$transaction(async (tx) => {
      // 1. Tambah riwayat pangkat baru
      await tx.pegawaiPangkat.create({
        data: {
          pegawaiId,
          pangkat: data.pangkat,
          golongan: data.golongan,
          tanggalBerlaku,
          nomorSK: data.nomorSK
        }
      })

      // 2. Cari riwayat pangkat dengan tanggal berlaku paling baru
      const latest = await tx.pegawaiPangkat.findFirst({
        where: { pegawaiId },
        orderBy: { tanggalBerlaku: 'desc' }
      })

      // Jika riwayat yang baru diinput adalah yang paling baru (atau sama tanggalnya)
      if (latest && latest.tanggalBerlaku.getTime() <= tanggalBerlaku.getTime()) {
        const normGol = normalizeGolonganKey(data.golongan)
        
        // Cari standar gaji untuk golongan / pangkat ini
        const standardSalary = await (tx as any).standarGajiPangkat.findFirst({
          where: {
            OR: [
              { golongan: data.golongan },
              { golongan: normGol },
              { pangkat: data.pangkat }
            ]
          }
        })

        const updateData: any = {
          pangkat: data.pangkat,
          golongan: data.golongan
        }

        if (standardSalary) {
          updateData.gajiPokok = standardSalary.gajiPokok
          if (Number(standardSalary.tunjangan) > 0) {
            updateData.tunjangan = standardSalary.tunjangan
          }
        }

        await tx.pegawai.update({
          where: { id: pegawaiId },
          data: updateData
        })
      }
    })

    revalidatePath(`/pegawai/${pegawaiId}`)
    revalidatePath("/kenaikan-pangkat")
    revalidatePath("/kgb")
    revalidatePath("/payroll")
    revalidatePath("/pegawai")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteRiwayatPangkat(id: string, pegawaiId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.pegawaiPangkat.delete({ where: { id } })

      // Cari sisa riwayat pangkat paling baru
      const remainingLatest = await tx.pegawaiPangkat.findFirst({
        where: { pegawaiId },
        orderBy: { tanggalBerlaku: 'desc' }
      })

      if (remainingLatest) {
        await tx.pegawai.update({
          where: { id: pegawaiId },
          data: {
            pangkat: remainingLatest.pangkat,
            golongan: remainingLatest.golongan
          }
        })
      }
    })

    revalidatePath(`/pegawai/${pegawaiId}`)
    revalidatePath("/kenaikan-pangkat")
    revalidatePath("/kgb")
    revalidatePath("/payroll")
    revalidatePath("/pegawai")
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
          telepon: data.telepon || null,
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
