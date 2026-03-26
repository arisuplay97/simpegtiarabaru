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
  const startIdx = lines[0].toLowerCase().includes("nik") || lines[0].toLowerCase().includes("nama") ? 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    if (cols.length < 3) continue

    // Support: NIK, Nama (opsional), Tanggal, Jam Masuk, Jam Keluar
    // Deteksi kolom nama: jika col[1] bukan tanggal valid
    let nik = cols[0]
    let tanggal = ""
    let jamMasuk = ""
    let jamKeluar = ""

    // Test apakah cols[1] adalah tanggal
    if (/^\d{4}-\d{2}-\d{2}/.test(cols[1])) {
      tanggal = cols[1]; jamMasuk = cols[2] || ""; jamKeluar = cols[3] || ""
    } else {
      // cols[1] = nama, cols[2] = tanggal
      tanggal = cols[2] || ""; jamMasuk = cols[3] || ""; jamKeluar = cols[4] || ""
    }

    if (!nik || !tanggal) continue
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

  // Buat record import
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
      // Cari pegawai berdasarkan NIK
      const pegawai = await prisma.pegawai.findUnique({ where: { nik: row.nik } })
      if (!pegawai) throw new Error(`NIK ${row.nik} tidak terdaftar`)

      const tanggal = new Date(row.tanggal)
      const startDay = new Date(tanggal); startDay.setHours(0, 0, 0, 0)
      const endDay = new Date(tanggal); endDay.setHours(23, 59, 59, 999)

      // Parse jam
      const parseJam = (jam: string) => {
        const [h, m] = jam.split(":").map(Number)
        const d = new Date(tanggal)
        d.setHours(h, m, 0, 0)
        return d
      }

      const jamMasuk = row.jamMasuk ? parseJam(row.jamMasuk) : undefined
      const jamKeluar = row.jamKeluar ? parseJam(row.jamKeluar) : undefined

      // Tentukan status absensi berdasarkan pengaturan
      const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
      const batasTerlambat = pengaturan?.batasTerlambat ?? 15
      let status: "HADIR" | "TERLAMBAT" | "ALPA" = "HADIR"
      if (jamMasuk && pengaturan?.jamMasuk) {
        const [bH, bM] = pengaturan.jamMasuk.split(":").map(Number)
        const batasJam = new Date(tanggal); batasJam.setHours(bH, bM + batasTerlambat, 0, 0)
        if (jamMasuk > batasJam) status = "TERLAMBAT"
      }

      // Upsert absensi
      const existing = await prisma.absensi.findFirst({
        where: { pegawaiId: pegawai.id, tanggal: { gte: startDay, lte: endDay } },
      })

      if (existing) {
        await prisma.absensi.update({
          where: { id: existing.id },
          data: { status, jamMasuk, jamKeluar },
        })
      } else {
        await prisma.absensi.create({
          data: {
            pegawaiId: pegawai.id,
            tanggal,
            status,
            jamMasuk,
            jamKeluar,
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
