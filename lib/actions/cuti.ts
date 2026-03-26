"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "./audit-log"

export async function getCutiList() {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const whereClause: any = {}
    
    // Jika PEGAWAI biasa, hanya tampilkan cutinya sendiri
    if (session.user.role === "PEGAWAI") {
      const pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id }
      })
      if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }
      whereClause.pegawaiId = pegawai.id
    }

    const cutiList = await prisma.cuti.findMany({
      where: whereClause,
      include: {
        pegawai: {
          include: {
            bidang: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { data: cutiList }
  } catch (error: any) {
    console.error("Gagal mengambil data cuti:", error)
    return { error: error.message }
  }
}

export async function createCuti(payload: any) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }

    // Validasi input wajib
    if (!payload.tanggalMulai || !payload.tanggalSelesai) {
      return { error: "Tanggal mulai dan selesai wajib diisi." }
    }
    if (!payload.alasan || payload.alasan.trim().length < 5) {
      return { error: "Alasan cuti wajib diisi (minimal 5 karakter)." }
    }

    // Hitung durasi hari
    const start = new Date(payload.tanggalMulai)
    const end = new Date(payload.tanggalSelesai)

    // Validasi urutan tanggal
    if (end < start) {
      return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." }
    }

    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (duration < 1) {
      return { error: "Durasi cuti minimal 1 hari." }
    }

    if (duration > pegawai.saldoCuti && payload.jenisCuti === "Cuti Tahunan") {
      return { error: `Saldo cuti tidak mencukupi. Sisa saldo: ${pegawai.saldoCuti} hari.` }
    }

    const newCuti = await prisma.cuti.create({
      data: {
        pegawaiId: pegawai.id,
        tanggalMulai: start,
        tanggalSelesai: end,
        jenisCuti: payload.jenisCuti,
        alasan: payload.alasan,
        status: "PENDING"
      }
    })

    await logAudit({
      action: "CREATE",
      module: "cuti",
      targetId: newCuti.id,
      targetName: `Pengajuan Cuti ${newCuti.jenisCuti}`,
      newData: newCuti as any,
    })
    

    revalidatePath("/cuti")
    return { success: true, data: newCuti }
  } catch (error: any) {
    console.error("Gagal membuat pengajuan cuti:", error)
    return { error: error.message }
  }
}

export async function updateCutiStatus(cutiId: string, newStatus: "APPROVED" | "REJECTED") {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "HRD" && session.user.role !== "SUPERADMIN")) {
      return { error: "Hanya HRD atau Superadmin yang dapat melakukan aksi ini" }
    }

    const cuti = await prisma.cuti.findUnique({
      where: { id: cutiId },
      include: { pegawai: true }
    })

    if (!cuti) return { error: "Data cuti tidak ditemukan" }
    if (cuti.status !== "PENDING") return { error: "Status cuti sudah diproses sebelumnya" }

    if (newStatus === "APPROVED") {
      const start = new Date(cuti.tanggalMulai)
      const end = new Date(cuti.tanggalSelesai)
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // 1. Jika Cuti Tahunan, validasi dan potong saldoCuti
      if (cuti.jenisCuti === "Cuti Tahunan") {
        if (cuti.pegawai.saldoCuti < duration) {
          return { error: "Gagal: Saldo cuti pegawai tidak mencukupi untuk durasi ini." }
        }

        await prisma.pegawai.update({
          where: { id: cuti.pegawaiId },
          data: {
            saldoCuti: cuti.pegawai.saldoCuti - duration
          }
        })
      }

      // 2. Mapping Status Absensi
      let absensiStatus: "CUTI" | "SAKIT" | "IZIN" = "CUTI"
      if (cuti.jenisCuti === "Cuti Sakit") {
        absensiStatus = "SAKIT"
      } else if (cuti.jenisCuti === "Izin Tidak Masuk") {
        absensiStatus = "IZIN"
      }

      // 3. Buat record Absensi otomatis untuk setiap hari kerja
      const currentDate = new Date(cuti.tanggalMulai)
      while (currentDate <= cuti.tanggalSelesai) {
        const dayOfWeek = currentDate.getDay()
        
        // Skip pencatatan absen di hari Sabtu (6) dan Minggu (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const startOfDay = new Date(currentDate)
          startOfDay.setHours(0, 0, 0, 0)
          
          const endOfDay = new Date(currentDate)
          endOfDay.setHours(23, 59, 59, 999)

          const absensiExist = await prisma.absensi.findFirst({
            where: {
              pegawaiId: cuti.pegawaiId,
              tanggal: { gte: startOfDay, lte: endOfDay }
            }
          })

          if (absensiExist) {
            await prisma.absensi.update({
              where: { id: absensiExist.id },
              data: { status: absensiStatus }
            })
          } else {
            await prisma.absensi.create({
              data: {
                pegawaiId: cuti.pegawaiId,
                tanggal: new Date(currentDate),
                status: absensiStatus,
                metode: "MANUAL",
              }
            })
          }
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    const updatedCuti = await prisma.cuti.update({
      where: { id: cutiId },
      data: { status: newStatus }
    })

    await logAudit({
      action: newStatus === "APPROVED" ? "APPROVE" : "REJECT",
      module: "cuti",
      targetId: cutiId,
      targetName: `Status Cuti ${cuti.pegawai.nama}`,
      newData: updatedCuti as any,
    })

    revalidatePath("/cuti")
    return { success: true, data: updatedCuti }
  } catch (error: any) {
    console.error("Gagal mengubah status cuti:", error)
    return { error: error.message }
  }
}

export async function getPegawaiSaldoCuti() {
  try {
    const session = await auth()
    if (!session?.user) return { data: 0 }
    
    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })
    
    return { data: pegawai?.saldoCuti || 0 }
  } catch (e) {
    return { data: 0 }
  }
}
