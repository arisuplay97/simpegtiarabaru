'use server'

// lib/actions/pph21.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "./audit-log"
import { startOfMonth, endOfMonth } from "date-fns"

// ============================================================
// PTKP 2024 (Peraturan Menteri Keuangan terbaru)
// ============================================================
const PTKP: Record<string, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0":  58_500_000,
  "K/1":  63_000_000,
  "K/2":  67_500_000,
  "K/3":  72_000_000,
  "HB/0": 112_500_000, // Kawin + istri berpenghasilan
}

// ============================================================
// Tarif PPh 21 Progresif (UU HPP 2021) — berlaku s.d. sekarang
// ============================================================
function hitungPPh21Progresif(pkp: number): number {
  let pajak = 0
  if (pkp <= 60_000_000)        { pajak = pkp * 0.05 }
  else if (pkp <= 250_000_000)  { pajak = 60_000_000 * 0.05 + (pkp - 60_000_000) * 0.15 }
  else if (pkp <= 500_000_000)  { pajak = 60_000_000 * 0.05 + 190_000_000 * 0.15 + (pkp - 250_000_000) * 0.25 }
  else if (pkp <= 5_000_000_000){ pajak = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + (pkp - 500_000_000) * 0.30 }
  else                           { pajak = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + 4_500_000_000 * 0.30 + (pkp - 5_000_000_000) * 0.35 }
  return Math.round(pajak)
}

// ============================================================
// HITUNG PPh 21 satu pegawai untuk satu bulan
// ============================================================
export async function hitungPPh21Pegawai({
  gajiPokok,
  tunjangan,
  lemburBayar = 0,
  ptkpKode,
  metode = "GROSS",
  iuranPensiunEmp = 0,
}: {
  gajiPokok: number
  tunjangan: number
  lemburBayar?: number
  ptkpKode: string
  metode?: "GROSS" | "GROSS_UP" | "NET"
  iuranPensiunEmp?: number
}) {
  const penghasilanBrutoSebulan = gajiPokok + tunjangan + lemburBayar
  const penghasilanBrutoSetahun = penghasilanBrutoSebulan * 12

  // Biaya jabatan: 5%, maks Rp 6.000.000/tahun
  const biayaJabatan = Math.min(penghasilanBrutoSetahun * 0.05, 6_000_000)

  // Iuran pensiun pegawai (jika ada)
  const iuranSetahun = iuranPensiunEmp * 12

  const penghasilanNettoSetahun = penghasilanBrutoSetahun - biayaJabatan - iuranSetahun

  const ptkpNilai = PTKP[ptkpKode] ?? PTKP["TK/0"]
  const pkp = Math.max(0, Math.floor((penghasilanNettoSetahun - ptkpNilai) / 1000) * 1000)

  let pph21Setahun = hitungPPh21Progresif(pkp)

  // Gross-up: naikkan gaji agar PPh 21 pas dibayar dari tambahan gaji
  if (metode === "GROSS_UP") {
    // Iterasi pendekatan gross-up
    let grossUpAmount = pph21Setahun
    for (let i = 0; i < 5; i++) {
      const newBruto = penghasilanBrutoSetahun + grossUpAmount
      const newBiaya = Math.min(newBruto * 0.05, 6_000_000)
      const newNetto = newBruto - newBiaya - iuranSetahun
      const newPkp = Math.max(0, Math.floor((newNetto - ptkpNilai) / 1000) * 1000)
      grossUpAmount = hitungPPh21Progresif(newPkp)
    }
    pph21Setahun = grossUpAmount
  }

  const pph21Sebulan = Math.round(pph21Setahun / 12)

  return {
    penghasilanBruto: penghasilanBrutoSebulan,
    biayaJabatan: Math.round(biayaJabatan / 12),
    iuranPensiunEmp,
    penghasilanNetto: Math.round((penghasilanNettoSetahun) / 12),
    ptkpKode,
    ptkpNilai,
    pkp,
    pph21Setahun,
    pph21Sebulan,
  }
}

// ============================================================
// PROSES PPh 21 SELURUH PEGAWAI (batch per periode)
// ============================================================
export async function prosesPPh21Batch(periodStr: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const date = new Date(periodStr + "-01")
  const start = startOfMonth(date)
  const end = endOfMonth(date)

  // Ambil semua pegawai aktif + data payroll bulan ini
  const pegawaiList = await prisma.pegawai.findMany({
    where: { status: "AKTIF" },
    include: {
      payroll: { where: { bulan: { gte: start, lte: end } } },
    },
  })

  let berhasil = 0
  let gagal = 0
  const errors: string[] = []

  for (const peg of pegawaiList) {
    try {
      const pr = peg.payroll[0]
      const gajiPokok = pr ? Number(pr.gajiPokok) : Number(peg.gajiPokok)
      const tunjangan = pr ? Number(pr.tunjangan) : Number(peg.tunjangan)
      const lemburBayar = 0 // TODO: sambungkan ke tabel Lembur nanti

      // Tentukan PTKP dari status nikah & tipe jabatan
      let ptkpKode = "TK/0"
      if (peg.statusNikah === "MENIKAH") ptkpKode = "K/0"

      const hasil = await hitungPPh21Pegawai({ gajiPokok, tunjangan, lemburBayar, ptkpKode })

      await prisma.pPh21.upsert({
        where: { pegawaiId_periode: { pegawaiId: peg.id, periode: start } },
        update: {
          gajiPokok, tunjangan, lemburBayar: lemburBayar,
          penghasilanBruto: hasil.penghasilanBruto,
          biayaJabatan: hasil.biayaJabatan,
          iuranPensiunEmp: hasil.iuranPensiunEmp,
          penghasilanNetto: hasil.penghasilanNetto,
          ptkpKode: hasil.ptkpKode,
          ptkpNilai: hasil.ptkpNilai,
          pkp: hasil.pkp,
          pph21Setahun: hasil.pph21Setahun,
          pph21Sebulan: hasil.pph21Sebulan,
        },
        create: {
          pegawaiId: peg.id, periode: start,
          gajiPokok, tunjangan, lemburBayar: lemburBayar,
          penghasilanBruto: hasil.penghasilanBruto,
          biayaJabatan: hasil.biayaJabatan,
          iuranPensiunEmp: hasil.iuranPensiunEmp,
          penghasilanNetto: hasil.penghasilanNetto,
          ptkpKode: hasil.ptkpKode,
          ptkpNilai: hasil.ptkpNilai,
          pkp: hasil.pkp,
          pph21Setahun: hasil.pph21Setahun,
          pph21Sebulan: hasil.pph21Sebulan,
          metodePotong: "GROSS",
        },
      })
      berhasil++
    } catch (e: any) {
      gagal++
      errors.push(`${peg.nama}: ${e.message}`)
    }
  }

  await logAudit({
    action: "CREATE",
    module: "pph21",
    targetName: `Proses PPh21 Batch ${periodStr} — ${berhasil} berhasil, ${gagal} gagal`,
  })

  return { berhasil, gagal, errors }
}

// ============================================================
// GET DAFTAR PPh 21 per periode
// ============================================================
export async function getPPh21List(periodStr: string) {
  const session = await auth()
  if (!session?.user) return { error: "Belum login" }

  const date = new Date(periodStr + "-01")
  const start = startOfMonth(date)
  const end = endOfMonth(date)

  const data = await prisma.pPh21.findMany({
    where: { periode: { gte: start, lte: end } },
    include: { pegawai: { include: { bidang: true } } },
    orderBy: { pegawai: { nama: "asc" } },
  })

  return {
    data: data.map((r) => ({
      id: r.id,
      pegawaiId: r.pegawaiId,
      nama: r.pegawai.nama,
      nik: r.pegawai.nik,
      unit: r.pegawai.bidang?.nama || "Umum",
      golongan: r.pegawai.golongan,
      gajiPokok: Number(r.gajiPokok),
      tunjangan: Number(r.tunjangan),
      penghasilanBruto: Number(r.penghasilanBruto),
      biayaJabatan: Number(r.biayaJabatan),
      penghasilanNetto: Number(r.penghasilanNetto),
      ptkpKode: r.ptkpKode,
      ptkpNilai: Number(r.ptkpNilai),
      pkp: Number(r.pkp),
      pph21Setahun: Number(r.pph21Setahun),
      pph21Sebulan: Number(r.pph21Sebulan),
      metode: r.metodePotong,
    })),
  }
}

// ============================================================
// EXPORT e-SPT / Bukti Potong (format CSV untuk DJP Online)
// ============================================================
export async function exportESPT(periodStr: string) {
  const session = await auth()
  if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
    return { error: "Akses ditolak" }
  }

  const result = await getPPh21List(periodStr)
  if ("error" in result) return result

  const header = "No,NPWP Pegawai,Nama Pegawai,Golongan,PTKP,Penghasilan Bruto,Biaya Jabatan,Penghasilan Netto,PKP,PPh21 Sebulan\n"
  const rows = result.data.map((r, i) =>
    [i + 1, "-", r.nama, r.golongan, r.ptkpKode,
      r.penghasilanBruto, r.biayaJabatan, r.penghasilanNetto,
      r.pkp, r.pph21Sebulan]
      .map((v) => `"${v}"`).join(",")
  )

  await logAudit({
    action: "EXPORT",
    module: "pph21",
    targetName: `Export e-SPT PPh21 ${periodStr}`,
  })

  return { csv: header + rows.join("\n") }
}
