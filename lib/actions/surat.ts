'use server'
// lib/actions/surat.ts
// Generate surat resmi dari template docx

import { prisma } from "@/lib/prisma"

// ============ TIPE DATA ============
export interface DataSurat {
  // Header surat
  nomor_surat: string       // contoh: 001/PERUMDAM-TIARA/III/2026
  lampiran: string          // contoh: - atau "1 (satu) berkas"
  perihal: string           // contoh: Undangan Sosialisasi TRIS

  // Tanggal & tujuan
  tanggal_surat: string     // contoh: 21 Maret 2026
  kepada: string            // contoh: Seluruh Kepala Bidang
  tempat_tujuan: string     // contoh: Praya

  // Isi surat
  isi_pembuka: string       // paragraf pembuka
  isi_penutup: string       // paragraf penutup

  // Khusus undangan (opsional)
  hari_tanggal_acara?: string  // Senin, 25 Maret 2026
  jam_acara?: string           // 09.00 WITA s/d selesai
  lokasi_acara?: string        // Aula Kantor Pusat
  nama_acara?: string          // Sosialisasi Sistem TRIS

  // Penandatangan
  jabatan_penandatangan: string  // Direktur Utama
  nama_penandatangan: string     // Ir. Joko Widagdo, M.M.
  nik_penandatangan: string      // NIK penandatangan
}

// ============ NOMOR SURAT BERBASIS DB (SEQUENTIAL) ============
export async function generateNomorSurat(
  kode: string = "PERUMDAM-TIARA"
): Promise<string> {
  const bulan = [
    "", "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII"
  ]
  const now = new Date()
  const bln = bulan[now.getMonth() + 1]
  const thn = now.getFullYear()

  // Hitung jumlah surat yang sudah ada di bulan & tahun yang sama
  const count = await prisma.arsipSurat.count({
    where: {
      tanggalSurat: {
        contains: `${thn}`
      },
      nomorSurat: {
        contains: `/${bln}/${thn}`
      }
    }
  })
  const nomorUrut = String(count + 1).padStart(3, "0")
  return `${nomorUrut}/${kode}/${bln}/${thn}`
}

// ============ SIMPAN ARSIP SURAT ============
export async function saveArsipSurat(payload: {
  nomorSurat: string
  jenisSurat: string
  perihal: string
  tanggalSurat: string
  kepada?: string
  namaPenandatangan: string
  nikPenandatangan?: string
  jabatanPenandatangan: string
  dataLengkap?: Record<string, any>
}) {
  try {
    await prisma.arsipSurat.create({ data: payload })
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan arsip surat" }
  }
}

// ============ GET ARSIP SURAT ============
export async function getArsipSurat(jenis?: string) {
  try {
    const list = await prisma.arsipSurat.findMany({
      where: jenis ? { jenisSurat: jenis } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return list
  } catch {
    return []
  }
}

// ============ FORMAT TANGGAL INDONESIA ============
export function formatTanggalIndonesia(date: Date = new Date()): string {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`
}

export function formatHariTanggal(date: Date = new Date()): string {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`
}

// ============ TEMPLATE SURAT BAWAAN ============
export const templateUndangan = (data: Partial<DataSurat>): DataSurat => ({
  nomor_surat: data.nomor_surat ?? "___/PERUMDAM-TIARA/___/2026",
  lampiran: data.lampiran ?? "-",
  perihal: data.perihal ?? "Undangan",
  tanggal_surat: data.tanggal_surat ?? formatTanggalIndonesia(),
  kepada: data.kepada ?? "Yth. Bapak/Ibu",
  tempat_tujuan: data.tempat_tujuan ?? "Praya",
  isi_pembuka: data.isi_pembuka ?? "keperluan dinas, kami mengundang Bapak/Ibu untuk hadir dalam acara berikut.",
  isi_penutup: data.isi_penutup ?? "Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu kami ucapkan terima kasih.",
  hari_tanggal_acara: data.hari_tanggal_acara ?? formatHariTanggal(),
  jam_acara: data.jam_acara ?? "09.00 WITA s/d selesai",
  lokasi_acara: data.lokasi_acara ?? "Aula Kantor Pusat Perumdam Tirta Ardhia Rinjani",
  nama_acara: data.nama_acara ?? "Rapat",
  jabatan_penandatangan: data.jabatan_penandatangan ?? "Direktur Utama",
  nama_penandatangan: data.nama_penandatangan ?? "________________",
  nik_penandatangan: data.nik_penandatangan ?? "________________",
})

export const templateSKMutasi = (pegawai: any): DataSurat => ({
  nomor_surat: `___/SK-MUT/PERUMDAM-TIARA/${new Date().getFullYear()}`,
  lampiran: "-",
  perihal: `Surat Keputusan Mutasi Pegawai a.n. ${pegawai?.nama ?? "___"}`,
  tanggal_surat: formatTanggalIndonesia(),
  kepada: pegawai?.nama ?? "___",
  tempat_tujuan: "Praya",
  isi_pembuka: `keputusan mutasi Saudara ${pegawai?.nama ?? "___"} dari jabatan ${pegawai?.jabatanAsal ?? "___"} menjadi ${pegawai?.jabatanTujuan ?? "___"} di lingkungan Perumdam Tirta Ardhia Rinjani, terhitung mulai tanggal ${pegawai?.tanggalEfektif ?? "___"}.`,
  isi_penutup: "Demikian Surat Keputusan ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.",
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "________________",
  nik_penandatangan: "________________",
})

export const templateSuratPeringatan = (pegawai: any, jenisSP: string): DataSurat => ({
  nomor_surat: `___/SP/PERUMDAM-TIARA/${new Date().getFullYear()}`,
  lampiran: "-",
  perihal: `${jenisSP} - ${pegawai?.nama ?? "___"}`,
  tanggal_surat: formatTanggalIndonesia(),
  kepada: pegawai?.nama ?? "___",
  tempat_tujuan: "Praya",
  isi_pembuka: `adanya pelanggaran disiplin yang dilakukan oleh Saudara ${pegawai?.nama ?? "___"}, jabatan ${pegawai?.jabatan ?? "___"}, dengan ini diberikan ${jenisSP} dengan alasan: ${pegawai?.alasan ?? "___"}.`,
  isi_penutup: "Saudara diharapkan dapat memperbaiki sikap dan perilaku kerja. Apabila di kemudian hari masih terdapat pelanggaran serupa, maka akan dikenakan sanksi yang lebih berat.",
  jabatan_penandatangan: "Direktur Utama",
  nama_penandatangan: "________________",
  nik_penandatangan: "________________",
})
