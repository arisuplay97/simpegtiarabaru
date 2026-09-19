export interface PangkatItem {
  id: number
  nama: string
  golongan: string
  aliasGolongan: string[]
}

export const daftarPangkat: PangkatItem[] = [
  // Golongan A
  { id: 1, nama: "Juru Muda", golongan: "A/I", aliasGolongan: ["A/I", "A/1", "Gol A/I", "I/a", "IA"] },
  { id: 2, nama: "Pengatur Muda", golongan: "A/II", aliasGolongan: ["A/II", "A/2", "Gol A/II", "II/a", "IIA"] },
  { id: 3, nama: "Penata Muda", golongan: "A/III", aliasGolongan: ["A/III", "A/3", "Gol A/III", "III/a", "IIIA"] },
  { id: 4, nama: "Pembina", golongan: "A/IV", aliasGolongan: ["A/IV", "A/4", "Gol A/IV", "IV/a", "IVA"] },

  // Golongan B
  { id: 5, nama: "Juru Muda Tingkat I", golongan: "B/I", aliasGolongan: ["B/I", "B/1", "Gol B/I", "I/b", "IB"] },
  { id: 6, nama: "Pengatur Muda Tingkat I", golongan: "B/II", aliasGolongan: ["B/II", "B/2", "Gol B/II", "II/b", "IIB"] },
  { id: 7, nama: "Penata Muda Tingkat I", golongan: "B/III", aliasGolongan: ["B/III", "B/3", "Gol B/III", "III/b", "IIIB"] },
  { id: 8, nama: "Pembina Tingkat I", golongan: "B/IV", aliasGolongan: ["B/IV", "B/4", "Gol B/IV", "IV/b", "IVB"] },

  // Golongan C
  { id: 9, nama: "Juru", golongan: "C/I", aliasGolongan: ["C/I", "C/1", "Gol C/I", "I/c", "IC"] },
  { id: 10, nama: "Pengatur", golongan: "C/II", aliasGolongan: ["C/II", "C/2", "Gol C/II", "II/c", "IIC"] },
  { id: 11, nama: "Penata", golongan: "C/III", aliasGolongan: ["C/III", "C/3", "Gol C/III", "III/c", "IIIC"] },
  { id: 12, nama: "Pembina Utama Muda", golongan: "C/IV", aliasGolongan: ["C/IV", "C/4", "Gol C/IV", "IV/c", "IVC"] },

  // Golongan D
  { id: 13, nama: "Juru Tingkat I", golongan: "D/I", aliasGolongan: ["D/I", "D/1", "Gol D/I", "I/d", "ID"] },
  { id: 14, nama: "Pengatur Tingkat I", golongan: "D/II", aliasGolongan: ["D/II", "D/2", "Gol D/II", "II/d", "IID"] },
  { id: 15, nama: "Penata Tingkat I", golongan: "D/III", aliasGolongan: ["D/III", "D/3", "Gol D/III", "III/d", "IIID"] },
  { id: 16, nama: "Pembina Utama Madya", golongan: "D/IV", aliasGolongan: ["D/IV", "D/4", "Gol D/IV", "IV/d", "IVD"] },

  // Golongan E
  { id: 17, nama: "Pembina Utama", golongan: "E/IV", aliasGolongan: ["E/IV", "E/4", "Gol E/IV", "IV/e", "IVE"] },
]
