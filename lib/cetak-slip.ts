import jsPDF from "jspdf"

export interface MySlipData {
  pegawaiId: string
  nik: string
  nama: string
  unit: string
  golongan: string
  jabatan?: string
  bank: string
  noRekening: string
  gajiPokok: number
  tunjangan: number
  lembur?: number
  potongan: number
  gajiBersih: number
  status: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export async function generateA5SlipGajiPdf(data: MySlipData, periodeLabel: string) {
  // A5 format: 148 x 210 mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5"
  })

  // Set font
  doc.setFont("helvetica", "normal")
  
  const marginX = 10
  const contentWidth = 128
  
  // Base coordinates
  let y = 15
  
  // Section 1: Header
  const headerHeight = 25
  doc.rect(marginX, y, contentWidth, headerHeight) // Outer Box Header
  
  try {
    const res = await fetch("/slip.png")
    const blob = await res.blob()
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    
    // Add image (x, y, width, height)
    // Asumsikan proporsi logo bisa muat di area 20x20
    doc.addImage(logoDataUrl, "PNG", marginX + 6, y + 2.5, 20, 20)
  } catch (err) {
    // Fallback text jika gagal load logo
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("[LOGO]", marginX + 6, y + 14)
  }

  // Title - menyesuaikan offset jika ada logo
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("PERUSAHAAN UMUM DAERAH", marginX + 35, y + 8)
  doc.text("TIRTA ARDHIA RINJANI", marginX + 35, y + 14)
  doc.text("SLIP GAJI BULAN " + periodeLabel.toUpperCase(), marginX + 35, y + 20)
  y += headerHeight
  
  // Section 2: Data Pegawai
  const dataHeight = 35
  doc.rect(marginX, y, contentWidth, dataHeight)
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const lblX = marginX + 5
  const valX = marginX + 30
  const startY = y + 7
  
  doc.text("Nama", lblX, startY)
  doc.text(": " + data.nama, valX, startY)

  doc.text("NIK", lblX, startY + 6)
  doc.text(": " + data.nik, valX, startY + 6)

  doc.text("Jabatan", lblX, startY + 12)
  doc.text(": " + (data.jabatan || "-"), valX, startY + 12)

  doc.text("Unit", lblX, startY + 18)
  doc.text(": " + data.unit, valX, startY + 18)

  doc.text("Golongan", lblX, startY + 24)
  doc.text(": " + data.golongan, valX, startY + 24)
  
  y += dataHeight
  
  // Section 3: Header Penerimaan / Potongan
  const colHeaderHeight = 10
  doc.rect(marginX, y, contentWidth, colHeaderHeight)
  
  doc.setFont("helvetica", "bold")
  doc.text("PENERIMAAN", marginX + 5, y + 6.5)
  doc.text("POTONGAN", marginX + (contentWidth / 2) + 5, y + 6.5)
  
  y += colHeaderHeight
  
  // Section 4: Rincian (Body)
  const bodyHeight = 35
  doc.rect(marginX, y, contentWidth, bodyHeight)
  
  // Vertical line separating Penerimaan & Potongan (span across Header and Body)
  doc.line(marginX + contentWidth / 2, y - colHeaderHeight, marginX + contentWidth / 2, y + bodyHeight)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  const leftX = marginX + 5
  const leftXVal = marginX + (contentWidth / 2) - 5
  
  const rightX = marginX + (contentWidth / 2) + 5
  const rightXVal = marginX + contentWidth - 5
  
  const valY = y + 7
  
  // Kiri (Penerimaan)
  doc.text("Gaji Pokok", leftX, valY)
  doc.text(formatCurrency(data.gajiPokok), leftXVal, valY, { align: "right" })
  
  doc.text("Tunjangan", leftX, valY + 6)
  doc.text(formatCurrency(data.tunjangan), leftXVal, valY + 6, { align: "right" })
  
  doc.text("Lembur", leftX, valY + 12)
  doc.text(formatCurrency(data.lembur || 0), leftXVal, valY + 12, { align: "right" })
  
  doc.text("Total Bruto", leftX, valY + 24)
  const totalBruto = data.gajiPokok + data.tunjangan + (data.lembur || 0)
  doc.text(formatCurrency(totalBruto), leftXVal, valY + 24, { align: "right" })

  // Kanan (Potongan)
  doc.text("BPJS Kesehatan", rightX, valY)
  doc.text("-", rightXVal, valY, { align: "right" })
  
  doc.text("BPJS TK", rightX, valY + 6)
  doc.text("-", rightXVal, valY + 6, { align: "right" })
  
  doc.text("PPh 21", rightX, valY + 12)
  doc.text("-", rightXVal, valY + 12, { align: "right" })
  
  doc.text("Total Potongan", rightX, valY + 24)
  doc.text(formatCurrency(data.potongan), rightXVal, valY + 24, { align: "right" })
  
  y += bodyHeight
  
  // Section 5: Gaji Bersih Footer
  const footerHeight = 12
  doc.rect(marginX, y, contentWidth, footerHeight)
  
  doc.setFont("helvetica", "bold")
  doc.text("GAJI BERSIH : " + formatCurrency(data.gajiBersih), marginX + 5, y + 8)
  
  // Footer text
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text("Slip gaji ini digenerate secara resmi melalui sistem ASIK", marginX, y + footerHeight + 8)
  
  // Save PDF
  const filenameStr = `Slip_Gaji_${data.nama.replace(/\s+/g,"_")}_${periodeLabel.replace(/\s+/g,"_")}.pdf`
  doc.save(filenameStr)
}
