// seed-lokasi.ts — Masukkan data lokasi default ke database
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const defaults = [
    {
      nama: "Kantor Pusat PDAM Tirta Ardhia Rinjani",
      tipe: "kantor_pusat",
      alamat: "Jl. Raya Praya No. 1, Lombok Tengah, NTB",
      latitude: -8.7236,
      longitude: 116.2934,
      radius: 100,
      aktif: true,
    },
    {
      nama: "Kantor Cabang Utara",
      tipe: "kantor_cabang",
      alamat: "Jl. Soekarno Hatta No. 45, Lombok Utara, NTB",
      latitude: -8.3612,
      longitude: 116.1723,
      radius: 100,
      aktif: true,
    },
    {
      nama: "Kantor Cabang Selatan",
      tipe: "kantor_cabang",
      alamat: "Jl. Bypass Mandalika No. 12, Lombok Selatan, NTB",
      latitude: -8.9012,
      longitude: 116.3456,
      radius: 100,
      aktif: true,
    },
  ]

  for (const loc of defaults) {
    const exists = await prisma.lokasiAbsensi.findFirst({
      where: { nama: loc.nama }
    })
    if (!exists) {
      await prisma.lokasiAbsensi.create({ data: loc })
      console.log(`✅ Lokasi "${loc.nama}" berhasil ditambahkan`)
    } else {
      console.log(`⏭️  Lokasi "${loc.nama}" sudah ada, dilewati`)
    }
  }
}

main()
  .then(() => { console.log("Seed lokasi selesai!"); process.exit(0) })
  .catch(e => { console.error(e); process.exit(1) })
