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

export async function getEligibleKenaikanPangkat() {
  const pegawais = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    orderBy: { tanggalMasuk: 'asc' }
  })

  const now = new Date()
  const eligiblePegawai = []

  for (const pegawai of pegawais) {
    if (!pegawai.tanggalMasuk) continue;
    
    const masaKerjaMs = now.getTime() - pegawai.tanggalMasuk.getTime()
    const masaKerjaTahun = masaKerjaMs / (1000 * 60 * 60 * 24 * 365.25)
    
    // Asumsi: Eligible jika masa kerja >= 4 tahun
    if (masaKerjaTahun >= 4) {
      // Cari pangkat saat ini di daftarPangkat
      const currentLabel = pegawai.pangkat || "Juru Muda"
      const currentGolongan = pegawai.golongan || "A/I"
      const currentIndex = daftarPangkat.findIndex(p => p.golongan === currentGolongan || p.nama === currentLabel)
      
      let pangkatBaru = "-"
      let golonganBaru = "-"
      
      if (currentIndex !== -1 && currentIndex < daftarPangkat.length - 1) {
        pangkatBaru = daftarPangkat[currentIndex + 1].nama
        golonganBaru = daftarPangkat[currentIndex + 1].golongan
      }

      // Hitung sisa hari menuju Kenaikan Pangkat ke-4, ke-8, dsb
      // Karena kita cek >= 4, dia mungkin udah 5 tahun. 
      // Anggap saja statusnya "eligible" (sisa hari = 0) jika lebih dari kelipatan 4 terdekat
      const nextMasaKerjaBulan = Math.floor(masaKerjaTahun * 12)
      
      eligiblePegawai.push({
        id: pegawai.id,
        nama: pegawai.nama,
        nik: pegawai.nik,
        jabatan: pegawai.jabatan || "-",
        golonganSaatIni: currentGolongan,
        pangkatSaatIni: currentLabel,
        golonganBaru: golonganBaru,
        pangkatBaru: pangkatBaru,
        tmtPangkat: pegawai.tanggalMasuk.toISOString(), // proxy for now
        masaKerja: `${Math.floor(masaKerjaTahun)} tahun ${nextMasaKerjaBulan % 12} bulan`,
        eligibleDate: new Date(pegawai.tanggalMasuk.getTime() + (4 * 365.25 * 24 * 60 * 60 * 1000)).toISOString(),
        sisaHari: 0,
        nilaiKinerja: 85, // Dummy default for now
        status: "eligible",
        avatar: pegawai.fotoUrl,
      })
    }
  }

  return eligiblePegawai
}

// Untuk sementara kita kembalikan array kosong jika belum ada tabel pengajuan
export async function getPengajuanKenaikanPangkat() {
  // TODO: Create a model for KenaikanPangkat if needed in the future
  return []
}
