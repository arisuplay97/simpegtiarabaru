'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getKGBData() {
  const now = new Date()
  
  // Ambil semua pegawai aktif beserta riwayat KGB
  const allPegawai = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      bidang: true,
      kgb: {
        orderBy: { tanggalBerlaku: 'desc' },
      }
    },
    orderBy: { nama: 'asc' }
  })

  const eligibleKGB: any[] = []
  const riwayatKGB: any[] = []

  for (const emp of allPegawai) {
    // Cari KGB approved terakhir jika ada
    const lastApprovedKgb = emp.kgb.find(k => k.status === "APPROVED")
    
    // TMT Gaji Terakhir = tanggalBerlaku KGB approved terakhir, atau tanggalMasuk, atau fallback ke createdAt/now
    const tmtGajiTerakhir = lastApprovedKgb?.tanggalBerlaku || emp.tanggalMasuk || emp.createdAt || now
    
    // KGB berikutnya = TMT Gaji Terakhir + 2 tahun (730 hari)
    const eligibleDate = new Date(tmtGajiTerakhir)
    eligibleDate.setFullYear(eligibleDate.getFullYear() + 2)

    const diffTime = eligibleDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const gajiPokokSaatIni = Number(emp.gajiPokok || 0)
    
    // Kenaikan standar BUMD / reguler rata-rata 4.5%
    const kenaikanPersen = 4.5
    let gajiPokokBaru = Math.round(gajiPokokSaatIni * (1 + (kenaikanPersen / 100)))
    if (gajiPokokSaatIni === 0) gajiPokokBaru = 3200000

    // Masa Kerja Golongan (MKG) dalam tahun
    const baseDateForMkg = emp.tanggalMasuk || emp.createdAt || now
    const mkgInMs = now.getTime() - baseDateForMkg.getTime()
    const mkg = Math.max(0, Math.floor(mkgInMs / (1000 * 60 * 60 * 24 * 365.25)))

    const hasPending = emp.kgb.some(k => k.status === "PENDING")
    
    // Kriteria Eligible:
    // 1. Sudah melewati atau kurang dari 60 hari menuju 2 tahun sejak TMT terakhir
    // 2. Belum ada pengajuan PENDING
    const isEligible = diffDays <= 60 && !hasPending

    if (isEligible) {
      eligibleKGB.push({
        pegawaiId: emp.id,
        nik: emp.nik,
        nama: emp.nama,
        jabatan: emp.jabatan || "-",
        unit: emp.bidang?.nama || "Umum",
        golongan: emp.golongan || "-",
        gajiPokokSaatIni,
        gajiPokokBaru,
        kenaikan: gajiPokokBaru - gajiPokokSaatIni,
        persentase: kenaikanPersen,
        mkg,
        mkgBaru: mkg + 2,
        tmtGajiTerakhir: tmtGajiTerakhir.toISOString().split('T')[0],
        eligibleDate: eligibleDate.toISOString().split('T')[0],
        sisaHari: diffDays,
        isOverdue: diffDays < 0,
        status: diffDays <= 0 ? "overdue" : "eligible",
        nilaiKinerja: 85 + (emp.nik.charCodeAt(emp.nik.length - 1) % 10),
      })
    }

    // Riwayat pengajuan KGB pegawai ini
    for (const k of emp.kgb) {
      riwayatKGB.push({
        id: k.id,
        pegawaiId: emp.id,
        nama: emp.nama,
        nik: emp.nik,
        jabatan: emp.jabatan || "-",
        golongan: emp.golongan || "-",
        unit: emp.bidang?.nama || "Umum",
        tmtLama: tmtGajiTerakhir.toISOString().split('T')[0],
        tmtBaru: k.tanggalBerlaku.toISOString().split('T')[0],
        gajiLama: Number(k.gajiPokokLama),
        gajiBaru: Number(k.gajiPokokBaru),
        selisih: Number(k.gajiPokokBaru) - Number(k.gajiPokokLama),
        status: k.status,
        tanggalPengajuan: k.createdAt.toISOString().split('T')[0],
        keterangan: k.keterangan || ""
      })
    }
  }

  // Sort riwayat dari yang paling baru
  riwayatKGB.sort((a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime())

  return {
    eligible: eligibleKGB,
    riwayat: riwayatKGB
  }
}

// ==== PENGAJUAN KGB ==== 
export async function ajukanKGB(data: {
  pegawaiId: string
  tanggalBerlaku: string
  gajiPokokLama: number
  gajiPokokBaru: number
  catatan?: string
  nomorSurat?: string
}) {
  try {
    const kgb = await prisma.kGB.create({
      data: {
        pegawaiId: data.pegawaiId,
        tanggalBerlaku: new Date(data.tanggalBerlaku),
        gajiPokokLama: data.gajiPokokLama,
        gajiPokokBaru: data.gajiPokokBaru,
        keterangan: data.catatan || (data.nomorSurat ? `No Pengantar: ${data.nomorSurat}` : null),
        status: "PENDING"
      },
      include: {
        pegawai: true
      }
    })

    // Kirim notifikasi ke HRD & Direksi
    try {
      const hrdUsers = await prisma.user.findMany({
        where: { role: { in: ["HRD", "SUPERADMIN", "DIREKSI"] } }
      })
      for (const u of hrdUsers) {
        await prisma.notifikasi.create({
          data: {
            userId: u.id,
            title: `Pengajuan KGB: ${kgb.pegawai.nama}`,
            message: `Pengajuan Kenaikan Gaji Berkala untuk ${kgb.pegawai.nama} (TMT: ${data.tanggalBerlaku}) menunggu persetujuan.`,
            link: "/kgb"
          }
        })
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi KGB:", notifErr)
    }

    revalidatePath("/kgb")
    return { success: true, data: kgb }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan KGB" }
  }
}

// ==== APPROVE / REJECT KGB ====
export async function updateStatusKGB(id: string, isApprove: boolean, catatanReview?: string) {
  try {
    const status = isApprove ? "APPROVED" : "REJECTED"
    
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.kGB.findUnique({
        where: { id },
        include: {
          pegawai: {
            include: { user: true, bidang: true }
          }
        }
      })

      if (!current) throw new Error("Data pengajuan KGB tidak ditemukan")

      const updated = await tx.kGB.update({
        where: { id },
        data: {
          status,
          keterangan: catatanReview ? `${current.keterangan ? current.keterangan + ' | ' : ''}Review: ${catatanReview}` : current.keterangan
        },
        include: {
          pegawai: {
            include: { user: true, bidang: true }
          }
        }
      })

      if (isApprove) {
        // Update gaji pokok pegawai di database
        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: {
            gajiPokok: updated.gajiPokokBaru
          }
        })
      }

      return updated
    })

    // Kirim notifikasi ke pegawai bersangkutan
    try {
      const aksiLabel = isApprove ? "disetujui ✅" : "ditolak ❌"
      if (result.pegawai.userId) {
        await prisma.notifikasi.create({
          data: {
            userId: result.pegawai.userId,
            title: `Kenaikan Gaji Berkala ${isApprove ? "Disetujui" : "Ditolak"}`,
            message: `Pengajuan KGB Anda menjadi Rp ${Number(result.gajiPokokBaru).toLocaleString("id-ID")} telah ${aksiLabel} oleh Direksi.`,
            link: "/kgb"
          }
        })
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi KGB ke pegawai:", notifErr)
    }

    revalidatePath("/kgb")
    revalidatePath("/payroll")
    revalidatePath(`/pegawai/${result.pegawaiId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses aksi KGB" }
  }
}
