"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "./audit-log"

// ============ TYPES ============
export type SesiAbsensiType = "MASUK" | "SIANG" | "PULANG"
export type JenisKoreksiType = "LUPA_ABSEN" | "IZIN_SESI" | "DINAS_LUAR" | "ERROR_SISTEM" | "LAINNYA"

export interface KoreksiAbsensiPayload {
  tanggal: string           // YYYY-MM-DD
  sesi: SesiAbsensiType[]   // bisa multi-sesi
  jenis: JenisKoreksiType
  alasan: string
  fotoUrl?: string | null
}

// ============ GET ABSENSI STATUS FOR A DATE ============
// Digunakan oleh mobile untuk menampilkan sesi mana yang sudah/belum terisi
export async function getAbsensiStatusByDate(tanggalStr: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })
    if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }

    const targetDate = new Date(`${tanggalStr}T00:00:00.000Z`)
    const startOfDay = new Date(`${tanggalStr}T00:00:00+08:00`)
    const endOfDay = new Date(`${tanggalStr}T23:59:59.999+08:00`)

    const absensi = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // Cek apakah sudah ada koreksi pending/approved untuk tanggal ini
    const existingKoreksi = await (prisma as any).koreksiAbsensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "APPROVED"] }
      }
    })

    return {
      data: {
        absensi: absensi ? {
          id: absensi.id,
          status: absensi.status,
          jamMasuk: absensi.jamMasuk,
          jamSiang: absensi.jamSiang,
          jamKeluar: absensi.jamKeluar,
        } : null,
        existingKoreksi: existingKoreksi ? {
          id: existingKoreksi.id,
          sesi: existingKoreksi.sesi,
          jenis: existingKoreksi.jenis,
          status: existingKoreksi.status,
          alasan: existingKoreksi.alasan,
        } : null
      }
    }
  } catch (error: any) {
    console.error("Error getAbsensiStatusByDate:", error)
    return { error: error.message }
  }
}

// ============ CREATE KOREKSI ABSENSI ============
export async function createKoreksiAbsensi(payload: KoreksiAbsensiPayload) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id }
    })
    if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }

    // Validasi input
    if (!payload.tanggal) return { error: "Tanggal wajib diisi." }
    if (!payload.sesi || payload.sesi.length === 0) return { error: "Pilih minimal 1 sesi absensi." }
    if (!payload.jenis) return { error: "Jenis koreksi wajib dipilih." }
    if (!payload.alasan || payload.alasan.trim().length < 5) return { error: "Alasan wajib diisi (minimal 5 karakter)." }

    // Validasi tanggal: maks 7 hari ke belakang
    const now = new Date()
    const witaDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
    const todayWita = new Date(`${witaDateStr}T00:00:00+08:00`)
    const targetDate = new Date(`${payload.tanggal}T00:00:00+08:00`)
    
    const diffDays = Math.floor((todayWita.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { error: "Tidak dapat mengajukan koreksi untuk tanggal yang belum berlalu." }
    if (diffDays > 7) return { error: "Koreksi absensi hanya dapat diajukan untuk maksimal 7 hari terakhir." }

    // Cek duplikat (sudah ada koreksi pending/approved untuk tanggal yang sama)
    const startOfDay = new Date(`${payload.tanggal}T00:00:00+08:00`)
    const endOfDay = new Date(`${payload.tanggal}T23:59:59.999+08:00`)

    const existingKoreksi = await (prisma as any).koreksiAbsensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "APPROVED"] }
      }
    })

    if (existingKoreksi) {
      if (existingKoreksi.status === "PENDING") {
        return { error: "Sudah ada pengajuan koreksi untuk tanggal ini yang masih menunggu persetujuan." }
      }
      if (existingKoreksi.status === "APPROVED") {
        return { error: "Koreksi untuk tanggal ini sudah disetujui sebelumnya." }
      }
    }

    // Cari record absensi untuk tanggal tersebut (jika ada)
    const absensi = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // Simpan ke database
    const koreksi = await (prisma as any).koreksiAbsensi.create({
      data: {
        pegawaiId: pegawai.id,
        absensiId: absensi?.id || null,
        tanggal: new Date(`${payload.tanggal}T00:00:00.000Z`),
        sesi: payload.sesi,
        jenis: payload.jenis,
        alasan: payload.alasan.trim(),
        fotoUrl: payload.fotoUrl || null,
        status: "PENDING",
      }
    })

    // Kirim notifikasi ke HRD
    try {
      const hrdUsers = await prisma.user.findMany({
        where: { role: { in: ["HRD", "SUPERADMIN"] } },
        select: { id: true }
      })

      const sesiLabel = payload.sesi.map(s => 
        s === "MASUK" ? "Pagi" : s === "SIANG" ? "Siang" : "Pulang"
      ).join(", ")

      for (const hrd of hrdUsers) {
        await prisma.notifikasi.create({
          data: {
            userId: hrd.id,
            title: "Pengajuan Koreksi Absensi Baru 📝",
            message: `${pegawai.nama} mengajukan koreksi absensi sesi ${sesiLabel} untuk tanggal ${payload.tanggal}.`,
            link: "/approval"
          }
        })
      }
    } catch (_) {}

    await logAudit({
      action: "CREATE",
      module: "koreksi_absensi",
      targetId: koreksi.id,
      targetName: `Koreksi ${pegawai.nama} - ${payload.tanggal}`,
      newData: koreksi,
    })

    revalidatePath("/m/koreksi-absensi")
    revalidatePath("/approval")

    return { success: true, data: koreksi }
  } catch (error: any) {
    console.error("Error createKoreksiAbsensi:", error)
    return { error: error.message || "Gagal mengajukan koreksi absensi." }
  }
}

// ============ GET KOREKSI LIST (untuk pegawai / admin) ============
export async function getKoreksiAbsensiList() {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Belum login" }

    const whereClause: any = {}

    // PEGAWAI biasa hanya melihat miliknya sendiri
    if (session.user.role === "PEGAWAI") {
      const pegawai = await prisma.pegawai.findUnique({
        where: { userId: session.user.id }
      })
      if (!pegawai) return { error: "Profil pegawai tidak ditemukan" }
      whereClause.pegawaiId = pegawai.id
    }

    const list = await (prisma as any).koreksiAbsensi.findMany({
      where: whereClause,
      include: {
        pegawai: {
          include: { bidang: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: list }
  } catch (error: any) {
    console.error("Error getKoreksiAbsensiList:", error)
    return { error: error.message }
  }
}

// ============ PROCESS KOREKSI (approve/reject) — dipanggil dari approval.ts ============
export async function processKoreksiAbsensi(
  id: string, 
  isApprove: boolean, 
  approverId: string,
  catatan?: string
) {
  try {
    const koreksi = await (prisma as any).koreksiAbsensi.findUnique({
      where: { id },
      include: { pegawai: true }
    })

    if (!koreksi) throw new Error("Data koreksi absensi tidak ditemukan")
    if (koreksi.status !== "PENDING") throw new Error("Koreksi ini sudah diproses sebelumnya")

    if (isApprove) {
      // Update status koreksi
      await (prisma as any).koreksiAbsensi.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: approverId,
          approvedAt: new Date(),
          catatanApprover: catatan || null,
        }
      })

      // Update record Absensi
      const tanggalStr = koreksi.tanggal.toISOString().split("T")[0]
      const startOfDay = new Date(`${tanggalStr}T00:00:00+08:00`)
      const endOfDay = new Date(`${tanggalStr}T23:59:59.999+08:00`)

      let absensi = await prisma.absensi.findFirst({
        where: {
          pegawaiId: koreksi.pegawaiId,
          tanggal: { gte: startOfDay, lte: endOfDay }
        }
      })

      const now = new Date()
      const sesiList: string[] = koreksi.sesi

      // Tentukan status absensi berdasarkan jenis koreksi
      let targetStatus: "HADIR" | "IZIN" = "HADIR"
      if (koreksi.jenis === "IZIN_SESI") {
        targetStatus = "IZIN"
      }

      if (absensi) {
        // Update sesi yang dikoreksi pada record yang sudah ada
        const updateData: any = {}
        
        for (const sesi of sesiList) {
          if (sesi === "MASUK" && !absensi.jamMasuk) {
            updateData.jamMasuk = now
          }
          if (sesi === "SIANG" && !absensi.jamSiang) {
            updateData.jamSiang = now
          }
          if (sesi === "PULANG" && !absensi.jamKeluar) {
            updateData.jamKeluar = now
          }
        }

        // Jika IZIN_SESI, ubah status ke IZIN
        if (koreksi.jenis === "IZIN_SESI") {
          updateData.status = "IZIN"
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.absensi.update({
            where: { id: absensi.id },
            data: updateData
          })
        }
      } else {
        // Buat record absensi baru dengan sesi yang dikoreksi
        const createData: any = {
          pegawaiId: koreksi.pegawaiId,
          tanggal: new Date(`${tanggalStr}T00:00:00.000Z`),
          status: targetStatus,
          metode: "MANUAL",
        }

        for (const sesi of sesiList) {
          if (sesi === "MASUK") createData.jamMasuk = now
          if (sesi === "SIANG") createData.jamSiang = now
          if (sesi === "PULANG") createData.jamKeluar = now
        }

        await prisma.absensi.create({ data: createData })
      }

      // Notifikasi ke pegawai
      try {
        if (koreksi.pegawai.userId) {
          const sesiLabel = sesiList.map((s: string) => 
            s === "MASUK" ? "Pagi" : s === "SIANG" ? "Siang" : "Pulang"
          ).join(", ")

          await prisma.notifikasi.create({
            data: {
              userId: koreksi.pegawai.userId,
              title: "Koreksi Absensi Disetujui ✅",
              message: `Pengajuan koreksi absensi sesi ${sesiLabel} untuk tanggal ${tanggalStr} telah disetujui.`,
              link: "/m/koreksi-absensi"
            }
          })
        }
      } catch (_) {}

    } else {
      // REJECT
      await (prisma as any).koreksiAbsensi.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedById: approverId,
          approvedAt: new Date(),
          catatanApprover: catatan || null,
        }
      })

      // Notifikasi penolakan
      try {
        if (koreksi.pegawai.userId) {
          const tanggalStr = koreksi.tanggal.toISOString().split("T")[0]
          await prisma.notifikasi.create({
            data: {
              userId: koreksi.pegawai.userId,
              title: "Koreksi Absensi Ditolak ❌",
              message: `Pengajuan koreksi absensi tanggal ${tanggalStr} ditolak.${catatan ? ` Catatan: ${catatan}` : ""}`,
              link: "/m/koreksi-absensi"
            }
          })
        }
      } catch (_) {}
    }

    revalidatePath("/approval")
    revalidatePath("/absensi")
    revalidatePath("/m/koreksi-absensi")

    return { success: true }
  } catch (error: any) {
    console.error("Error processKoreksiAbsensi:", error)
    return { error: error.message || "Gagal memproses koreksi absensi." }
  }
}
