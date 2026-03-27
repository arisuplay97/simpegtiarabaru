'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

// Parameter Poin (Bisa disesuaikan atau diambil dari Pengaturan nanti)
const POIN = {
  HADIR_TEPAT: 10,
  HADIR_TELAT: 3,
  PULANG_CEPAT: -2,
  LEMBUR: 5,
  ALPA: -10,
  SP1: -50,
  SP2: -100,
  SP3: -200,
}

// Helper untuk menghitung poin 1 pegawai dalam rentang waktu tertentu
export async function calculatePegawaiPoints(pegawaiId: string, startDate: Date, endDate: Date) {
  try {
    // 1. Hitung poin dari Absensi
    const absensi = await prisma.absensi.findMany({
      where: {
        pegawaiId,
        tanggal: { gte: startDate, lte: endDate }
      }
    })

    let earnedPoints = 0
    let detailPoin = {
      hadirTepat: 0,
      hadirTelat: 0,
      pulangCepat: 0,
      alpa: 0,
      lembur: 0,
      sp: 0
    }

    // Perlu tahu jam pulang standar untuk cek pulang cepat
    const pengaturan = await (prisma as any).pengaturan.findUnique({ where: { id: "1" } })
    const jamPulangSetting = pengaturan?.jamPulang || "17:00"
    const [pjh, pjm] = jamPulangSetting.split(":").map(Number)

    for (const abs of absensi) {
      if (abs.status === "HADIR") {
        earnedPoints += POIN.HADIR_TEPAT
        detailPoin.hadirTepat++
      } else if (abs.status === "TERLAMBAT") {
        earnedPoints += POIN.HADIR_TELAT
        detailPoin.hadirTelat++
      } else if (abs.status === "ALPA") {
        earnedPoints += POIN.ALPA
        detailPoin.alpa++
      }

      // Cek pulang cepat
      if (abs.jamKeluar && (abs.status === "HADIR" || abs.status === "TERLAMBAT")) {
        let jh = 0, jm = 0
        if (typeof abs.jamKeluar === 'string' && (abs.jamKeluar as string).includes(':')) {
          const parts = (abs.jamKeluar as string).split(':')
          jh = Number(parts[0])
          jm = Number(parts[1])
        } else if (abs.jamKeluar instanceof Date) {
          jh = abs.jamKeluar.getHours()
          jm = abs.jamKeluar.getMinutes()
        }
        
        if (jh < pjh || (jh === pjh && jm < pjm)) {
          earnedPoints += POIN.PULANG_CEPAT
          detailPoin.pulangCepat++
        }
      }
    }

    // 2. Hitung poin dari Lembur (Asumsi status APPROVED = dihitung)
    const lembur = await (prisma as any).lembur.count({
      where: {
        pegawaiId,
        status: "APPROVED",
        tanggal: { gte: startDate, lte: endDate }
      }
    })
    earnedPoints += (lembur * POIN.LEMBUR)
    detailPoin.lembur = lembur

    // 3. Hitung penalti dari SP
    const suratPeringatan = await (prisma as any).suratPeringatan.findMany({
      where: {
        pegawaiId,
        tanggalDiberikan: { gte: startDate, lte: endDate }
      }
    })
    
    suratPeringatan.forEach((sp: any) => {
      if (sp.jenis === "SP1") earnedPoints += POIN.SP1
      if (sp.jenis === "SP2") earnedPoints += POIN.SP2
      if (sp.jenis === "SP3") earnedPoints += POIN.SP3
      detailPoin.sp++
    })

    // 4. Hitung Poin yang sudah ditukar (Redeemed) 
    // Redeem point akumulatif, tidak dibatasi rentang waktu untuk saldo saat ini, 
    // TAPI jika ini untuk hitung "Score Bulan Ini", redeem tidak usah dihitung.
    // Jika untuk total ALL TIME saldo, redeem dihitung.
    
    // Kita buat logic: Total Pencapaian vs Saldo Sisa.
    // getTopPegawaiLeaderboard butuh "Total Pencapaian", bukan saldo.
    
    return {
      success: true,
      totalEarned: earnedPoints,
      detail: detailPoin
    }

  } catch (error) {
    console.error("Error calculatePegawaiPoints:", error)
    return { success: false, totalEarned: 0, detail: {} }
  }
}

// Dapatkan Sisa Saldo Poin Pegawai (All Time)
export async function getSaldoPoinPegawai(pegawaiId: string) {
  const allTimeStart = new Date("2000-01-01")
  const allTimeEnd = new Date("2099-12-31")
  
  const earned = await calculatePegawaiPoints(pegawaiId, allTimeStart, allTimeEnd)
  
  const penukaran = await (prisma as any).penukaranPoin.aggregate({
    where: { 
      pegawaiId,
      status: { in: ["PENDING", "APPROVED"] } 
    },
    _sum: {
      jumlahPoin: true
    }
  })

  const spentPoints = penukaran._sum.jumlahPoin || 0
  const saldo = (earned.totalEarned || 0) - spentPoints

  return {
    saldo,
    totalEarned: earned.totalEarned,
    spent: spentPoints
  }
}

// Ambil Top 5 Leaderboard Pegawai (Bulan Ini atau Tahun Ini)
export async function getTopPegawaiLeaderboard(period: "month" | "year") {
  try {
    const now = new Date()
    const startDate = period === "month" ? startOfMonth(now) : startOfYear(now)
    const endDate = period === "month" ? endOfMonth(now) : endOfYear(now)

    // Ambil semua pegawai aktif
    const pegawais = await prisma.pegawai.findMany({
      where: { status: "AKTIF" },
      select: { id: true, nama: true, jabatan: true, fotoUrl: true, bidang: { select: { nama: true } } }
    })

    const leaderboard = await Promise.all(
      pegawais.map(async (p) => {
        const points = await calculatePegawaiPoints(p.id, startDate, endDate)
        return {
          ...p,
          points: points.totalEarned || 0,
          bidang: p.bidang?.nama || "Umum"
        }
      })
    )

    // Sort descending and limit 5
    const top5 = leaderboard
      .sort((a, b) => b.points - a.points)
      // filter yang punya poin > 0 untuk relevansi
      // .filter(p => p.points > 0) 
      .slice(0, 5)

    return top5
  } catch (error) {
    console.error("Error getTopPegawaiLeaderboard:", error)
    return []
  }
}

// Riwayat Penukaran Poin Pegawai
export async function getRiwayatPenukaranPoin(pegawaiId?: string) {
  try {
    const whereClause = pegawaiId ? { pegawaiId } : {}
    return await (prisma as any).penukaranPoin.findMany({
      where: whereClause,
      include: {
        pegawai: { select: { nama: true, jabatan: true } },
        approvedBy: { select: { nama: true } }
      },
      orderBy: { tanggal: 'desc' }
    })
  } catch (error) {
    return []
  }
}

// Ajukan Penukaran Poin (Oleh Pegawai/HRD)
export async function ajukanPenukaranPoin(data: { pegawaiId: string, jumlahPoin: number, keteranganItem: string }) {
  try {
    // Cek saldo dulu
    const rek = await getSaldoPoinPegawai(data.pegawaiId)
    if (rek.saldo < data.jumlahPoin) {
      return { error: `Saldo Poin tidak cukup. Saldo Anda: ${rek.saldo}` }
    }

    await (prisma as any).penukaranPoin.create({
      data: {
        pegawaiId: data.pegawaiId,
        jumlahPoin: data.jumlahPoin,
        keteranganItem: data.keteranganItem,
        status: "PENDING"
      }
    })

    revalidatePath("/reward")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan penukaran poin" }
  }
}

// Proses Penukaran Poin (Oleh HRD/Admin)
export async function prosesPenukaranPoin(id: string, status: "APPROVED" | "REJECTED") {
  try {
    const session = await auth()
    if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
      return { error: "Akses ditolak" }
    }

    const adminStr = session.user.email
    const admin = await prisma.user.findUnique({ where: { email: adminStr! }, include: { pegawai: true } })

    await (prisma as any).penukaranPoin.update({
      where: { id },
      data: {
        status,
        approvedById: admin?.pegawai?.id
      }
    })

    revalidatePath("/reward")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses penukaran" }
  }
}
