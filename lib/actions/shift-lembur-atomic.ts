'use server'

// lib/actions/shift-lembur.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "./audit-log"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format } from "date-fns"

// ============================================================
// ======== SHIFT =============================================
// ============================================================

export async function getShiftList() {
  return prisma.shift.findMany({
    orderBy: { kode: "asc" },
    include: { _count: { select: { jadwal: true } } },
  })
}

export async function createShift(data: {
  nama: string
  kode: string
  jamMasuk: string
  jamKeluar: string
  durasiJam: number
  keterangan?: string
}) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }
  try {
    const shift = await prisma.shift.create({ data })
    await logAudit({ action: "CREATE", module: "shift", targetId: shift.id, targetName: shift.nama })
    return { success: true, shift }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "Kode shift sudah ada" }
    return { error: e.message }
  }
}

export async function updateShift(id: string, data: Partial<{
  nama: string; kode: string; jamMasuk: string; jamKeluar: string
  durasiJam: number; keterangan: string; aktif: boolean
}>) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }
  const old = await prisma.shift.findUnique({ where: { id } })
  const shift = await prisma.shift.update({ where: { id }, data })
  await logAudit({ action: "UPDATE", module: "shift", targetId: id, targetName: shift.nama, oldData: old as any, newData: shift as any })
  return { success: true }
}

export async function deleteShift(id: string) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "SUPERADMIN") return { error: "Akses ditolak" }
  const shift = await prisma.shift.findUnique({ where: { id } })
  await prisma.shift.delete({ where: { id } })
  await logAudit({ action: "DELETE", module: "shift", targetId: id, targetName: shift?.nama })
  return { success: true }
}

// ============================================================
// JADWAL SHIFT (assign shift ke pegawai per tanggal/minggu)
// ============================================================

export async function getJadwalMinggu(weekStartStr: string) {
  const weekStart = new Date(weekStartStr)
  const weekEnd = addDays(weekStart, 6)

  const jadwal = await prisma.jadwalShift.findMany({
    where: { tanggal: { gte: weekStart, lte: weekEnd } },
    include: {
      pegawai: { include: { bidang: true } },
      shift: true,
    },
    orderBy: [{ tanggal: "asc" }, { pegawai: { nama: "asc" } }],
  })

  return jadwal
}

export async function assignShift(pegawaiId: string, shiftId: string, tanggal: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }
  const tgl = new Date(tanggal)

  const jadwal = await prisma.jadwalShift.upsert({
    where: { pegawaiId_tanggal: { pegawaiId, tanggal: tgl } },
    update: { shiftId },
    create: { pegawaiId, shiftId, tanggal: tgl },
    include: { pegawai: true, shift: true },
  })

  await logAudit({
    action: "UPDATE",
    module: "shift",
    targetId: jadwal.id,
    targetName: `${jadwal.pegawai.nama} — ${tanggal} — ${jadwal.shift.nama}`,
  })
  return { success: true }
}

export async function hapusJadwalShift(id: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }
  await prisma.jadwalShift.delete({ where: { id } })
  return { success: true }
}

// ============================================================
// ======== LEMBUR ============================================
// ============================================================

export function hitungTarifLembur(gajiPokok: number, tunjangan: number, durasiJam: number, jenisHari: "HARI_KERJA" | "HARI_LIBUR" | "HARI_BESAR"): number {
  const upahSeJam = (gajiPokok + tunjangan) / 173

  if (jenisHari === "HARI_KERJA") {
    if (durasiJam <= 1) return Math.round(upahSeJam * 1.5 * durasiJam)
    return Math.round(upahSeJam * 1.5 + upahSeJam * 2 * (durasiJam - 1))
  } else {
    let total = 0
    for (let jam = 1; jam <= durasiJam; jam++) {
      if (jam <= 7) total += upahSeJam * 2
      else if (jam === 8) total += upahSeJam * 3
      else total += upahSeJam * 4
    }
    return Math.round(total)
  }
}

export async function ajukanLembur(data: {
  pegawaiId: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  durasiJam: number
  jenis: "HARI_KERJA" | "HARI_LIBUR" | "HARI_BESAR"
  alasan: string
}) {
  const session = await auth()
  if (!session?.user) return { error: "Belum login" }

  const pegawai = await prisma.pegawai.findUnique({ where: { id: data.pegawaiId } })
  if (!pegawai) return { error: "Pegawai tidak ditemukan" }

  const tarifPerJam = (Number(pegawai.gajiPokok) + Number(pegawai.tunjangan)) / 173
  const totalBayar = hitungTarifLembur(Number(pegawai.gajiPokok), Number(pegawai.tunjangan), data.durasiJam, data.jenis)

  const lembur = await prisma.lembur.create({
    data: {
      pegawaiId: data.pegawaiId,
      tanggal: new Date(data.tanggal),
      jamMulai: data.jamMulai,
      jamSelesai: data.jamSelesai,
      durasiJam: data.durasiJam,
      jenis: data.jenis,
      alasan: data.alasan,
      tarifPerJam,
      totalBayar,
    },
  })

  await logAudit({
    action: "CREATE",
    module: "lembur",
    targetId: lembur.id,
    targetName: `Lembur ${pegawai.nama} — ${data.tanggal} (${data.durasiJam} jam)`,
  })
  return { success: true, lembur }
}

export async function approveLembur(id: string, approve: boolean, catatan?: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD", "DIREKSI"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }
  const lembur = await prisma.lembur.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      disetujuiOleh: session.user.email!,
      catatan,
    },
    include: { pegawai: true },
  })
  await logAudit({
    action: approve ? "APPROVE" : "REJECT",
    module: "lembur",
    targetId: id,
    targetName: `Lembur ${lembur.pegawai.nama}`,
  })
  return { success: true }
}

export async function getLemburList({
  bulan,
  status,
  pegawaiId,
}: {
  bulan?: string
  status?: string
  pegawaiId?: string
}) {
  const where: any = {}
  if (bulan) {
    const date = new Date(bulan + "-01")
    where.tanggal = { gte: startOfMonth(date), lte: endOfMonth(date) }
  }
  if (status && status !== "all") where.status = status
  if (pegawaiId) where.pegawaiId = pegawaiId

  const data = await prisma.lembur.findMany({
    where,
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { tanggal: "desc" },
  })

  return data.map((l) => ({
    id: l.id,
    nama: l.pegawai.nama,
    nik: l.pegawai.nik,
    unit: l.pegawai.bidang?.nama || "Umum",
    tanggal: format(l.tanggal, "dd MMM yyyy"),
    jamMulai: l.jamMulai,
    jamSelesai: l.jamSelesai,
    durasiJam: l.durasiJam,
    jenis: l.jenis,
    alasan: l.alasan,
    status: l.status,
    tarifPerJam: Number(l.tarifPerJam),
    totalBayar: Number(l.totalBayar),
    disetujuiOleh: l.disetujuiOleh,
    catatan: l.catatan,
  }))
}
