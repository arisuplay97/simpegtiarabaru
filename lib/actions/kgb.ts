'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// KGB is every 2 years. We approximate 2 years as 730 days
const KGB_PERIOD_DAYS = 730

export async function getKGBData() {
  const now = new Date()
  
  // Ambil semua pegawai aktif beserta riwayat KGB terakhirnya
  const allPegawai = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      bidang: true,
      kgb: {
        orderBy: { tanggalBerlaku: 'desc' },
      }
    }
  })

  const eligibleKGB = []
  const riwayatKGB = []

  for (const emp of allPegawai) {
    // Cari KGB terakhir
    const lastKgb = emp.kgb.length > 0 ? emp.kgb[0] : null
    
    // TMT Gaji Terakhir = either tanggalMasuk or the last APPROVED KGB date
    const tmtGajiTerakhir = lastKgb?.status === "APPROVED" 
      ? lastKgb.tanggalBerlaku 
      : emp.tanggalMasuk

    // KGB next date = TMT Gaji Terakhir + 2 years
    const eligibleDate = new Date(tmtGajiTerakhir)
    eligibleDate.setFullYear(eligibleDate.getFullYear() + 2)

    const diffTime = eligibleDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const gajiPokokSaatIni = Number(emp.gajiPokok || 0)
    
    // Hitungan kasar kenaikan: 4.2% default
    const kenaikanPersen = 4.2
    let gajiPokokBaru = Math.round(gajiPokokSaatIni * (1 + (kenaikanPersen / 100)))
    // jika gajipokok 0 (belum diset), kasih default simulasi biar keliatan di UI
    if (gajiPokokSaatIni === 0) gajiPokokBaru = 3000000

    // Masa Kerja Golongan (MKG) dalam tahun
    const mkgInMs = now.getTime() - emp.tanggalMasuk.getTime()
    const mkg = Math.floor(mkgInMs / (1000 * 60 * 60 * 24 * 365.25))

    const empData = {
      pegawaiId: emp.id,
      nik: emp.nik,
      nama: emp.nama,
      jabatan: emp.jabatan,
      unit: emp.bidang?.nama || "Umum",
      golongan: emp.golongan,
      
      gajiPokokSaatIni,
      gajiPokokBaru,
      kenaikan: gajiPokokBaru - gajiPokokSaatIni,
      persentase: kenaikanPersen,
      
      mkg: mkg,
      mkgBaru: mkg + 2,
      tmtGajiTerakhir: tmtGajiTerakhir.toISOString().split('T')[0],
      eligibleDate: eligibleDate.toISOString().split('T')[0],
      sisaHari: diffDays,
      status: diffDays <= 60 ? "eligible" : "waiting", // eligible if within 60 days
      nilaiKinerja: 85 + Math.floor(Math.random() * 10), // Randomize mock performance for now
    }

    // Jika masuk kriteria eligible dan tidak ada pengajuan pending
    const hasPending = emp.kgb.some(k => k.status === "PENDING")
    
    if (!hasPending && diffDays <= 60) {
      eligibleKGB.push(empData)
    }

    // Masukkan semua riwayat kgb ke array riwayat
    for (const k of emp.kgb) {
      riwayatKGB.push({
        id: k.id,
        pegawaiId: emp.id,
        nama: emp.nama,
        nik: emp.nik,
        golongan: emp.golongan,
        unit: emp.bidang?.nama || "Umum",
        tmtLama: tmtGajiTerakhir.toISOString().split('T')[0], // simplifikasi
        tmtBaru: k.tanggalBerlaku.toISOString().split('T')[0],
        gajiLama: Number(k.gajiPokokLama),
        gajiBaru: Number(k.gajiPokokBaru),
        status: k.status,
        tanggalPengajuan: k.createdAt.toISOString().split('T')[0],
        keterangan: k.keterangan || ""
      })
    }
  }

  // Random sample if eligible is empty for demo purpose
  if (eligibleKGB.length === 0 && allPegawai.length > 0) {
      const demoEmp = allPegawai[0]
      eligibleKGB.push({
        pegawaiId: demoEmp.id,
        nik: demoEmp.nik,
        nama: demoEmp.nama,
        jabatan: demoEmp.jabatan,
        unit: demoEmp.bidang?.nama || "Umum",
        golongan: demoEmp.golongan,
        gajiPokokSaatIni: Number(demoEmp.gajiPokok || 3000000),
        gajiPokokBaru: Number(demoEmp.gajiPokok || 3000000) * 1.05,
        kenaikan: (Number(demoEmp.gajiPokok || 3000000) * 1.05) - Number(demoEmp.gajiPokok || 3000000),
        persentase: 5,
        mkg: 5,
        mkgBaru: 7,
        tmtGajiTerakhir: "2024-01-01",
        eligibleDate: new Date().toISOString().split('T')[0],
        sisaHari: 0,
        status: "eligible",
        nilaiKinerja: 90
      })
  }

  return {
    eligible: eligibleKGB,
    riwayat: riwayatKGB
  }
}

// ==== PENGAJUAN KGB ==== 
export async function ajukanKGB(data: any) {
  try {
    const kgb = await prisma.kGB.create({
      data: {
        pegawaiId: data.pegawaiId,
        tanggalBerlaku: new Date(data.tanggalBerlaku),
        gajiPokokLama: data.gajiPokokLama,
        gajiPokokBaru: data.gajiPokokBaru,
        keterangan: data.catatan || null,
        status: "PENDING"
      }
    })
    revalidatePath("/kgb")
    return { success: true, data: kgb }
  } catch (error: any) {
    return { error: error.message || "Gagal mengajukan KGB" }
  }
}

// ==== APPROVE / REJECT KGB ====
export async function updateStatusKGB(id: string, isApprove: boolean) {
  try {
    const status = isApprove ? "APPROVED" : "REJECTED"
    
    // Jalankan dalam transaction agar data gaji pegawai ikut berubah jika approved
    await prisma.$transaction(async (tx) => {
      const updated = await tx.kGB.update({
        where: { id },
        data: { status }
      })

      if (isApprove) {
        await tx.pegawai.update({
          where: { id: updated.pegawaiId },
          data: {
            gajiPokok: updated.gajiPokokBaru
          }
        })
      }
    })

    revalidatePath("/kgb")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal memproses aksi KGB" }
  }
}
