'use server'

// lib/actions/kontrak.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "./audit-log"
import { createNotification } from "./notifikasi"
import { differenceInDays, format, addDays, isBefore, isAfter } from "date-fns"
import { id as localeId } from "date-fns/locale"

// ============================================================
// GET SEMUA KONTRAK
// ============================================================
export async function getKontrakList({
  tipe,
  status,
  search,
  expiringSoon, // true = tampilkan yang akan habis dalam 14 hari
}: {
  tipe?: string
  status?: string
  search?: string
  expiringSoon?: boolean
} = {}) {
  const session = await auth()
  if (!session?.user) return { error: "Belum login" }

  const where: any = {}
  if (tipe && tipe !== "all") where.tipe = tipe
  if (status && status !== "all") where.status = status
  if (search) {
    where.OR = [
      { pegawai: { nama: { contains: search, mode: "insensitive" } } },
      { pegawai: { nik: { contains: search, mode: "insensitive" } } },
      { nomorKontrak: { contains: search, mode: "insensitive" } },
      { posisi: { contains: search, mode: "insensitive" } },
    ]
  }
  if (expiringSoon) {
    const today = new Date()
    const limitDate = addDays(today, 14)
    where.tanggalSelesai = { gte: today, lte: limitDate }
    where.status = "AKTIF"
  }

  const data = await prisma.kontrak.findMany({
    where,
    include: {
      pegawai: {
        include: { bidang: true },
      },
    },
    orderBy: { tanggalSelesai: "asc" },
  })

  const today = new Date()

  return {
    data: data.map((k: any) => {
      const sisaHari = differenceInDays(new Date(k.tanggalSelesai), today)
      const durasiTotal = differenceInDays(new Date(k.tanggalSelesai), new Date(k.tanggalMulai))
      const sudahBerjalan = differenceInDays(today, new Date(k.tanggalMulai))
      const persentase = Math.min(100, Math.max(0, Math.round((sudahBerjalan / durasiTotal) * 100)))

      return {
        id: k.id,
        pegawaiId: k.pegawaiId,
        nama: k.pegawai.nama,
        nik: k.pegawai.nik,
        foto: k.pegawai.fotoUrl,
        unit: k.pegawai.bidang?.nama || k.unitKerja,
        tipe: k.tipe,
        nomorKontrak: k.nomorKontrak,
        posisi: k.posisi,
        unitKerja: k.unitKerja,
        tanggalMulai: format(new Date(k.tanggalMulai), "dd MMM yyyy", { locale: localeId }),
        tanggalSelesai: format(new Date(k.tanggalSelesai), "dd MMM yyyy", { locale: localeId }),
        tanggalMulaiRaw: k.tanggalMulai,
        tanggalSelesaiRaw: k.tanggalSelesai,
        durasiHari: k.durasiHari,
        sisaHari,
        persentase,
        gajiKontrak: Number(k.gajiKontrak),
        tunjangan: Number(k.tunjangan),
        status: k.status,
        keterangan: k.keterangan,
        diperpanjangDari: k.diperpanjangDari,
        isExpiringSoon: sisaHari <= 14 && sisaHari >= 0 && k.status === "AKTIF",
        isExpired: sisaHari < 0 && k.status === "AKTIF",
      }
    }),
  }
}

// ============================================================
// GET STATISTIK KONTRAK (untuk summary cards)
// ============================================================
export async function getKontrakStats() {
  const today = new Date()
  const limit14 = addDays(today, 14)

  const [totalAktif, totalPKWT, totalMagang, expiringSoon, selesaibulanIni] = await Promise.all([
    prisma.kontrak.count({ where: { status: "AKTIF" } }),
    prisma.kontrak.count({ where: { status: "AKTIF", tipe: "PKWT" } }),
    prisma.kontrak.count({ where: { status: "AKTIF", tipe: "MAGANG" } }),
    prisma.kontrak.count({
      where: { status: "AKTIF", tanggalSelesai: { gte: today, lte: limit14 } },
    }),
    prisma.kontrak.count({
      where: {
        status: "AKTIF",
        tanggalSelesai: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lte: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        },
      },
    }),
  ])

  return { totalAktif, totalPKWT, totalMagang, expiringSoon, selesaibulanIni }
}

// ============================================================
// BUAT KONTRAK BARU
// ============================================================
export async function createKontrak(data: {
  pegawaiId: string
  tipe: "PKWT" | "MAGANG"
  nomorKontrak?: string
  tanggalMulai: string
  tanggalSelesai: string
  posisi: string
  unitKerja: string
  gajiKontrak?: number
  tunjangan?: number
  keterangan?: string
}) {
  const session = await (auth() as any)
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const mulai = new Date(data.tanggalMulai)
  const selesai = new Date(data.tanggalSelesai)

  if (isAfter(mulai, selesai)) {
    return { error: "Tanggal mulai tidak boleh setelah tanggal selesai" }
  }

  const durasiHari = differenceInDays(selesai, mulai)

  try {
    const kontrak = await prisma.kontrak.create({
      data: {
        pegawaiId: data.pegawaiId,
        tipe: data.tipe,
        nomorKontrak: data.nomorKontrak,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        durasiHari,
        posisi: data.posisi,
        unitKerja: data.unitKerja,
        gajiKontrak: data.gajiKontrak || 0,
        tunjangan: data.tunjangan || 0,
        keterangan: data.keterangan,
        status: "AKTIF",
      },
      include: { pegawai: true },
    })

    // Notifikasi ke HRD/SUPERADMIN
    const admins = await prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "HRD"] } },
    })
    for (const admin of admins) {
      await createNotification(
        admin.id,
        `Kontrak Baru: ${kontrak.pegawai.nama}`,
        `${data.tipe} ${kontrak.pegawai.nama} — ${data.posisi} | Berakhir: ${format(selesai, "dd MMM yyyy", { locale: localeId })}`,
        "/kontrak"
      )
    }

    await logAudit({
      action: "CREATE",
      module: "kontrak",
      targetId: kontrak.id,
      targetName: `Kontrak ${data.tipe} — ${kontrak.pegawai.nama}`,
      newData: data as any,
    })

    revalidatePath("/kontrak")
    return { success: true, kontrak }
  } catch (e: any) {
    return { error: e.message || "Gagal membuat kontrak" }
  }
}

// ============================================================
// PERPANJANG KONTRAK
// ============================================================
export async function perpanjangKontrak(
  kontrakId: string,
  data: {
    tanggalMulai: string
    tanggalSelesai: string
    gajiKontrak?: number
    tunjangan?: number
    keterangan?: string
  }
) {
  const session = await (auth() as any)
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const kontrakLama = await prisma.kontrak.findUnique({
    where: { id: kontrakId },
    include: { pegawai: true },
  })
  if (!kontrakLama) return { error: "Kontrak tidak ditemukan" }

  const mulai = new Date(data.tanggalMulai)
  const selesai = new Date(data.tanggalSelesai)
  const durasiHari = differenceInDays(selesai, mulai)

  try {
    // Update kontrak lama → DIPERPANJANG
    await prisma.kontrak.update({
      where: { id: kontrakId },
      data: { status: "DIPERPANJANG" },
    })

    // Buat kontrak baru
    const kontrakBaru = await prisma.kontrak.create({
      data: {
        pegawaiId: kontrakLama.pegawaiId,
        tipe: kontrakLama.tipe,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        durasiHari,
        posisi: kontrakLama.posisi,
        unitKerja: kontrakLama.unitKerja,
        gajiKontrak: data.gajiKontrak || Number(kontrakLama.gajiKontrak),
        tunjangan: data.tunjangan || Number(kontrakLama.tunjangan),
        status: "AKTIF",
        diperpanjangDari: kontrakId,
        keterangan: data.keterangan,
      },
    })

    await logAudit({
      action: "UPDATE",
      module: "kontrak",
      targetId: kontrakId,
      targetName: `Perpanjang Kontrak — ${kontrakLama.pegawai.nama}`,
    })

    revalidatePath("/kontrak")
    return { success: true, kontrakBaru }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ============================================================
// SELESAIKAN / BATALKAN KONTRAK
// ============================================================
export async function updateStatusKontrak(
  id: string,
  status: "SELESAI" | "DIBATALKAN",
  keterangan?: string
) {
  const session = await (auth() as any)
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const kontrak = await prisma.kontrak.update({
    where: { id },
    data: { status, keterangan },
    include: { pegawai: true },
  })

  await logAudit({
    action: "UPDATE",
    module: "kontrak",
    targetId: id,
    targetName: `${status} Kontrak — ${kontrak.pegawai.nama}`,
  })

  revalidatePath("/kontrak")
  return { success: true }
}

// ============================================================
// CRON: CEK KONTRAK YANG AKAN HABIS (panggil dari API route/cron)
// Kirim notifikasi 14 hari sebelum habis
// ============================================================
export async function cekReminderKontrak() {
  const today = new Date()
  const limit14 = addDays(today, 14)
  const limit7 = addDays(today, 7)

  // Kontrak aktif yang akan habis dalam 14 hari & belum dapat reminder
  const kontrakExpiring = await prisma.kontrak.findMany({
    where: {
      status: "AKTIF",
      tanggalSelesai: { gte: today, lte: limit14 },
      reminder14Sent: false,
    },
    include: { pegawai: { include: { user: true } } },
  })

  const admins = await prisma.user.findMany({
    where: { role: { in: ["SUPERADMIN", "HRD"] } },
  })

  for (const kontrak of kontrakExpiring) {
    const sisaHari = differenceInDays(new Date(kontrak.tanggalSelesai), today)
    const tglSelesai = format(new Date(kontrak.tanggalSelesai), "dd MMMM yyyy", { locale: localeId })

    // Notifikasi ke admin/HRD
    for (const admin of admins) {
      await createNotification(
        admin.id,
        `⚠️ Kontrak Akan Habis: ${kontrak.pegawai.nama}`,
        `Kontrak ${kontrak.tipe} ${kontrak.pegawai.nama} akan berakhir dalam ${sisaHari} hari (${tglSelesai}). Segera tindak lanjuti.`,
        "/kontrak"
      )
    }

    // Tandai sudah kirim reminder
    await prisma.kontrak.update({
      where: { id: kontrak.id },
      data: { reminder14Sent: true },
    })
  }

  // Auto-update status ke SELESAI jika sudah lewat tanggal selesai
  await prisma.kontrak.updateMany({
    where: {
      status: "AKTIF",
      tanggalSelesai: { lt: today },
    },
    data: { status: "SELESAI" },
  })

  return { processed: kontrakExpiring.length }
}

// ============================================================
// GET PEGAWAI UNTUK DROPDOWN (yang belum punya kontrak aktif / tipe kontrak)
// ============================================================
export async function getPegawaiUntukKontrak() {
  const session = await (auth() as any)
  if (!session?.user) return []

  // Filter: hanya tampilkan pegawai yang bertipe jabatan KONTRAK (non-PNS/Tetap)
  // tipeJabatan = "KONTRAK" artinya pegawai kontrak / PKWT / magang
  const pegawai = await prisma.pegawai.findMany({
    where: { 
      status: "AKTIF",
      tipeJabatan: "KONTRAK"
    },
    include: { bidang: { select: { nama: true } } },
    orderBy: { nama: "asc" },
  })

  return pegawai.map((p: any) => ({
    id: p.id,
    nama: p.nama,
    nik: p.nik,
    jabatan: p.jabatan,
    unit: p.bidang?.nama || "-",
  }))
}
