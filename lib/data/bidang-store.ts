// lib/data/bidang-store.ts
// Data master bidang/unit kerja + logika atasan otomatis

export type TipeJabatan = "kepala_bidang" | "kasubbid" | "staff"

export interface Bidang {
  id: string
  nama: string           // Nama bidang, misal "IT & Sistem"
  kode: string           // Kode singkat, misal "IT"
  kepalaBidang: string   // Nama kepala bidang
  direkturAtasan: string // Nama direktur yang menaungi
  aktif: boolean
}

export interface StrukturJabatan {
  bidangId: string
  tipe: TipeJabatan
  namaJabatan: string    // Label jabatan lengkap
}

// ============ DATA MASTER BIDANG ============
export let bidangList: Bidang[] = [
  {
    id: "1",
    nama: "IT & Sistem",
    kode: "IT",
    kepalaBidang: "Ahmad Rizki Pratama",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
  },
  {
    id: "2",
    nama: "Keuangan",
    kode: "KEU",
    kepalaBidang: "Siti Nurhaliza",
    direkturAtasan: "Direktur Umum",
    aktif: true,
  },
  {
    id: "3",
    nama: "Distribusi",
    kode: "DIST",
    kepalaBidang: "Budi Santoso",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
  },
  {
    id: "4",
    nama: "Pelayanan",
    kode: "PEL",
    kepalaBidang: "Dewi Lestari",
    direkturAtasan: "Direktur Umum",
    aktif: true,
  },
  {
    id: "5",
    nama: "Produksi",
    kode: "PROD",
    kepalaBidang: "Ir. Gunawan Wibowo",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
  },
  {
    id: "6",
    nama: "SDM & Umum",
    kode: "SDM",
    kepalaBidang: "Fitri Handayani",
    direkturAtasan: "Direktur Umum",
    aktif: true,
  },
  {
    id: "7",
    nama: "Direksi",
    kode: "DIR",
    kepalaBidang: "Ir. Joko Widagdo",
    direkturAtasan: "Dewan Pengawas",
    aktif: true,
  },
]

// ============ DAFTAR DIREKTUR ============
export const direkturList = [
  "Direktur Utama",
  "Direktur Teknik",
  "Direktur Umum",
  "Dewan Pengawas",
]

// ============ LOGIKA JABATAN ============

// Ambil label jabatan berdasarkan tipe dan bidang
export const getJabatanLabel = (tipe: TipeJabatan, namaBidang: string): string => {
  switch (tipe) {
    case "kepala_bidang": return `Kepala Bidang ${namaBidang}`
    case "kasubbid":      return `Kasubbid ${namaBidang}`
    case "staff":         return `Staff ${namaBidang}`
    default:              return namaBidang
  }
}

// Dapatkan atasan otomatis berdasarkan jabatan + bidang
export const getAtasanOtomatis = (
  tipe: TipeJabatan,
  bidangId: string,
  bidangData: Bidang[] = bidangList
): string => {
  const bidang = bidangData.find(b => b.id === bidangId)
  if (!bidang) return "-"

  switch (tipe) {
    case "staff":
      // Atasan staff = kasubbid (atau kepala bidang jika tidak ada kasubbid)
      return `Kasubbid ${bidang.nama}`
    case "kasubbid":
      // Atasan kasubbid = kepala bidang
      return bidang.kepalaBidang || `Kepala Bidang ${bidang.nama}`
    case "kepala_bidang":
      // Atasan kepala bidang = direktur yang menaungi bidang tersebut
      return bidang.direkturAtasan || "Direktur Utama"
    default:
      return "-"
  }
}

// Opsi jabatan untuk dropdown (berdasarkan bidang yang dipilih)
export const getJabatanOptions = (bidangId: string, bidangData: Bidang[] = bidangList) => {
  const bidang = bidangData.find(b => b.id === bidangId)
  if (!bidang) return []
  return [
    { value: "kepala_bidang", label: `Kepala Bidang ${bidang.nama}` },
    { value: "kasubbid",      label: `Kasubbid ${bidang.nama}` },
    { value: "staff",         label: `Staff ${bidang.nama}` },
  ]
}

// Helper: parse jabatan string ke tipe
export const parseTipeJabatan = (jabatan: string): TipeJabatan => {
  const lower = jabatan.toLowerCase()
  if (lower.includes("kepala bidang") || lower.includes("kepala bagian") || lower.includes("manager") || lower.includes("direktur")) return "kepala_bidang"
  if (lower.includes("kasubbid") || lower.includes("supervisor") || lower.includes("koordinator")) return "kasubbid"
  return "staff"
}
