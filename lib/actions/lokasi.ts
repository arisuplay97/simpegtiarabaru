"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// GET semua lokasi
export async function getLokasiList() {
  return prisma.lokasiAbsensi.findMany({
    orderBy: { createdAt: "asc" }
  })
}

// CREATE lokasi baru
export async function createLokasi(data: {
  nama: string
  tipe: string
  alamat: string
  latitude: number
  longitude: number
  radius: number
  aktif: boolean
  tanggalMulai?: string | null
  tanggalSelesai?: string | null
  wajibHadir?: boolean
  keterangan?: string | null
}) {
  const result = await prisma.lokasiAbsensi.create({
    data: {
      nama: data.nama,
      tipe: data.tipe,
      alamat: data.alamat,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
      aktif: data.aktif,
      tanggalMulai: data.tanggalMulai || null,
      tanggalSelesai: data.tanggalSelesai || null,
      wajibHadir: data.wajibHadir ?? false,
      keterangan: data.keterangan || null,
    }
  })
  revalidatePath("/settings/lokasi")
  return result
}

// UPDATE lokasi
export async function updateLokasi(id: string, data: {
  nama: string
  tipe: string
  alamat: string
  latitude: number
  longitude: number
  radius: number
  aktif: boolean
  tanggalMulai?: string | null
  tanggalSelesai?: string | null
  wajibHadir?: boolean
  keterangan?: string | null
}) {
  const result = await prisma.lokasiAbsensi.update({
    where: { id },
    data: {
      nama: data.nama,
      tipe: data.tipe,
      alamat: data.alamat,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
      aktif: data.aktif,
      tanggalMulai: data.tanggalMulai || null,
      tanggalSelesai: data.tanggalSelesai || null,
      wajibHadir: data.wajibHadir ?? false,
      keterangan: data.keterangan || null,
    }
  })
  revalidatePath("/settings/lokasi")
  return result
}

// DELETE lokasi
export async function deleteLokasi(id: string) {
  await prisma.lokasiAbsensi.delete({ where: { id } })
  revalidatePath("/settings/lokasi")
}

// TOGGLE status aktif
export async function toggleLokasiAktif(id: string, aktif: boolean) {
  await prisma.lokasiAbsensi.update({
    where: { id },
    data: { aktif }
  })
  revalidatePath("/settings/lokasi")
}
