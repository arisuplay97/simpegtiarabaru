import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync("123456", 10)

  const users = [
    {
      email: "superadmin@tiara.com",
      password: password,
      role: "SUPERADMIN",
    },
    {
      email: "hrd@tiara.com",
      password: password,
      role: "HRD",
    },
    {
      email: "direksi@tiara.com",
      password: password,
      role: "DIREKSI",
    },
    {
      email: "pegawai@tiara.com",
      password: password,
      role: "PEGAWAI",
    },
  ]

  console.log("Seeding users...")

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: user.password,
        role: user.role as any,
      },
    })
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
