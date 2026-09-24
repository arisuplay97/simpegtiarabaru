import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { jsPDF } from "jspdf"
import { auth } from "@/lib/auth"
import { getKalenderMatrix, PegawaiMatrixRow } from "@/lib/actions/kalender-matrix"
import { getSystemSettings } from "@/lib/actions/absensi"

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const nowWita = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }))
    const bulan = parseInt(searchParams.get("bulan") || String(nowWita.getMonth() + 1))
    const tahun = parseInt(searchParams.get("tahun") || String(nowWita.getFullYear()))
    const format = (searchParams.get("format") || "excel").toLowerCase()
    const filterSearch = searchParams.get("search")?.toLowerCase().trim() || ""
    const filterBidang = searchParams.get("bidang") || "ALL"
    const filterCabang = searchParams.get("cabang") || "ALL"

    // Ambil data matriks kehadiran untuk periode terpilih
    const matrixRes = await getKalenderMatrix(bulan, tahun)
    if (!matrixRes.success) {
      return NextResponse.json({ error: matrixRes.error || "Gagal mengambil data kalender" }, { status: 400 })
    }

    let rows: PegawaiMatrixRow[] = [...matrixRes.rows]

    // Ambil pengaturan jam kerja untuk deteksi telat
    const settings = await getSystemSettings()
    const [jamMasukH, jamMasukM] = (settings.jamMasuk || "08:00").split(":").map(Number)
    const batasTerlambatMenit = settings.batasTerlambat || 0 // toleransi menit

    // Terapkan filter pencarian
    if (filterSearch) {
      rows = rows.filter(
        (r) =>
          r.nama.toLowerCase().includes(filterSearch) ||
          r.nik.toLowerCase().includes(filterSearch) ||
          r.departemen.toLowerCase().includes(filterSearch) ||
          r.cabang.toLowerCase().includes(filterSearch) ||
          r.jabatan.toLowerCase().includes(filterSearch)
      )
    }

    // Terapkan filter Bidang/Departemen
    if (filterBidang !== "ALL") {
      rows = rows.filter((r) => r.bidangId === filterBidang || r.departemen === filterBidang)
    }

    // Terapkan filter Cabang
    if (filterCabang !== "ALL") {
      rows = rows.filter((r) => r.cabangId === filterCabang || r.cabang === filterCabang)
    }

    const totalDays = matrixRes.totalDays
    const daysInfo = matrixRes.daysInfo
    const bulanNama = BULAN_NAMES[bulan - 1]
    const printDateWita = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar"
    })
    const printTimeWita = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar"
    }).replace(".", ":")

    // Filter label for headers
    const filterLabelParts: string[] = []
    if (filterBidang !== "ALL") filterLabelParts.push(`Bidang: ${filterBidang}`)
    if (filterCabang !== "ALL") filterLabelParts.push(`Cabang: ${filterCabang}`)
    if (filterSearch) filterLabelParts.push(`Pencarian: "${filterSearch}"`)
    const filterInfoText = filterLabelParts.length > 0 ? filterLabelParts.join(" | ") : "Semua Unit Kerja & Cabang"

    // =========================================================================
    // 1. FORMAT: EXCEL (.XLSX)
    // =========================================================================
    if (format === "excel" || format === "xlsx") {
      const wb = new ExcelJS.Workbook()
      wb.creator = "SIMPEG TIARA - PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"
      wb.created = now

      const ws = wb.addWorksheet(`Matriks ${bulanNama} ${tahun}`, {
        views: [{ showGridLines: true }]
      })

      // Kop Dokumen
      const title1 = ws.addRow(["PEMERINTAH KABUPATEN LOMBOK TENGAH"])
      const title2 = ws.addRow(["PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"])
      const title3 = ws.addRow(["MATRIKS REKAPITULASI KEHADIRAN & PRESENSI PEGAWAI"])
      const title4 = ws.addRow([`PERIODE: BULAN ${bulanNama.toUpperCase()} TAHUN ${tahun}  |  ZONA WAKTU: WITA (UTC+8)`])
      const title5 = ws.addRow([`Filter: ${filterInfoText}  |  Total Data: ${rows.length} Pegawai  |  Dicetak: ${printDateWita} pukul ${printTimeWita} WITA`])
      ws.addRow([]) // spacer row 6

      title1.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF334155" } }
      title2.font = { name: "Arial", size: 13, bold: true, color: { argb: "FF1E3A8A" } }
      title3.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF0F172A" } }
      title4.font = { name: "Arial", size: 9.5, italic: true, bold: true, color: { argb: "FF475569" } }
      title5.font = { name: "Arial", size: 8.5, italic: true, color: { argb: "FF64748B" } }

      // Setup Columns
      const cols: Partial<ExcelJS.Column>[] = [
        { key: "no", width: 6 },
        { key: "nik", width: 14 },
        { key: "nama", width: 32 },
        { key: "jabatan", width: 24 },
        { key: "cabang", width: 22 },
      ]

      for (let d = 1; d <= totalDays; d++) {
        cols.push({ key: `day_${d}`, width: 4.8 })
      }

      cols.push(
        { key: "tot_h", width: 6 },
        { key: "tot_t", width: 6 },
        { key: "tot_i", width: 6 },
        { key: "tot_s", width: 6 },
        { key: "tot_c", width: 6 },
        { key: "tot_a", width: 6 },
        { key: "tot_persen", width: 8 }
      )
      ws.columns = cols

      // Row 7: Header Utama
      const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1)
      const headerRowVals = [
        "NO",
        "NIK",
        "NAMA PEGAWAI",
        "JABATAN",
        "BIDANG / CABANG",
        ...dayNumbers,
        "H",
        "T",
        "I",
        "S",
        "C",
        "A",
        "%"
      ]
      const headerRow = ws.addRow(headerRowVals)
      headerRow.height = 24

      // Row 8: Nama Hari (Subheader)
      const dayNamesShort = daysInfo.map((di) => di.dayName)
      const subHeaderRowVals = [
        "",
        "",
        "",
        "",
        "",
        ...dayNamesShort,
        "Hadir",
        "Lmbat",
        "Izin",
        "Sakit",
        "Cuti",
        "Alpa",
        "Hadir %"
      ]
      const subHeaderRow = ws.addRow(subHeaderRowVals)
      subHeaderRow.height = 18

      // Merge header cells for NO, NIK, NAMA, JABATAN, CABANG
      ws.mergeCells("A7:A8")
      ws.mergeCells("B7:B8")
      ws.mergeCells("C7:C8")
      ws.mergeCells("D7:D8")
      ws.mergeCells("E7:E8")

      // Style Header Rows (7 & 8)
      for (let rNum = 7; rNum <= 8; rNum++) {
        const r = ws.getRow(rNum)
        r.eachCell((cell, colNum) => {
          cell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: "FFFFFFFF" } }
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E3A8A" } // Deep Navy Blue
          }
          cell.border = {
            top: { style: "thin", color: { argb: "FF94A3B8" } },
            left: { style: "thin", color: { argb: "FF94A3B8" } },
            bottom: { style: "thin", color: { argb: "FF94A3B8" } },
            right: { style: "thin", color: { argb: "FF94A3B8" } },
          }

          // Special highlight for weekend column headers
          if (colNum >= 6 && colNum < 6 + totalDays) {
            const dayIndex = colNum - 6
            const isWk = daysInfo[dayIndex]?.isWeekend
            if (isWk) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF334155" } // Dark Slate for weekend
              }
            }
          }

          // Summary Column Colors on Subheader
          if (rNum === 8) {
            if (colNum === 6 + totalDays) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } } // Green
            if (colNum === 6 + totalDays + 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } } // Amber
            if (colNum === 6 + totalDays + 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC2410C" } } // Orange
            if (colNum === 6 + totalDays + 3) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7E22CE" } } // Purple
            if (colNum === 6 + totalDays + 4) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } } // Blue
            if (colNum === 6 + totalDays + 5) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBE123C" } } // Rose
            if (colNum === 6 + totalDays + 6) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF312E81" } } // Indigo
          }
        })
      }

      // Render Rows
      let grandH = 0
      let grandT = 0
      let grandI = 0
      let grandS = 0
      let grandC = 0
      let grandA = 0

      rows.forEach((r, idx) => {
        grandH += r.totalHadir
        grandT += r.totalTerlambat
        grandI += r.totalIzin
        grandS += r.totalSakit
        grandC += r.totalCuti
        grandA += r.totalAlpha

        const dayCodes = Array.from({ length: totalDays }, (_, i) => {
          const st = r.days[i + 1]
          return st?.code || "-"
        })

        const effectiveWorkDays = r.totalHariKerja > 0 ? r.totalHariKerja : 1
        const hadirPersen = Number((((r.totalHadir + r.totalTerlambat) / effectiveWorkDays) * 100).toFixed(0))

        const rowValues = [
          idx + 1,
          r.nik,
          r.nama,
          r.jabatan,
          r.cabang || r.departemen,
          ...dayCodes,
          r.totalHadir,
          r.totalTerlambat,
          r.totalIzin,
          r.totalSakit,
          r.totalCuti,
          r.totalAlpha,
          `${hadirPersen}%`
        ]

        const dataRow = ws.addRow(rowValues)
        dataRow.height = 20

        const isEven = idx % 2 === 1
        const zebraBg = isEven ? "FFF8FAFC" : "FFFFFFFF"

        dataRow.eachCell((cell, colNum) => {
          cell.font = { name: "Arial", size: 8.5 }
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          }

          // Default background
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: zebraBg }
          }

          // Alignment
          if (colNum === 1 || colNum === 2) {
            cell.alignment = { vertical: "middle", horizontal: "center" }
          } else if (colNum === 3 || colNum === 4 || colNum === 5) {
            cell.alignment = { vertical: "middle", horizontal: "left" }
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" }
          }

          // Day Cell Color Coding
          if (colNum >= 6 && colNum < 6 + totalDays) {
            const dayIdx = colNum - 6
            const isWk = daysInfo[dayIdx]?.isWeekend
            const val = String(cell.value || "")

            if (val === "H") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF166534" } }
            } else if (val === "T") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF92400E" } }
            } else if (val === "C") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF1E40AF" } }
            } else if (val === "I") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF9A3412" } }
            } else if (val === "S") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E8FF" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF6B21A8" } }
            } else if (val === "A") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE4E6" } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF9F1239" } }
            } else if (val === "L" || isWk) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
              cell.font = { name: "Arial", size: 8, color: { argb: "FF94A3B8" } }
            } else {
              cell.font = { name: "Arial", size: 8, color: { argb: "FFCBD5E1" } }
            }
          }

          // Summary Columns styling
          if (colNum >= 6 + totalDays) {
            cell.font = { name: "Arial", size: 8.5, bold: true }
          }
        })
      })

      // Total Row at the bottom
      const totalRowVals = [
        "",
        "",
        "TOTAL KESELURUHAN",
        "",
        "",
        ...Array.from({ length: totalDays }, () => ""),
        grandH,
        grandT,
        grandI,
        grandS,
        grandC,
        grandA,
        ""
      ]
      const totalRow = ws.addRow(totalRowVals)
      totalRow.height = 22
      ws.mergeCells(`A${totalRow.number}:E${totalRow.number}`)

      totalRow.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF0F172A" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" }
        }
        cell.border = {
          top: { style: "medium", color: { argb: "FF64748B" } },
          bottom: { style: "double", color: { argb: "FF64748B" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        }
        if (colNum <= 5) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
      })

      // Legend / Keterangan Kode di bawah tabel
      ws.addRow([]) // spacer
      const legendTitle = ws.addRow(["KETERANGAN KODE PRESENSI:"])
      legendTitle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1E293B" } }

      const legends = [
        "H  = Hadir Tepat Waktu (Hijau)",
        "T  = Terlambat Hadir (Kuning / Amber)",
        "I  = Izin Resmi / Dispensasi Dinas (Oranye)",
        "S  = Sakit dengan Surat Dokter (Ungu)",
        "C  = Cuti Tahunan / Melahirkan / Alasan Penting (Biru)",
        "A  = Alpha / Tanpa Keterangan Sah (Merah)",
        "L  = Libur Akhir Pekan (Abu-abu)",
        "Catatan: Jam pencatatan kehadiran menggunakan Zona Waktu Indonesia Tengah (WITA, UTC+8)."
      ]

      legends.forEach((leg) => {
        const lr = ws.addRow([leg])
        lr.font = { name: "Arial", size: 8.5, color: { argb: "FF475569" } }
      })

      // Signature Block
      ws.addRow([])
      const sigDateRow = ws.addRow(["", "", "", "", "", ...Array.from({ length: Math.max(0, totalDays - 8) }, () => ""), `Praya, ${printDateWita}`])
      sigDateRow.font = { name: "Arial", size: 9, bold: true }

      const sigTitleRow = ws.addRow(["", "", "Mengetahui,", "", "", ...Array.from({ length: Math.max(0, totalDays - 8) }, () => ""), "Kasubbid Kepegawaian & SDM"])
      sigTitleRow.font = { name: "Arial", size: 9, bold: true }

      const sigRoleRow = ws.addRow(["", "", "Plt. Direktur Utama", "", "", ...Array.from({ length: Math.max(0, totalDays - 8) }, () => ""), "PERUMDA Tirta Ardhia Rinjani"])
      sigRoleRow.font = { name: "Arial", size: 8.5, italic: true }

      ws.addRow([])
      ws.addRow([])
      ws.addRow([])

      const sigNameRow = ws.addRow(["", "", "( Bambang Supratomo, S.T., M.T. )", "", "", ...Array.from({ length: Math.max(0, totalDays - 8) }, () => ""), "( H. Lalu M. Syarif, S.E. )"])
      sigNameRow.font = { name: "Arial", size: 9, bold: true }

      // =====================================================================
      // SHEET 2: DETAIL PRESENSI PER SESI
      // =====================================================================
      const ws2 = wb.addWorksheet(`Detail ${bulanNama} ${tahun}`, {
        views: [{ showGridLines: true }],
      })

      // Kop Sheet 2
      const d2Title1 = ws2.addRow(["PERUMDA AIR MINUM TIRTA ARDHIA RINJANI"])
      const d2Title2 = ws2.addRow([`DETAIL PRESENSI PER SESI — ${bulanNama.toUpperCase()} ${tahun}`])
      const d2Title3 = ws2.addRow([`Filter: ${filterInfoText}  |  Dicetak: ${printDateWita} (${printTimeWita} WITA)  |  Jam Masuk Standar: ${settings.jamMasuk} WITA`])
      ws2.addRow([]) // spacer

      d2Title1.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E3A8A" } }
      d2Title2.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } }
      d2Title3.font = { name: "Arial", size: 8.5, italic: true, color: { argb: "FF64748B" } }

      // Setup columns
      ws2.columns = [
        { key: "no", width: 5 },
        { key: "nik", width: 14 },
        { key: "nama", width: 28 },
        { key: "jabatan", width: 22 },
        { key: "unit", width: 20 },
        { key: "tanggal", width: 12 },
        { key: "hari", width: 8 },
        { key: "jam_masuk", width: 10 },
        { key: "status_pagi", width: 14 },
        { key: "jam_siang", width: 10 },
        { key: "status_siang", width: 14 },
        { key: "jam_pulang", width: 10 },
        { key: "status_pulang", width: 14 },
        { key: "sesi_hadir", width: 12 },
        { key: "kode", width: 6 },
        { key: "keterangan", width: 24 },
      ]

      // Header
      const d2HeaderVals = [
        "NO", "NIK", "NAMA PEGAWAI", "JABATAN", "BIDANG/CABANG",
        "TANGGAL", "HARI",
        "JAM MASUK", "STATUS PAGI",
        "JAM SIANG", "STATUS SIANG",
        "JAM PULANG", "STATUS SORE",
        "SESI HADIR", "KODE", "KETERANGAN"
      ]
      const d2Header = ws2.addRow(d2HeaderVals)
      d2Header.height = 22

      d2Header.eachCell((cell) => {
        cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FFFFFFFF" } }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }
        cell.border = {
          top: { style: "thin", color: { argb: "FF94A3B8" } },
          left: { style: "thin", color: { argb: "FF94A3B8" } },
          bottom: { style: "thin", color: { argb: "FF94A3B8" } },
          right: { style: "thin", color: { argb: "FF94A3B8" } },
        }
      })

      const hariNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      // Hitung batas waktu telat dalam menit dari 00:00
      const batasTelatTotalMenit = jamMasukH * 60 + jamMasukM + batasTerlambatMenit
      let d2No = 0

      for (const r of rows) {
        for (let day = 1; day <= totalDays; day++) {
          const st = r.days[day]
          if (!st) continue

          // Skip weekend & hari mendatang tanpa data
          if (st.isWeekend && st.code === "L") continue
          if (st.code === "-") continue

          d2No++

          const curDate = new Date(`${st.dateStr}T12:00:00+08:00`)
          const hariNama = hariNames[curDate.getDay()]

          // Determine pagi status
          let statusPagi = "-"
          let statusPagiBg = "FFFFFFFF"
          let statusPagiColor = "FF94A3B8"
          if (st.jamMasuk) {
            // Parse jam masuk untuk cek telat
            const [mH, mM] = st.jamMasuk.split(":").map(Number)
            const masukTotalMenit = mH * 60 + mM
            if (masukTotalMenit > batasTelatTotalMenit) {
              const telatMenit = masukTotalMenit - batasTelatTotalMenit
              statusPagi = `TELAT ${telatMenit} mnt`
              statusPagiBg = "FFFEF3C7"
              statusPagiColor = "FF92400E"
            } else {
              statusPagi = "TEPAT WAKTU"
              statusPagiBg = "FFDCFCE7"
              statusPagiColor = "FF166534"
            }
          } else if (st.code === "H" || st.code === "T") {
            statusPagi = "TIDAK ABSEN"
            statusPagiBg = "FFFFE4E6"
            statusPagiColor = "FF9F1239"
          }

          // Determine siang status
          let statusSiang = "-"
          let statusSiangBg = "FFFFFFFF"
          let statusSiangColor = "FF94A3B8"
          if (st.jamSiang) {
            statusSiang = "HADIR"
            statusSiangBg = "FFDCFCE7"
            statusSiangColor = "FF166534"
          } else if (st.code === "H" || st.code === "T") {
            statusSiang = "TIDAK ABSEN"
            statusSiangBg = "FFFFE4E6"
            statusSiangColor = "FF9F1239"
          }

          // Determine pulang status
          let statusPulang = "-"
          let statusPulangBg = "FFFFFFFF"
          let statusPulangColor = "FF94A3B8"
          if (st.jamKeluar) {
            statusPulang = "HADIR"
            statusPulangBg = "FFDCFCE7"
            statusPulangColor = "FF166534"
          } else if (st.code === "H" || st.code === "T") {
            statusPulang = "TIDAK ABSEN"
            statusPulangBg = "FFFFE4E6"
            statusPulangColor = "FF9F1239"
          }

          // Hitung sesi yang hadir
          let sesiCount = 0
          if (st.jamMasuk) sesiCount++
          if (st.jamSiang) sesiCount++
          if (st.jamKeluar) sesiCount++
          const sesiLabel = st.code === "H" || st.code === "T" ? `${sesiCount}/3 sesi` : "-"

          // Kode warna mapping
          const kodeColorMap: Record<string, string> = {
            H: "FF166534", T: "FF92400E", C: "FF1E40AF",
            I: "FF9A3412", S: "FF6B21A8", A: "FF9F1239"
          }

          const rowVals = [
            d2No,
            r.nik,
            r.nama,
            r.jabatan,
            r.cabang || r.departemen,
            st.dateStr.split("-").reverse().join("/"), // DD/MM/YYYY
            hariNama,
            st.jamMasuk || "-",
            statusPagi,
            st.jamSiang || "-",
            statusSiang,
            st.jamKeluar || "-",
            statusPulang,
            sesiLabel,
            st.code,
            st.keterangan || st.statusLabel,
          ]

          const dataRow = ws2.addRow(rowVals)
          dataRow.height = 18

          const isEven = d2No % 2 === 0
          const zebraBg = isEven ? "FFF8FAFC" : "FFFFFFFF"

          dataRow.eachCell((cell, colNum) => {
            cell.font = { name: "Arial", size: 8 }
            cell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraBg } }
            cell.alignment = { vertical: "middle", horizontal: colNum <= 5 ? "left" : "center" }

            // Status Pagi coloring (col 9)
            if (colNum === 9 && statusPagi !== "-") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusPagiBg } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: statusPagiColor } }
            }
            // Status Siang coloring (col 11)
            if (colNum === 11 && statusSiang !== "-") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusSiangBg } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: statusSiangColor } }
            }
            // Status Pulang coloring (col 13)
            if (colNum === 13 && statusPulang !== "-") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusPulangBg } }
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: statusPulangColor } }
            }
            // Sesi count coloring (col 14)
            if (colNum === 14 && sesiLabel !== "-") {
              if (sesiCount === 3) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }
                cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF166534" } }
              } else if (sesiCount >= 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
                cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF92400E" } }
              } else {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE4E6" } }
                cell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF9F1239" } }
              }
            }
            // Kode coloring (col 15)
            if (colNum === 15) {
              const codeColor = kodeColorMap[String(cell.value)] || "FF94A3B8"
              cell.font = { name: "Arial", size: 8, bold: true, color: { argb: codeColor } }
            }
          })
        }
      }

      // Legend di Sheet 2
      ws2.addRow([])
      const d2LegTitle = ws2.addRow(["KETERANGAN:"])
      d2LegTitle.font = { name: "Arial", size: 8.5, bold: true }
      const d2Legends = [
        `Jam Masuk Standar: ${settings.jamMasuk} WITA  |  Toleransi Telat: ${batasTerlambatMenit} menit`,
        "STATUS PAGI: TEPAT WAKTU (hijau) = masuk sebelum/tepat batas  |  TELAT (kuning) = masuk setelah batas",
        "STATUS SIANG/SORE: HADIR (hijau) = sudah absen  |  TIDAK ABSEN (merah) = belum/tidak absen sesi tersebut",
        "SESI HADIR: 3/3 = lengkap semua sesi  |  2/3 atau 1/3 = tidak lengkap  |  0/3 = tidak absen sama sekali",
      ]
      d2Legends.forEach((leg) => {
        const lr = ws2.addRow([leg])
        lr.font = { name: "Arial", size: 8, color: { argb: "FF475569" } }
      })

      const buffer = await wb.xlsx.writeBuffer()
      const filename = `MATRIKS_KEHADIRAN_${bulanNama.toUpperCase()}_${tahun}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    // =========================================================================
    // 2. FORMAT: PDF (.PDF)
    // =========================================================================
    if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth() // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight() // 210 mm
      const marginX = 8
      const contentWidth = pageWidth - marginX * 2 // 281 mm

      // Column widths:
      // Fixed: No(6), NIK(16), Nama(38), Unit(24), Rekap(H:5, T:5, I:5, S:5, C:5, A:5, %:6) = 115 mm
      // Sisa untuk hari = 281 - 115 = 166 mm
      const fixedWidth = 6 + 16 + 38 + 24 + (5 * 6) + 6
      const remainingForDays = contentWidth - fixedWidth
      const dayColWidth = Number((remainingForDays / totalDays).toFixed(2))

      const colWidths = [
        6,    // No
        16,   // NIK
        38,   // Nama
        24,   // Unit/Cabang
        ...Array.from({ length: totalDays }, () => dayColWidth),
        5,    // H
        5,    // T
        5,    // I
        5,    // S
        5,    // C
        5,    // A
        6     // %
      ]

      let y = 10
      let currentPage = 1

      const printKopSurat = () => {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9.5)
        doc.setTextColor(30, 41, 59)
        doc.text("PEMERINTAH KABUPATEN LOMBOK TENGAH", pageWidth / 2, y, { align: "center" })
        y += 4

        doc.setFontSize(12.5)
        doc.setTextColor(30, 58, 138) // Deep Blue
        doc.text("PERUMDA AIR MINUM TIRTA ARDHIA RINJANI", pageWidth / 2, y, { align: "center" })
        y += 3.8

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text("Jl. Gajah Mada No. 10, Praya, Kabupaten Lombok Tengah, NTB | Telepon: (0370) 654321 | SIMPEG TIARA", pageWidth / 2, y, { align: "center" })
        y += 3

        // Garis Pembatas Kop Ganda
        doc.setDrawColor(30, 58, 138)
        doc.setLineWidth(0.6)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 0.7
        doc.setLineWidth(0.2)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 4

        // Judul Dokumen & Subtitle
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text("MATRIKS REKAPITULASI KEHADIRAN & PRESENSI PEGAWAI", pageWidth / 2, y, { align: "center" })
        y += 3.8

        doc.setFont("helvetica", "italic")
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text(`BULAN: ${bulanNama.toUpperCase()} ${tahun}  |  ZONA WAKTU: WITA (UTC+8)`, pageWidth / 2, y, { align: "center" })
        y += 3.5

        // Filter & Metadata Bar
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(`Filter: ${filterInfoText}  ·  Total Data: ${rows.length} Pegawai  ·  Dicetak: ${printDateWita} (${printTimeWita} WITA)`, marginX, y)
        y += 3.5
      }

      const printTableHeader = () => {
        const headerH = 7
        doc.setFillColor(30, 58, 138) // Deep Navy Blue
        doc.rect(marginX, y, contentWidth, headerH, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(6.5)
        doc.setTextColor(255, 255, 255)

        let currX = marginX

        // 1. NO
        doc.text("NO", currX + 3, y + 4.5, { align: "center" })
        currX += 6

        // 2. NIK
        doc.text("NIK", currX + 8, y + 4.5, { align: "center" })
        currX += 16

        // 3. NAMA
        doc.text("NAMA PEGAWAI", currX + 2, y + 4.5, { align: "left" })
        currX += 38

        // 4. UNIT
        doc.text("UNIT / CABANG", currX + 2, y + 4.5, { align: "left" })
        currX += 24

        // 5. DAYS (1 to totalDays)
        for (let d = 1; d <= totalDays; d++) {
          const isWk = daysInfo[d - 1]?.isWeekend
          if (isWk) {
            doc.setFillColor(51, 65, 85) // Dark slate for weekend
            doc.rect(currX, y, dayColWidth, headerH, "F")
          }
          doc.setTextColor(255, 255, 255)
          doc.text(String(d), currX + dayColWidth / 2, y + 4.5, { align: "center" })
          currX += dayColWidth
        }

        // 6. REKAP COLS
        const rekapCols = ["H", "T", "I", "S", "C", "A", "%"]
        rekapCols.forEach((rc, i) => {
          const w = i === 6 ? 6 : 5
          doc.text(rc, currX + w / 2, y + 4.5, { align: "center" })
          currX += w
        })

        y += headerH
      }

      const printFooter = (pageNum: number) => {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(6.5)
        doc.setTextColor(148, 163, 184)
        doc.text(`SIMPEG TIARA · Dicetak pada ${printDateWita} pukul ${printTimeWita} WITA (Asia/Makassar)`, marginX, pageHeight - 6)
        doc.text(`Halaman ${pageNum}`, pageWidth - marginX, pageHeight - 6, { align: "right" })
      }

      // First Page Header
      printKopSurat()
      printTableHeader()

      // Render Rows
      const rowHeight = 4.8

      rows.forEach((r, idx) => {
        // Cek sisa halaman
        if (y + rowHeight > pageHeight - 16) {
          printFooter(currentPage)
          doc.addPage()
          currentPage++
          y = 10
          printKopSurat()
          printTableHeader()
        }

        const isEven = idx % 2 === 1
        if (isEven) {
          doc.setFillColor(248, 250, 252) // Slate-50
          doc.rect(marginX, y, contentWidth, rowHeight, "F")
        }

        // Border row
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.15)
        doc.rect(marginX, y, contentWidth, rowHeight, "S")

        let currX = marginX

        // 1. NO
        doc.setFont("helvetica", "normal")
        doc.setFontSize(6.5)
        doc.setTextColor(71, 85, 105)
        doc.text(String(idx + 1), currX + 3, y + 3.4, { align: "center" })
        currX += 6

        // 2. NIK
        doc.text(r.nik.replace(/\s+/g, ""), currX + 8, y + 3.4, { align: "center" })
        currX += 16

        // 3. NAMA (Truncate if too long)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        const truncatedName = doc.splitTextToSize(r.nama, 36)[0] || r.nama
        doc.text(truncatedName, currX + 1.5, y + 3.4, { align: "left" })
        currX += 38

        // 4. UNIT / CABANG
        doc.setFont("helvetica", "normal")
        doc.setFontSize(6)
        doc.setTextColor(100, 116, 139)
        const unitDisplay = r.cabang || r.departemen
        const truncatedUnit = doc.splitTextToSize(unitDisplay, 22)[0] || unitDisplay
        doc.text(truncatedUnit, currX + 1.5, y + 3.4, { align: "left" })
        currX += 24

        // 5. DAYS CELLS
        for (let d = 1; d <= totalDays; d++) {
          const st = r.days[d]
          const code = st?.code || "-"
          const isWk = daysInfo[d - 1]?.isWeekend

          if (code === "H") {
            doc.setFillColor(220, 252, 231) // Emerald light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(22, 101, 52)
            doc.text("H", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "T") {
            doc.setFillColor(254, 243, 199) // Amber light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(146, 64, 14)
            doc.text("T", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "C") {
            doc.setFillColor(219, 234, 254) // Blue light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(30, 64, 175)
            doc.text("C", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "I") {
            doc.setFillColor(255, 237, 213) // Orange light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(154, 52, 18)
            doc.text("I", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "S") {
            doc.setFillColor(243, 232, 255) // Purple light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(107, 33, 168)
            doc.text("S", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "A") {
            doc.setFillColor(255, 228, 230) // Rose light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(6)
            doc.setTextColor(159, 18, 57)
            doc.text("A", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else if (code === "L" || isWk) {
            doc.setFillColor(241, 245, 249) // Slate light
            doc.rect(currX, y, dayColWidth, rowHeight, "F")
            doc.setFont("helvetica", "normal")
            doc.setFontSize(5.5)
            doc.setTextColor(148, 163, 184)
            doc.text("L", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          } else {
            doc.setFont("helvetica", "normal")
            doc.setFontSize(5.5)
            doc.setTextColor(203, 213, 225)
            doc.text("-", currX + dayColWidth / 2, y + 3.4, { align: "center" })
          }

          currX += dayColWidth
        }

        // 6. REKAP SUMMARY COLS
        const effectiveWorkDays = r.totalHariKerja > 0 ? r.totalHariKerja : 1
        const hadirPersen = Number((((r.totalHadir + r.totalTerlambat) / effectiveWorkDays) * 100).toFixed(0))

        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)
        doc.setTextColor(22, 101, 52)
        doc.text(String(r.totalHadir), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(146, 64, 14)
        doc.text(String(r.totalTerlambat), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(154, 52, 18)
        doc.text(String(r.totalIzin), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(107, 33, 168)
        doc.text(String(r.totalSakit), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(30, 64, 175)
        doc.text(String(r.totalCuti), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(159, 18, 57)
        doc.text(String(r.totalAlpha), currX + 2.5, y + 3.4, { align: "center" })
        currX += 5

        doc.setTextColor(30, 41, 59)
        doc.text(`${hadirPersen}%`, currX + 3, y + 3.4, { align: "center" })

        y += rowHeight
      })

      // Check space for Legend & Signature block
      if (y + 35 > pageHeight - 16) {
        printFooter(currentPage)
        doc.addPage()
        currentPage++
        y = 10
        printKopSurat()
      }

      // Legend Section
      y += 4
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(15, 23, 42)
      doc.text("KETERANGAN KODE PRESENSI:", marginX, y)
      y += 3.5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(6.5)
      doc.setTextColor(71, 85, 105)
      doc.text("H = Hadir Tepat Waktu   |   T = Terlambat Hadir   |   I = Izin / Dinas   |   S = Sakit   |   C = Cuti   |   A = Alpha   |   L = Libur", marginX, y)
      y += 3
      doc.text("Catatan: Seluruh data jam kehadiran dicatat dan dihitung berbasis Zona Waktu Indonesia Tengah (WITA, UTC+8).", marginX, y)
      y += 6

      // Signature Block
      const sigCol1X = marginX + 20
      const sigCol2X = pageWidth - marginX - 60

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text("Mengetahui,", sigCol1X, y)
      doc.text(`Praya, ${printDateWita}`, sigCol2X, y)
      y += 3.8

      doc.setFont("helvetica", "bold")
      doc.text("Plt. Direktur Utama", sigCol1X, y)
      doc.text("Kasubbid Kepegawaian & SDM", sigCol2X, y)
      y += 14

      doc.text("( Bambang Supratomo, S.T., M.T. )", sigCol1X, y)
      doc.text("( H. Lalu M. Syarif, S.E. )", sigCol2X, y)

      printFooter(currentPage)

      // =======================================================================
      // HALAMAN DETAIL PRESENSI PER SESI (PDF)
      // =======================================================================
      const hariNamesPdf = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      const batasTelatTotalMenitPdf = jamMasukH * 60 + jamMasukM + batasTerlambatMenit

      // Collect detail rows
      const detailRows: Array<{
        no: number; nik: string; nama: string; unit: string; tanggal: string; hari: string;
        jamMasuk: string; statusPagi: string; statusPagiIsOk: boolean; statusPagiIsTelat: boolean;
        jamSiang: string; statusSiang: string; statusSiangIsOk: boolean;
        jamPulang: string; statusPulang: string; statusPulangIsOk: boolean;
        sesi: string; sesiCount: number; kode: string; ket: string;
      }> = []

      let pdfDetailNo = 0
      for (const r of rows) {
        for (let day = 1; day <= totalDays; day++) {
          const st = r.days[day]
          if (!st) continue
          if (st.isWeekend && st.code === "L") continue
          if (st.code === "-") continue

          pdfDetailNo++
          const curDate = new Date(`${st.dateStr}T12:00:00+08:00`)
          const hariNama = hariNamesPdf[curDate.getDay()]

          let statusPagi = "-"
          let statusPagiIsOk = false
          let statusPagiIsTelat = false
          if (st.jamMasuk) {
            const [mH, mM] = st.jamMasuk.split(":").map(Number)
            const masukTotalMenit = mH * 60 + mM
            if (masukTotalMenit > batasTelatTotalMenitPdf) {
              const telatMenit = masukTotalMenit - batasTelatTotalMenitPdf
              statusPagi = `TELAT ${telatMenit}m`
              statusPagiIsTelat = true
            } else {
              statusPagi = "TEPAT"
              statusPagiIsOk = true
            }
          } else if (st.code === "H" || st.code === "T") {
            statusPagi = "KOSONG"
          }

          let statusSiang = "-"
          let statusSiangIsOk = false
          if (st.jamSiang) { statusSiang = "HADIR"; statusSiangIsOk = true }
          else if (st.code === "H" || st.code === "T") { statusSiang = "KOSONG" }

          let statusPulang = "-"
          let statusPulangIsOk = false
          if (st.jamKeluar) { statusPulang = "HADIR"; statusPulangIsOk = true }
          else if (st.code === "H" || st.code === "T") { statusPulang = "KOSONG" }

          let sesiCount = 0
          if (st.jamMasuk) sesiCount++
          if (st.jamSiang) sesiCount++
          if (st.jamKeluar) sesiCount++
          const sesiLabel = (st.code === "H" || st.code === "T") ? `${sesiCount}/3` : "-"

          detailRows.push({
            no: pdfDetailNo, nik: r.nik, nama: r.nama,
            unit: r.cabang || r.departemen,
            tanggal: st.dateStr.split("-").reverse().join("/"),
            hari: hariNama,
            jamMasuk: st.jamMasuk || "-", statusPagi, statusPagiIsOk, statusPagiIsTelat,
            jamSiang: st.jamSiang || "-", statusSiang, statusSiangIsOk,
            jamPulang: st.jamKeluar || "-", statusPulang, statusPulangIsOk,
            sesi: sesiLabel, sesiCount, kode: st.code, ket: st.keterangan || st.statusLabel,
          })
        }
      }

      if (detailRows.length > 0) {
        // New page for detail
        doc.addPage()
        currentPage++
        y = 10

        // Detail header
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(30, 58, 138)
        doc.text("DETAIL PRESENSI PER SESI", pageWidth / 2, y, { align: "center" })
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.setTextColor(71, 85, 105)
        doc.text(`${bulanNama} ${tahun}  |  Jam Masuk Standar: ${settings.jamMasuk} WITA  |  Toleransi: ${batasTerlambatMenit} menit`, pageWidth / 2, y, { align: "center" })
        y += 5

        // Detail table columns: No(5), NIK(14), Nama(30), Unit(20), Tgl(12), Hari(10), JamMasuk(10), StPagi(14), JamSiang(10), StSiang(10), JamPlg(10), StSore(10), Sesi(8), Kode(6), Ket(remaining)
        const dColW = [5, 14, 30, 20, 12, 10, 10, 14, 10, 10, 10, 10, 8, 6, 0]
        const dContentW = contentWidth
        const usedW = dColW.slice(0, -1).reduce((a, b) => a + b, 0)
        dColW[dColW.length - 1] = dContentW - usedW // Keterangan gets remaining

        const dHeaders = ["No", "NIK", "Nama", "Unit", "Tanggal", "Hari", "Masuk", "St.Pagi", "Siang", "St.Siang", "Pulang", "St.Sore", "Sesi", "Kode", "Keterangan"]
        const dRowH = 4.2

        const printDetailHeader = () => {
          doc.setFillColor(30, 58, 138)
          doc.rect(marginX, y, dContentW, 6, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(5.5)
          doc.setTextColor(255, 255, 255)
          let cx = marginX
          for (let i = 0; i < dHeaders.length; i++) {
            doc.text(dHeaders[i], cx + dColW[i] / 2, y + 4, { align: "center" })
            cx += dColW[i]
          }
          y += 6
        }

        printDetailHeader()

        for (const dr of detailRows) {
          if (y + dRowH > pageHeight - 14) {
            printFooter(currentPage)
            doc.addPage()
            currentPage++
            y = 10
            printDetailHeader()
          }

          const isEven = dr.no % 2 === 0
          if (isEven) {
            doc.setFillColor(248, 250, 252)
            doc.rect(marginX, y, dContentW, dRowH, "F")
          }

          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.1)
          doc.rect(marginX, y, dContentW, dRowH, "S")

          let cx = marginX
          const textY = y + 3

          // No
          doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(100, 116, 139)
          doc.text(String(dr.no), cx + dColW[0] / 2, textY, { align: "center" })
          cx += dColW[0]

          // NIK
          doc.text(dr.nik.replace(/\s+/g, ""), cx + dColW[1] / 2, textY, { align: "center" })
          cx += dColW[1]

          // Nama
          doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(15, 23, 42)
          const tName = doc.splitTextToSize(dr.nama, dColW[2] - 2)[0] || dr.nama
          doc.text(tName, cx + 1, textY)
          cx += dColW[2]

          // Unit
          doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(100, 116, 139)
          const tUnit = doc.splitTextToSize(dr.unit, dColW[3] - 2)[0] || dr.unit
          doc.text(tUnit, cx + 1, textY)
          cx += dColW[3]

          // Tanggal
          doc.text(dr.tanggal, cx + dColW[4] / 2, textY, { align: "center" })
          cx += dColW[4]

          // Hari
          doc.text(dr.hari, cx + dColW[5] / 2, textY, { align: "center" })
          cx += dColW[5]

          // Jam Masuk
          doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(30, 41, 59)
          doc.text(dr.jamMasuk, cx + dColW[6] / 2, textY, { align: "center" })
          cx += dColW[6]

          // Status Pagi - with color
          if (dr.statusPagiIsOk) {
            doc.setFillColor(220, 252, 231); doc.rect(cx, y, dColW[7], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(22, 101, 52)
          } else if (dr.statusPagiIsTelat) {
            doc.setFillColor(254, 243, 199); doc.rect(cx, y, dColW[7], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(146, 64, 14)
          } else if (dr.statusPagi === "KOSONG") {
            doc.setFillColor(255, 228, 230); doc.rect(cx, y, dColW[7], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(159, 18, 57)
          } else {
            doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(148, 163, 184)
          }
          doc.text(dr.statusPagi, cx + dColW[7] / 2, textY, { align: "center" })
          cx += dColW[7]

          // Jam Siang
          doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(30, 41, 59)
          doc.text(dr.jamSiang, cx + dColW[8] / 2, textY, { align: "center" })
          cx += dColW[8]

          // Status Siang
          if (dr.statusSiangIsOk) {
            doc.setFillColor(220, 252, 231); doc.rect(cx, y, dColW[9], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(22, 101, 52)
          } else if (dr.statusSiang === "KOSONG") {
            doc.setFillColor(255, 228, 230); doc.rect(cx, y, dColW[9], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(159, 18, 57)
          } else {
            doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(148, 163, 184)
          }
          doc.text(dr.statusSiang, cx + dColW[9] / 2, textY, { align: "center" })
          cx += dColW[9]

          // Jam Pulang
          doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(30, 41, 59)
          doc.text(dr.jamPulang, cx + dColW[10] / 2, textY, { align: "center" })
          cx += dColW[10]

          // Status Sore
          if (dr.statusPulangIsOk) {
            doc.setFillColor(220, 252, 231); doc.rect(cx, y, dColW[11], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(22, 101, 52)
          } else if (dr.statusPulang === "KOSONG") {
            doc.setFillColor(255, 228, 230); doc.rect(cx, y, dColW[11], dRowH, "F")
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(159, 18, 57)
          } else {
            doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(148, 163, 184)
          }
          doc.text(dr.statusPulang, cx + dColW[11] / 2, textY, { align: "center" })
          cx += dColW[11]

          // Sesi
          if (dr.sesiCount === 3) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(22, 101, 52)
          } else if (dr.sesiCount >= 1) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(146, 64, 14)
          } else {
            doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(159, 18, 57)
          }
          doc.text(dr.sesi, cx + dColW[12] / 2, textY, { align: "center" })
          cx += dColW[12]

          // Kode
          const kodeColorsPdf: Record<string, [number, number, number]> = {
            H: [22, 101, 52], T: [146, 64, 14], C: [30, 64, 175],
            I: [154, 52, 18], S: [107, 33, 168], A: [159, 18, 57],
          }
          const kc = kodeColorsPdf[dr.kode] || [148, 163, 184]
          doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(kc[0], kc[1], kc[2])
          doc.text(dr.kode, cx + dColW[13] / 2, textY, { align: "center" })
          cx += dColW[13]

          // Keterangan
          doc.setFont("helvetica", "normal"); doc.setFontSize(4.5); doc.setTextColor(100, 116, 139)
          const tKet = doc.splitTextToSize(dr.ket, dColW[14] - 2)[0] || dr.ket
          doc.text(tKet, cx + 1, textY)

          y += dRowH
        }

        // Legend for detail
        y += 3
        if (y + 12 > pageHeight - 14) {
          printFooter(currentPage)
          doc.addPage()
          currentPage++
          y = 10
        }
        doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.setTextColor(15, 23, 42)
        doc.text("KETERANGAN DETAIL:", marginX, y); y += 3
        doc.setFont("helvetica", "normal"); doc.setFontSize(5.5); doc.setTextColor(71, 85, 105)
        doc.text(`Jam Masuk Standar: ${settings.jamMasuk} WITA  |  Toleransi: ${batasTerlambatMenit} menit  |  TEPAT = Tepat Waktu (hijau)  |  TELAT = Lewat Batas (kuning)  |  KOSONG = Tidak Absen Sesi Tersebut (merah)`, marginX, y)
        y += 3
        doc.text("SESI HADIR: 3/3 = Lengkap  |  2/3 atau 1/3 = Tidak Lengkap  |  0/3 = Tidak Hadir Sama Sekali", marginX, y)

        printFooter(currentPage)
      }

      const pdfOutput = doc.output("arraybuffer")
      const filename = `MATRIKS_KEHADIRAN_${bulanNama.toUpperCase()}_${tahun}.pdf`

      return new NextResponse(pdfOutput, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ error: "Format tidak didukung. Gunakan 'excel' atau 'pdf'." }, { status: 400 })
  } catch (err: any) {
    console.error("Error export kalender:", err)
    return NextResponse.json({ error: err.message || "Gagal mengekspor data kalender" }, { status: 500 })
  }
}
