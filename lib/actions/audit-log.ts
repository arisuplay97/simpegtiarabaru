'use server'

// lib/actions/audit-log.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function logAudit({
  action,
  module,
  targetId,
  targetName,
  oldData,
  newData,
}: {
  action: string
  module: string
  targetId?: string
  targetName?: string
  oldData?: any
  newData?: any
}) {
  try {
    const session = await auth()
    const head = await headers()
    const ip = head.get("x-forwarded-for") || "127.0.0.1"
    const userAgent = head.get("user-agent") || "unknown"

    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || "SYSTEM",
        action,
        module,
        targetId,
        targetName,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ipAddress: ip,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Audit Log Error:", error)
  }
}

export async function getAuditLogs(params: {
  module?: string
  action?: string
  page?: number
  limit?: number
}) {
  const { module, action, page = 1, limit = 50 } = params
  const skip = (page - 1) * limit

  const where: any = {}
  if (module && module !== "all") where.module = module
  if (action && action !== "all") where.action = action

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { nama: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, pages: Math.ceil(total / limit) }
}

export async function exportAuditLogCSV() {
  const data = await prisma.auditLog.findMany({
    include: { user: { select: { nama: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  })

  const header = "Waktu,User,Aksi,Modul,Target,IP\n"
  const rows = data.map((l) => {
    return `${l.createdAt.toISOString()},${l.user?.nama || "Unknown"},${l.action},${l.module},${l.targetName || "-"},${l.ipAddress}`
  })

  return header + rows.join("\n")
}
