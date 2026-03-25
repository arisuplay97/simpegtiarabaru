import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Mapping for roles/types to atasan logic
const getAtasanOtomatis = (tipe: string, bidangNama: string, kepalaBidang?: string, direkturAtasan?: string) => {
  const lowerTipe = tipe.toLowerCase()
  const isCabang = bidangNama.toLowerCase().includes('cabang')
  const areaName = isCabang ? bidangNama.replace(/cabang/i, '').trim() : bidangNama

  switch (lowerTipe) {
    case "staff":
      return `Kasubbid ${bidangNama || "-"}`
    case "kasubbid":
      return kepalaBidang || `Kepala Bidang ${bidangNama || "-"}`
    case "kepala_bidang":
      return direkturAtasan || "Direktur Utama"
    case "staff_cabang":
      return `Kasubbid Cabang ${areaName || "-"}`
    case "kasubbid_cabang":
      return kepalaBidang || `Kepala Cabang ${areaName || "-"}`
    case "kepala_cabang":
      return direkturAtasan || "Direktur Umum"
    case "kontrak":
      return `Kasubbid ${bidangNama || "-"}`
    default:
      return null
  }
}

async function main() {
  const allEmployees = await prisma.pegawai.findMany({
    include: { bidang: true }
  })

  console.log(`Found ${allEmployees.length} employees. checking atasanLangsung...`)

  for (const emp of allEmployees) {
    if (!emp.atasanLangsung || emp.atasanLangsung === "-" || emp.atasanLangsung === "") {
        const atasan = getAtasanOtomatis(
            emp.tipeJabatan, 
            emp.bidang?.nama || "Umum",
            emp.bidang?.kepalaBidang,
            emp.bidang?.direkturAtasan
        )
        
        if (atasan) {
            console.log(`Updating ${emp.nama} (${emp.tipeJabatan}) -> Atasan: ${atasan}`)
            await prisma.pegawai.update({
                where: { id: emp.id },
                data: { atasanLangsung: atasan }
            })
        }
    }
  }
  console.log("Done!")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
