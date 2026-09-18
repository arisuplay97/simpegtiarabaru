export interface PangkatItem {
  id: number
  nama: string
  golongan: string
  aliasGolongan: string[]
}

export const daftarPangkat: PangkatItem[] = [
  { id: 1, nama: "Juru Muda", golongan: "I/a", aliasGolongan: ["A/I", "I/a", "IA"] },
  { id: 2, nama: "Juru Muda Tingkat I", golongan: "I/b", aliasGolongan: ["B/I", "I/b", "IB"] },
  { id: 3, nama: "Juru", golongan: "I/c", aliasGolongan: ["C/I", "I/c", "IC"] },
  { id: 4, nama: "Juru Tingkat I", golongan: "I/d", aliasGolongan: ["D/I", "I/d", "ID"] },
  { id: 5, nama: "Pengatur Muda", golongan: "II/a", aliasGolongan: ["A/II", "II/a", "IIA"] },
  { id: 6, nama: "Pengatur Muda Tingkat I", golongan: "II/b", aliasGolongan: ["B/II", "II/b", "IIB"] },
  { id: 7, nama: "Pengatur", golongan: "II/c", aliasGolongan: ["C/II", "II/c", "IIC"] },
  { id: 8, nama: "Pengatur Tingkat I", golongan: "II/d", aliasGolongan: ["D/II", "II/d", "IID"] },
  { id: 9, nama: "Penata Muda", golongan: "III/a", aliasGolongan: ["A/III", "III/a", "IIIA"] },
  { id: 10, nama: "Penata Muda Tingkat I", golongan: "III/b", aliasGolongan: ["B/III", "III/b", "IIIB"] },
  { id: 11, nama: "Penata", golongan: "III/c", aliasGolongan: ["C/III", "III/c", "IIIC"] },
  { id: 12, nama: "Penata Tingkat I", golongan: "III/d", aliasGolongan: ["D/III", "III/d", "IIID"] },
  { id: 13, nama: "Pembina", golongan: "IV/a", aliasGolongan: ["A/IV", "IV/a", "IVA"] },
  { id: 14, nama: "Pembina Tingkat I", golongan: "IV/b", aliasGolongan: ["B/IV", "IV/b", "IVB"] },
  { id: 15, nama: "Pembina Utama Muda", golongan: "IV/c", aliasGolongan: ["C/IV", "IV/c", "IVC"] },
  { id: 16, nama: "Pembina Utama Madya", golongan: "IV/d", aliasGolongan: ["D/IV", "IV/d", "IVD"] },
  { id: 17, nama: "Pembina Utama", golongan: "IV/e", aliasGolongan: ["E/IV", "IV/e", "IVE"] },
]
