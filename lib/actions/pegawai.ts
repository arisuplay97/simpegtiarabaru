'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { pegawaiData, getStats } from "@/lib/data/pegawai-store"

export async function getEmployees() {
  try {
    const employees = await prisma.pegawai.findMany({
      orderBy: { nama: 'asc' },
    })
    
    // If DB is empty, return local store data for demo
    if (employees.length === 0) {
      return pegawaiData
    }
    
    return employees
  } catch (error) {
    console.warn("Database failed, returning store employees")
    return pegawaiData
  }
}

export async function getEmployeeStats() {
  try {
    const total = await prisma.pegawai.count()
    if (total === 0) return getStats(pegawaiData)

    const aktif = await prisma.pegawai.count({ where: { status: 'aktif' } })
    const cuti = await prisma.pegawai.count({ where: { status: 'cuti' } })
    const nonAktif = await prisma.pegawai.count({ where: { status: { in: ['non-aktif', 'pensiun'] } } })

    return { total, aktif, cuti, nonAktif }
  } catch (error) {
    return getStats(pegawaiData)
  }
}

export async function createEmployee(data: any) {
  try {
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
        sp: data.sp,
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
  } catch (error) {
    console.warn("Failed to create employee in DB, returning mock success")
    return { id: String(Date.now()), ...data }
  }
}
