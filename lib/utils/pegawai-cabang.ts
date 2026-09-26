/**
 * Helper untuk menentukan apakah pegawai bertugas di Kantor Cabang
 * Jadwal kerja kantor cabang: Senin - Sabtu (6 hari kerja)
 */
export function isCabangEmployee(pegawai: any): boolean {
  if (!pegawai) return false
  if (pegawai.lokasiAbsensi?.tipe === "kantor_cabang") return true
  const tipeJabatan = String(pegawai.tipeJabatan || "").toUpperCase()
  if (["KEPALA_CABANG", "KASUBBID_CABANG", "STAFF_CABANG"].includes(tipeJabatan)) return true
  const role = String(pegawai.role || pegawai.user?.role || "").toUpperCase()
  if (role.includes("CABANG")) return true
  const bidangNama = String(pegawai.bidang?.nama || "").toLowerCase()
  if (bidangNama.includes("cabang") || bidangNama.includes("pos")) return true
  const jabatan = String(pegawai.jabatan || "").toLowerCase()
  if (jabatan.includes("cabang") || jabatan.includes("pos")) return true
  return false
}
