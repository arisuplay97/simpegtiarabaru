"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * Simpan face descriptor (128-float array) ke tabel Pegawai
 */
export async function saveFaceDescriptor(descriptor: number[]) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return { error: "Tidak terautentikasi" }

  try {
    const pegawai = await prisma.pegawai.findUnique({ where: { userId } })
    if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }

    await prisma.pegawai.update({
      where: { id: pegawai.id },
      data: {
        faceDescriptor: descriptor,
        faceRegistered: true,
        faceFailCount: 0,
      }
    })

    return { success: true }
  } catch (e: any) {
    return { error: "Gagal menyimpan data wajah: " + e.message }
  }
}

/**
 * Ambil face descriptor dan status registrasi dari session user yang login
 */
export async function getMyFaceStatus() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return null

  const pegawai = await prisma.pegawai.findUnique({
    where: { userId },
    select: {
      id: true,
      faceRegistered: true,
      faceDescriptor: true,
      faceFailCount: true,
    }
  })
  return pegawai
}

/**
 * Ambil face descriptor milik pegawai berdasarkan pegawaiId (untuk verifikasi server-side)
 */
export async function getFaceDescriptorByPegawaiId(pegawaiId: string) {
  const p = await prisma.pegawai.findUnique({
    where: { id: pegawaiId },
    select: { faceDescriptor: true, faceRegistered: true }
  })
  return p
}

/**
 * Increment face fail count
 */
export async function incrementFaceFailCount(pegawaiId: string) {
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { faceFailCount: { increment: 1 } }
  })
}

/**
 * Reset face fail count (dipanggil saat absen berhasil)
 */
export async function resetFaceFailCount(pegawaiId: string) {
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { faceFailCount: 0 }
  })
}

/**
 * Approve absensi pending oleh HRD
 */
export async function approvePendingAbsensi(absensiId: string) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!["HRD", "SUPERADMIN"].includes(role)) return { error: "Akses ditolak" }

  try {
    const hrdPegawai = await prisma.pegawai.findUnique({
      where: { userId: (session?.user as any).id },
      select: { id: true }
    })

    await prisma.absensi.update({
      where: { id: absensiId },
      data: {
        pendingApproval: false,
        status: "HADIR" as any,
        approvedById: hrdPegawai?.id || null,
        approvedAt: new Date(),
      }
    })
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

/**
 * Reject absensi pending → menjadi ALPA
 */
export async function rejectPendingAbsensi(absensiId: string) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!["HRD", "SUPERADMIN"].includes(role)) return { error: "Akses ditolak" }

  try {
    await prisma.absensi.update({
      where: { id: absensiId },
      data: {
        pendingApproval: false,
        status: "ALPA" as any,
      }
    })
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

/**
 * Get semua absensi yang pending approval (untuk dashboard HRD)
 */
export async function getPendingAbsensiList() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!["HRD", "SUPERADMIN"].includes(role)) return []

  return prisma.absensi.findMany({
    where: { pendingApproval: true },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { createdAt: "desc" }
  })
}
