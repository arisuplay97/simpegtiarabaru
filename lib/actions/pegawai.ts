'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getEmployees() {
  return await prisma.pegawai.findMany({
    include: {
      user: true
    },
    orderBy: {
      nama: 'asc'
    }
  })
}

export async function getEmployeeStats() {
  const total = await prisma.pegawai.count()
  const aktif = await prisma.pegawai.count({ where: { status: 'aktif' } })
  const cuti = await prisma.pegawai.count({ where: { status: 'cuti' } })
  const nonAktif = await prisma.pegawai.count({ where: { status: { in: ['non-aktif', 'pensiun'] } } })

  return { total, aktif, cuti, nonAktif }
}

export async function createEmployee(data: any) {
  const employee = await prisma.pegawai.create({
    data: {
      nama: data.nama,
      nip: data.nik, // Using NIK for NIP as per requirements
      email: data.email,
      jabatan: data.jabatan,
      golongan: data.golongan,
      pangkat: data.pangkat || '-',
      unitKerja: data.unitKerja,
      status: data.status,
      tanggalMasuk: new Date(data.tanggalMasuk),
      user: {
        create: {
          email: data.email,
          password: data.password || '123456', // Default password
          role: data.role || 'PEGAWAI'
        }
      }
    }
  })
  revalidatePath('/pegawai')
  return employee
}
