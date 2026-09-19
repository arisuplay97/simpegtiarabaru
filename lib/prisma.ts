import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_GCm8zbpPhLi3@ep-patient-tree-a18agacl-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
