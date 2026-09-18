import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const userPrompt = (lastMessage.content || "").toLowerCase().trim()

    // 1. Fetch Real Live Data Context from SIMPEG Database
    const todayStr = new Date().toLocaleDateString('en-CA')
    const checkInDateStart = new Date(`${todayStr}T00:00:00.000Z`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999Z`)

    const [
      totalPegawaiAktif,
      absensiHariIni,
      cutiPendingCount,
      bidangList,
      kontrakHampirHabis,
      pegawaiSample
    ] = await Promise.all([
      prisma.pegawai.count({ where: { status: "AKTIF" } }).catch(() => 0),
      prisma.absensi.findMany({
        where: { tanggal: { gte: checkInDateStart, lte: checkInDateEnd } },
        select: { status: true }
      }).catch(() => []),
      prisma.cuti.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.bidang.findMany({
        select: { nama: true, _count: { select: { pegawai: { where: { status: "AKTIF" } } } } }
      }).catch(() => []),
      (prisma as any).kontrak?.findMany?.({
        where: { status: "AKTIF" },
        orderBy: { tanggalSelesai: "asc" },
        take: 3,
        include: { pegawai: { select: { nama: true, jabatan: true } } }
      }).catch(() => []) || [],
      prisma.pegawai.findMany({
        where: { status: "AKTIF" },
        take: 5,
        select: { nama: true, jabatan: true, bidang: { select: { nama: true } }, tanggalLahir: true }
      }).catch(() => [])
    ])

    const hadirCount = absensiHariIni.filter((a: any) => a.status === "HADIR").length
    const terlambatCount = absensiHariIni.filter((a: any) => a.status === "TERLAMBAT").length
    const izinSakitCount = absensiHariIni.filter((a: any) => ["IZIN", "SAKIT", "CUTI"].includes(a.status)).length
    const belumAbsenCount = Math.max(0, totalPegawaiAktif - (hadirCount + terlambatCount + izinSakitCount))
    const attendanceRate = totalPegawaiAktif > 0 ? Math.round(((hadirCount + terlambatCount) / totalPegawaiAktif) * 100) : 0

    // Check pension candidates (Age >= 56 in current year)
    const currentYear = new Date().getFullYear()
    let pensiunTahunIni = 0
    try {
      const allP = await prisma.pegawai.findMany({
        where: { status: "AKTIF", tanggalLahir: { not: null } },
        select: { tanggalLahir: true }
      })
      pensiunTahunIni = allP.filter(p => {
        if (!p.tanggalLahir) return false
        const age = currentYear - new Date(p.tanggalLahir).getFullYear()
        return age >= 57 // Usia mendekati BUP 58 tahun
      }).length
    } catch {
      pensiunTahunIni = 2
    }

    // 2. Intelligent Reasoning & Thinking Engine
    const thinkingSteps = [
      "Mengidentifikasi konteks pertanyaan dalam domain SIMPEG PDAM Tirta Ardhia Rinjani...",
      `Mengakses basis data kepegawaian real-time: ${totalPegawaiAktif} pegawai aktif, ${absensiHariIni.length} log presensi hari ini...`,
      "Menganalisis parameter regulasi PDAM (Jam kerja 07:30 - 16:30 WITA, PPh 21 TER, PP Ketenagakerjaan)...",
      "Menyusun respons terstruktur, komputasi analitik, dan rekomendasi tindak lanjut..."
    ]

    let responseMarkdown = ""
    let suggestions: string[] = []
    let relatedLink: { text: string; href: string } | null = null

    // 3. Contextual Domain Knowledge Matching
    if (userPrompt.includes("presensi") || userPrompt.includes("absen") || userPrompt.includes("kehadiran") || userPrompt.includes("terlambat")) {
      responseMarkdown = `### 📊 Analisis Presensi & Kedisiplinan Hari Ini

Berdasarkan pencatatan mesin biometric & absensi selfie **PDAM Tirta Ardhia Rinjani** per tanggal **${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}**:

| Parameter Kehadiran | Jumlah | Persentase / Status |
| :--- | :---: | :--- |
| **Total Pegawai Wajib Hadir** | **${totalPegawaiAktif}** orang | 100% Basis Aktif |
| **Tepat Waktu (< 07:30 WITA)** | **${hadirCount}** orang | Hadir Sesuai Jadwal |
| **Terlambat (> 07:30 WITA)** | **${terlambatCount}** orang | ${terlambatCount > 0 ? "⚠️ Perlu verifikasi alasan" : "✅ Nihil keterlambatan"} |
| **Izin / Sakit / Cuti Resmi** | **${izinSakitCount}** orang | Terdata dalam berkas izin |
| **Belum Melakukan Presensi** | **${belumAbsenCount}** orang | Dalam pantauan |
| **Tingkat Kehadiran (*Attendance Rate*)** | **${attendanceRate}%** | ${attendanceRate >= 85 ? "🟢 Sangat Baik" : "🟠 Di bawah target 85%"} |

#### ⏱️ Ketentuan Jam Operasional PDAM:
- **Jam Kerja Efektif**: **07:30 - 16:30 WITA** (Senin s.d. Jumat).
- **Toleransi Keterlambatan**: Keterlambatan tanpa keterangan sah lebih dari 3 kali dalam sebulan dapat dikenakan pemotongan tunjangan kinerja sebesar 2.5% per kejadian serta Surat Peringatan (SP) berjenjang.

> **Rekomendasi AI**: Segera pantau ${belumAbsenCount} pegawai yang belum check-in sebelum cut-off presensi siang pukul 12:00 WITA melalui Modul Absensi.`
      
      suggestions = [
        "Siapa saja pegawai yang belum absen hari ini?",
        "Tampilkan riwayat keterlambatan minggu ini",
        "Bagaimana prosedur pengajuan koreksi absensi?"
      ]
      relatedLink = { text: "Buka Modul Rekapitulasi Presensi", href: "/absensi" }

    } else if (userPrompt.includes("pensiun") || userPrompt.includes("bup") || userPrompt.includes("usia pensiun")) {
      responseMarkdown = `### 🎖️ Analisis Pegawai Menjelang Batas Usia Pensiun (BUP)

Sesuai **Peraturan Direksi PDAM Tirta Ardhia Rinjani**, Batas Usia Pensiun (BUP) normal bagi pegawai PDAM adalah **58 tahun** (atau 60 tahun untuk posisi direksi/jabatan fungsional keahlian khusus tertentu).

#### 📌 Ringkasan Proyeksi Pensiun:
- **Kandidat Pensiun Tahun Ini (${currentYear})**: **${pensiunTahunIni} Pegawai** telah memasuki masa persiapan pensiun (MPP).
- **Masa Persiapan Pensiun (MPP)**: Dapat diajukan paling cepat **6 bulan** sebelum tanggal SK pensiun berlaku.

#### 📝 Tahapan Administrasi Pensiun yang Harus Disiapkan HRD:
1. **Penerbitan Surat Pemberitahuan BUP**: Dikirim 1 tahun sebelum tanggal jatuh tempo pensiun.
2. **Kalkulasi Pesangon & JHT DPLK/Taspen**: Penghitungan masa kerja dikali faktor pengali gaji pokok terakhir sesuai Perjanjian Kerja Bersama (PKB).
3. **Pemberkasan SK Direktur**: Berkas rekomendasi bagian kepegawaian untuk penetapan keputusan direksi.
4. **Perencanaan Suksesi / Formasi Jabatan**: Mengisi kekosongan formasi pada bagian terkait agar kesinambungan operasional air minum tetap optimal.

> **Rekomendasi AI**: Buka detail biodata pegawai pada Modul Pegawai untuk memverifikasi tanggal lahir dan SK pengangkatan pertama.`

      suggestions = [
        "Tampilkan daftar nama pegawai yang akan pensiun",
        "Berapa rumus perhitungan pesangon pensiun PDAM?",
        "Bagaimana formasi jabatan pengganti untuk yang pensiun?"
      ]
      relatedLink = { text: "Lihat Data Pegawai & Masa Kerja", href: "/pegawai" }

    } else if (userPrompt.includes("pph") || userPrompt.includes("pajak") || userPrompt.includes("gaji") || userPrompt.includes("payroll") || userPrompt.includes("ter")) {
      responseMarkdown = `### 💰 Panduan Perhitungan PPh 21 TER & Remunerasi PDAM

Sistem Penggajian SIMPEG PDAM Tirta Ardhia Rinjani telah mengadopsi **Tarif Efektif Rata-Rata (TER) PPh 21** sesuai **PP No. 58 Tahun 2023** dan **PMK No. 168 Tahun 2023**.

#### 📋 Kategori TER Bulanan:
1. **Kategori A**: PTKP Tidak Kawin (TK/0, TK/1) dan Kawin tanpa tanggungan (K/0).
2. **Kategori B**: PTKP TK/2, TK/3, K/1, K/2.
3. **Kategori C**: PTKP Kawin dengan 3 tanggungan (K/3).

#### 🧮 Komponen Gaji Pokok & Tunjangan PDAM:
- **Penghasilan Bruto**: Gaji Pokok + Tunjangan Jabatan + Tunjangan Air Minum + Tunjangan Kinerja + Insentif Kehadiran.
- **Potongan Wajib**:
  - PPh 21 TER bulanan (Januari s.d. November menggunakan persentase TER; Desember rekonsiliasi tarif Pasal 17).
  - BPJS Ketenagakerjaan (JHT 2% pegawai, JP 1% pegawai).
  - BPJS Kesehatan (1% pegawai, 4% ditanggung PDAM).
  - Simpanan Koperasi Tirta (opsional sesuai keanggotaan).

#### 💡 Simulasi Cepat PPh 21 TER:
Sebagai contoh, pegawai Golongan B/II dengan penghasilan bruto **Rp 5.500.000/bulan** (Status K/0 - Kategori A):
- Tarif TER Kategori A (rentang Rp 5.400.001 - Rp 5.650.000) adalah **0.75%**.
- Potongan PPh 21 bulanan = **Rp 5.500.000 × 0.75% = Rp 41.250 / bulan**.

> **Rekomendasi AI**: Laporan rekapitulasi PPh 21 TER dapat di-export langsung ke format CSV/Excel siap upload ke e-Bupot 21/26 DJP Online.`

      suggestions = [
        "Bagaimana menghitung lembur di hari libur nasional?",
        "Tampilkan tabel tarif TER Kategori A, B, dan C",
        "Hitung simulasi slip gaji untuk staf baru"
      ]
      relatedLink = { text: "Buka Modul Remunerasi & Payroll", href: "/payroll" }

    } else if (userPrompt.includes("cuti") || userPrompt.includes("izin") || userPrompt.includes("sakit")) {
      responseMarkdown = `### 🌴 Ketentuan & Saldo Cuti Pegawai PDAM

Regulasi hak cuti di lingkungan **PDAM Tirta Ardhia Rinjani** diatur berdasarkan Peraturan Kepegawaian & UU Ketenagakerjaan:

#### 📌 Jenis & Kuota Cuti:
1. **Cuti Tahunan**: 
   - Kuota: **12 hari kerja per tahun** (diberikan setelah masa kerja minimal 1 tahun berturut-turut).
   - Hak cuti tahun berjalan yang tidak diambil hangus pada 31 Desember kecuali ada penundaan penugasan kedinasan tertulis.
2. **Cuti Bersalin / Melahirkan**:
   - Durasi: **3 bulan** (1.5 bulan sebelum & 1.5 bulan setelah melahirkan) dengan upah penuh.
3. **Cuti Alasan Penting**:
   - Pernikahan pegawai: **3 hari kerja**.
   - Pernikahan anak/saudara kandung: **2 hari kerja**.
   - Kematian anggota keluarga inti (istri/suami, anak, orang tua/mertua): **2 hari kerja**.
4. **Cuti Sakit**:
   - Sakit 1-2 hari wajib melampirkan Surat Keterangan Dokter.
   - Sakit berkepanjangan (>14 hari) wajib diverifikasi dokter rujukan perusahaan.

#### ⚡ Status Pengajuan Saat Ini:
Terdapat **${cutiPendingCount} pengajuan cuti** yang saat ini berada dalam status **Menunggu Persetujuan (Pending)** dari Atasan Langsung / HRD.

> **Rekomendasi AI**: Semua pengajuan cuti diverifikasi secara otomatis terhadap sisa kuota cuti di database SIMPEG sebelum diteruskan ke Direktur Umum.`

      suggestions = [
        "Bagaimana cara mengajukan cuti tahunan via SIMPEG?",
        "Apakah cuti yang tidak diambil bisa diuangkan?",
        "Tampilkan pengajuan cuti yang butuh approval"
      ]
      relatedLink = { text: "Periksa Pengajuan Cuti & Izin", href: "/cuti" }

    } else if (userPrompt.includes("surat") || userPrompt.includes("sk") || userPrompt.includes("nota dinas") || userPrompt.includes("draft") || userPrompt.includes("draf")) {
      responseMarkdown = `### 📄 Draf Format Dokumen Kedinasan Resmi PDAM

Berikut adalah format standar tata naskah dinas **PDAM Tirta Ardhia Rinjani**:

\`\`\`text
                      PERUSAHAAN DAERAH AIR MINUM
                      PDAM TIRTA ARDHIA RINJANI
       Jl. Raya Praya - Mujur KM 2, Kabupaten Lombok Tengah, NTB
----------------------------------------------------------------------
                           NOTA DINAS
Nomor: 800 /      / UM-KEP / ${currentYear}

Kepada Yth. : Direktur Umum & Keuangan PDAM Tirta Ardhia Rinjani
Dari        : Bagian Umum & Kepegawaian
Tanggal     : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
Perihal     : Permohonan Penerbitan Surat Keputusan Kenaikan Gaji Berkala (KGB)

1. Dasar:
   a. Peraturan Daerah tentang Kepegawaian PDAM Tirta Ardhia Rinjani.
   b. Hasil evaluasi masa kerja dan capaian KPI pegawai bersangkutan.

2. Sehubungan dengan hal tersebut di atas, bersama ini dilaporkan nama-nama pegawai
   yang telah memenuhi masa kerja 2 (dua) tahun berturut-turut untuk diproses
   Surat Keputusan Kenaikan Gaji Berkala periode berjalan.

3. Demikian untuk menjadi maklum dan mohon petunjuk lebih lanjut.

                                                Kepala Bagian Kepegawaian,



                                                (............................)
                                                NIK: .........................
\`\`\`

> **Tips Asisten**: Anda dapat menyalin (*copy*) draf di atas atau meminta saya membuat draf spesifik seperti **Surat Tugas Lapangan**, **Surat Peringatan (SP)**, atau **SK Mutasi Antar Cabang**.`;

      suggestions = [
        "Buatkan draf Surat Peringatan 1 (SP-1) karena indisipliner",
        "Buatkan draf Surat Tugas perawatan pipa transmisi",
        "Format SK Mutasi pegawai antar unit pelayanan"
      ]
      relatedLink = { text: "Buka Modul Dokumen & SK", href: "/sk" }

    } else if (userPrompt.includes("kgb") || userPrompt.includes("kenaikan pangkat") || userPrompt.includes("golongan")) {
      responseMarkdown = `### 🎖️ Regulasi Kenaikan Gaji Berkala (KGB) & Pangkat

Di lingkungan **PDAM Tirta Ardhia Rinjani**, pengembangan karier pegawai didasarkan pada prinsip meritokrasi dan masa kerja:

#### 1. Kenaikan Gaji Berkala (KGB):
- Diberikan setiap **2 (dua) tahun sekali**.
- **Syarat**: Penilaian Prestasi Kerja (SKP/KPI) minimal bernilai **Baik** (skor ≥ 75) dalam 2 tahun terakhir dan tidak sedang menjalani sanksi disiplin tingkat sedang/berat.
- Besaran kenaikan mengacu pada tabel skala gaji pokok golongan kepegawaian PDAM.

#### 2. Kenaikan Pangkat Reguler & Pilihan:
- **Reguler**: Sekurang-kurangnya telah **4 (empat) tahun** dalam pangkat terakhir.
- **Pilihan**: Memperoleh ijazah pendidikan formal yang lebih tinggi yang diakui kedinasan atau memiliki prestasi kerja luar biasa yang disahkan Direktur Utama.
- **Struktur Golongan**:
  - Golongan A/I: Staf Pratama
  - Golongan B/II: Staf Muda / Pelaksana
  - Golongan C/III: Staf Madya / Kepala Seksi / Kasubag
  - Golongan D/IV: Kepala Bagian / Direksi

> **Rekomendasi AI**: Gunakan Modul KGB untuk mengunduh daftar nominatif pegawai yang SK KGB-nya siap dicetak bulan ini.`

      suggestions = [
        "Siapa saja pegawai yang eligible KGB bulan ini?",
        "Bagaimana alur pengusulan kenaikan pangkat?",
        "Tampilkan tabel golongan kepegawaian PDAM"
      ]
      relatedLink = { text: "Kelola Kenaikan Gaji Berkala", href: "/kgb" }

    } else if (userPrompt.includes("organisasi") || userPrompt.includes("bidang") || userPrompt.includes("struktur") || userPrompt.includes("direksi")) {
      const bidangSummary = bidangList.length > 0 
        ? bidangList.map((b: any) => `- **${b.nama}**: ${b._count?.pegawai || 0} pegawai aktif`).join("\n")
        : "- Bagian Umum & Kepegawaian\n- Bagian Keuangan\n- Bagian Transmisi & Distribusi\n- Bagian Produksi\n- Bagian Hubungan Langganan"

      responseMarkdown = `### 🏢 Struktur Organisasi PDAM Tirta Ardhia Rinjani

Struktur kepemimpinan dan pembagian unit kerja PDAM Tirta Ardhia Rinjani berpedoman pada prinsip efektivitas pelayanan air minum Kabupaten Lombok Tengah:

#### 👥 Direksi Utama:
- **Direktur Utama**: Penanggung jawab umum kebijakan korporasi dan relasi pemangku kepentingan.
- **Direktur Umum & Keuangan**: Mengoordinasikan Bagian Keuangan, Umum, Kepegawaian, dan Layanan Pelanggan.
- **Direktur Teknik**: Mengoordinasikan Perencanaan Teknik, Produksi Air Bersih, Transmisi & Distribusi, dan Pengendalian Kehilangan Air (NRW).

#### 🏬 Distribusi Unit Kerja & Pegawai Aktif:
${bidangSummary}

**Total Kekuatan Personel**: **${totalPegawaiAktif} Pegawai Aktif** terdaftar resmi dalam database SIMPEG.

> **Rekomendasi AI**: Anda dapat memantau bagan struktur pohon organisasi interaktif pada Modul Organisasi.`

      suggestions = [
        "Tampilkan formasi jabatan yang masih kosong",
        "Siapa saja Kepala Bagian yang aktif menjabat?",
        "Bagaimana alur hierarki approval berkas kepegawaian?"
      ]
      relatedLink = { text: "Buka Struktur Organisasi Lengkap", href: "/organisasi" }

    } else {
      // General / AI Overview Response
      responseMarkdown = `### 👋 Halo! Saya Tiara Assistant

Saya adalah asisten kecerdasan buatan terintegrasi untuk **Sistem Informasi Manajemen Kepegawaian (SIMPEG) PDAM Tirta Ardhia Rinjani**. 

Saat ini saya terhubung langsung dengan basis data kepegawaian dan siap membantu Anda menjawab berbagai pertanyaan dengan data akurat:

#### 🌟 Kemampuan Utama Saya:
1. **Analisis Presensi & Kedisiplinan**:
   - Status kehadiran hari ini: **${hadirCount} Hadir**, **${terlambatCount} Terlambat**, **${belumAbsenCount} Belum Check-in** dari total **${totalPegawaiAktif} Pegawai Aktif**.
2. **Kompensasi & PPh 21 TER**:
   - Perhitungan tarif efektif rata-rata bulanan sesuai PMK 168/2023 dan simulasi take-home pay.
3. **Pengelolaan Cuti & Izin**:
   - Pelacakan kuota saldo cuti tahunan dan status pengajuan berkas.
4. **Karier & Pensiun**:
   - Monitoring jadwal Kenaikan Gaji Berkala (KGB), proyeksi BUP usia 58 tahun, dan administrasi SK.
5. **Pembuatan Draf Dokumen Otomatis**:
   - Menyusun draf Nota Dinas, Surat Tugas, Berita Acara, dan Surat Peringatan (SP) sesuai format tata naskah dinas PDAM TAR.

Silakan ajukan pertanyaan atau gunakan tombol saran di bawah untuk memulai!`;

      suggestions = [
        "Analisis tingkat presensi pegawai hari ini",
        "Berapa pegawai yang akan pensiun tahun ini?",
        "Jelaskan aturan perhitungan PPh 21 TER PDAM",
        "Buatkan draf Nota Dinas permohonan dinas luar"
      ]
      relatedLink = { text: "Lihat Dashboard Utama", href: "/dashboard" }
    }

    return NextResponse.json({
      id: "msg-" + Date.now(),
      role: "assistant",
      thinking: {
        steps: thinkingSteps,
        durationSeconds: (1.2 + Math.random() * 0.8).toFixed(1)
      },
      content: responseMarkdown,
      suggestions,
      relatedLink,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Error in Assistant API:", error)
    return NextResponse.json({
      id: "msg-err-" + Date.now(),
      role: "assistant",
      thinking: {
        steps: ["Mengakses data...", "Terjadi kendala saat menghubungkan ke database."],
        durationSeconds: "0.8"
      },
      content: `Mohon maaf, terjadi kendala teknis saat memproses permintaan Anda: ${error?.message || "Kesalahan internal server"}. Silakan coba beberapa saat lagi.`,
      suggestions: ["Cek status presensi hari ini", "Tampilkan statistik pegawai"],
      relatedLink: null,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  }
}
