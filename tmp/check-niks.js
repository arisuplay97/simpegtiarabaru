const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const niks = ['312312', '12121331', '123444', '13671367']
  const pegawai = await prisma.pegawai.findMany({
    where: { nik: { in: niks } }
  })
  console.log(JSON.stringify(pegawai, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
