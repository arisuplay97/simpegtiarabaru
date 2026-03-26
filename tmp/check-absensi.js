const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const absensi = await prisma.absensi.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { pegawai: true }
  })
  console.log(JSON.stringify(absensi, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
