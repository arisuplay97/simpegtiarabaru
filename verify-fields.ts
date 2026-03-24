import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Checking fields...")
  
  // Check Pengaturan
  const p = await prisma.pengaturan.findUnique({ where: { id: "1" } })
  console.log("Pengaturan batasCheckin:", p?.batasCheckin)
  
  // Check Pegawai
  const e = await prisma.pegawai.findFirst({
    select: {
      bebasAbsensi: true,
      lokasiAbsensiId: true
    }
  })
  console.log("Pegawai bebasAbsensi:", e?.bebasAbsensi)
  console.log("Pegawai lokasiAbsensiId:", e?.lokasiAbsensiId)
}

main()
  .catch(e => {
    console.error("Verification failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
