// lib/data/bidang-store.ts
// Data master bidang/unit kerja + sub bidang + logika atasan otomatis

export type TipeJabatan = "kepala_bidang" | "kasubbid" | "staff" | "kepala_cabang" | "kasubbid_cabang" | "staff_cabang"

// Tipe status kepegawaian (bukan jabatan struktural)
export type TipeKepegawaian = "tetap" | "honorer" | "kontrak" | "magang"

export interface SubBidang {
  id: string
  nama: string
  bidangId: string
}

export interface Bidang {
  id: string
  nama: string           // Nama bidang, misal "IT & Sistem"
  kode: string           // Kode singkat, misal "IT"
  kepalaBidang: string   // Nama kepala bidang
  direkturAtasan: string // Nama direktur yang menaungi
  aktif: boolean
  subBidang?: SubBidang[]
}

export interface StrukturJabatan {
  bidangId: string
  tipe: TipeJabatan
  namaJabatan: string    // Label jabatan lengkap
}

// ============ GOLONGAN (Urutan: A/I → A/IV, B/I → B/IV, dst) ============
export const golonganOptions = [
  "A/I", "A/II", "A/III", "A/IV",
  "B/I", "B/II", "B/III", "B/IV",
  "C/I", "C/II", "C/III", "C/IV",
  "D/I", "D/II", "D/III", "D/IV",
  "E/IV",
]

// ============ TIPE KEPEGAWAIAN ============
export const tipeKepegawaianOptions = [
  { value: "tetap", label: "Pegawai Tetap" },
  { value: "honorer", label: "Honorer" },
  { value: "kontrak", label: "Kontrak" },
  { value: "magang", label: "Magang" },
]

// ============ DATA MASTER BIDANG ============
export let bidangList: Bidang[] = [
  {
    id: "1",
    nama: "IT & Sistem",
    kode: "IT",
    kepalaBidang: "Ahmad Rizki Pratama",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
    subBidang: [
      { id: "1-1", nama: "Pengembangan Aplikasi", bidangId: "1" },
      { id: "1-2", nama: "Infrastruktur & Jaringan", bidangId: "1" },
    ],
  },
  {
    id: "2",
    nama: "Keuangan",
    kode: "KEU",
    kepalaBidang: "Siti Nurhaliza",
    direkturAtasan: "Direktur Umum",
    aktif: true,
    subBidang: [
      { id: "2-1", nama: "Akuntansi", bidangId: "2" },
      { id: "2-2", nama: "Anggaran & Pelaporan", bidangId: "2" },
    ],
  },
  {
    id: "3",
    nama: "Distribusi",
    kode: "DIST",
    kepalaBidang: "Budi Santoso",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
    subBidang: [
      { id: "3-1", nama: "Perencanaan Distribusi", bidangId: "3" },
      { id: "3-2", nama: "Operasional Distribusi", bidangId: "3" },
    ],
  },
  {
    id: "4",
    nama: "Pelayanan",
    kode: "PEL",
    kepalaBidang: "Dewi Lestari",
    direkturAtasan: "Direktur Umum",
    aktif: true,
    subBidang: [
      { id: "4-1", nama: "Pelayanan Pelanggan", bidangId: "4" },
      { id: "4-2", nama: "Hubungan Masyarakat", bidangId: "4" },
    ],
  },
  {
    id: "5",
    nama: "Produksi",
    kode: "PROD",
    kepalaBidang: "Ir. Gunawan Wibowo",
    direkturAtasan: "Direktur Teknik",
    aktif: true,
    subBidang: [
      { id: "5-1", nama: "Pengelolaan Air Baku", bidangId: "5" },
      { id: "5-2", nama: "Pengawasan Mutu", bidangId: "5" },
    ],
  },
  {
    id: "6",
    nama: "SDM & Umum",
    kode: "SDM",
    kepalaBidang: "Fitri Handayani",
    direkturAtasan: "Direktur Umum",
    aktif: true,
    subBidang: [
      { id: "6-1", nama: "Kepegawaian", bidangId: "6" },
      { id: "6-2", nama: "Umum & Logistik", bidangId: "6" },
    ],
  },
  {
    id: "7",
    nama: "Direksi",
    kode: "DIR",
    kepalaBidang: "Ir. Joko Widagdo",
    direkturAtasan: "Dewan Pengawas",
    aktif: true,
    subBidang: [],
  },
  {
    id: "c12",
    nama: "Cabang 12 Lombok Tengah",
    kode: "C12LT",
    kepalaBidang: "Ahmad Fauzi",
    direkturAtasan: "Direktur Umum",
    aktif: true,
    subBidang: [
      { id: "c12-1", nama: "Pelayanan Cabang", bidangId: "c12" },
      { id: "c12-2", nama: "Teknik Cabang", bidangId: "c12" },
    ],
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
  const isCabang = namaBidang.toLowerCase().includes('cabang')
  const areaName = isCabang ? namaBidang.replace(/cabang/i, '').trim() : namaBidang

  switch (tipe) {
    case "kepala_bidang": return `Kepala Bidang ${namaBidang}`
    case "kasubbid":      return `Kasubbid ${namaBidang}`
    case "staff":         return `Staff ${namaBidang}`
    case "kepala_cabang": return `Kepala Cabang ${areaName}`
    case "kasubbid_cabang": return `Kasubbid Cabang ${areaName}`
    case "staff_cabang":  return `Staff Cabang ${areaName}`
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
    case "staff":         return `Kasubbid ${bidang.nama || "-"}`
    case "kasubbid":      return bidang.kepalaBidang || `Kepala Bidang ${bidang.nama || "-"}`
    case "kepala_bidang": return bidang.direkturAtasan || "Direktur Utama"
    case "staff_cabang":  return `Kasubbid Cabang ${bidang.nama.replace(/cabang/i, '').trim() || "-"}`
    case "kasubbid_cabang": return bidang.kepalaBidang || `Kepala Cabang ${bidang.nama.replace(/cabang/i, '').trim() || "-"}`
    case "kepala_cabang": return bidang.direkturAtasan || "Direktur Umum"
    default: return "-"
  }
}

// Opsi jabatan untuk dropdown (berdasarkan bidang yang dipilih)
export const getJabatanOptions = (bidangId: string, bidangData: Bidang[] = bidangList) => {
  const bidang = bidangData.find(b => b.id === bidangId)
  if (!bidang) return []

  const isCabang = bidang.nama.toLowerCase().includes('cabang')
  const areaName = isCabang ? bidang.nama.replace(/cabang/i, '').trim() : bidang.nama

  if (isCabang) {
    return [
      { value: "kepala_cabang", label: `Kepala Cabang ${areaName}` },
      { value: "kasubbid_cabang", label: `Kasubbid Cabang ${areaName}` },
      { value: "staff_cabang", label: `Staff Cabang ${areaName}` },
    ]
  }

  return [
    { value: "kepala_bidang", label: `Kepala Bidang ${bidang.nama || "-"}` },
    { value: "kasubbid",      label: `Kasubbid ${bidang.nama || "-"}` },
    { value: "staff",         label: `Staff ${bidang.nama || "-"}` },
  ]
}

// Ambil sub bidang berdasarkan bidangId
export const getSubBidangOptions = (bidangId: string, bidangData: Bidang[] = bidangList): SubBidang[] => {
  const bidang = bidangData.find(b => b.id === bidangId)
  return bidang?.subBidang || []
}

// Helper: parse jabatan string ke tipe
export const parseTipeJabatan = (jabatan: string): TipeJabatan => {
  const lower = jabatan.toLowerCase()
  if (lower.includes("kepala bidang") || lower.includes("kepala bagian") || lower.includes("manager") || lower.includes("direktur")) return "kepala_bidang"
  if (lower.includes("kasubbid") || lower.includes("supervisor") || lower.includes("koordinator")) return "kasubbid"
  return "staff"
}
