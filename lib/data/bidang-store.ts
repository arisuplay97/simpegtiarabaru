// lib/data/bidang-store.ts
// Data master bidang/unit kerja + cabang + pos + sub bidang + logika atasan otomatis
// Disesuaikan dari DATA PEGAWAI PER BIDANG DAN CABANG (Sheet Agustus 2025)

export type TipeJabatan = "direktur_utama" | "direktur_operasional" | "direktur_umum" | "direktur" | "kepala_bidang" | "kasubbid" | "staf_ahli" | "staff" | "kepala_cabang" | "kasubbid_cabang" | "staff_cabang"

// Tipe status kepegawaian (bukan jabatan struktural)
export type TipeKepegawaian = "tetap" | "honorer" | "kontrak" | "magang"

export interface SubBidang {
  id: string
  nama: string
  bidangId: string
}

export interface Bidang {
  id: string
  nama: string           // Nama bidang, misal "Keuangan"
  kode: string           // Kode singkat, misal "KEU"
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

// ============ DATA MASTER BIDANG (Kantor Pusat) ============
export let bidangList: Bidang[] = [
  // ──── DIREKSI ────
  {
    id: "dir",
    nama: "Direksi",
    kode: "DIR",
    kepalaBidang: "-",
    direkturAtasan: "Dewan Pengawas",
    aktif: true,
    subBidang: [],
  },

  // ──── BIDANG PUSAT ────
  {
    id: "spi",
    nama: "Satuan Pengawas Intern",
    kode: "SPI",
    kepalaBidang: "LALU RAHMAN HAFIZ WIJAYA",
    direkturAtasan: "Direktur Utama",
    aktif: true,
    subBidang: [
      { id: "spi-1", nama: "Pengawasan Umum & Keuangan", bidangId: "spi" },
      { id: "spi-2", nama: "Pengawasan Teknik", bidangId: "spi" },
    ],
  },
  {
    id: "sekper",
    nama: "Sekretariat Perusahaan",
    kode: "SEKPER",
    kepalaBidang: "LALU KHAERUL HUDA, SE",
    direkturAtasan: "Direktur Utama",
    aktif: true,
    subBidang: [
      { id: "sekper-1", nama: "Humas", bidangId: "sekper" },
      { id: "sekper-2", nama: "Teknologi Informasi", bidangId: "sekper" },
      { id: "sekper-3", nama: "Hukum", bidangId: "sekper" },
      { id: "sekper-4", nama: "Kesekretariatan", bidangId: "sekper" },
    ],
  },
  {
    id: "hl",
    nama: "Hubungan Langganan",
    kode: "HL",
    kepalaBidang: "LALU WAHYUDI, S.Sos",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "hl-1", nama: "Penagihan", bidangId: "hl" },
      { id: "hl-2", nama: "Pelayanan", bidangId: "hl" },
      { id: "hl-3", nama: "Pembaca Meter", bidangId: "hl" },
    ],
  },
  {
    id: "keu",
    nama: "Keuangan",
    kode: "KEU",
    kepalaBidang: "YULI RAHMAWATI, SE",
    direkturAtasan: "Direktur Umum & Keuangan",
    aktif: true,
    subBidang: [
      { id: "keu-1", nama: "Aset", bidangId: "keu" },
      { id: "keu-2", nama: "Akuntansi", bidangId: "keu" },
      { id: "keu-3", nama: "Kas", bidangId: "keu" },
      { id: "keu-4", nama: "Perencana Keuangan", bidangId: "keu" },
    ],
  },
  {
    id: "ppt",
    nama: "Perencana & Pengawasan Teknik",
    kode: "PPT",
    kepalaBidang: "BAKHTIAR RIFA'I",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "ppt-1", nama: "Pengawasan Teknik", bidangId: "ppt" },
      { id: "ppt-2", nama: "Perencanaan Teknik", bidangId: "ppt" },
      { id: "ppt-3", nama: "Sistem Informasi Geografis (GIS)", bidangId: "ppt" },
    ],
  },
  {
    id: "td",
    nama: "Transmisi & Distribusi",
    kode: "TD",
    kepalaBidang: "SYAIFUL BAHRI",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "td-1", nama: "Transmisi & Distribusi", bidangId: "td" },
      { id: "td-2", nama: "Kehilangan Air", bidangId: "td" },
      { id: "td-3", nama: "Meter Segel", bidangId: "td" },
      { id: "td-4", nama: "Tera Meter", bidangId: "td" },
    ],
  },
  {
    id: "prod",
    nama: "Produksi",
    kode: "PROD",
    kepalaBidang: "A'AN ALFIAN, ST",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "prod-1", nama: "Laboratorium", bidangId: "prod" },
      { id: "prod-2", nama: "IPA Mandalika", bidangId: "prod" },
      { id: "prod-3", nama: "IPA Penujak", bidangId: "prod" },
      { id: "prod-4", nama: "Sistem Grafitasi", bidangId: "prod" },
    ],
  },
  {
    id: "pwt",
    nama: "Perawatan",
    kode: "PWT",
    kepalaBidang: "ZULNAIDI",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "pwt-1", nama: "Pemeliharaan Instalasi", bidangId: "pwt" },
      { id: "pwt-2", nama: "Perawatan Peralatan Teknik", bidangId: "pwt" },
      { id: "pwt-3", nama: "Gudang", bidangId: "pwt" },
    ],
  },
  {
    id: "usdm",
    nama: "Umum dan SDM",
    kode: "USDM",
    kepalaBidang: "LALU SUDIRMAN, S. Adm",
    direkturAtasan: "Direktur Umum & Keuangan",
    aktif: true,
    subBidang: [
      { id: "usdm-1", nama: "Kepegawaian", bidangId: "usdm" },
      { id: "usdm-2", nama: "Rumah Tangga", bidangId: "usdm" },
    ],
  },

  // ──── CABANG ────
  {
    id: "cbg-pra",
    nama: "Cabang Praya",
    kode: "CBG-PRA",
    kepalaBidang: "LALU MUH. YUSUP, SE",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-pra-1", nama: "Teknik", bidangId: "cbg-pra" },
      { id: "cbg-pra-2", nama: "Administrasi", bidangId: "cbg-pra" },
    ],
  },
  {
    id: "cbg-prt",
    nama: "Cabang Praya Tengah",
    kode: "CBG-PRT",
    kepalaBidang: "SUKRIN",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-prt-1", nama: "Teknik", bidangId: "cbg-prt" },
      { id: "cbg-prt-2", nama: "Administrasi", bidangId: "cbg-prt" },
    ],
  },
  {
    id: "cbg-prb",
    nama: "Cabang Praya Barat",
    kode: "CBG-PRB",
    kepalaBidang: "HANDI PRAMONO",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-prb-1", nama: "Teknik", bidangId: "cbg-prb" },
      { id: "cbg-prb-2", nama: "Administrasi", bidangId: "cbg-prb" },
    ],
  },
  {
    id: "cbg-pbd",
    nama: "Cabang Praya Barat Daya",
    kode: "CBG-PBD",
    kepalaBidang: "ERWANTO",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-pbd-1", nama: "Teknik", bidangId: "cbg-pbd" },
      { id: "cbg-pbd-2", nama: "Administrasi", bidangId: "cbg-pbd" },
    ],
  },
  {
    id: "cbg-ptm",
    nama: "Cabang Praya Timur",
    kode: "CBG-PTM",
    kepalaBidang: "SUNARDI",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-ptm-1", nama: "Teknik", bidangId: "cbg-ptm" },
      { id: "cbg-ptm-2", nama: "Administrasi", bidangId: "cbg-ptm" },
    ],
  },
  {
    id: "cbg-jgt",
    nama: "Cabang Jonggat",
    kode: "CBG-JGT",
    kepalaBidang: "AKHMAD AZHARI, SE",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-jgt-1", nama: "Teknik", bidangId: "cbg-jgt" },
      { id: "cbg-jgt-2", nama: "Administrasi", bidangId: "cbg-jgt" },
    ],
  },
  {
    id: "cbg-pgr",
    nama: "Cabang Pringgarata",
    kode: "CBG-PGR",
    kepalaBidang: "R. JUSMAN ABDUL MAJID",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-pgr-1", nama: "Teknik", bidangId: "cbg-pgr" },
      { id: "cbg-pgr-2", nama: "Administrasi", bidangId: "cbg-pgr" },
    ],
  },
  {
    id: "cbg-kpg",
    nama: "Cabang Kopang",
    kode: "CBG-KPG",
    kepalaBidang: "ZULHAI ANSORI",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-kpg-1", nama: "Teknik", bidangId: "cbg-kpg" },
      { id: "cbg-kpg-2", nama: "Administrasi", bidangId: "cbg-kpg" },
    ],
  },
  {
    id: "cbg-btk",
    nama: "Cabang Batukliang",
    kode: "CBG-BTK",
    kepalaBidang: "LALU AHMAD FAUZI",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-btk-1", nama: "Teknik", bidangId: "cbg-btk" },
      { id: "cbg-btk-2", nama: "Administrasi", bidangId: "cbg-btk" },
    ],
  },
  {
    id: "cbg-bku",
    nama: "Cabang Batukliang Utara",
    kode: "CBG-BKU",
    kepalaBidang: "LALU SUHARDI AMIN",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-bku-1", nama: "Teknik", bidangId: "cbg-bku" },
      { id: "cbg-bku-2", nama: "Administrasi", bidangId: "cbg-bku" },
    ],
  },
  {
    id: "cbg-jnp",
    nama: "Cabang Janapria",
    kode: "CBG-JNP",
    kepalaBidang: "SYAFA'ATUL KHAIDIR",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-jnp-1", nama: "Teknik", bidangId: "cbg-jnp" },
      { id: "cbg-jnp-2", nama: "Administrasi", bidangId: "cbg-jnp" },
    ],
  },
  {
    id: "cbg-pjt",
    nama: "Cabang Pujut",
    kode: "CBG-PJT",
    kepalaBidang: "H. LALU HASNAN HARIADY, ST",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-pjt-1", nama: "Teknik", bidangId: "cbg-pjt" },
      { id: "cbg-pjt-2", nama: "Pos", bidangId: "cbg-pjt" },
    ],
  },
  {
    id: "cbg-kta",
    nama: "Cabang Kuta",
    kode: "CBG-KTA",
    kepalaBidang: "-",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [
      { id: "cbg-kta-1", nama: "Teknik", bidangId: "cbg-kta" },
      { id: "cbg-kta-2", nama: "Administrasi", bidangId: "cbg-kta" },
    ],
  },

  // ──── POS ────
  {
    id: "pos-bdk",
    nama: "Pos Bodak",
    kode: "POS-BDK",
    kepalaBidang: "-",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [],
  },
  {
    id: "pos-dmj",
    nama: "Pos Darmaji",
    kode: "POS-DMJ",
    kepalaBidang: "-",
    direkturAtasan: "Direktur Operasional",
    aktif: true,
    subBidang: [],
  },
]

// ============ DAFTAR DIREKTUR ============
export const direkturList = [
  "Direktur Utama",
  "Direktur Operasional",
  "Direktur Umum & Keuangan",
  "Dewan Pengawas",
]

// ============ LOGIKA JABATAN ============

// Ambil label jabatan berdasarkan tipe dan bidang
export const getJabatanLabel = (tipe: TipeJabatan, namaBidang: string): string => {
  switch (tipe) {
    case "direktur_utama": return `Direktur Utama`
    case "direktur_operasional": return `Direktur Operasional`
    case "direktur_umum":  return `Direktur Umum & Keuangan`
    case "direktur":       return `Direktur`
    case "kepala_bidang": return `Kepala Bidang`
    case "kasubbid":      return `Kasubbid`
    case "staf_ahli":     return `Staf Ahli`
    case "staff":         return `Staff`
    case "kepala_cabang": return `Kepala Cabang`
    case "kasubbid_cabang": return `Kasubbid Cabang`
    case "staff_cabang":  return `Staff Cabang`
    default:              return ""
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
    case "staf_ahli":     return `Kasubbid ${bidang.nama || "-"}`
    case "kasubbid":      return bidang.kepalaBidang || `Kepala Bidang ${bidang.nama || "-"}`
    case "kepala_bidang": return bidang.direkturAtasan || "Direktur Utama"
    case "staff_cabang":  return `Kasubbid ${bidang.nama || "-"}`
    case "kasubbid_cabang": return bidang.kepalaBidang || `Kepala ${bidang.nama || "-"}`
    case "kepala_cabang": return bidang.direkturAtasan || "Direktur Operasional"
    case "direktur_operasional": return "Direktur Utama"
    case "direktur_umum": return "Direktur Utama"
    case "direktur":      return "Direktur Utama"
    case "direktur_utama": return "Dewan Pengawas / Bupati"
    default: return "-"
  }
}

// Opsi jabatan untuk dropdown (berdasarkan bidang yang dipilih)
export const getJabatanOptions = (bidangId: string, bidangData: Bidang[] = bidangList) => {
  const bidang = bidangData.find(b => b.id === bidangId)
  if (!bidang) return []

  const isDir = bidang.nama.toLowerCase().includes('direksi') || bidang.kode?.toLowerCase() === 'dir'
  const isCabang = bidang.nama.toLowerCase().includes('cabang')
  const isPos = bidang.nama.toLowerCase().includes('pos')

  if (isDir) {
    return [
      { value: "direktur_utama", label: "Direktur Utama" },
      { value: "direktur_operasional", label: "Direktur Operasional" },
      { value: "direktur_umum", label: "Direktur Umum & Keuangan" },
    ]
  }

  if (isCabang || isPos) {
    return [
      { value: "kepala_cabang", label: `Kepala ${isCabang ? "Cabang" : "Pos"}` },
      { value: "kasubbid_cabang", label: `Kasubbid` },
      { value: "staf_ahli", label: `Staf Ahli` },
      { value: "staff_cabang", label: `Staff` },
    ]
  }

  return [
    { value: "kepala_bidang", label: `Kepala Bidang` },
    { value: "kasubbid",      label: `Kasubbid` },
    { value: "staf_ahli",     label: `Staf Ahli` },
    { value: "staff",         label: `Staff` },
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
  if (lower.includes("direktur utama") || lower.includes("dirut")) return "direktur_utama"
  if (lower.includes("direktur operasional") || lower.includes("dirops")) return "direktur_operasional"
  if (lower.includes("umum & keuangan") || lower.includes("umum dan keuangan") || lower.includes("dirum")) return "direktur_umum"
  if (lower.includes("direktur")) return "direktur"
  if (lower.includes("kepala bidang") || lower.includes("kepala bagian") || lower.includes("manager")) return "kepala_bidang"
  if (lower.includes("kepala cabang") || lower.includes("kepala pos")) return "kepala_cabang"
  if (lower.includes("kasubbid") || lower.includes("supervisor") || lower.includes("koordinator")) return "kasubbid"
  if (lower.includes("staf ahli") || lower.includes("staff ahli")) return "staf_ahli"
  return "staff"
}
