'use server'

// lib/actions/audit-log.ts
// Tambahkan ke proyek: lib/actions/audit-log.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// ============================================================
// HELPER: Catat audit log dari mana saja (server action / API)
// Contoh pemakaian:
//   await logAudit({ action: "UPDATE", module: "pegawai", targetId: id, targetName: nama, oldData, newData })
// ============================================================
export async function logAudit({
  action,
  module,
  targetId,
  targetName,
  oldData,
  newData,
}: {
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "IMPORT" | "APPROVE" | "REJECT"
  module: string
  targetId?: string
  targetName?: string
  oldData?: object
  newData?: object
}) {
  try {
    const session = await auth()
    if (!session?.user) return

    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const ua = headersList.get("user-agent") || "unknown"

    await prisma.auditLog.create({
      data: {
        userId: session.user.id!,
        userEmail: session.user.email!,
        userRole: (session.user as any).role || "PEGAWAI",
        action,
        module,
        targetId,
        targetName,
        oldData: oldData ? (oldData as any) : undefined,
        newData: newData ? (newData as any) : undefined,
        ipAddress: ip,
        userAgent: ua,
      },
    })
  } catch (e) {
    // Jangan sampai audit log error menghentikan proses utama
    console.error("[AuditLog Error]", e)
  }
}

// ============================================================
// GET AUDIT LOGS (untuk halaman admin)
// ============================================================
export async function getAuditLogs({
  page = 1,
  limit = 50,
  module,
  action,
  search,
  dateFrom,
  dateTo,
}: {
  page?: number
  limit?: number
  module?: string
  action?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const where: any = {}

  if (module && module !== "all") where.module = module
  if (action && action !== "all") where.action = action
  if (search) {
    where.OR = [
      { userEmail: { contains: search, mode: "insensitive" } },
      { targetName: { contains: search, mode: "insensitive" } },
    ]
  }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ============================================================
// EXPORT AUDIT LOG ke CSV (untuk compliance/audit)
// ============================================================
export async function exportAuditLogCSV(filters: {
  module?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "SUPERADMIN") {
    return { error: "Hanya SUPERADMIN yang bisa export audit log" }
  }

  const where: any = {}
  if (filters.module && filters.module !== "all") where.module = filters.module
  if (filters.action && filters.action !== "all") where.action = filters.action
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) {
      const end = new Date(filters.dateTo)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
  })

  const header = "Waktu,User,Role,Aksi,Modul,Target,IP\n"
  const rows = logs.map((l) =>
    [
      new Date(l.createdAt).toLocaleString("id-ID"),
      l.userEmail,
      l.userRole,
      l.action,
      l.module,
      l.targetName || l.targetId || "-",
      l.ipAddress || "-",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  )

  await logAudit({ action: "EXPORT", module: "audit-log", targetName: "Export CSV Audit Log" })

  return { csv: header + rows.join("\n") }
}
