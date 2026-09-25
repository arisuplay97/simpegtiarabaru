"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "./audit-log"
import { hitungIndeksPegawai } from "./indeks"

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

// Helper validasi UUID agar tidak error Prisma jika approverId bukan UUID (e.g. akun demo 'demo-1'/'demo-2')
function toValidUUID(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(val.trim()) ? val.trim() : null
}

// ============ PROCESS KOREKSI (approve/reject) — dipanggil dari approval.ts ============
export async function processKoreksiAbsensi(
  id: string, 
  isApprove: boolean, 
  approverId: string,
  catatan?: string
) {
  // Fetch koreksi data outside transaction for validation
  const koreksi = await (prisma as any).koreksiAbsensi.findUnique({
    where: { id },
    include: { pegawai: true }
  })

  if (!koreksi) throw new Error("Data koreksi absensi tidak ditemukan")
  if (koreksi.status !== "PENDING") throw new Error("Koreksi ini sudah diproses sebelumnya")

  // Resolve approver ID: valid UUID string atau null jika non-UUID (e.g. demo account)
  let validApproverId: string | null = toValidUUID(approverId)
  if (!validApproverId && approverId) {
    try {
      const u = await prisma.user.findFirst({
        where: {
          OR: [
            { username: approverId },
            { email: approverId },
          ]
        },
        select: { id: true }
      })
      if (u?.id && toValidUUID(u.id)) {
        validApproverId = u.id
      }
    } catch (_) {}
  }

  if (isApprove) {
    // Gunakan $transaction agar status koreksi dan update absensi ATOMIK
    // Jika salah satu gagal, semua di-rollback
    await prisma.$transaction(async (tx) => {
      // 1. Update status koreksi -> APPROVED
      await (tx as any).koreksiAbsensi.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: validApproverId,
          approvedAt: new Date(),
          catatanApprover: catatan || null,
        }
      })

      // 2. Update record Absensi
      const tanggalStr = new Date(koreksi.tanggal).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
      const startOfDay = new Date(`${tanggalStr}T00:00:00+08:00`)
      const endOfDay = new Date(`${tanggalStr}T23:59:59.999+08:00`)
      // Also check exact UTC midnight match (how absensi.ts stores tanggal)
      const targetDateDb = new Date(`${tanggalStr}T00:00:00.000Z`)

      let absensi = await tx.absensi.findFirst({
        where: {
          pegawaiId: koreksi.pegawaiId,
          OR: [
            { tanggal: { gte: startOfDay, lte: endOfDay } },
            { tanggal: targetDateDb },
          ]
        }
      })

      const sesiList: string[] = Array.isArray(koreksi.sesi) ? koreksi.sesi : [koreksi.sesi]

      // Jam default tepat waktu pada tanggal absensi yang dikoreksi (WITA UTC+8)
      const jamMasukTepatWaktu = new Date(`${tanggalStr}T07:45:00+08:00`)
      const jamSiangStandar = new Date(`${tanggalStr}T12:15:00+08:00`)
      const jamPulangStandar = new Date(`${tanggalStr}T17:05:00+08:00`)

      // Tentukan status kehadiran:
      // - IZIN_SESI: status IZIN
      // - LUPA_ABSEN / DINAS_LUAR / ERROR_SISTEM / LAINNYA: status HADIR ("Tepat Waktu")
      const targetStatus: "HADIR" | "IZIN" = koreksi.jenis === "IZIN_SESI" ? "IZIN" : "HADIR"

      if (absensi) {
        // Update sesi yang dikoreksi pada record yang sudah ada
        const updateData: any = {
          status: targetStatus,
        }
        
        for (const sesi of sesiList) {
          if (sesi === "MASUK") {
            updateData.jamMasuk = absensi.jamMasuk && absensi.status === "HADIR" ? absensi.jamMasuk : jamMasukTepatWaktu
          }
          if (sesi === "SIANG") {
            updateData.jamSiang = absensi.jamSiang || jamSiangStandar
          }
          if (sesi === "PULANG") {
            updateData.jamKeluar = absensi.jamKeluar || jamPulangStandar
          }
        }

        await tx.absensi.update({
          where: { id: absensi.id },
          data: updateData
        })
      } else {
        // Buat record absensi baru dengan sesi yang dikoreksi
        const createData: any = {
          pegawaiId: koreksi.pegawaiId,
          tanggal: targetDateDb,
          status: targetStatus,
          metode: "MANUAL",
        }

        for (const sesi of sesiList) {
          if (sesi === "MASUK") createData.jamMasuk = jamMasukTepatWaktu
          if (sesi === "SIANG") createData.jamSiang = jamSiangStandar
          if (sesi === "PULANG") createData.jamKeluar = jamPulangStandar
        }

        await tx.absensi.create({ data: createData })
      }
    })

    // Otomatis hitung ulang indeks disiplin pegawai agar skor langsung berubah realtime
    try {
      const d = new Date(koreksi.tanggal)
      hitungIndeksPegawai(koreksi.pegawaiId, d.getMonth() + 1, d.getFullYear()).catch(() => {})
    } catch (_) {}

    // Notifikasi ke pegawai (di luar transaction, boleh gagal tanpa rollback)
    try {
      if (koreksi.pegawai.userId) {
        const sesiList: string[] = Array.isArray(koreksi.sesi) ? koreksi.sesi : [koreksi.sesi]
        const tanggalStr = new Date(koreksi.tanggal).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
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
        approvedById: validApproverId,
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
  revalidatePath("/m/dashboard")
  revalidatePath("/dashboard")

  return { success: true }
}
