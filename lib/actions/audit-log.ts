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
        userEmail: session?.user?.email || "SYSTEM",
        userRole: (session?.user as any)?.role || "SYSTEM",
        action,
        module,
        targetId,
        targetName,
        oldData: oldData || null,
        newData: newData || null,
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
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}) {
  const { module, action, search, dateFrom, dateTo, page = 1, limit = 50 } = params
  const skip = (page - 1) * limit

  const where: any = {}
  if (module && module !== "all") where.module = module
  if (action && action !== "all") where.action = action
  
  if (search) {
    where.OR = [
      { userEmail: { contains: search, mode: "insensitive" } },
      { targetName: { contains: search, mode: "insensitive" } },
      { module: { contains: search, mode: "insensitive" } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const dTo = new Date(dateTo)
      dTo.setHours(23, 59, 59, 999)
      where.createdAt.lte = dTo
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, pages: Math.ceil(total / limit) }
}

export async function exportAuditLogCSV(params: {
  module?: string
  action?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  const { module, action, dateFrom, dateTo } = params
  const where: any = {}
  if (module && module !== "all") where.module = module
  if (action && action !== "all") where.action = action
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const dTo = new Date(dateTo)
      dTo.setHours(23, 59, 59, 999)
      where.createdAt.lte = dTo
    }
  }

  const data = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  })

  const header = "Waktu,User,Aksi,Modul,Target,IP\n"
  const rows = data.map((l) => {
    return `${l.createdAt.toISOString()},${l.userEmail},${l.action},${l.module},${l.targetName || "-"},${l.ipAddress}`
  })

  return { csv: header + rows.join("\n") }
}
