import jsPDF from "jspdf"

export interface CvEmployeeData {
  id: string
  nik: string
  nama: string
  email?: string | null
  telepon?: string | null
  fotoUrl?: string | null
  jabatan: string
  golongan: string
  pangkat?: string | null
  tipeJabatan?: string | null
  status: string
  tanggalMasuk: string | Date
  jenisKelamin?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  agama?: string | null
  statusNikah?: string | null
  alamat?: string | null
  npwp?: string | null
  pendidikanTerakhir?: string | null
  jurusan?: string | null
  institusi?: string | null
  tahunLulus?: string | null
  bank?: string | null
  noRekening?: string | null
  bpjsKesehatan?: string | null
  bpjsKetenagakerjaan?: string | null
  atasanLangsung?: string | null
  bidang?: { nama: string } | null
  subBidang?: { nama: string } | null
  keluarga?: Array<{
    id?: string
    nama: string
    hubungan: string
    pekerjaan?: string | null
    telepon?: string | null
  }>
  pendidikan?: Array<{
    id?: string
    tingkat: string
    institusi: string
    jurusan?: string | null
    tahunLulus: string
  }>
  riwayatJabatan?: Array<{
    id?: string
    jabatan: string
    unitDefinitif: string
    tanggalMulai: string | Date
    tanggalSelesai?: string | Date | null
  }>
  riwayatPangkatDetail?: Array<{
    id?: string
    pangkat: string
    golongan: string
    tanggalBerlaku: string | Date
    nomorSK?: string | null
  }>
  pelatihan?: Array<{
    id?: string
    namaPelatihan: string
    penyelenggara: string
    tahun: string
  }>
}

function formatDateIndo(val?: string | Date | null): string {
  if (!val) return "-"
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const day = String(d.getDate()).padStart(2, "0")
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

function cleanText(val?: string | null): string {
  if (!val || val.trim() === "") return "-"
  return val.trim()
}

export async function generateCvPdf(data: CvEmployeeData) {
  // Setup document A4 (210 x 297 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const marginX = 14
  const contentWidth = 182 // 210 - 28
  const maxY = 278
  let currentY = 16

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage()
      currentY = 16
      // Running header on page 2+
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Curriculum Vitae — ${data.nama.toUpperCase()} — PERUMDA Air Minum Tirta Ardhia Rinjani`,
        marginX,
        currentY - 4
      )
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(marginX, currentY - 2, marginX + contentWidth, currentY - 2)
    }
  }

  // ─── 1. ATS HEADER ──────────────────────────────────────────────────────────
  // Organization Super-Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text("PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA ARDHIA RINJANI", marginX, currentY)
  currentY += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text("Jl. Gajah Mada No. 1, Praya, Kabupaten Lombok Tengah, NTB", marginX, currentY)
  currentY += 5

  // Header Divider
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.line(marginX, currentY, marginX + contentWidth, currentY)
  currentY += 6

  // Employee Name & ATS Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(data.nama.toUpperCase(), marginX, currentY)
  currentY += 5.5

  // Primary Position & Unit
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(37, 99, 235) // Royal Blue
  const unitText = data.bidang?.nama ? ` — ${data.bidang.nama}` : ""
  doc.text(`${data.jabatan.toUpperCase()}${unitText.toUpperCase()}`, marginX, currentY)
  currentY += 5

  // Contact & Summary Line (ATS Essential)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  const contactParts = [
    `NIK: ${data.nik}`,
    `Email: ${cleanText(data.email)}`,
    `Telp: ${cleanText(data.telepon)}`,
    `Status: ${data.status === "AKTIF" ? "Pegawai Aktif" : data.status}`,
    `Gol: ${data.golongan || "-"}`,
  ]
  doc.text(contactParts.join("  |  "), marginX, currentY)
  currentY += 6

  // ─── HELPER: Draw Section Category Header ──────────────────────────────────
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12)
    doc.setFillColor(241, 245, 249) // Slate 100
    doc.rect(marginX, currentY, contentWidth, 6.5, "F")
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.rect(marginX, currentY, contentWidth, 6.5, "S")

    // Left decorative bar
    doc.setFillColor(37, 99, 235) // Blue 600
    doc.rect(marginX, currentY, 2.5, 6.5, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text(title.toUpperCase(), marginX + 5, currentY + 4.5)
    currentY += 7.5
  }

  // ─── CATEGORY 1: DATA PRIBADI & KEPEGAWAIAN (Table) ────────────────────────
  drawSectionHeader("1. Data Pribadi & Kepegawaian")

  const colLabelW = 38
  const colValW = 53
  const rowH = 5.6

  const personalInfoRows: Array<[string, string, string, string]> = [
    [
      "Nomor Induk Kependudukan",
      cleanText(data.nik),
      "Status Kepegawaian",
      cleanText(data.status),
    ],
    [
      "Tempat, Tanggal Lahir",
      `${cleanText(data.tempatLahir)}, ${formatDateIndo(data.tanggalLahir)}`,
      "Jenis Kelamin",
      data.jenisKelamin === "L" || data.jenisKelamin === "LAKI_LAKI"
        ? "Laki-laki"
        : data.jenisKelamin === "P" || data.jenisKelamin === "PEREMPUAN"
        ? "Perempuan"
        : cleanText(data.jenisKelamin),
    ],
    [
      "Agama",
      cleanText(data.agama),
      "Status Pernikahan",
      cleanText(data.statusNikah),
    ],
    [
      "Nomor Telepon / WhatsApp",
      cleanText(data.telepon),
      "Alamat Email Resmi",
      cleanText(data.email),
    ],
    [
      "Alamat Domisili",
      cleanText(data.alamat),
      "Nomor Pokok Wajib Pajak",
      cleanText(data.npwp),
    ],
    [
      "Jabatan Saat Ini",
      cleanText(data.jabatan),
      "Unit Kerja / Bidang",
      cleanText(data.bidang?.nama),
    ],
    [
      "Pangkat Saat Ini",
      cleanText(data.pangkat),
      "Golongan Ruang",
      cleanText(data.golongan),
    ],
    [
      "Tanggal TMT Masuk Kerja",
      formatDateIndo(data.tanggalMasuk),
      "Atasan Langsung",
      cleanText(data.atasanLangsung),
    ],
  ]

  // If Bank/BPJS info exists, add them as well
  if (data.bank || data.bpjsKesehatan) {
    personalInfoRows.push([
      "Bank / No. Rekening",
      data.bank ? `${data.bank} - ${cleanText(data.noRekening)}` : "-",
      "BPJS Kesehatan",
      cleanText(data.bpjsKesehatan),
    ])
  }

  personalInfoRows.forEach(([lbl1, val1, lbl2, val2], idx) => {
    checkPageBreak(rowH)
    const isEven = idx % 2 === 0

    // Draw Left Col
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
    doc.rect(marginX, currentY, colLabelW, rowH, "F")
    doc.setFillColor(255, 255, 255)
    doc.rect(marginX + colLabelW, currentY, colValW, rowH, "F")

    // Draw Right Col
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
    doc.rect(marginX + colLabelW + colValW, currentY, colLabelW, rowH, "F")
    doc.setFillColor(255, 255, 255)
    doc.rect(marginX + colLabelW + colValW + colLabelW, currentY, colValW, rowH, "F")

    // Borders
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")
    doc.line(marginX + colLabelW, currentY, marginX + colLabelW, currentY + rowH)
    doc.line(marginX + colLabelW + colValW, currentY, marginX + colLabelW + colValW, currentY + rowH)
    doc.line(marginX + colLabelW + colValW + colLabelW, currentY, marginX + colLabelW + colValW + colLabelW, currentY + rowH)

    // Text Lbl 1
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(lbl1, marginX + 2, currentY + 3.8)

    // Text Val 1
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)
    doc.text(doc.splitTextToSize(val1, colValW - 4)[0] || "-", marginX + colLabelW + 2, currentY + 3.8)

    // Text Lbl 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(lbl2, marginX + colLabelW + colValW + 2, currentY + 3.8)

    // Text Val 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)
    doc.text(doc.splitTextToSize(val2, colValW - 4)[0] || "-", marginX + colLabelW + colValW + colLabelW + 2, currentY + 3.8)

    currentY += rowH
  })

  currentY += 4

  // ─── CATEGORY 2: RIWAYAT JABATAN & PENGALAMAN (Table) ──────────────────────
  drawSectionHeader("2. Riwayat Jabatan & Pengalaman Kerja")

  const jabCols = [
    { label: "No", width: 10, align: "center" as const },
    { label: "Jabatan / Posisi", width: 56, align: "left" as const },
    { label: "Unit Kerja / Penempatan", width: 52, align: "left" as const },
    { label: "Periode / TMT", width: 38, align: "center" as const },
    { label: "Status", width: 26, align: "center" as const },
  ]

  // Table Column Header
  checkPageBreak(6)
  doc.setFillColor(241, 245, 249)
  doc.rect(marginX, currentY, contentWidth, 5.5, "F")
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(marginX, currentY, contentWidth, 5.5, "S")

  let colX = marginX
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  jabCols.forEach((col) => {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 2
    doc.text(col.label, textX, currentY + 3.8, { align: col.align })
    colX += col.width
  })
  currentY += 5.5

  // Prepare Jabatan Rows
  const jabatanRows: Array<{ jabatan: string; unit: string; periode: string; status: string }> = []

  // Add current position first
  jabatanRows.push({
    jabatan: data.jabatan,
    unit: data.bidang?.nama || "Kantor Pusat",
    periode: `${formatDateIndo(data.tanggalMasuk)} - Sekarang`,
    status: "Aktif",
  })

  // Add previous positions from riwayatJabatan if available
  if (data.riwayatJabatan && data.riwayatJabatan.length > 0) {
    data.riwayatJabatan.forEach((rj) => {
      // Avoid duplicate if same as current
      if (rj.jabatan !== data.jabatan) {
        jabatanRows.push({
          jabatan: rj.jabatan,
          unit: rj.unitDefinitif || "-",
          periode: `${formatDateIndo(rj.tanggalMulai)} - ${
            rj.tanggalSelesai ? formatDateIndo(rj.tanggalSelesai) : "Selesai"
          }`,
          status: "Selesai",
        })
      }
    })
  }

  jabatanRows.forEach((row, idx) => {
    checkPageBreak(rowH)
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
    doc.rect(marginX, currentY, contentWidth, rowH, "F")
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")

    let xPos = marginX
    doc.setFont("helvetica", idx === 0 ? "bold" : "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)

    // No
    doc.text(String(idx + 1), xPos + jabCols[0].width / 2, currentY + 3.8, { align: "center" })
    xPos += jabCols[0].width

    // Jabatan
    doc.text(doc.splitTextToSize(row.jabatan, jabCols[1].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += jabCols[1].width

    // Unit
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(row.unit, jabCols[2].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += jabCols[2].width

    // Periode
    doc.text(row.periode, xPos + jabCols[3].width / 2, currentY + 3.8, { align: "center" })
    xPos += jabCols[3].width

    // Status
    if (row.status === "Aktif") {
      doc.setTextColor(22, 101, 52) // Green 800
      doc.setFont("helvetica", "bold")
    } else {
      doc.setTextColor(100, 116, 139)
      doc.setFont("helvetica", "normal")
    }
    doc.text(row.status, xPos + jabCols[4].width / 2, currentY + 3.8, { align: "center" })

    currentY += rowH
  })

  currentY += 4

  // ─── CATEGORY 3: RIWAYAT PENDIDIKAN FORMAL (Table) ─────────────────────────
  drawSectionHeader("3. Riwayat Pendidikan Formal")

  const eduCols = [
    { label: "No", width: 10, align: "center" as const },
    { label: "Jenjang", width: 22, align: "center" as const },
    { label: "Nama Institusi / Lembaga Pendidikan", width: 68, align: "left" as const },
    { label: "Jurusan / Program Studi", width: 56, align: "left" as const },
    { label: "Tahun Kelulusan", width: 26, align: "center" as const },
  ]

  checkPageBreak(6)
  doc.setFillColor(241, 245, 249)
  doc.rect(marginX, currentY, contentWidth, 5.5, "F")
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(marginX, currentY, contentWidth, 5.5, "S")

  colX = marginX
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  eduCols.forEach((col) => {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 2
    doc.text(col.label, textX, currentY + 3.8, { align: col.align })
    colX += col.width
  })
  currentY += 5.5

  // Prepare Pendidikan Data
  const eduRows: Array<{ tingkat: string; institusi: string; jurusan: string; tahun: string }> = []

  if (data.pendidikan && data.pendidikan.length > 0) {
    data.pendidikan.forEach((p) => {
      eduRows.push({
        tingkat: p.tingkat || "-",
        institusi: p.institusi || "-",
        jurusan: p.jurusan || "-",
        tahun: p.tahunLulus || "-",
      })
    })
  } else if (data.pendidikanTerakhir || data.institusi) {
    eduRows.push({
      tingkat: data.pendidikanTerakhir || "-",
      institusi: data.institusi || "-",
      jurusan: data.jurusan || "-",
      tahun: data.tahunLulus || "-",
    })
  }

  if (eduRows.length === 0) {
    eduRows.push({
      tingkat: "-",
      institusi: "Data riwayat pendidikan belum ditambahkan",
      jurusan: "-",
      tahun: "-",
    })
  }

  eduRows.forEach((row, idx) => {
    checkPageBreak(rowH)
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
    doc.rect(marginX, currentY, contentWidth, rowH, "F")
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")

    let xPos = marginX
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)

    // No
    doc.text(String(idx + 1), xPos + eduCols[0].width / 2, currentY + 3.8, { align: "center" })
    xPos += eduCols[0].width

    // Jenjang
    doc.setFont("helvetica", "bold")
    doc.text(row.tingkat, xPos + eduCols[1].width / 2, currentY + 3.8, { align: "center" })
    xPos += eduCols[1].width

    // Institusi
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(row.institusi, eduCols[2].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += eduCols[2].width

    // Jurusan
    doc.text(doc.splitTextToSize(row.jurusan, eduCols[3].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += eduCols[3].width

    // Tahun Lulus
    doc.text(row.tahun, xPos + eduCols[4].width / 2, currentY + 3.8, { align: "center" })

    currentY += rowH
  })

  currentY += 4

  // ─── CATEGORY 4: RIWAYAT KEPANGKATAN & GOLONGAN (Table) ─────────────────────
  drawSectionHeader("4. Riwayat Kepangkatan & Golongan")

  const rankCols = [
    { label: "No", width: 10, align: "center" as const },
    { label: "Pangkat", width: 48, align: "left" as const },
    { label: "Golongan / Ruang", width: 32, align: "center" as const },
    { label: "TMT Berlaku", width: 38, align: "center" as const },
    { label: "Nomor SK / Pengesahan", width: 54, align: "left" as const },
  ]

  checkPageBreak(6)
  doc.setFillColor(241, 245, 249)
  doc.rect(marginX, currentY, contentWidth, 5.5, "F")
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(marginX, currentY, contentWidth, 5.5, "S")

  colX = marginX
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  rankCols.forEach((col) => {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 2
    doc.text(col.label, textX, currentY + 3.8, { align: col.align })
    colX += col.width
  })
  currentY += 5.5

  const rankRows: Array<{ pangkat: string; golongan: string; tmt: string; sk: string }> = []

  // Add current rank
  rankRows.push({
    pangkat: data.pangkat || "-",
    golongan: data.golongan || "-",
    tmt: formatDateIndo(data.tanggalMasuk),
    sk: "SK Pengangkatan Pegawai",
  })

  // Add history
  if (data.riwayatPangkatDetail && data.riwayatPangkatDetail.length > 0) {
    data.riwayatPangkatDetail.forEach((rp) => {
      rankRows.push({
        pangkat: rp.pangkat,
        golongan: rp.golongan,
        tmt: formatDateIndo(rp.tanggalBerlaku),
        sk: rp.nomorSK || "-",
      })
    })
  }

  rankRows.forEach((row, idx) => {
    checkPageBreak(rowH)
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
    doc.rect(marginX, currentY, contentWidth, rowH, "F")
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")

    let xPos = marginX
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)

    // No
    doc.text(String(idx + 1), xPos + rankCols[0].width / 2, currentY + 3.8, { align: "center" })
    xPos += rankCols[0].width

    // Pangkat
    doc.text(doc.splitTextToSize(row.pangkat, rankCols[1].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += rankCols[1].width

    // Golongan
    doc.setFont("helvetica", "bold")
    doc.text(row.golongan, xPos + rankCols[2].width / 2, currentY + 3.8, { align: "center" })
    xPos += rankCols[2].width

    // TMT
    doc.setFont("helvetica", "normal")
    doc.text(row.tmt, xPos + rankCols[3].width / 2, currentY + 3.8, { align: "center" })
    xPos += rankCols[3].width

    // SK
    doc.text(doc.splitTextToSize(row.sk, rankCols[4].width - 4)[0], xPos + 2, currentY + 3.8)

    currentY += rowH
  })

  currentY += 4

  // ─── CATEGORY 5: PELATIHAN & PENGEMBANGAN KOMPETENSI (Table) ────────────────
  drawSectionHeader("5. Pelatihan & Sertifikasi Profesi")

  const trainCols = [
    { label: "No", width: 10, align: "center" as const },
    { label: "Nama Pelatihan / Diklat / Workshop", width: 84, align: "left" as const },
    { label: "Penyelenggara / Institusi", width: 62, align: "left" as const },
    { label: "Tahun", width: 26, align: "center" as const },
  ]

  checkPageBreak(6)
  doc.setFillColor(241, 245, 249)
  doc.rect(marginX, currentY, contentWidth, 5.5, "F")
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(marginX, currentY, contentWidth, 5.5, "S")

  colX = marginX
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  trainCols.forEach((col) => {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 2
    doc.text(col.label, textX, currentY + 3.8, { align: col.align })
    colX += col.width
  })
  currentY += 5.5

  const trainRows: Array<{ nama: string; penyelenggara: string; tahun: string }> = []
  if (data.pelatihan && data.pelatihan.length > 0) {
    data.pelatihan.forEach((pl) => {
      trainRows.push({
        nama: pl.namaPelatihan,
        penyelenggara: pl.penyelenggara || "-",
        tahun: pl.tahun || "-",
      })
    })
  }

  if (trainRows.length === 0) {
    trainRows.push({
      nama: "Belum ada riwayat pelatihan terdaftar",
      penyelenggara: "-",
      tahun: "-",
    })
  }

  trainRows.forEach((row, idx) => {
    checkPageBreak(rowH)
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
    doc.rect(marginX, currentY, contentWidth, rowH, "F")
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")

    let xPos = marginX
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)

    // No
    doc.text(String(idx + 1), xPos + trainCols[0].width / 2, currentY + 3.8, { align: "center" })
    xPos += trainCols[0].width

    // Nama
    doc.text(doc.splitTextToSize(row.nama, trainCols[1].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += trainCols[1].width

    // Penyelenggara
    doc.text(doc.splitTextToSize(row.penyelenggara, trainCols[2].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += trainCols[2].width

    // Tahun
    doc.text(row.tahun, xPos + trainCols[3].width / 2, currentY + 3.8, { align: "center" })

    currentY += rowH
  })

  currentY += 4

  // ─── CATEGORY 6: SUSUNAN ANGGOTA KELUARGA (Table) ───────────────────────────
  drawSectionHeader("6. Susunan Anggota Keluarga")

  const famCols = [
    { label: "No", width: 10, align: "center" as const },
    { label: "Nama Lengkap", width: 64, align: "left" as const },
    { label: "Hubungan Keluarga", width: 36, align: "left" as const },
    { label: "Pekerjaan", width: 44, align: "left" as const },
    { label: "Kontak / Ket.", width: 28, align: "center" as const },
  ]

  checkPageBreak(6)
  doc.setFillColor(241, 245, 249)
  doc.rect(marginX, currentY, contentWidth, 5.5, "F")
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(marginX, currentY, contentWidth, 5.5, "S")

  colX = marginX
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  famCols.forEach((col) => {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 2
    doc.text(col.label, textX, currentY + 3.8, { align: col.align })
    colX += col.width
  })
  currentY += 5.5

  const famRows: Array<{ nama: string; hubungan: string; pekerjaan: string; kontak: string }> = []
  if (data.keluarga && data.keluarga.length > 0) {
    data.keluarga.forEach((k) => {
      famRows.push({
        nama: k.nama,
        hubungan: k.hubungan,
        pekerjaan: k.pekerjaan || "-",
        kontak: k.telepon || "-",
      })
    })
  }

  if (famRows.length === 0) {
    famRows.push({
      nama: "Belum ada susunan keluarga terdaftar",
      hubungan: "-",
      pekerjaan: "-",
      kontak: "-",
    })
  }

  famRows.forEach((row, idx) => {
    checkPageBreak(rowH)
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
    doc.rect(marginX, currentY, contentWidth, rowH, "F")
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.rect(marginX, currentY, contentWidth, rowH, "S")

    let xPos = marginX
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)

    // No
    doc.text(String(idx + 1), xPos + famCols[0].width / 2, currentY + 3.8, { align: "center" })
    xPos += famCols[0].width

    // Nama
    doc.text(doc.splitTextToSize(row.nama, famCols[1].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += famCols[1].width

    // Hubungan
    doc.setFont("helvetica", "bold")
    doc.text(row.hubungan, xPos + 2, currentY + 3.8)
    xPos += famCols[2].width

    // Pekerjaan
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(row.pekerjaan, famCols[3].width - 4)[0], xPos + 2, currentY + 3.8)
    xPos += famCols[3].width

    // Kontak
    doc.text(row.kontak, xPos + famCols[4].width / 2, currentY + 3.8, { align: "center" })

    currentY += rowH
  })

  currentY += 8

  // ─── PENGESAHAN & PERNYATAAN RESMI ──────────────────────────────────────────
  checkPageBreak(28)

  const dateNowStr = formatDateIndo(new Date())

  // Statement box on left
  doc.setFont("helvetica", "italic")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  const statement =
    "Pernyataan: Data dan riwayat kepegawaian yang tercantum dalam dokumen ini adalah benar, sah, dan terdaftar dalam pangkalan data resmi SIMPEG PERUMDA Air Minum Tirta Ardhia Rinjani Kabupaten Lombok Tengah."
  const splitStatement = doc.splitTextToSize(statement, 105)
  doc.text(splitStatement, marginX, currentY + 2)

  // Signature Block on right
  const signX = marginX + 120
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text(`Praya, ${dateNowStr}`, signX, currentY + 2)
  doc.text("Pegawai yang bersangkutan,", signX, currentY + 6)

  // Signature spacing
  currentY += 22
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(data.nama.toUpperCase(), signX, currentY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`NIK: ${data.nik}`, signX, currentY + 3.5)

  // ─── RUNNING FOOTER ON ALL PAGES ────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.2)
    doc.line(marginX, 287, marginX + contentWidth, 287)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `SIMPEG — PERUMDA Air Minum Tirta Ardhia Rinjani | Dokumen Resmi Kepegawaian (Format CV ATS)`,
      marginX,
      291
    )
    doc.text(`Halaman ${i} dari ${totalPages}`, marginX + contentWidth, 291, { align: "right" })
  }

  // Save PDF
  const safeName = data.nama.replace(/[^a-zA-Z0-9]/g, "_")
  doc.save(`CV_ATS_${safeName}.pdf`)
}
