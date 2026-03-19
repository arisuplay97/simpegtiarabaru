// lib/data/lokasi-store.ts

export type TipeLokasi = "kantor_pusat" | "kantor_cabang" | "acara"

export interface LokasiAbsensi {
  id: string
  nama: string
  tipe: TipeLokasi
  alamat: string
  latitude: number
  longitude: number
  radius: number        // dalam meter
  aktif: boolean
  // Khusus acara:
  tanggalMulai?: string // format YYYY-MM-DD
  tanggalSelesai?: string
  wajibHadir?: boolean  // jika true, pegawai WAJIB absen di sini
  keterangan?: string
}

export const lokasiData: LokasiAbsensi[] = [
  {
    id: "1",
    nama: "Kantor Pusat PDAM Tirta Ardhia Rinjani",
    tipe: "kantor_pusat",
    alamat: "Jl. Raya Praya No. 1, Lombok Tengah, NTB",
    latitude: -8.7236,
    longitude: 116.2934,
    radius: 100,
    aktif: true,
  },
  {
    id: "2",
    nama: "Kantor Cabang Utara",
    tipe: "kantor_cabang",
    alamat: "Jl. Soekarno Hatta No. 45, Lombok Utara, NTB",
    latitude: -8.3612,
    longitude: 116.1723,
    radius: 100,
    aktif: true,
  },
  {
    id: "3",
    nama: "Kantor Cabang Selatan",
    tipe: "kantor_cabang",
    alamat: "Jl. Bypass Mandalika No. 12, Lombok Selatan, NTB",
    latitude: -8.9012,
    longitude: 116.3456,
    radius: 100,
    aktif: true,
  },
]

// Hitung jarak antara 2 koordinat (meter)
export const hitungJarak = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000 // radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Cek apakah koordinat dalam radius lokasi manapun
export const cekDalamRadius = (
  userLat: number,
  userLng: number,
  lokasi: LokasiAbsensi[]
): { valid: boolean; lokasi?: LokasiAbsensi; jarak?: number } => {
  const aktif = lokasi.filter(l => l.aktif)
  for (const l of aktif) {
    const jarak = hitungJarak(userLat, userLng, l.latitude, l.longitude)
    if (jarak <= l.radius) {
      return { valid: true, lokasi: l, jarak: Math.round(jarak) }
    }
  }
  return { valid: false }
}

// Cek apakah hari ini ada acara wajib
export const getAcaraHariIni = (
  lokasi: LokasiAbsensi[],
  tanggal: string = new Date().toISOString().split("T")[0]
): LokasiAbsensi | null => {
  return lokasi.find(l =>
    l.tipe === "acara" &&
    l.aktif &&
    l.wajibHadir &&
    l.tanggalMulai &&
    l.tanggalSelesai &&
    tanggal >= l.tanggalMulai &&
    tanggal <= l.tanggalSelesai
  ) ?? null
}
