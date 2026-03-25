'use server'

// lib/actions/fingerprint-import.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "./audit-log"
import { revalidatePath } from "next/cache"

export async function importFingerprint(data: {
  fileName: string
  fileType: string
  records: any[]
}) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  let berhasil = 0
  let gagal = 0
  const errorLog: any[] = []

  for (const rec of data.records) {
    try {
      const pegawai = await prisma.pegawai.findUnique({ where: { nik: rec.nik } })
      if (!pegawai) {
        gagal++
        errorLog.push({ nik: rec.nik, error: "Pegawai tidak ditemukan" })
        continue
      }

      const tanggal = new Date(rec.tanggal)
      const absensi = await prisma.absensi.upsert({
        where: { pegawaiId_tanggal: { pegawaiId: pegawai.id, tanggal } },
        update: {
          jamMasuk: rec.jamMasuk || undefined,
          jamKeluar: rec.jamKeluar || undefined,
          status: "HADIR",
        },
        create: {
          pegawaiId: pegawai.id,
          tanggal,
          jamMasuk: rec.jamMasuk,
          jamKeluar: rec.jamKeluar,
          status: "HADIR",
        },
      })
      berhasil++
    } catch (e: any) {
      gagal++
      errorLog.push({ nik: rec.nik, error: e.message })
    }
  }

  await prisma.importFingerprint.create({
    data: {
      fileName: data.fileName,
      totalRecord: data.records.length,
      berhasil,
      gagal,
      status: gagal === 0 ? "SUCCESS" : "PARTIAL",
      errorLog: JSON.stringify(errorLog),
      processedBy: session.user.email!,
    },
  })

  await logAudit({ action: "IMPORT", module: "absensi", targetName: `Import Fingerprint: ${data.fileName}` })
  revalidatePath("/absensi/import-fingerprint")
  return { berhasil, gagal, errorLog }
}

export async function getRiwayatImport() {
  return prisma.importFingerprint.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}
