import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const bidangData = [
    { nama: "IT & Sistem",  kode: "IT",   kepalaBidang: "Ahmad Rizki Pratama",  direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "Keuangan",     kode: "KEU",  kepalaBidang: "Siti Nurhaliza",       direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Distribusi",   kode: "DIST", kepalaBidang: "Budi Santoso",         direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "Pelayanan",    kode: "PEL",  kepalaBidang: "Dewi Lestari",         direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Produksi",     kode: "PROD", kepalaBidang: "Ir. Gunawan Wibowo",   direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "SDM & Umum",   kode: "SDM",  kepalaBidang: "Fitri Handayani",      direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Direksi",      kode: "DIR",  kepalaBidang: "Ir. Joko Widagdo",     direkturAtasan: "Dewan Pengawas",   aktif: true },
  ]

  for (const b of bidangData) {
    await prisma.bidang.upsert({
      where: { kode: b.kode },
      update: b,
      create: b,
    })
  }
  console.log("Bidang seeded!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
