import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { daftarPangkat } from "@/lib/constants/pangkat"

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "SIMPEG PDAM Tirta Ardhia Rinjani"
    workbook.created = new Date()

    // Ambil data bidang dari database untuk referensi pengguna
    const bidangList = await prisma.bidang.findMany({
      where: { aktif: true },
      select: { nama: true, kode: true },
      orderBy: { nama: "asc" }
    })

    // ==========================================
    // SHEET 1: FORM IMPORT DATA PEGAWAI
    // ==========================================
    const sheet1 = workbook.addWorksheet("Data Pegawai", {
      views: [{ showGridLines: true }]
    })

    const columns = [
      { header: "NIK", key: "nik", width: 22 },
      { header: "Nama Lengkap", key: "nama", width: 28 },
      { header: "Email", key: "email", width: 26 },
      { header: "No HP / Telepon", key: "telepon", width: 18 },
      { header: "Unit Kerja / Bidang", key: "bidang", width: 24 },
      { header: "Jabatan", key: "jabatan", width: 24 },
      { header: "Tipe Jabatan", key: "tipeJabatan", width: 18 },
      { header: "Golongan", key: "golongan", width: 14 },
      { header: "Pangkat", key: "pangkat", width: 24 },
      { header: "TMT / Tanggal Masuk", key: "tanggalMasuk", width: 20 },
      { header: "Status Pegawai", key: "status", width: 16 },
      { header: "Gaji Pokok", key: "gajiPokok", width: 18 },
      { header: "Tunjangan", key: "tunjangan", width: 16 },
      { header: "Jenis Kelamin", key: "jenisKelamin", width: 16 },
      { header: "Tempat Lahir", key: "tempatLahir", width: 20 },
      { header: "Tanggal Lahir", key: "tanggalLahir", width: 18 },
      { header: "Agama", key: "agama", width: 16 },
      { header: "Status Nikah", key: "statusNikah", width: 18 },
      { header: "Alamat Tinggal", key: "alamat", width: 32 },
      { header: "No NPWP", key: "npwp", width: 20 },
      { header: "Pendidikan Terakhir", key: "pendidikanTerakhir", width: 20 },
      { header: "Jurusan", key: "jurusan", width: 22 },
      { header: "Institusi / Kampus", key: "institusi", width: 26 },
      { header: "Tahun Lulus", key: "tahunLulus", width: 14 },
      { header: "Nama Bank", key: "bank", width: 18 },
      { header: "No Rekening", key: "noRekening", width: 22 },
      { header: "BPJS Kesehatan", key: "bpjsKesehatan", width: 20 },
      { header: "BPJS Ketenagakerjaan", key: "bpjsKetenagakerjaan", width: 22 },
    ]

    sheet1.columns = columns

    // Baris 1: Header Utama
    const headerRow = sheet1.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" } // Slate 900
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "medium", color: { argb: "FF0F172A" } },
        left: { style: "thin", color: { argb: "FF334155" } },
        bottom: { style: "medium", color: { argb: "FF0F172A" } },
        right: { style: "thin", color: { argb: "FF334155" } },
      }
    })

    // Baris 2: Petunjuk Kolom
    const hintRow = sheet1.addRow([
      "[WAJIB] NIK Karyawan (7-8 digit) / KTP",
      "[WAJIB] Nama & Gelar",
      "[Opsional] nik@tiara.id jika kosong",
      "08xxxxxxxxxx",
      "Lihat sheet referensi",
      "Contoh: Staff Distribusi",
      "STAFF / KASUBBID / STAF_AHLI / KEPALA_BIDANG / KEPALA_CABANG",
      "Contoh: A/I, B/II, C/I",
      "Otomatis terisi jika kosong",
      "YYYY-MM-DD (Contoh: 2022-03-01)",
      "AKTIF / CUTI / NON_AKTIF",
      "Otomatis sesuai standar pangkat jika 0",
      "Nominal angka",
      "L / P",
      "Kota / Kabupaten",
      "YYYY-MM-DD",
      "ISLAM / KRISTEN / KATOLIK / dst",
      "BELUM_MENIKAH / MENIKAH / CERAI",
      "Alamat domisili lengkap",
      "15 atau 16 digit",
      "SMA / D3 / S1 / S2 / S3",
      "Nama program studi",
      "Nama sekolah / universitas",
      "Contoh: 2018",
      "BCA / BRI / Bank NTB Syariah",
      "Nomor rekening",
      "Nomor kartu BPJS",
      "Nomor kartu KPJ / BPJS TK",
    ])
    hintRow.height = 24
    hintRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748B" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" } // Slate 100
      }
      cell.alignment = { vertical: "middle", horizontal: "center" }
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "medium", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })

    // Sample Data Baris 3-5
    const sampleRows = [
      [
        "5201011504900001",
        "Ahmad Fauzi, S.T.",
        "ahmad.fauzi@tiara.id",
        "081234567890",
        bidangList[0]?.nama || "Transmisi & Distribusi",
        "Staff Distribusi Jaringan",
        "STAFF",
        "B/I",
        "Juru Muda Tingkat I",
        "2021-02-01",
        "AKTIF",
        3500000,
        500000,
        "L",
        "Praya",
        "1990-04-15",
        "ISLAM",
        "MENIKAH",
        "Jl. Raya Praya No. 12, Lombok Tengah",
        "123456789012345",
        "S1",
        "Teknik Sipil",
        "Universitas Mataram",
        "2014",
        "Bank NTB Syariah",
        "501020304050",
        "000123456789",
        "98765432100",
      ],
      [
        "5201015607920002",
        "Dewi Lestari, S.Ak.",
        "dewi.lestari@tiara.id",
        "081987654321",
        bidangList[1]?.nama || "Keuangan",
        "Kasubbid Akuntansi",
        "KASUBBID",
        "C/I",
        "Juru",
        "2019-08-15",
        "AKTIF",
        4200000,
        750000,
        "P",
        "Mataram",
        "1992-07-16",
        "ISLAM",
        "MENIKAH",
        "Perum Griya Asri Blok C-4, Praya",
        "234567890123456",
        "S1",
        "Akuntansi",
        "Universitas Mataram",
        "2015",
        "BRI",
        "012301098765501",
        "000234567891",
        "98765432101",
      ],
      [
        "5201012309950003",
        "Budi Santoso",
        "budi.santoso@tiara.id",
        "085233445566",
        bidangList[0]?.nama || "Distribusi",
        "Staff Pemeliharaan Pipa",
        "KONTRAK",
        "A/I",
        "Juru Muda",
        "2023-05-10",
        "AKTIF",
        2800000,
        300000,
        "L",
        "Kopang",
        "1995-09-23",
        "ISLAM",
        "BELUM_MENIKAH",
        "Dusun Dasan Baru, Kopang, Lombok Tengah",
        "",
        "SMA",
        "IPA",
        "SMAN 1 Kopang",
        "2014",
        "BCA",
        "8910293847",
        "",
        "",
      ]
    ]

    sampleRows.forEach(rowData => {
      const row = sheet1.addRow(rowData)
      row.height = 20
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10 }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        }
        if (colNumber === 1 || colNumber === 8 || colNumber === 10 || colNumber === 11 || colNumber === 14 || colNumber === 16) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        } else if (colNumber === 12 || colNumber === 13) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
          cell.numFmt = "#,##0"
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        }
      })
    })

    // ==========================================
    // SHEET 2: PANDUAN & DAFTAR REFERENSI
    // ==========================================
    const sheet2 = workbook.addWorksheet("Panduan & Referensi", {
      views: [{ showGridLines: true }]
    })

    sheet2.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Golongan", key: "gol", width: 14 },
      { header: "Pangkat Otomatis", key: "pangkat", width: 28 },
      { header: "", key: "space", width: 6 },
      { header: "No", key: "noBid", width: 6 },
      { header: "Unit Kerja / Bidang Terdaftar", key: "bidangNama", width: 32 },
    ]

    const refHeader = sheet2.getRow(1)
    refHeader.height = 26
    refHeader.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" } // Blue 900
      }
      cell.alignment = { vertical: "middle", horizontal: "center" }
    })

    // Isi baris referensi
    const maxRows = Math.max(daftarPangkat.length, bidangList.length)
    for (let i = 0; i < maxRows; i++) {
      const p = daftarPangkat[i]
      const b = bidangList[i]
      const row = sheet2.addRow([
        p ? i + 1 : "",
        p ? p.golongan : "",
        p ? p.nama : "",
        "",
        b ? i + 1 : "",
        b ? b.nama : "",
      ])
      row.height = 18
      row.eachCell((cell, col) => {
        cell.font = { name: "Calibri", size: 9.5 }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        }
        if (col === 1 || col === 2 || col === 5) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
      })
    }

    // Informasi catatan kaki
    sheet2.addRow([])
    const noteRow = sheet2.addRow([
      "Catatan: Data keluarga, pendidikan berijazah, SK kenaikan pangkat/jabatan sebelumnya, scan dokumen PDF, dan foto profil bisa dilengkapi dan diedit kapan saja setelah import melalui menu Profil Pegawai."
    ])
    noteRow.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF047857" } }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Template_Import_Pegawai_PDAM.xlsx"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Gagal generate template excel:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
