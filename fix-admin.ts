import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const superuser = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  })
  
  if (!superuser) {
    console.log("Superadmin user not found.")
    return
  }
  
  const existingPegawai = await prisma.pegawai.findUnique({
    where: { userId: superuser.id }
  })
  
  if (existingPegawai) {
    console.log("Superadmin already has a Pegawai profile.")
    return
  }
  
  console.log("Creating Pegawai profile for Superadmin...")
  await prisma.pegawai.create({
    data: {
      userId: superuser.id,
      nik: "0000000000000000",
      nama: superuser.name || "Super Admin",
      email: superuser.email || "superadmin@example.com",
      jabatan: "Administrator Sistem",
      tipeJabatan: "STAFF",
      golongan: "A/I",
      status: "AKTIF",
      tanggalMasuk: new Date(),
    }
  })
  console.log("Successfully created Pegawai profile for Superadmin!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
