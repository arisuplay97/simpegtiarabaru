import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cabang = await prisma.bidang.upsert({
    where: { nama: 'Cabang 12 Lombok Tengah' },
    update: {},
    create: {
      nama: 'Cabang 12 Lombok Tengah',
      kode: 'C12LT',
      kepalaBidang: 'Ahmad Fauzi',
      direkturAtasan: 'Direktur Umum',
      aktif: true,
      subBidang: {
        create: [
          { nama: 'Pelayanan Cabang' },
          { nama: 'Teknik Cabang' }
        ]
      }
    }
  })
  console.log('Cabang created:', cabang)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
