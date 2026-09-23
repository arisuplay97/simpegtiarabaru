import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { jsPDF } from "jspdf"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Helper: Format NIK 7 digit dengan spasi seperti berkas fisik PDAM ("20 02 136")
function formatNikDisplay(nik: string | null | undefined): string {
  if (!nik) return "-"
  const clean = nik.replace(/\s+/g, "")
  if (clean.length === 7) {
    return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`
  }
  return clean
}

// Helper: Format Golongan ke bentuk ringkas ("C2", "B4", dst.)
function formatGolonganDisplay(gol: string | null | undefined): string {
  if (!gol || gol === "-") return "-"
  let g = gol.trim()
  // Jika bentuk C/II -> C2, B/IV -> B4
  if (g.includes("/")) {
    const [huruf, ruang] = g.split("/")
    const romanMap: Record<string, string> = {
      "I": "1", "II": "2", "III": "3", "IV": "4",
      "i": "1", "ii": "2", "iii": "3", "iv": "4",
      "1": "1", "2": "2", "3": "3", "4": "4"
    }
    return `${huruf.toUpperCase()}${romanMap[ruang] || ruang}`
  }
  return g.toUpperCase()
}

// Helper: Format Status Pegawai ke istilah resmi PDAM
function formatStatusDisplay(status: string | null | undefined, tipeJabatan: string | null | undefined): string {
  const tj = (tipeJabatan || "").toUpperCase()
  const st = (status || "").toUpperCase()
  if (tj === "KONTRAK") return "Honorer"
  if (st === "AKTIF") return "Pegawai Tetap"
  if (st === "CUTI") return "Cuti"
  if (st === "NON_AKTIF") return "Non-Aktif"
  if (st === "PENSIUN") return "Pensiun"
  return status || "Pegawai Tetap"
}

// Helper: Format Pendidikan Terakhir
function formatPendidikanDisplay(pendidikan: string | null | undefined, jurusan: string | null | undefined): string {
  if (!pendidikan) return "-"
  if (jurusan && jurusan.trim() && jurusan !== "-") {
    return `${pendidikan} ${jurusan}`.trim()
  }
  return pendidikan
}

// Hierarki urutan unit kerja PDAM
const UNIT_KERJA_ORDER = [
  "satuan pengawas intern",
  "sekretariat perusahaan",
  "hubungan langganan",
  "keuangan",
  "perencana & pengawasan teknik",
  "perawatan",
  "transmisi & distribusi",
  "umum dan sdm",
  "produksi",
  "cabang praya",
  "cabang praya tengah",
  "cabang praya barat",
  "cabang praya barat daya",
  "cabang praya timur",
  "cabang jonggat",
  "cabang pringgarata",
  "cabang kopang",
  "cabang batukliang",
  "cabang batukliang utara",
  "cabang janapria",
  "cabang pujut",
  "cabang kuta",
  "pos bodak",
  "pos darmaji",
  "direksi",
]

function getUnitOrder(namaUnit: string): number {
  const lower = (namaUnit || "").toLowerCase().trim()
  const idx = UNIT_KERJA_ORDER.findIndex(u => lower.includes(u) || u.includes(lower))
  return idx !== -1 ? idx : 999
}

function getJabatanRank(jabatan: string, tipeJabatan: string): number {
  const j = (jabatan || "").toLowerCase()
  const t = (tipeJabatan || "").toLowerCase()
  if (j.includes("direktur utama") || j.includes("dirut")) return 1
  if (j.includes("direktur")) return 2
  if (j.includes("kepala bidang") || j.includes("kabid") || j.includes("kepala cabang") || t === "kepala_bidang" || t === "kepala_cabang") return 3
  if (j.startsWith("kasubbid") || j.startsWith("kasubbag") || t.includes("kasubbid")) return 4
  if (j.includes("staf ahli") || t.includes("staf_ahli")) return 5
  if (j.includes("staf") || t.includes("staff")) return 6
  return 7
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "excel-bidang"
    const filterSearch = searchParams.get("search")?.toLowerCase().trim() || ""
    const filterStatus = searchParams.get("status") || ""
    const filterBidang = searchParams.get("bidang") || ""
    const filterGolongan = searchParams.get("golongan") || ""

    // Bangun where clause berdasarkan filter aktif
    const where: any = {}
    if (filterStatus) {
      where.status = filterStatus
    }
    if (filterBidang && filterBidang !== "pusat" && filterBidang !== "cabang") {
      where.bidangId = filterBidang
    }
    if (filterGolongan) {
      where.golongan = filterGolongan
    }
    if (filterSearch) {
      where.OR = [
        { nama: { contains: filterSearch, mode: 'insensitive' } },
        { nik: { contains: filterSearch } },
        { jabatan: { contains: filterSearch, mode: 'insensitive' } },
      ]
    }

    // Ambil data pegawai dengan filter yang diterapkan
    let employees = await prisma.pegawai.findMany({
      where,
      include: {
        bidang: true,
        subBidang: true,
        user: { select: { email: true, username: true, role: true } },
      },
    })

    // Filter tambahan untuk "pusat" / "cabang" yang tidak bisa di-query langsung
    if (filterBidang === "pusat") {
      employees = employees.filter(e => e.bidangId && !e.bidang?.nama?.toLowerCase().includes("cabang"))
    } else if (filterBidang === "cabang") {
      employees = employees.filter(e => e.bidang?.nama?.toLowerCase().includes("cabang"))
    }

    // Kelompokkan dan urutkan pegawai per Unit Kerja
    const groupedMap = new Map<string, typeof employees>()

    employees.forEach(emp => {
      const unit = emp.bidang?.nama || "Lain-lain / Belum Ditempatkan"
      if (!groupedMap.has(unit)) {
        groupedMap.set(unit, [])
      }
      groupedMap.get(unit)!.push(emp)
    })

    // Urutkan grup unit kerja
    const sortedUnits = Array.from(groupedMap.keys()).sort((a, b) => {
      return getUnitOrder(a) - getUnitOrder(b)
    })

    // Urutkan pegawai di dalam setiap unit kerja berdasarkan hierarki jabatan
    sortedUnits.forEach(unit => {
      const list = groupedMap.get(unit)!
      list.sort((a, b) => {
        const rankA = getJabatanRank(a.jabatan, a.tipeJabatan)
        const rankB = getJabatanRank(b.jabatan, b.tipeJabatan)
        if (rankA !== rankB) return rankA - rankB
        return (a.nama || "").localeCompare(b.nama || "")
      })
    })

    const now = new Date()
    const bulanArr = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ]
    const bulanNama = bulanArr[now.getMonth()]
    const tahun = now.getFullYear()

    // =========================================================================
    // 1. FORMAT: EXCEL PER BIDANG & CABANG (Format Berkas Pertama)
    // =========================================================================
    if (format === "excel-bidang") {
      const wb = new ExcelJS.Workbook()
      wb.creator = "SIMPEG TIARA - PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"
      wb.created = now

      const ws = wb.addWorksheet(bulanNama, {
        views: [{ showGridLines: true }]
      })

      // Kop Dokumen 3 Baris
      ws.addRow(["DATA PEGAWAI PERUMDA AIR MINUM TIRTA ARDHIA RINJANI LOMBOK TENGAH"])
      ws.addRow(["BERDASARKAN BIDANG/ CABANG/ POS"])
      ws.addRow([`BULAN ${bulanNama} TAHUN ${tahun}`])

      // Styling Kop Baris 1-3
      for (let i = 1; i <= 3; i++) {
        const r = ws.getRow(i)
        r.font = { name: "Arial", size: 11, bold: true }
        r.alignment = { vertical: "middle", horizontal: "left" }
      }

      // Lebar Kolom yang disesuaikan
      ws.columns = [
        { key: "no", width: 8 },
        { key: "nik", width: 16 },
        { key: "nama", width: 36 },
        { key: "gol", width: 14 },
        { key: "jabatan", width: 42 },
        { key: "bidang", width: 32 },
        { key: "status", width: 18 },
        { key: "pendidikan", width: 26 },
      ]

      const tableHeaders = [
        "NO.",
        "NIK",
        "NAMA PEGAWAI",
        "GOL./ RUANG",
        "JABATAN",
        "BIDANG/CABANG/POS",
        "STATUS PEGAWAI",
        "JENJANG PENDIDIKAN",
      ]

      // Render setiap unit kerja
      sortedUnits.forEach((unitName) => {
        const empsInUnit = groupedMap.get(unitName) || []
        if (empsInUnit.length === 0) return

        // Tambahkan baris header tabel untuk setiap unit kerja
        const headerRow = ws.addRow(tableHeaders)
        headerRow.height = 22
        headerRow.eachCell((cell) => {
          cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF0F172A" } }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE2E8F0" } // Slate-200
          }
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
          cell.border = {
            top: { style: "thin", color: { argb: "FF94A3B8" } },
            left: { style: "thin", color: { argb: "FF94A3B8" } },
            bottom: { style: "thin", color: { argb: "FF94A3B8" } },
            right: { style: "thin", color: { argb: "FF94A3B8" } },
          }
        })

        // Baris data pegawai dalam unit kerja tersebut
        empsInUnit.forEach((emp, idx) => {
          const rowValues = [
            idx + 1,
            formatNikDisplay(emp.nik),
            (emp.nama || "").toUpperCase(),
            formatGolonganDisplay(emp.golongan),
            emp.jabatan || "-",
            unitName,
            formatStatusDisplay(emp.status, emp.tipeJabatan),
            formatPendidikanDisplay(emp.pendidikanTerakhir, emp.jurusan),
          ]

          const dataRow = ws.addRow(rowValues)
          dataRow.height = 20

          dataRow.eachCell((cell, colNumber) => {
            cell.font = { name: "Arial", size: 9 }
            cell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            }

            // Perataan kolom: NO, NIK, GOL, STATUS di tengah; lainnya rata kiri
            if ([1, 2, 4, 7].includes(colNumber)) {
              cell.alignment = { vertical: "middle", horizontal: "center" }
            } else {
              cell.alignment = { vertical: "middle", horizontal: "left" }
            }
          })
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const filename = `DATA_PEGAWAI_PER_BIDANG_DAN_CABANG_${bulanNama}_${tahun}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    // =========================================================================
    // 2. FORMAT: EXCEL MASTER LENGKAP (28 Kolom Database)
    // =========================================================================
    if (format === "excel-master") {
      const wb = new ExcelJS.Workbook()
      wb.creator = "SIMPEG TIARA - PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"
      wb.created = now

      const ws = wb.addWorksheet("Master Pegawai", {
        views: [{ showGridLines: true }]
      })

      const masterColumns = [
        { header: "No", key: "no", width: 6 },
        { header: "NIK", key: "nik", width: 18 },
        { header: "Nama Lengkap", key: "nama", width: 32 },
        { header: "Email", key: "email", width: 28 },
        { header: "Telepon", key: "telepon", width: 18 },
        { header: "Unit Kerja / Bidang", key: "bidang", width: 28 },
        { header: "Sub Bidang", key: "subBidang", width: 24 },
        { header: "Jabatan", key: "jabatan", width: 28 },
        { header: "Tipe Jabatan", key: "tipeJabatan", width: 18 },
        { header: "Golongan", key: "golongan", width: 14 },
        { header: "Pangkat", key: "pangkat", width: 24 },
        { header: "Tanggal Masuk (TMT)", key: "tanggalMasuk", width: 18 },
        { header: "Status", key: "status", width: 16 },
        { header: "Gaji Pokok", key: "gajiPokok", width: 18 },
        { header: "Tunjangan", key: "tunjangan", width: 16 },
        { header: "Jenis Kelamin", key: "jenisKelamin", width: 14 },
        { header: "Tempat Lahir", key: "tempatLahir", width: 20 },
        { header: "Tanggal Lahir", key: "tanggalLahir", width: 16 },
        { header: "Agama", key: "agama", width: 14 },
        { header: "Status Nikah", key: "statusNikah", width: 16 },
        { header: "Alamat", key: "alamat", width: 35 },
        { header: "NPWP", key: "npwp", width: 20 },
        { header: "Pendidikan Terakhir", key: "pendidikan", width: 20 },
        { header: "Jurusan", key: "jurusan", width: 24 },
        { header: "Institusi", key: "institusi", width: 28 },
        { header: "Tahun Lulus", key: "tahunLulus", width: 14 },
        { header: "Bank", key: "bank", width: 18 },
        { header: "No Rekening", key: "noRekening", width: 22 },
        { header: "BPJS Kesehatan", key: "bpjsKes", width: 20 },
        { header: "BPJS TK", key: "bpjsTk", width: 20 },
      ]

      ws.columns = masterColumns

      // Header Row Style
      const hRow = ws.getRow(1)
      hRow.height = 28
      hRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E3A8A" } // Dark Blue
        }
        cell.alignment = { vertical: "middle", horizontal: "center" }
      })

      // Isi baris data
      let rowIdx = 0
      sortedUnits.forEach(unit => {
        const emps = groupedMap.get(unit) || []
        emps.forEach(emp => {
          rowIdx++
          const r = ws.addRow([
            rowIdx,
            formatNikDisplay(emp.nik),
            emp.nama,
            emp.email,
            emp.telepon || "-",
            emp.bidang?.nama || "-",
            emp.subBidang?.nama || "-",
            emp.jabatan,
            emp.tipeJabatan,
            emp.golongan,
            emp.pangkat || "-",
            emp.tanggalMasuk ? new Date(emp.tanggalMasuk).toISOString().split("T")[0] : "-",
            emp.status,
            Number(emp.gajiPokok || 0),
            Number(emp.tunjangan || 0),
            emp.jenisKelamin || "-",
            emp.tempatLahir || "-",
            emp.tanggalLahir ? new Date(emp.tanggalLahir).toISOString().split("T")[0] : "-",
            emp.agama || "-",
            emp.statusNikah || "-",
            emp.alamat || "-",
            emp.npwp || "-",
            emp.pendidikanTerakhir || "-",
            emp.jurusan || "-",
            emp.institusi || "-",
            emp.tahunLulus || "-",
            emp.bank || "-",
            emp.noRekening || "-",
            emp.bpjsKesehatan || "-",
            emp.bpjsKetenagakerjaan || "-",
          ])
          r.height = 20
          r.eachCell((cell) => {
            cell.font = { name: "Arial", size: 9 }
            cell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            }
          })
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const filename = `DATA_MASTER_PEGAWAI_${tahun}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    // =========================================================================
    // 3. FORMAT: PDF RESMI PDAM (A4 Landscape, Kop Surat & Tabel Per Unit)
    // =========================================================================
    if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth() // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight() // 210 mm
      const marginX = 12
      const contentWidth = pageWidth - marginX * 2 // 273 mm

      // Definisi Lebar 8 Kolom (Total = 273 mm)
      const colWidths = [10, 24, 56, 18, 56, 45, 28, 36]
      const colHeaders = [
        "NO.",
        "NIK",
        "NAMA PEGAWAI",
        "GOL.",
        "JABATAN",
        "BIDANG/CABANG/POS",
        "STATUS",
        "PENDIDIKAN",
      ]

      let y = 14

      const printKopSurat = () => {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10.5)
        doc.setTextColor(30, 41, 59)
        doc.text("PEMERINTAH KABUPATEN LOMBOK TENGAH", pageWidth / 2, y, { align: "center" })
        y += 4.5

        doc.setFontSize(13)
        doc.setTextColor(30, 58, 138) // Deep Blue
        doc.text("PERUMDA AIR MINUM TIRTA ARDHIA RINJANI", pageWidth / 2, y, { align: "center" })
        y += 4.2

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Jl. Gajah Mada No. 10, Praya, Kabupaten Lombok Tengah, NTB | Telepon: (0370) 654321 | SIMPEG TIARA", pageWidth / 2, y, { align: "center" })
        y += 3.5

        // Garis Pembatas Kop Ganda
        doc.setDrawColor(30, 58, 138)
        doc.setLineWidth(0.7)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 0.8
        doc.setLineWidth(0.25)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 5.5

        // Judul Dokumen
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10.5)
        doc.setTextColor(15, 23, 42)
        doc.text("DATA PEGAWAI BERDASARKAN BIDANG / CABANG / POS", pageWidth / 2, y, { align: "center" })
        y += 4.2

        doc.setFont("helvetica", "italic")
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)
        doc.text(`BULAN ${bulanNama} TAHUN ${tahun}`, pageWidth / 2, y, { align: "center" })
        y += 5
      }

      const printTableHeader = () => {
        doc.setFillColor(30, 58, 138) // Dark Navy Blue
        doc.rect(marginX, y, contentWidth, 6.5, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7.5)
        doc.setTextColor(255, 255, 255)

        let currX = marginX
        colHeaders.forEach((h, i) => {
          const w = colWidths[i]
          const isCenter = [0, 1, 3, 6].includes(i)
          if (isCenter) {
            doc.text(h, currX + w / 2, y + 4.3, { align: "center" })
          } else {
            doc.text(h, currX + 2, y + 4.3, { align: "left" })
          }
          currX += w
        })
        y += 6.5
      }

      // Cetak Kop Pertama
      printKopSurat()

      // Render setiap unit kerja
      sortedUnits.forEach((unitName, uIdx) => {
        const empsInUnit = groupedMap.get(unitName) || []
        if (empsInUnit.length === 0) return

        // Cek ruang halaman: jika sisa halaman tinggal sedikit, buat halaman baru
        if (y > pageHeight - 35) {
          doc.addPage()
          y = 14
          printKopSurat()
        }

        // Section Banner Unit Kerja
        doc.setFillColor(241, 245, 249) // Slate-100
        doc.rect(marginX, y, contentWidth, 5.5, "F")
        doc.setDrawColor(203, 213, 225) // Slate-300
        doc.rect(marginX, y, contentWidth, 5.5, "S")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(8.5)
        doc.setTextColor(15, 23, 42)
        doc.text(`${uIdx + 1}. ${unitName.toUpperCase()} (${empsInUnit.length} Pegawai)`, marginX + 3, y + 3.8)
        y += 5.5

        // Baris Header Tabel
        printTableHeader()

        // Baris Pegawai
        empsInUnit.forEach((emp, eIdx) => {
          if (y > pageHeight - 20) {
            doc.addPage()
            y = 14
            printKopSurat()
            printTableHeader()
          }

          const rowH = 5.2
          const isZebra = eIdx % 2 === 1
          if (isZebra) {
            doc.setFillColor(248, 250, 252)
            doc.rect(marginX, y, contentWidth, rowH, "F")
          }

          doc.setDrawColor(226, 232, 240)
          doc.rect(marginX, y, contentWidth, rowH, "S")

          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.5)
          doc.setTextColor(30, 41, 59)

          const rowData = [
            (eIdx + 1).toString(),
            formatNikDisplay(emp.nik),
            (emp.nama || "").toUpperCase(),
            formatGolonganDisplay(emp.golongan),
            emp.jabatan || "-",
            unitName,
            formatStatusDisplay(emp.status, emp.tipeJabatan),
            formatPendidikanDisplay(emp.pendidikanTerakhir, emp.jurusan),
          ]

          let currX = marginX
          rowData.forEach((val, cIdx) => {
            const w = colWidths[cIdx]
            const isCenter = [0, 1, 3, 6].includes(cIdx)
            
            // Truncate text jika terlalu panjang agar tidak overflow
            const maxChars = cIdx === 2 ? 34 : cIdx === 4 ? 32 : cIdx === 5 ? 26 : cIdx === 7 ? 22 : 20
            let displayVal = val
            if (displayVal.length > maxChars) {
              displayVal = displayVal.slice(0, maxChars - 1) + "…"
            }

            if (isCenter) {
              doc.text(displayVal, currX + w / 2, y + 3.6, { align: "center" })
            } else {
              doc.text(displayVal, currX + 2, y + 3.6, { align: "left" })
            }
            currX += w
          })

          y += rowH
        })

        y += 3.5 // Spasi antar unit kerja
      })

      // Tanda Tangan Direktur Utama di Akhir Dokumen
      if (y > pageHeight - 42) {
        doc.addPage()
        y = 18
      } else {
        y += 4
      }

      const signX = pageWidth - 65
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(15, 23, 42)
      doc.text(`Praya, ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, signX, y)
      y += 3.8
      doc.text("Direktur Utama,", signX, y)
      y += 18 // Ruang TTD
      doc.setFont("helvetica", "bold")
      doc.text("BAMBANG SUPRATOMO", signX, y)
      y += 3.2
      doc.setFont("helvetica", "normal")
      doc.text("NIK. 232432", signX, y)

      // Footer Running Page Number
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text("SIMPEG TIARA • Dokumen Resmi Kepegawaian PDAM Tirta Ardhia Rinjani", marginX, pageHeight - 7)
        doc.text(`Halaman ${p} dari ${pageCount}`, pageWidth - marginX, pageHeight - 7, { align: "right" })
      }

      const pdfArrayBuffer = doc.output("arraybuffer")
      const buffer = Buffer.from(pdfArrayBuffer)
      const filename = `DATA_PEGAWAI_PER_BIDANG_DAN_CABANG_${bulanNama}_${tahun}.pdf`

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    return new NextResponse("Format tidak didukung", { status: 400 })
  } catch (error: any) {
    console.error("Export Error:", error)
    return new NextResponse(error.message || "Gagal mengekspor data", { status: 500 })
  }
}
