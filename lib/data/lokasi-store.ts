// lib/data/lokasi-store.ts

export type TipeLokasi = "kantor_pusat" | "kantor_cabang" | "acara"

export interface TitikKoordinat {
  id: string
  nama: string
  latitude: number
  longitude: number
  radius?: number | null
}

export interface LokasiAbsensi {
  id: string
  nama: string
  tipe: TipeLokasi
  alamat: string
  latitude: number
  longitude: number
  radius: number        // default radius dalam meter
  aktif: boolean
  titikKoordinat?: TitikKoordinat[] | string | null
  // Khusus acara:
  tanggalMulai?: string // format YYYY-MM-DD
  tanggalSelesai?: string
  wajibHadir?: boolean  // jika true, pegawai WAJIB absen di sini
  targetPegawai?: string | null
  keterangan?: string | null
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

// Hitung jarak antara 2 koordinat (meter) menggunakan Haversine Formula
export const hitungJarak = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  if (
    lat1 == null || lng1 == null || lat2 == null || lng2 == null ||
    isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)
  ) {
    return Infinity
  }
  const R = 6371000 // radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Ekstrak semua titik koordinat yang dimiliki oleh suatu lokasi
export const parseTitikKoordinat = (lokasi: LokasiAbsensi): TitikKoordinat[] => {
  const points: TitikKoordinat[] = [
    {
      id: "primary",
      nama: "Titik Utama",
      latitude: Number(lokasi.latitude),
      longitude: Number(lokasi.longitude),
      radius: lokasi.radius,
    }
  ]

  if (lokasi.titikKoordinat) {
    try {
      const parsed = typeof lokasi.titikKoordinat === "string"
        ? JSON.parse(lokasi.titikKoordinat)
        : lokasi.titikKoordinat
      if (Array.isArray(parsed)) {
        parsed.forEach((pt: any, idx: number) => {
          const lat = Number(pt?.latitude)
          const lng = Number(pt?.longitude)
          if (!isNaN(lat) && !isNaN(lng)) {
            points.push({
              id: pt.id || `pt_${idx + 1}`,
              nama: pt.nama?.trim() || `Titik Tambahan ${idx + 1}`,
              latitude: lat,
              longitude: lng,
              radius: pt.radius ? Number(pt.radius) : lokasi.radius,
            })
          }
        })
      }
    } catch (e) {
      console.error("Error parseTitikKoordinat:", e)
    }
  }

  return points
}

// Cek apakah koordinat dalam radius lokasi manapun (memeriksa semua titik koordinat yang ada pada lokasi)
export const cekDalamRadius = (
  userLat: number,
  userLng: number,
  lokasi: LokasiAbsensi[]
): {
  valid: boolean
  lokasi?: LokasiAbsensi
  titik?: TitikKoordinat
  jarak?: number
  titikNama?: string
} => {
  const aktif = lokasi.filter(l => l.aktif)

  let closestMatch: { lokasi: LokasiAbsensi; titik: TitikKoordinat; jarak: number } | null = null

  for (const l of aktif) {
    const allPoints = parseTitikKoordinat(l)
    for (const pt of allPoints) {
      const effectiveRadius = pt.radius ?? l.radius
      const jarak = hitungJarak(userLat, userLng, pt.latitude, pt.longitude)

      if (!isNaN(jarak) && jarak <= effectiveRadius) {
        if (!closestMatch || jarak < closestMatch.jarak) {
          closestMatch = { lokasi: l, titik: pt, jarak: Math.round(jarak) }
        }
      }
    }
  }

  if (closestMatch) {
    return {
      valid: true,
      lokasi: closestMatch.lokasi,
      titik: closestMatch.titik,
      jarak: closestMatch.jarak,
      titikNama: closestMatch.titik.nama,
    }
  }

  return { valid: false }
}

// Hitung jarak minimum dari koordinat user ke lokasi (memeriksa semua titik koordinat lokasi)
export const hitungJarakTerdekatKeLokasi = (
  userLat: number,
  userLng: number,
  lokasi: LokasiAbsensi
): { jarak: number; titik: TitikKoordinat } => {
  const points = parseTitikKoordinat(lokasi)
  let minJarak = Infinity
  let closestPoint = points[0]

  for (const pt of points) {
    const d = hitungJarak(userLat, userLng, pt.latitude, pt.longitude)
    if (d < minJarak) {
      minJarak = d
      closestPoint = pt
    }
  }

  return { jarak: Math.round(minJarak), titik: closestPoint }
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
