'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const daftarPangkat = [
  { id: 1, nama: "Juru Muda", golongan: "A/I" },
  { id: 2, nama: "Juru Muda Tingkat I", golongan: "B/I" },
  { id: 3, nama: "Juru", golongan: "C/I" },
  { id: 4, nama: "Juru Tingkat I", golongan: "D/I" },
  { id: 5, nama: "Pengatur Muda", golongan: "A/II" },
  { id: 6, nama: "Pengatur Muda Tingkat I", golongan: "B/II" },
  { id: 7, nama: "Pengatur", golongan: "C/II" },
  { id: 8, nama: "Pengatur Tingkat I", golongan: "D/II" },
  { id: 9, nama: "Penata Muda", golongan: "A/III" },
  { id: 10, nama: "Penata Muda Tingkat I", golongan: "B/III" },
  { id: 11, nama: "Penata", golongan: "C/III" },
  { id: 12, nama: "Penata Tingkat I", golongan: "D/III" },
  { id: 13, nama: "Pembina", golongan: "A/IV" },
  { id: 14, nama: "Pembina Tingkat I", golongan: "B/IV" },
  { id: 15, nama: "Pembina Utama Muda", golongan: "C/IV" },
  { id: 16, nama: "Pembina Utama Madya", golongan: "D/IV" },
  { id: 17, nama: "Pembina Utama", golongan: "E/IV" },
]

export async function getPangkatData() {
  const pegawais = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      bidang: true,
      riwayatPangkat: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { nama: 'asc' }
  })

  const now = new Date()
  const eligiblePangkat = []
  const riwayatPangkat = []

  for (const emp of pegawais) {
    if (!emp.tanggalMasuk) continue;
    
    const lastPangkat = emp.riwayatPangkat.length > 0 ? emp.riwayatPangkat[0] : null
    
    // TMT Pangkat Terakhir adalah either the last approved promotion or their join date
    const tmtPangkatTerakhir = (lastPangkat?.status === "APPROVED") 
      ? lastPangkat.tanggalBerlaku 
      : emp.tanggalMasuk

    const masaKerjaMs = now.getTime() - tmtPangkatTerakhir.getTime()
    const diffDays = Math.ceil((tmtPangkatTerakhir.getTime() + (4 * 365.25 * 24 * 60 * 60 * 1000) - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Eligible if 4 years have passed since last promotion
    const isEligibleTime = diffDays <= 60 

    const currentLabel = emp.pangkat || "Juru Muda"
    const currentGolongan = emp.golongan || "A/I"
    const currentIndex = daftarPangkat.findIndex(p => p.golongan === currentGolongan || p.nama === currentLabel)
    
    let pangkatBaru = "-"
    let golonganBaru = "-"
    
    if (currentIndex !== -1 && currentIndex < daftarPangkat.length - 1) {
      pangkatBaru = daftarPangkat[currentIndex + 1].nama
      golonganBaru = daftarPangkat[currentIndex + 1].golongan
    }

    const hasPending = emp.riwayatPangkat.some((k: any) => k.status === "PENDING")

    // Hanya masukkan ke eligible kalau belum ada yg pending, ada jenjang karir selanjutnya, dan waktunya masuk
    if (isEligibleTime && !hasPending && currentIndex !== -1 && currentIndex < daftarPangkat.length - 1) {
      eligiblePangkat.push({
        pegawaiId: emp.id,
        nama: emp.nama,
        nik: emp.nik,
        jabatan: emp.jabatan || "-",
        unit: emp.bidang?.nama || "Umum",
        golonganSaatIni: currentGolongan,
        pangkatSaatIni: currentLabel,
        golonganBaru,
        pangkatBaru,
        tmtPangkat: tmtPangkatTerakhir.toISOString().split('T')[0],
        masaKerja: `${Math.floor(masaKerjaMs / (1000 * 60 * 60 * 24 * 365.25))} tahun`,
        eligibleDate: new Date(tmtPangkatTerakhir.getTime() + (4 * 365.25 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        sisaHari: diffDays < 0 ? 0 : diffDays,
        nilaiKinerja: 85 + Math.floor(Math.random() * 10), // mock performance
      })
    }

    // Riwayat pengajuan pangkat
    for (const p of emp.riwayatPangkat) {
      riwayatPangkat.push({
        id: p.id,
        pegawaiId: emp.id,
        nama: emp.nama,
        nik: emp.nik,
        unit: emp.bidang?.nama || "Umum",
        tmtBaru: p.tanggalBerlaku.toISOString().split('T')[0],
        pangkatLama: p.pangkatLama,
        golonganLama: p.golonganLama,
        pangkatBaru: p.pangkatBaru,
        golonganBaru: p.golonganBaru,
        status: p.status,
        tanggalPengajuan: p.createdAt.toISOString().split('T')[0],
        keterangan: p.keterangan || "",
      })
    }
  }

  return {
    eligible: eligiblePangkat,
    riwayat: riwayatPangkat
  }
}

// ==== PENGAJUAN PANGKAT ====
export async function ajukanPangkat(data: any) {
  try {
    const pangkat = await prisma.kenaikanPangkat.create({
      data: {
        pegawaiId: data.pegawaiId,
        tanggalBerlaku: new Date(data.tanggalBerlaku),
        pangkatLama: data.pangkatLama,
        golonganLama: data.golonganLama,
        pangkatBaru: data.pangkatBaru,
        golonganBaru: data.golonganBaru,
        keterangan: data.keterangan || null,
        status: "PENDING"
      }
    })
    revalidatePath("/kenaikan-pangkat")
    return { success: true, data: pangkat }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan kenaikan pangkat" }
  }
}

// ==== APPROVE / REJECT PANGKAT ====
export async function updateStatusPangkat(id: string, isApprove: boolean) {
  try {
    const status = isApprove ? "APPROVED" : "REJECTED"

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.kenaikanPangkat.update({
        where: { id },
        data: { status },
        include: {
          pegawai: {
            include: {
              user: true,
              bidang: true
            }
          }
        }
      })

      if (isApprove) {
        // 1. Update pangkat & golongan pegawai
        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: {
            pangkat: updated.pangkatBaru,
            golongan: updated.golonganBaru
          }
        })

        // 2. Buat record Mutasi berjenis PROMOSI agar muncul di modul Promosi
        //    (gunakan pegawaiId sendiri sebagai approvedById karena self-promotion by admin)
        await tx.mutasi.create({
          data: {
            pegawaiId: updated.pegawaiId,
            type: "PROMOSI",
            jabatanAsal: updated.pegawai.jabatan,
            unitAsal: updated.pegawai.bidang?.nama || "Umum",
            jabatanTujuan: updated.pegawai.jabatan, // jabatan tetap, hanya pangkat yang naik
            unitTujuan: updated.pegawai.bidang?.nama || "Umum",
            alasan: `Kenaikan Pangkat dari ${updated.pangkatLama} (${updated.golonganLama}) ke ${updated.pangkatBaru} (${updated.golonganBaru})`,
            tanggalEfektif: updated.tanggalBerlaku,
            status: "APPROVED",
            catatan: updated.keterangan || "Disetujui oleh Direksi"
          }
        })
      }

      return updated
    })

    // 3. Kirim notifikasi ke semua User ber-role HRD dan ke pegawai yg bersangkutan
    //    (Di luar transaction agar tidak blocking)
    try {
      const aksiLabel = isApprove ? "disetujui" : "ditolak"
      const pegawaiNama = result.pegawai.nama

      // Notifikasi untuk pegawai itu sendiri
      if (result.pegawai.userId) {
        await prisma.notifikasi.create({
          data: {
            userId: result.pegawai.userId,
            title: `Kenaikan Pangkat ${isApprove ? "Disetujui ✅" : "Ditolak ❌"}`,
            message: `Pengajuan kenaikan pangkat Anda ke ${result.pangkatBaru} (${result.golonganBaru}) telah ${aksiLabel} oleh Direksi.`,
            link: "/kenaikan-pangkat"
          }
        })
      }

      // Notifikasi ke semua HRD
      const hrdUsers = await prisma.user.findMany({
        where: { role: "HRD" }
      })
      for (const hrdUser of hrdUsers) {
        await prisma.notifikasi.create({
          data: {
            userId: hrdUser.id,
            title: `Kenaikan Pangkat ${pegawaiNama} ${isApprove ? "Disetujui" : "Ditolak"}`,
            message: `Direksi telah ${aksiLabel} kenaikan pangkat ${pegawaiNama} ke ${result.pangkatBaru} (${result.golonganBaru}).`,
            link: "/kenaikan-pangkat"
          }
        })
      }
    } catch (notifErr) {
      // Gagal kirim notifikasi tidak boleh membatalkan proses approval
      console.error("Gagal mengirim notifikasi:", notifErr)
    }

    revalidatePath("/kenaikan-pangkat")
    revalidatePath("/mutasi")
    revalidatePath("/approval")
    revalidatePath("/notifikasi")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses aksi Pangkat" }
  }
}
