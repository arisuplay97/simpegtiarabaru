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
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function clean(val?: string | null): string {
  if (!val || val.trim() === "") return "-"
  return val.trim()
}

export async function generateCvPdf(data: CvEmployeeData) {
  // Load logo slip.png if available
  let logoDataUrl: string | null = null
  try {
    const res = await fetch("/slip.png")
    if (res.ok) {
      const blob = await res.blob()
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    }
  } catch (e) {
    // Ignore fetch error in test/non-browser environment
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const mx = 15
  const cw = 180
  const maxY = 280
  let y = 14
  const rowH = 6
  const headerH = 6

  // All drawing in black
  const setBlack = () => {
    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)
  }

  const pageBreak = (need: number) => {
    if (y + need > maxY) {
      doc.addPage()
      y = 14
    }
  }

  // Helper: draw a table with columns
  const drawTable = (
    title: string,
    columns: Array<{ label: string; width: number; align: "left" | "center" }>,
    rows: Array<string[]>,
  ) => {
    // Section title
    pageBreak(headerH + rowH + 6)
    setBlack()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(title, mx, y + 4)
    y += 7

    // Column header row
    doc.setLineWidth(0.3)
    setBlack()
    doc.rect(mx, y, cw, headerH, "S")

    let cx = mx
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    columns.forEach((col, i) => {
      // Vertical dividers between columns (skip first)
      if (i > 0) {
        doc.line(cx, y, cx, y + headerH)
      }
      const tx = col.align === "center" ? cx + col.width / 2 : cx + 2
      doc.text(col.label, tx, y + 4, { align: col.align })
      cx += col.width
    })
    y += headerH

    // Data rows
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setLineWidth(0.2)

    rows.forEach((row) => {
      pageBreak(rowH)
      setBlack()
      doc.rect(mx, y, cw, rowH, "S")

      let rx = mx
      columns.forEach((col, i) => {
        if (i > 0) {
          doc.line(rx, y, rx, y + rowH)
        }
        const cellText = row[i] || "-"
        const tx = col.align === "center" ? rx + col.width / 2 : rx + 2
        const maxW = col.width - 4
        const truncated = doc.splitTextToSize(cellText, maxW)[0] || "-"
        doc.setFont("helvetica", "normal")
        doc.text(truncated, tx, y + 4, { align: col.align })
        rx += col.width
      })
      y += rowH
    })

    y += 4
  }

  // Helper: draw key-value pair table (2 columns: label | value)
  const drawKvTable = (
    title: string,
    rows: Array<[string, string]>,
  ) => {
    const labelW = 50
    const valueW = cw - labelW

    pageBreak(headerH + rowH + 6)
    setBlack()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(title, mx, y + 4)
    y += 7

    // Column header
    doc.setLineWidth(0.3)
    doc.rect(mx, y, cw, headerH, "S")
    doc.line(mx + labelW, y, mx + labelW, y + headerH)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.text("Keterangan", mx + 2, y + 4)
    doc.text("Isian", mx + labelW + 2, y + 4)
    y += headerH

    // Data rows
    doc.setLineWidth(0.2)
    rows.forEach(([label, value]) => {
      pageBreak(rowH)
      setBlack()
      doc.rect(mx, y, cw, rowH, "S")
      doc.line(mx + labelW, y, mx + labelW, y + rowH)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.text(label, mx + 2, y + 4)

      const truncated = doc.splitTextToSize(value, valueW - 4)[0] || "-"
      doc.text(truncated, mx + labelW + 2, y + 4)
      y += rowH
    })

    y += 4
  }

  setBlack()

  // ── HEADER WITH LOGO ──
  const hasLogo = !!logoDataUrl
  const textX = hasLogo ? mx + 16 : mx

  if (hasLogo && logoDataUrl) {
    // 925x1302 aspect ratio: 12.5mm width x 17.6mm height
    doc.addImage(logoDataUrl, "PNG", mx, y, 12.5, 17.6)
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.text("PERUMDA AIR MINUM TIRTA ARDHIA RINJANI", textX, y + 4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Kabupaten Lombok Tengah — Provinsi Nusa Tenggara Barat", textX, y + 8.5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("DAFTAR RIWAYAT HIDUP / CURRICULUM VITAE", textX, y + 14)

  y += hasLogo ? 20 : 17

  doc.setLineWidth(0.5)
  doc.line(mx, y, mx + cw, y)
  y += 5

  // Name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(data.nama.toUpperCase(), mx, y)
  y += 5

  // Position & unit
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  const unitLabel = data.bidang?.nama ? ` — ${data.bidang.nama}` : ""
  doc.text(`${data.jabatan}${unitLabel}`, mx, y)
  y += 4

  // Contact line
  doc.setFontSize(8)
  const contacts = [
    `Nomer Induk Karyawan: ${data.nik}`,
    `Email: ${clean(data.email)}`,
    `Telp: ${clean(data.telepon)}`,
    `Gol: ${data.golongan || "-"}`,
  ]
  doc.text(contacts.join("   |   "), mx, y)
  y += 3

  doc.setLineWidth(0.25)
  doc.line(mx, y, mx + cw, y)
  y += 5

  // ── 1. DATA PRIBADI & KEPEGAWAIAN ──
  const personalRows: Array<[string, string]> = [
    ["Nomer Induk Karyawan (NIK)", clean(data.nik)],
    ["Tempat, Tanggal Lahir", `${clean(data.tempatLahir)}, ${formatDateIndo(data.tanggalLahir)}`],
    ["Jenis Kelamin",
      data.jenisKelamin === "L" || data.jenisKelamin === "LAKI_LAKI" ? "Laki-laki"
        : data.jenisKelamin === "P" || data.jenisKelamin === "PEREMPUAN" ? "Perempuan"
        : clean(data.jenisKelamin)],
    ["Agama", clean(data.agama)],
    ["Status Pernikahan", clean(data.statusNikah)],
    ["Alamat Domisili", clean(data.alamat)],
    ["Nomor Telepon", clean(data.telepon)],
    ["Alamat Email", clean(data.email)],
    ["NPWP", clean(data.npwp)],
    ["Jabatan", clean(data.jabatan)],
    ["Unit Kerja", clean(data.bidang?.nama)],
    ["Pangkat", clean(data.pangkat)],
    ["Golongan", clean(data.golongan)],
    ["Status Kepegawaian", data.status === "AKTIF" ? "Pegawai Aktif" : data.status],
    ["Tanggal Masuk", formatDateIndo(data.tanggalMasuk)],
    ["Atasan Langsung", clean(data.atasanLangsung)],
  ]

  if (data.bank || data.noRekening) {
    personalRows.push(["Bank / No. Rekening", data.bank ? `${data.bank} - ${clean(data.noRekening)}` : clean(data.noRekening)])
  }
  if (data.bpjsKesehatan) {
    personalRows.push(["BPJS Kesehatan", clean(data.bpjsKesehatan)])
  }

  drawKvTable("1. Data Pribadi & Kepegawaian", personalRows)

  // ── 2. RIWAYAT JABATAN ──
  const jabCols = [
    { label: "No", width: 12, align: "center" as const },
    { label: "Jabatan", width: 54, align: "left" as const },
    { label: "Unit Kerja", width: 50, align: "left" as const },
    { label: "Periode", width: 42, align: "center" as const },
    { label: "Status", width: 22, align: "center" as const },
  ]

  const jabRows: string[][] = []

  jabRows.push([
    "1",
    data.jabatan,
    data.bidang?.nama || "-",
    `${formatDateIndo(data.tanggalMasuk)} - Sekarang`,
    "Aktif",
  ])

  if (data.riwayatJabatan && data.riwayatJabatan.length > 0) {
    let no = 2
    data.riwayatJabatan.forEach((rj) => {
      if (rj.jabatan !== data.jabatan) {
        jabRows.push([
          String(no++),
          rj.jabatan,
          rj.unitDefinitif || "-",
          `${formatDateIndo(rj.tanggalMulai)} - ${rj.tanggalSelesai ? formatDateIndo(rj.tanggalSelesai) : "Selesai"}`,
          "Selesai",
        ])
      }
    })
  }

  drawTable("2. Riwayat Jabatan", jabCols, jabRows)

  // ── 3. RIWAYAT PENDIDIKAN ──
  const eduCols = [
    { label: "No", width: 12, align: "center" as const },
    { label: "Jenjang", width: 22, align: "center" as const },
    { label: "Institusi", width: 68, align: "left" as const },
    { label: "Jurusan", width: 52, align: "left" as const },
    { label: "Tahun Lulus", width: 26, align: "center" as const },
  ]

  const eduRows: string[][] = []

  if (data.pendidikan && data.pendidikan.length > 0) {
    data.pendidikan.forEach((p, i) => {
      eduRows.push([String(i + 1), p.tingkat || "-", p.institusi || "-", p.jurusan || "-", p.tahunLulus || "-"])
    })
  } else if (data.pendidikanTerakhir || data.institusi) {
    eduRows.push(["1", data.pendidikanTerakhir || "-", data.institusi || "-", data.jurusan || "-", data.tahunLulus || "-"])
  } else {
    eduRows.push(["1", "-", "Belum ada data pendidikan", "-", "-"])
  }

  drawTable("3. Riwayat Pendidikan", eduCols, eduRows)

  // ── 4. RIWAYAT KEPANGKATAN ──
  const rankCols = [
    { label: "No", width: 12, align: "center" as const },
    { label: "Pangkat", width: 46, align: "left" as const },
    { label: "Golongan", width: 30, align: "center" as const },
    { label: "TMT Berlaku", width: 40, align: "center" as const },
    { label: "Nomor SK", width: 52, align: "left" as const },
  ]

  const rankRows: string[][] = []

  rankRows.push(["1", data.pangkat || "-", data.golongan || "-", formatDateIndo(data.tanggalMasuk), "-"])

  if (data.riwayatPangkatDetail && data.riwayatPangkatDetail.length > 0) {
    let no = 2
    data.riwayatPangkatDetail.forEach((rp) => {
      rankRows.push([String(no++), rp.pangkat, rp.golongan, formatDateIndo(rp.tanggalBerlaku), rp.nomorSK || "-"])
    })
  }

  drawTable("4. Riwayat Kepangkatan & Golongan", rankCols, rankRows)

  // ── 5. PELATIHAN ──
  const trainCols = [
    { label: "No", width: 12, align: "center" as const },
    { label: "Nama Pelatihan", width: 82, align: "left" as const },
    { label: "Penyelenggara", width: 60, align: "left" as const },
    { label: "Tahun", width: 26, align: "center" as const },
  ]

  const trainRows: string[][] = []
  if (data.pelatihan && data.pelatihan.length > 0) {
    data.pelatihan.forEach((pl, i) => {
      trainRows.push([String(i + 1), pl.namaPelatihan, pl.penyelenggara || "-", pl.tahun || "-"])
    })
  } else {
    trainRows.push(["1", "Belum ada data pelatihan", "-", "-"])
  }

  drawTable("5. Pelatihan & Sertifikasi", trainCols, trainRows)

  // ── 6. KELUARGA ──
  const famCols = [
    { label: "No", width: 12, align: "center" as const },
    { label: "Nama Lengkap", width: 58, align: "left" as const },
    { label: "Hubungan", width: 34, align: "left" as const },
    { label: "Pekerjaan", width: 46, align: "left" as const },
    { label: "Kontak", width: 30, align: "center" as const },
  ]

  const famRows: string[][] = []
  if (data.keluarga && data.keluarga.length > 0) {
    data.keluarga.forEach((k, i) => {
      famRows.push([String(i + 1), k.nama, k.hubungan, k.pekerjaan || "-", k.telepon || "-"])
    })
  } else {
    famRows.push(["1", "Belum ada data keluarga", "-", "-", "-"])
  }

  drawTable("6. Susunan Keluarga", famCols, famRows)

  // ── PENGESAHAN ──
  pageBreak(30)
  setBlack()

  const dateNow = formatDateIndo(new Date())

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7)
  const stmt = "Demikian daftar riwayat hidup ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya."
  doc.text(doc.splitTextToSize(stmt, 100), mx, y + 2)

  const signX = mx + 115
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Praya, ${dateNow}`, signX, y + 2)
  doc.text("Yang bersangkutan,", signX, y + 6)

  y += 22
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.text(data.nama.toUpperCase(), signX, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.text(`Nomer Induk Karyawan: ${data.nik}`, signX, y + 3.5)

  // ── FOOTER ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    setBlack()
    doc.setLineWidth(0.2)
    doc.line(mx, 287, mx + cw, 287)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text("SIMPEG — PERUMDA Air Minum Tirta Ardhia Rinjani", mx, 291)
    doc.text(`Halaman ${i} / ${totalPages}`, mx + cw, 291, { align: "right" })
  }

  const safeName = data.nama.replace(/[^a-zA-Z0-9]/g, "_")
  doc.save(`CV_${safeName}.pdf`)
}
