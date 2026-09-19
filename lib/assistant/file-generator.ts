import ExcelJS from "exceljs"
import jsPDF from "jspdf"

export interface ExcelColumn {
  header: string
  key: string
  width?: number
}

export interface ExcelGeneratorOptions {
  title: string
  subtitle?: string
  sheetName?: string
  filename?: string
  columns: ExcelColumn[]
  rows: Record<string, any>[]
}

export interface PdfGeneratorOptions {
  title: string
  subtitle?: string
  nomorSurat?: string
  docType?: "laporan" | "nota_dinas" | "surat_tugas" | "rekap"
  filename?: string
  contentLines?: string[]
  tableData?: {
    headers: string[]
    rows: (string | number)[][]
  }
  penandatangan?: {
    jabatan: string
    nama: string
    nik?: string
  }
}

export interface GeneratedFileResult {
  name: string
  type: "excel" | "pdf"
  dataUrl: string
  size: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

/**
 * Membuat Berkas Excel (.xlsx) Profesional dengan Kop & Gaya Tabel PDAM
 */
export async function generateAssistantExcel(options: ExcelGeneratorOptions): Promise<GeneratedFileResult> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Tiara Assistant - SIMPEG PDAM Tirta Ardhia Rinjani"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(options.sheetName || "Laporan Kepegawaian", {
    views: [{ showGridLines: true }]
  })

  // 1. Judul Laporan
  const titleRow = sheet.addRow(["PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"])
  titleRow.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } }
  
  const subTitleRow = sheet.addRow([options.title.toUpperCase()])
  subTitleRow.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF334155" } }

  if (options.subtitle) {
    const metaRow = sheet.addRow([options.subtitle])
    metaRow.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } }
  }

  sheet.addRow([]) // Baris kosong

  // 2. Kolom Header
  const headerValues = ["No", ...options.columns.map(c => c.header)]
  const headerRow = sheet.addRow(headerValues)
  headerRow.height = 24

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }, // Blue-600
    }
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E40AF" } },
      left: { style: "thin", color: { argb: "FF1E40AF" } },
      bottom: { style: "medium", color: { argb: "FF1E3A8A" } },
      right: { style: "thin", color: { argb: "FF1E40AF" } },
    }
  })

  // 3. Baris Data
  options.rows.forEach((rowData, index) => {
    const rowValues = [
      index + 1,
      ...options.columns.map(c => rowData[c.key] ?? "-")
    ]
    const row = sheet.addRow(rowValues)
    row.height = 20

    const isZebra = index % 2 === 1
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 9.5 }
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 ? "center" : typeof cell.value === "number" ? "right" : "left"
      }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
      if (isZebra) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }
        }
      }
    })
  })

  // Auto-fit kolom
  sheet.getColumn(1).width = 6
  options.columns.forEach((col, idx) => {
    const defaultWidth = col.width || Math.max(14, col.header.length + 4)
    sheet.getColumn(idx + 2).width = defaultWidth
  })

  // Footer baris timestamp
  sheet.addRow([])
  const footerRow = sheet.addRow([`Dicetak otomatis oleh Tiara AI Copilot pada ${new Date().toLocaleString("id-ID")}`])
  footerRow.font = { name: "Arial", size: 8, italic: true, color: { argb: "FF94A3B8" } }

  const buffer = await workbook.xlsx.writeBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
  const filename = options.filename || `Laporan_${options.title.replace(/\s+/g, "_")}_${Date.now()}.xlsx`

  return {
    name: filename,
    type: "excel",
    dataUrl,
    size: formatBytes(buffer.byteLength)
  }
}

/**
 * Membuat Dokumen PDF Resmi dengan Kop Surat PDAM Tirta Ardhia Rinjani
 */
export async function generateAssistantPdf(options: PdfGeneratorOptions): Promise<GeneratedFileResult> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 14

  // 1. Kop Surat Resmi PDAM
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("PEMERINTAH KABUPATEN LOMBOK TENGAH", pageWidth / 2, y, { align: "center" })
  y += 5

  doc.setFontSize(13)
  doc.setTextColor(30, 58, 138) // Dark Blue
  doc.text("PERUMDA AIR MINUM TIRTA ARDHIA RINJANI", pageWidth / 2, y, { align: "center" })
  y += 4.5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text("Jl. Gajah Mada No. 10, Praya, Kabupaten Lombok Tengah, Nusa Tenggara Barat", pageWidth / 2, y, { align: "center" })
  y += 3.5
  doc.text("Telepon: (0370) 654321 | Email: pdam@lomboktengahkab.go.id | SIMPEG TIARA", pageWidth / 2, y, { align: "center" })
  y += 4

  // Garis Pembatas Kop Ganda
  doc.setDrawColor(30, 58, 138)
  doc.setLineWidth(0.8)
  doc.line(15, y, pageWidth - 15, y)
  y += 0.8
  doc.setLineWidth(0.3)
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  // 2. Judul Dokumen
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(options.title.toUpperCase(), pageWidth / 2, y, { align: "center" })
  y += 5

  if (options.nomorSurat) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Nomor: ${options.nomorSurat}`, pageWidth / 2, y, { align: "center" })
    y += 5
  }

  if (options.subtitle) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text(options.subtitle, pageWidth / 2, y, { align: "center" })
    y += 6
  }

  y += 2
  doc.setTextColor(15, 23, 42)

  // 3. Konten Teks Paragraf
  if (options.contentLines && options.contentLines.length > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)

    options.contentLines.forEach(line => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      const splitText = doc.splitTextToSize(line, pageWidth - 32)
      doc.text(splitText, 16, y)
      y += splitText.length * 4.5 + 2
    })
    y += 4
  }

  // 4. Tabel Data (Jika ada)
  if (options.tableData && options.tableData.headers.length > 0) {
    const firstHeaderIsNo = options.tableData.headers[0]?.toLowerCase().startsWith("no")
    const headers = firstHeaderIsNo ? options.tableData.headers : ["No", ...options.tableData.headers]
    const numCols = headers.length
    const colWidth = (pageWidth - 32) / numCols
    const startX = 16

    // Header Tabel
    doc.setFillColor(37, 99, 235) // Blue-600
    doc.rect(startX, y, pageWidth - 32, 7, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)

    headers.forEach((h, i) => {
      const x = startX + i * colWidth + colWidth / 2
      doc.text(h, x, y + 4.8, { align: "center" })
    })
    y += 7

    // Baris Tabel
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(15, 23, 42)

    options.tableData.rows.forEach((row, rowIdx) => {
      if (y > 265) {
        doc.addPage()
        y = 20
      }
      const isZebra = rowIdx % 2 === 1
      if (isZebra) {
        doc.setFillColor(248, 250, 252)
        doc.rect(startX, y, pageWidth - 32, 6, "F")
      }
      doc.setDrawColor(226, 232, 240)
      doc.rect(startX, y, pageWidth - 32, 6, "S")

      const rowValues = firstHeaderIsNo 
        ? row.map(v => v?.toString() ?? "-")
        : [(rowIdx + 1).toString(), ...row.map(v => v?.toString() ?? "-")]
      rowValues.forEach((val, cIdx) => {
        const x = startX + cIdx * colWidth + (cIdx === 0 ? colWidth / 2 : 2)
        const align = cIdx === 0 ? "center" : "left"
        doc.text(val, x, y + 4.2, { align: align as any })
      })
      y += 6
    })

    y += 8
  }

  // 5. Tanda Tangan Pejabat
  if (y > 230) {
    doc.addPage()
    y = 25
  }

  const signee = options.penandatangan || {
    jabatan: "Direktur Utama",
    nama: "Bambang Supratomo",
    nik: "232432"
  }

  const signX = pageWidth - 65
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`Praya, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, signX, y)
  y += 4
  doc.text(signee.jabatan, signX, y)
  y += 20 // Ruang TTD
  doc.setFont("helvetica", "bold")
  doc.text(signee.nama, signX, y)
  y += 3.5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  if (signee.nik && signee.nik.trim()) {
    doc.text(`NIK. ${signee.nik}`, signX, y)
  }

  // 6. Watermark Footer
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(`SIMPEG TIARA • Dokumen Sah Resmi PDAM Tirta Ardhia Rinjani • Dihasilkan Otomatis`, pageWidth / 2, 288, { align: "center" })

  const pdfOutput = doc.output("datauristring")
  const rawBytes = doc.output("arraybuffer").byteLength
  const filename = options.filename || `Dokumen_${options.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`

  return {
    name: filename,
    type: "pdf",
    dataUrl: pdfOutput,
    size: formatBytes(rawBytes)
  }
}
