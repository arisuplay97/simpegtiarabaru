'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { daftarPangkat } from "@/lib/constants/pangkat"
import { normalizeGolonganKey } from "@/lib/utils"

export async function getPangkatData() {
  const pegawais = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      bidang: true,
      riwayatPangkat: {
        orderBy: { tanggalBerlaku: 'desc' }
      },
      riwayatPangkatDetail: {
        orderBy: { tanggalBerlaku: 'desc' }
      }
    },
    orderBy: { nama: 'asc' }
  })

  const now = new Date()
  const eligiblePangkat: any[] = []
  const riwayatPangkat: any[] = []

  for (const emp of pegawais) {
    // 1. Tentukan riwayat pangkat terakhir dari riwayat detail profil maupun pengajuan approved
    const lastApprovedInApp = emp.riwayatPangkat.find(p => p.status === "APPROVED")
    const lastProfilePangkat = emp.riwayatPangkatDetail[0]

    // Kumpulkan seluruh tanggal valid mutasi/pangkat/masuk
    const promotionTimestamps: number[] = []

    if (lastApprovedInApp?.tanggalBerlaku) {
      promotionTimestamps.push(new Date(lastApprovedInApp.tanggalBerlaku).getTime())
    }
    for (const pd of emp.riwayatPangkatDetail) {
      if (pd.tanggalBerlaku) {
        promotionTimestamps.push(new Date(pd.tanggalBerlaku).getTime())
      }
    }
    if (emp.tanggalMasuk) {
      promotionTimestamps.push(new Date(emp.tanggalMasuk).getTime())
    }
    if (emp.createdAt) {
      promotionTimestamps.push(new Date(emp.createdAt).getTime())
    }

    const tmtPangkatTerakhir = promotionTimestamps.length > 0
      ? new Date(Math.max(...promotionTimestamps))
      : now

    const masaKerjaMs = now.getTime() - tmtPangkatTerakhir.getTime()
    const diffDays = Math.ceil((tmtPangkatTerakhir.getTime() + (4 * 365.25 * 24 * 60 * 60 * 1000) - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Eligible if 4 years have passed (or within 60 days of 4th year)
    const isEligibleTime = diffDays <= 60 

    const currentLabel = emp.pangkat || lastProfilePangkat?.pangkat || "Juru Muda"
    const currentGolongan = emp.golongan || lastProfilePangkat?.golongan || "A/I"
    const normGolongan = normalizeGolonganKey(currentGolongan)
    
    const currentIndex = daftarPangkat.findIndex(p => {
      const normP = normalizeGolonganKey(p.golongan)
      return (
        normP.toLowerCase() === normGolongan.toLowerCase() ||
        p.golongan.toLowerCase() === currentGolongan.toLowerCase() ||
        p.nama.toLowerCase() === currentLabel.toLowerCase() ||
        p.aliasGolongan.some(a => {
          const normA = normalizeGolonganKey(a)
          return normA.toLowerCase() === normGolongan.toLowerCase() || a.toLowerCase() === currentGolongan.toLowerCase()
        })
      )
    })
    
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
        masaKerjaTahun: Math.floor(masaKerjaMs / (1000 * 60 * 60 * 24 * 365.25)),
        masaKerja: `${Math.floor(masaKerjaMs / (1000 * 60 * 60 * 24 * 365.25))} tahun`,
        eligibleDate: new Date(tmtPangkatTerakhir.getTime() + (4 * 365.25 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        sisaHari: diffDays,
        isOverdue: diffDays < 0,
        nilaiKinerja: 85 + (emp.nik.charCodeAt(emp.nik.length - 1) % 12),
      })
    }

    // Riwayat pengajuan pangkat
    for (const p of emp.riwayatPangkat) {
      riwayatPangkat.push({
        id: p.id,
        pegawaiId: emp.id,
        nama: emp.nama,
        nik: emp.nik,
        jabatan: emp.jabatan || "-",
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

  riwayatPangkat.sort((a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime())

  return {
    eligible: eligiblePangkat,
    riwayat: riwayatPangkat
  }
}

// ==== PENGAJUAN PANGKAT ====
export async function ajukanPangkat(data: {
  pegawaiId: string
  tanggalBerlaku: string
  pangkatLama: string
  golonganLama: string
  pangkatBaru: string
  golonganBaru: string
  keterangan?: string | null
}) {
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
            title: `Usulan Pangkat: ${pangkat.pegawai.nama}`,
            message: `Pengusulan kenaikan pangkat untuk ${pangkat.pegawai.nama} ke ${data.pangkatBaru} (${data.golonganBaru}) menunggu persetujuan.`,
            link: "/kenaikan-pangkat"
          }
        })
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi kenaikan pangkat:", notifErr)
    }

    revalidatePath("/kenaikan-pangkat")
    return { success: true, data: pangkat }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan kenaikan pangkat" }
  }
}

// ==== APPROVE / REJECT PANGKAT ====
export async function updateStatusPangkat(id: string, isApprove: boolean, catatanReview?: string) {
  try {
    const status = isApprove ? "APPROVED" : "REJECTED"

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.kenaikanPangkat.findUnique({
        where: { id },
        include: {
          pegawai: {
            include: {
              user: true,
              bidang: true
            }
          }
        }
      })

      if (!current) throw new Error("Data kenaikan pangkat tidak ditemukan")

      const updated = await tx.kenaikanPangkat.update({
        where: { id },
        data: {
          status,
          keterangan: catatanReview ? `${current.keterangan ? current.keterangan + ' | ' : ''}Review: ${catatanReview}` : current.keterangan
        },
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
        // Cari standar gaji untuk pangkat / golongan baru ini
        const standardSalary = await (tx as any).standarGajiPangkat.findFirst({
          where: {
            OR: [
              { golongan: updated.golonganBaru },
              { pangkat: updated.pangkatBaru }
            ]
          }
        })

        const updateData: any = {
          pangkat: updated.pangkatBaru,
          golongan: updated.golonganBaru
        }

        if (standardSalary) {
          updateData.gajiPokok = standardSalary.gajiPokok
          if (Number(standardSalary.tunjangan) > 0) {
            updateData.tunjangan = standardSalary.tunjangan
          }
        }

        // 1. Update pangkat, golongan, dan sinkron gaji pegawai
        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: updateData
        })

        // 2. Buat record Mutasi berjenis PROMOSI agar sinkron di modul Promosi
        await tx.mutasi.create({
          data: {
            pegawaiId: updated.pegawaiId,
            type: "PROMOSI",
            jabatanAsal: updated.pegawai.jabatan || "-",
            unitAsal: updated.pegawai.bidang?.nama || "Umum",
            jabatanTujuan: updated.pegawai.jabatan || "-",
            unitTujuan: updated.pegawai.bidang?.nama || "Umum",
            alasan: `Kenaikan Pangkat Reguler dari ${updated.pangkatLama} (${updated.golonganLama}) ke ${updated.pangkatBaru} (${updated.golonganBaru})`,
            tanggalEfektif: updated.tanggalBerlaku,
            status: "APPROVED",
            catatan: updated.keterangan || "Disetujui oleh Direksi"
          }
        })

        // 3. Catat otomatis ke Riwayat Pangkat Pegawai
        await tx.pegawaiPangkat.create({
          data: {
            pegawaiId: updated.pegawaiId,
            pangkat: updated.pangkatBaru,
            golongan: updated.golonganBaru,
            tanggalBerlaku: updated.tanggalBerlaku,
            nomorSK: updated.keterangan || "SK Kenaikan Pangkat Reguler"
          }
        })
      }

      return updated
    })

    // 4. Kirim notifikasi ke User ber-role HRD dan ke pegawai yg bersangkutan
    try {
      const aksiLabel = isApprove ? "disetujui ✅" : "ditolak ❌"
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
        where: { role: { in: ["HRD", "SUPERADMIN"] } }
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
      console.error("Gagal mengirim notifikasi pangkat:", notifErr)
    }

    revalidatePath("/kenaikan-pangkat")
    revalidatePath("/mutasi")
    revalidatePath("/approval")
    revalidatePath("/notifikasi")
    revalidatePath("/payroll")
    revalidatePath("/kgb")
    revalidatePath(`/pegawai/${result.pegawaiId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses aksi Pangkat" }
  }
}

