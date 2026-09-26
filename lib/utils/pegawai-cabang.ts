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

/**
 * Helper untuk menentukan apakah pegawai berstatus Cabang pada TANGGAL TERTENTU.
 * Memperhitungkan riwayat mutasi / riwayat jabatan jika terjadi mutasi di tengah jalan.
 * 
 * Aturan:
 * - Jika targetDate sebelum tanggal mutasi: mengecek unit & jabatan ASAL.
 * - Jika targetDate pada/setelah tanggal mutasi: mengecek unit & jabatan TUJUAN.
 * - Jika tidak ada riwayat mutasi atau tidak cocok: fallback ke isCabangEmployee(pegawai).
 * 
 * @param pegawai Data pegawai (bisa include mutasiKe, mutasi, atau riwayatJabatan)
 * @param targetDate Tanggal yang sedang dicek (Date atau string "YYYY-MM-DD")
 */
export function isCabangOnDate(pegawai: any, targetDate: Date | string): boolean {
  if (!pegawai) return false

  const dateObj = typeof targetDate === "string" ? new Date(targetDate) : new Date(targetDate)
  if (isNaN(dateObj.getTime())) return isCabangEmployee(pegawai)
  const dateStr = dateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })

  // 1. Cek dari daftar Mutasi yang APPROVED jika ada
  const mutasiList: any[] = (pegawai.mutasiKe || pegawai.mutasi || [])
    .filter((m: any) => m.status === "APPROVED" && m.tanggalEfektif)
    .sort((a: any, b: any) => new Date(a.tanggalEfektif).getTime() - new Date(b.tanggalEfektif).getTime())

  if (mutasiList.length > 0) {
    const isCabangStr = (val: string) => {
      const s = String(val || "").toLowerCase()
      return s.includes("cabang") || s.includes("pos")
    }

    const firstMutasiDate = new Date(mutasiList[0].tanggalEfektif).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
    if (dateStr < firstMutasiDate) {
      // Sebelum mutasi pertama: gunakan unit / jabatan asal dari mutasi pertama
      return isCabangStr(mutasiList[0].unitAsal) || isCabangStr(mutasiList[0].jabatanAsal)
    }

    // Cari mutasi paling akhir yang tanggal efektifnya <= dateStr
    let activeMutasi = mutasiList[0]
    for (const m of mutasiList) {
      const mDate = new Date(m.tanggalEfektif).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
      if (mDate <= dateStr) {
        activeMutasi = m
      } else {
        break
      }
    }

    return isCabangStr(activeMutasi.unitTujuan) || isCabangStr(activeMutasi.jabatanTujuan)
  }

  // 2. Cek dari riwayatJabatan jika tersedia
  const riwayat: any[] = pegawai.riwayatJabatan || []
  if (riwayat.length > 0) {
    const match = riwayat.find((rj: any) => {
      const tMulai = new Date(rj.tanggalMulai).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })
      const tSelesai = rj.tanggalSelesai ? new Date(rj.tanggalSelesai).toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" }) : null
      return dateStr >= tMulai && (!tSelesai || dateStr <= tSelesai)
    })
    if (match) {
      const unit = String(match.unitDefinitif || "").toLowerCase()
      const jab = String(match.jabatan || "").toLowerCase()
      return unit.includes("cabang") || unit.includes("pos") || jab.includes("cabang") || jab.includes("pos")
    }
  }

  // 3. Fallback: gunakan status jabatan saat ini
  return isCabangEmployee(pegawai)
}

