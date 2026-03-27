// lib/utils/surat-templates.ts
// Utility fungsi template surat — TIDAK mengandung 'use server'
// Aman dipakai di client maupun server

// ============ TIPE DATA ============
export interface DataSurat {
  nomor_surat: string
  lampiran: string
  perihal: string
  tanggal_surat: string
  kepada: string
  tempat_tujuan: string
  isi_pembuka: string
  isi_penutup: string
  hari_tanggal_acara?: string
  jam_acara?: string
  lokasi_acara?: string
  nama_acara?: string
  jabatan_penandatangan: string
  nama_penandatangan: string
  nik_penandatangan: string
}

// ============ FORMAT TANGGAL ============
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

// ============ TEMPLATE SURAT ============
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
