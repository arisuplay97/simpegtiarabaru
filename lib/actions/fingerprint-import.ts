'use server'

// lib/actions/fingerprint-import.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "./audit-log"

// ============================================================
// FORMAT FILE MESIN FINGERPRINT YANG DIDUKUNG:
//
// Format 1 — CSV standar (export dari mesin ZKTeco/Hikvision/dll):
//   NIK,Nama,Tanggal,Jam Masuk,Jam Keluar
//   100001,BUDI SANTOSO,2026-03-01,07:55,17:10
//
// Format 2 — TXT attendance log (baris per-event):
//   100001  2026-03-01 07:55:00  0  1   (NIK, datetime, terminal, event)
//   100001  2026-03-01 17:10:00  0  0
//
// Format 3 — Excel (.xlsx) dengan kolom serupa Format 1
// ============================================================

interface FingerprintRow {
  nik: string
  tanggal: string    // "2026-03-01"
  jamMasuk?: string  // "07:55"
  jamKeluar?: string // "17:10"
}

// Parse CSV fingerprint
function parseCSV(content: string): FingerprintRow[] {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: FingerprintRow[] = []

  // Skip header jika ada
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes("nik") || firstLine.includes("nama") || firstLine.includes("tanggal")
  const startIdx = hasHeader ? 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    // Support comma or semicolon
    const sep = line.includes(";") ? ";" : ","
    const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""))
    
    if (cols.length < 3) continue

    let nik = cols[0]
    let tanggal = ""
    let jamMasuk = ""
    let jamKeluar = ""

    // Fungsi deteksi apakah string adalah tanggal (YYYY-MM-DD atau M/D/YYYY atau D-M-YYYY)
    const isDate = (str: string) => {
      return /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(str)
    }

    if (isDate(cols[1])) {
      // Format: NIK, Tanggal, Jam Masuk, Jam Keluar
      tanggal = cols[1]; jamMasuk = cols[2] || ""; jamKeluar = cols[3] || ""
    } else if (cols.length > 2 && isDate(cols[2])) {
      // Format: NIK, Nama, Tanggal, Jam Masuk, Jam Keluar
      tanggal = cols[2]; jamMasuk = cols[3] || ""; jamKeluar = cols[4] || ""
    }

    if (!nik || !tanggal) continue

    // Normalisasi tanggal jika format D/M/YYYY atau M/D/YYYY
    if (tanggal.includes("/") || (tanggal.includes("-") && !tanggal.startsWith("20"))) {
      const sep = tanggal.includes("/") ? "/" : "-"
      const parts = tanggal.split(sep)
      if (parts.length === 3) {
        let [p1, p2, p3] = parts
        let d, m, y

        // Deteksi format: YYYY di awal atau di akhir
        if (p1.length === 4) {
          // YYYY-MM-DD (sudah standar, tapi handle jika pakai /)
          y = p1; m = p2; d = p3
        } else {
          // Format D/M/YYYY atau M/D/YYYY
          y = p3
          const v1 = parseInt(p1)
          const v2 = parseInt(p2)

          if (v1 > 12) {
            // Pasti D/M/YYYY
            d = p1; m = p2
          } else if (v2 > 12) {
            // Pasti M/D/YYYY
            m = p1; d = p2
          } else {
            // Ambigu (keduanya <= 12), default ke D/M/YYYY (standar Indonesia)
            d = p1; m = p2
          }
        }
        tanggal = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
      }
    }

    result.push({ nik, tanggal, jamMasuk: jamMasuk || undefined, jamKeluar: jamKeluar || undefined })
  }
  return result
}

// Parse TXT attendance log (ZKTeco format)
function parseTXT(content: string): FingerprintRow[] {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean)
  const eventMap = new Map<string, { masuk?: string; keluar?: string }>()

  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length < 2) continue
    const nik = parts[0]
    const datetime = parts[1] + " " + (parts[2] || "")
    const match = datetime.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/)
    if (!match) continue

    const tanggal = match[1]
    const jam = match[2]
    const eventCode = parts[parts.length - 1]
    const key = `${nik}__${tanggal}`

    const existing = eventMap.get(key) || {}
    // Event 1 = check-in, 0 = check-out (atau pakai waktu pertama/terakhir)
    if (!existing.masuk) existing.masuk = jam
    else existing.keluar = jam

    eventMap.set(key, existing)
  }

  return Array.from(eventMap.entries()).map(([key, val]) => {
    const [nik, tanggal] = key.split("__")
    return { nik, tanggal, jamMasuk: val.masuk, jamKeluar: val.keluar }
  })
}

// ============================================================
// IMPORT UTAMA
// ============================================================
export async function importFingerprint(formData: FormData) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const file = formData.get("file") as File
  if (!file) return { error: "File tidak ditemukan" }

  const fileName = file.name
  const ext = fileName.split(".").pop()?.toLowerCase()
  const content = await file.text()

  // Parse berdasarkan format
  let rows: FingerprintRow[] = []
  if (ext === "csv") {
    rows = parseCSV(content)
  } else if (ext === "txt" || ext === "dat") {
    rows = parseTXT(content)
  } else {
    return { error: "Format file tidak didukung. Gunakan .csv, .txt, atau .dat" }
  }

  if (rows.length === 0) return { error: "Tidak ada data valid yang bisa diparse dari file" }

    // Dapatkan timezoneOffset dari client (dalam menit)
    const rawOffset = formData.get("timezoneOffset")
    const timezoneOffset = Number(rawOffset) || 0
    
    // Fungsi konversi offset menit ke format [+HH:mm] atau [-HH:mm]
    const getOffsetString = (offsetMinutes: number) => {
      const sign = offsetMinutes <= 0 ? "+" : "-"
      const abs = Math.abs(offsetMinutes)
      const h = Math.floor(abs / 60).toString().padStart(2, "0")
      const m = (abs % 60).toString().padStart(2, "0")
      return `${sign}${h}:${m}`
    }
    const offsetStr = getOffsetString(timezoneOffset)
    
    // console.log(`[IMPORT] Received offset: ${timezoneOffset}m -> ${offsetStr}`)

    try {
      const importRecord = await prisma.importFingerprint.create({
        data: {
          namaFile: fileName,
          totalRecord: rows.length,
          status: "PROCESSING",
          uploadedBy: session.user.id!,
        },
      })

      let berhasil = 0
      let gagal = 0
      const errorLog: { row: number; nik: string; error: string }[] = []

      // Proses baris per baris
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          const pegawai = await prisma.pegawai.findUnique({ where: { nik: row.nik } })
          if (!pegawai) throw new Error(`NIK ${row.nik} tidak terdaftar`)

          const [y, mm, dd] = row.tanggal.split("-").map(Number)
          const dateStr = `${y}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`
          
          // Gunakan ISO format dengan offset agar diparse tepat ke UTC oleh Node.js/Prisma
          const tanggal = new Date(`${dateStr}T00:00:00${offsetStr}`)
          
          // Range pencarian
          const startDay = new Date(tanggal)
          const endDay = new Date(tanggal.getTime() + (24 * 60 * 60 * 1000) - 1)

          function parseJam(jamStr: string) {
            const cleanJam = jamStr.replace(/[.]/g, ":")
            const [h, m] = cleanJam.split(":").map(Number)
            const iso = `${dateStr}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00${offsetStr}`
            return new Date(iso)
          }

          const jamMasuk = row.jamMasuk ? parseJam(row.jamMasuk) : undefined
        const jamKeluar = row.jamKeluar ? parseJam(row.jamKeluar) : undefined

        // Tentukan status absensi berdasarkan pengaturan
        const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
        const batasTerlambat = pengaturan?.batasTerlambat ?? 15
        let status: "HADIR" | "TERLAMBAT" | "ALPA" = "HADIR"
        
        if (jamMasuk && pengaturan?.jamMasuk) {
          const [bH, bM] = pengaturan.jamMasuk.split(":").map(Number)
          // Batas jam juga harus diparse dengan offset yang sama agar sebanding
          const batasJam = new Date(Date.UTC(y, mm - 1, dd, bH, bM + batasTerlambat))
          const batasJamUTC = new Date(batasJam.getTime() + (timezoneOffset * 60 * 1000))
          
          if (jamMasuk > batasJamUTC) status = "TERLAMBAT"
        }

        const existing = await prisma.absensi.findFirst({
          where: { pegawaiId: pegawai.id, tanggal: { gte: startDay, lte: endDay } },
        })

        if (existing) {
          await prisma.absensi.update({
            where: { id: existing.id },
            data: { status, jamMasuk, jamKeluar, metode: "FINGERPRINT", importId: importRecord.id },
          })
        } else {
          await prisma.absensi.create({
            data: {
              pegawaiId: pegawai.id,
              tanggal,
              status,
              jamMasuk,
              jamKeluar,
              metode: "FINGERPRINT",
              importId: importRecord.id,
            },
          })
        }
        berhasil++
      } catch (e: any) {
        gagal++
        errorLog.push({ row: i + 1, nik: row.nik, error: e.message })
      }
    }

    // Update record import
    await prisma.importFingerprint.update({
      where: { id: importRecord.id },
      data: {
        berhasil,
        gagal,
        status: gagal === rows.length ? "GAGAL" : "SELESAI",
        errorLog: errorLog.length > 0 ? (errorLog as any) : undefined,
      },
    })

    await logAudit({
      action: "IMPORT",
      module: "absensi",
      targetId: importRecord.id,
      targetName: `Import Fingerprint: ${fileName} — ${berhasil}/${rows.length} berhasil`,
    })

    return { success: true, total: rows.length, berhasil, gagal, errorLog }
  } catch (error: any) {
    console.error("Import error:", error)
    return { error: `Gagal memproses import: ${error.message}` }
  }
}

// ============================================================
// GET RIWAYAT IMPORT
// ============================================================
export async function getRiwayatImport() {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return []
  }
  return prisma.importFingerprint.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}

// ============================================================
// HAPUS RIWAYAT IMPORT (ROLLBACK)
// ============================================================
export async function deleteImportRiwayat(importId: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Hapus data absensi yang terkait dengan import ini
      // Note: Karena kita pakai onDelete: SetNull di schema, kita harus hapus manual 
      // jika ingin benar-benar rollback.
      await tx.absensi.deleteMany({
        where: { importId: importId }
      })

      // 2. Hapus record riwayat import
      await tx.importFingerprint.delete({
        where: { id: importId }
      })

      await logAudit({
        action: "DELETE",
        module: "absensi",
        targetId: importId,
        targetName: `Hapus/Rollback Import Fingerprint`,
      })

      return { success: true }
    })
  } catch (error: any) {
    console.error("Delete import error:", error)
    return { error: `Gagal menghapus riwayat: ${error.message}` }
  }
}
