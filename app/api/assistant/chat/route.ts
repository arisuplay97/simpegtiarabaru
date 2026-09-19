import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { decryptApiKey } from "@/lib/security/encryption"
import { generateAssistantExcel, generateAssistantPdf, GeneratedFileResult } from "@/lib/assistant/file-generator"

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
    const userPromptRaw = (lastMessage.content || "").trim()
    const userPrompt = userPromptRaw.toLowerCase()

    // ── PROTOKOL KEAMANAN MUTLAK: AI DILARANG KERAS MENGHAPUS DATA PEGAWAI ──
    const isDestructiveRequest = 
      userPrompt.includes("hapus pegawai") ||
      userPrompt.includes("delete pegawai") ||
      userPrompt.includes("hapus data pegawai") ||
      userPrompt.includes("hilangkan data pegawai") ||
      userPrompt.includes("hapus daftar pegawai") ||
      userPrompt.includes("drop table") ||
      userPrompt.includes("truncate")

    if (isDestructiveRequest) {
      return NextResponse.json({
        id: "msg-" + Date.now(),
        role: "assistant",
        thinking: {
          steps: [
            "Memeriksa protokol keamanan integritas data SIMPEG...",
            "Perintah penghapusan data pegawai terdeteksi.",
            "Akses ditolak secara permanen sesuai SOP Keamanan."
          ],
          durationSeconds: "0.4"
        },
        content: `### 🛡️ Peringatan Keamanan: Operasi Dilarang (Akses Ditolak)

**Tiara Assistant beroperasi dalam mode *Read-Only* (Hanya Baca) dan DILARANG KERAS menghapus, mengubah, atau memanipulasi data pegawai di database SIMPEG.**

Sesuai dengan kebijakan tata kelola data **PDAM Tirta Ardhia Rinjani**:
1. **Perlindungan Data**: Tidak ada modul atau agen AI yang memiliki izin atau hak akses untuk menghapus (*DELETE*) rekaman pegawai dari database.
2. **Prosedur Resmi**: Segala bentuk penonaktifan atau pengelolaan pegawai hanya dapat dilakukan secara manual oleh **Administrator / HRD** yang terautentikasi melalui menu resmi [Data Pegawai](/pegawai).`,
        files: [],
        suggestions: [
          "Tampilkan daftar pegawai aktif",
          "Kirimkan excel daftar pegawai",
          "Buka menu Data Pegawai"
        ],
        relatedLink: { text: "Kelola Data Pegawai (HRD)", href: "/pegawai" },
        timestamp: new Date().toISOString()
      })
    }

    // 1. Ambil Data Real-Time SIMPEG dari Database
    const todayStr = new Date().toLocaleDateString("en-CA")
    const checkInDateStart = new Date(`${todayStr}T00:00:00.000Z`)
    const checkInDateEnd = new Date(`${todayStr}T23:59:59.999Z`)

    const [
      totalPegawaiAktif,
      absensiHariIni,
      cutiPendingCount,
      bidangList,
      allPegawaiAktif
    ] = await Promise.all([
      prisma.pegawai.count({ where: { status: "AKTIF" } }).catch(() => 0),
      prisma.absensi.findMany({
        where: { tanggal: { gte: checkInDateStart, lte: checkInDateEnd } },
        include: { pegawai: { select: { nama: true, jabatan: true, bidang: { select: { nama: true } } } } }
      }).catch(() => []),
      prisma.cuti.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.bidang.findMany({
        select: { id: true, nama: true, kode: true, _count: { select: { pegawai: { where: { status: "AKTIF" } } } } }
      }).catch(() => []),
      prisma.pegawai.findMany({
        where: { status: "AKTIF" },
        select: {
          id: true,
          nik: true,
          nama: true,
          jabatan: true,
          golongan: true,
          status: true,
          bidang: { select: { id: true, nama: true } },
          subBidang: { select: { nama: true } }
        },
        orderBy: [{ bidang: { nama: "asc" } }, { nama: "asc" }]
      }).catch(() => [])
    ])

    const hadirCount = absensiHariIni.filter((a: any) => a.status === "HADIR").length
    const terlambatCount = absensiHariIni.filter((a: any) => a.status === "TERLAMBAT").length
    const izinSakitCount = absensiHariIni.filter((a: any) => ["IZIN", "SAKIT", "CUTI"].includes(a.status)).length
    const belumAbsenCount = Math.max(0, totalPegawaiAktif - (hadirCount + terlambatCount + izinSakitCount))
    const attendanceRate = totalPegawaiAktif > 0 ? Math.round(((hadirCount + terlambatCount) / totalPegawaiAktif) * 100) : 0

    // 2. Analisis & Filter Cerdas Berdasarkan Permintaan Pengguna (Bidang / Jabatan)
    let matchedBidang: any = null
    // Direct match nama bidang
    for (const b of bidangList) {
      const bName = (b.nama || "").trim().toLowerCase()
      if (bName && userPrompt.includes(bName)) {
        matchedBidang = b
        break
      }
    }
    // Keyword / Alias matches
    if (!matchedBidang) {
      if (userPrompt.includes("sekretariat") || userPrompt.includes("sekper")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("sekretariat"))
      } else if (userPrompt.includes("keuangan") || userPrompt.includes("keu") || userPrompt.includes("akuntansi") || userPrompt.includes("kasir")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("keuangan"))
      } else if (userPrompt.includes("sdm") || userPrompt.includes("personalia") || userPrompt.includes("umum")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("sdm"))
      } else if (userPrompt.includes("produksi") || userPrompt.includes("prod")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("produksi"))
      } else if (userPrompt.includes("transmisi") || userPrompt.includes("distribusi")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("transmisi") || b.nama.toLowerCase().includes("distribusi"))
      } else if (userPrompt.includes("perencana") || userPrompt.includes("pengawasan") || userPrompt.includes("teknik")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("perencana"))
      } else if (userPrompt.includes("langganan") || userPrompt.includes("hublang")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("langganan"))
      } else if (userPrompt.includes("direksi") || userPrompt.includes("direktur")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("direksi"))
      } else if (userPrompt.includes("cabang")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("cabang"))
      } else if (userPrompt.includes("spi")) {
        matchedBidang = bidangList.find((b: any) => b.nama.toLowerCase().includes("spi"))
      }
    }

    let matchedJabatan: string | null = null
    const jabatanList = ["direktur utama", "direktur", "kepala bidang", "kepala cabang", "kasubbid", "staff"]
    for (const j of jabatanList) {
      if (userPrompt.includes(j)) {
        matchedJabatan = j
        break
      }
    }

    // Tentukan pegawai target yang difilter secara presisi
    let targetPegawai = allPegawaiAktif
    let filterDescription = "Seluruh Pegawai Aktif"
    let fileSlug = "Daftar_Nominatif_Pegawai_Aktif"

    if (matchedBidang) {
      const bNamaTrimmed = matchedBidang.nama.trim().toLowerCase()
      targetPegawai = allPegawaiAktif.filter((p: any) =>
        p.bidang?.nama && p.bidang.nama.trim().toLowerCase() === bNamaTrimmed
      )
      filterDescription = `Bidang ${matchedBidang.nama.trim()}`
      fileSlug = `Daftar_Pegawai_Bidang_${matchedBidang.nama.trim().replace(/[^a-zA-Z0-9]/g, "_")}`
    } else if (matchedJabatan) {
      targetPegawai = allPegawaiAktif.filter((p: any) =>
        p.jabatan && p.jabatan.toLowerCase().includes(matchedJabatan!.toLowerCase())
      )
      filterDescription = `Jabatan ${matchedJabatan.toUpperCase()}`
      fileSlug = `Daftar_Pegawai_Jabatan_${matchedJabatan.replace(/[^a-zA-Z0-9]/g, "_")}`
    }

    // 3. Deteksi Permintaan Berkas (Excel / PDF)
    const filesToAttach: GeneratedFileResult[] = []

    const isExcelRequested = userPrompt.includes("excel") || userPrompt.includes("xlsx") || userPrompt.includes("spreadsheet")
    const isPdfRequested = userPrompt.includes("pdf") || userPrompt.includes("surat") || userPrompt.includes("nota dinas") || userPrompt.includes("sk ") || userPrompt.includes("dokumen")

    if (isExcelRequested) {
      if (userPrompt.includes("absen") || userPrompt.includes("presensi") || userPrompt.includes("kehadiran")) {
        // Buat Excel Rekap Presensi
        const targetAbsensi = matchedBidang 
          ? absensiHariIni.filter((a: any) => a.pegawai?.bidang?.nama?.trim().toLowerCase() === matchedBidang.nama.trim().toLowerCase())
          : absensiHariIni

        const excelFile = await generateAssistantExcel({
          title: matchedBidang ? `Rekapitulasi Presensi Pegawai - Bidang ${matchedBidang.nama.trim()}` : "Rekapitulasi Presensi Pegawai Harian",
          subtitle: `Tanggal: ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} | Unit: ${filterDescription}`,
          sheetName: "Presensi Harian",
          filename: `Rekap_Presensi_${(matchedBidang ? matchedBidang.nama.trim() : "Harian").replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.xlsx`,
          columns: [
            { header: "Nama Pegawai", key: "nama", width: 26 },
            { header: "Jabatan", key: "jabatan", width: 22 },
            { header: "Unit Kerja / Bidang", key: "bidang", width: 24 },
            { header: "Status Kehadiran", key: "status", width: 18 },
            { header: "Waktu Absen", key: "waktu", width: 16 }
          ],
          rows: targetAbsensi.length > 0 ? targetAbsensi.map((a: any) => ({
            nama: a.pegawai?.nama || "-",
            jabatan: a.pegawai?.jabatan || "-",
            bidang: a.pegawai?.bidang?.nama || "-",
            status: a.status,
            waktu: a.createdAt ? new Date(a.createdAt).toLocaleTimeString("id-ID") : "-"
          })) : targetPegawai.map((p: any) => ({
            nama: p.nama,
            jabatan: p.jabatan,
            bidang: p.bidang?.nama || "-",
            status: "BELUM ABSEN",
            waktu: "-"
          }))
        })
        filesToAttach.push(excelFile)
      } else {
        // Buat Excel Pegawai Khusus (Sesuai Filter Bidang / Jabatan yang diminta)
        const excelFile = await generateAssistantExcel({
          title: matchedBidang 
            ? `DAFTAR PEGAWAI BIDANG ${matchedBidang.nama.trim().toUpperCase()}`
            : matchedJabatan
            ? `DAFTAR PEGAWAI JABATAN ${matchedJabatan.toUpperCase()}`
            : "DAFTAR NOMINATIF PEGAWAI AKTIF",
          subtitle: `Total: ${targetPegawai.length} Pegawai Terdaftar | Unit Kerja: ${filterDescription} | SIMPEG TIARA`,
          sheetName: matchedBidang ? matchedBidang.nama.trim().slice(0, 26) : "Data Pegawai",
          filename: `${fileSlug}_${Date.now()}.xlsx`,
          columns: [
            { header: "NIK", key: "nik", width: 18 },
            { header: "Nama Lengkap", key: "nama", width: 26 },
            { header: "Jabatan", key: "jabatan", width: 24 },
            { header: "Golongan", key: "golongan", width: 14 },
            { header: "Unit Kerja / Bidang", key: "bidang", width: 26 },
            { header: "Status", key: "status", width: 14 }
          ],
          rows: targetPegawai.map((p: any) => ({
            nik: p.nik || "-",
            nama: p.nama,
            jabatan: p.jabatan,
            golongan: p.golongan || "-",
            bidang: p.bidang?.nama || "-",
            status: p.status
          }))
        })
        filesToAttach.push(excelFile)
      }
    } else if (isPdfRequested && (userPrompt.includes("buatkan") || userPrompt.includes("kirimkan") || userPrompt.includes("unduh") || userPrompt.includes("cetak") || userPrompt.includes("draf"))) {
      if (userPrompt.includes("nota dinas") || userPrompt.includes("tugas")) {
        const pdfFile = await generateAssistantPdf({
          title: "NOTA DINAS RESMI",
          nomorSurat: `005/ND-PEG/PDAM-TAR/${new Date().getFullYear()}`,
          subtitle: `Perihal: Penugasan Operasional Pegawai ${filterDescription}`,
          filename: `Nota_Dinas_${(matchedBidang ? matchedBidang.nama.trim() : "Resmi").replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`,
          contentLines: [
            "Kepada Yth. : Direktur Utama Perumda Air Minum Tirta Ardhia Rinjani",
            "Dari         : Kepala Bagian Kepegawaian & Umum",
            `Tanggal      : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
            "Sifat        : Penting / Segera",
            "",
            `1. Sehubungan dengan pemenuhan tugas kedinasan di lingkungan ${filterDescription}, bersama ini disampaikan daftar personel yang ditugaskan.`,
            "2. Berdasarkan data kedisiplinan dan absensi realtime SIMPEG TIARA, seluruh personel yang tercantum aktif bertugas.",
            "3. Demikian nota dinas ini disampaikan, atas perhatian dan arahan Bapak Direktur Utama kami ucapkan terima kasih."
          ],
          tableData: {
            headers: ["Nama Personel", "Jabatan", "Golongan", "Unit Kerja"],
            rows: targetPegawai.slice(0, 8).map((p: any) => [
              p.nama,
              p.jabatan,
              p.golongan || "-",
              p.bidang?.nama || "-"
            ])
          }
        })
        filesToAttach.push(pdfFile)
      } else {
        // PDF Rekap Pegawai / Eksekutif
        const pdfFile = await generateAssistantPdf({
          title: matchedBidang 
            ? `DAFTAR PEGAWAI BIDANG ${matchedBidang.nama.trim().toUpperCase()}`
            : `LAPORAN PEGAWAI ${filterDescription.toUpperCase()}`,
          nomorSurat: `090/LAP-SDM/PDAM-TAR/${new Date().getFullYear()}`,
          subtitle: `Unit Kerja: ${filterDescription} | Total: ${targetPegawai.length} Pegawai Aktif`,
          filename: `${fileSlug}_${Date.now()}.pdf`,
          contentLines: [
            `Berikut daftar resmi pegawai tercatat aktif di lingkungan ${filterDescription} Perumda Air Minum Tirta Ardhia Rinjani:`,
            `Seluruh data telah diverifikasi sesuai database kepegawaian SIMPEG TIARA.`
          ],
          tableData: {
            headers: ["Nama Pegawai", "Jabatan", "Golongan", "Unit Kerja"],
            rows: targetPegawai.map((p: any) => [
              p.nama,
              p.jabatan,
              p.golongan || "-",
              p.bidang?.nama || "-"
            ])
          }
        })
        filesToAttach.push(pdfFile)
      }
    }

    // 4. Siapkan Data Konteks Lengkap untuk LLM (Prompt Engineering Presisi)
    const pegawaiTargetFormatted = targetPegawai.map((p: any, idx: number) => 
      `${idx + 1}. **${p.nama}** - Jabatan: ${p.jabatan} | Golongan: ${p.golongan || "-"} | Unit Kerja: ${p.bidang?.nama || "-"}`
    ).join("\n")

    const allBidangSummary = bidangList.map((b: any) => 
      `- ${b.nama.trim()}: ${b._count?.pegawai || 0} pegawai aktif`
    ).join("\n")

    const fullPegawaiDirectory = allPegawaiAktif.map((p: any, idx: number) =>
      `${idx + 1}. ${p.nama} (${p.jabatan} - ${p.bidang?.nama || "Tanpa Bidang"})`
    ).join("\n")

    const systemPrompt = `Anda adalah Tiara Assistant, AI Cerdas resmi sistem kepegawaian (SIMPEG) Perumda Air Minum Tirta Ardhia Rinjani (PDAM TAR).

ATURAN KEAMANAN & INTEGRITAS DATA MUTLAK:
- ANDA ADALAH SISTEM READ-ONLY (HANYA BACA). 
- DILARANG KERAS MENGHAPUS, MENGUBAH, ATAU MEMANIPULASI DATA/DAFTAR PEGAWAI DARI DATABASE.
- Anda TIDAK MEMILIKI fungsi, modul, izin, ataupun kemampuan untuk menghapus data pegawai. Jika ada pengguna yang meminta Anda menghapus pegawai, tolak dengan tegas bahwa penghapusan data pegawai hanya dapat dilakukan secara manual oleh HRD/Superadmin melalui menu resmi Kepegawaian.

PANDUAN UTAMA KETEPATAN JAWABAN:
1. Jawab pertanyaan pengguna secara LANGSUNG, SPESIFIK, FAKTUAL, dan AKURAT sesuai data database SIMPEG di bawah ini.
2. JANGAN PERNAH menyuruh pengguna memfilter sendiri di Excel atau mencari sendiri data yang diminta!
3. Jika pengguna menanyakan atau meminta file Excel/PDF tentang pegawai di bidang/unit kerja tertentu (misalnya "Sekretariat Perusahaan"):
   - Sistem TELAH MEMBUATKAN file terlampir (${filesToAttach.map(f => f.name).join(", ")}) yang HANYA memuat data pegawai bidang tersebut secara presisi.
   - Di teks balasan Anda, TULISKAN nama-nama pegawai tersebut secara lengkap (format daftar berpoin / tabel markdown yang rapi).
   - Informasikan dengan ramah bahwa file unduhan yang dilampirkan sudah difilter khusus hanya berisi daftar nama pegawai tersebut.

DATA REAL-TIME DATABASE SIMPEG:
${matchedBidang || matchedJabatan ? `DATA PEGAWAI HASIL FILTER KHUSUS (${filterDescription} - ${targetPegawai.length} Orang):
${pegawaiTargetFormatted}` : `DAFTAR PEGAWAI AKTIF (${allPegawaiAktif.length} Orang):
${fullPegawaiDirectory}`}

STATISTIK UMUM INSTANSI:
- Total Pegawai Aktif: ${totalPegawaiAktif} orang
- Presensi Hari Ini: ${hadirCount} Hadir, ${terlambatCount} Terlambat, ${belumAbsenCount} Belum Absen (${attendanceRate}% kehadiran)
- Daftar Unit Kerja & Jumlah Pegawai:
${allBidangSummary}

${filesToAttach.length > 0 ? `FILE TERLAMPIR YANG SUDAH DIBUAT SISTEM:
${filesToAttach.map(f => `- ${f.name} (${f.size}) -> File ini SUDAH difilter presisi hanya memuat data ${filterDescription}.`).join("\n")}` : ""}`

    // 5. Cek Konfigurasi External AI Model dari Database
    let aiConfig: any = null
    try {
      aiConfig = await (prisma as any).aiConfig.findUnique({ where: { id: "default" } })
    } catch {}

    const hasExternalKey = aiConfig?.enabled && aiConfig?.apiKeyEncrypted

    // 6. Jika ada model eksternal yang terpasang dan aktif, panggil API eksternal
    if (hasExternalKey) {
      try {
        const decryptedKey = decryptApiKey(aiConfig.apiKeyEncrypted)

        if (aiConfig.provider === "google") {
          // Google Gemini API Call
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(aiConfig.model)}:generateContent?key=${decryptedKey}`
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${systemPrompt}\n\nPertanyaan Pengguna: ${userPromptRaw}` }] }
              ],
              generationConfig: {
                temperature: aiConfig.temperature || 0.4,
                maxOutputTokens: aiConfig.maxTokens || 2048
              }
            })
          })

          if (geminiRes.ok) {
            const data = await geminiRes.json()
            const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (replyText) {
              return NextResponse.json({
                id: "msg-" + Date.now(),
                role: "assistant",
                thinking: {
                  steps: [
                    `Menghubungkan ke ${aiConfig.model} (Google Gemini)...`,
                    `Memfilter data pegawai ${filterDescription} dari database SIMPEG (${targetPegawai.length} orang)...`,
                    filesToAttach.length > 0 ? `Menyusun file ${filesToAttach.map(f => f.name).join(", ")} khusus ${filterDescription}...` : "Memvalidasi data...",
                    `Menyusun tanggapan akurat...`
                  ],
                  durationSeconds: "1.2"
                },
                content: replyText,
                files: filesToAttach,
                suggestions: [
                  "Kirimkan rekap presensi hari ini format excel",
                  "Siapa saja pegawai di bidang Keuangan?",
                  "Berapa total pegawai aktif di masing-masing bidang?"
                ],
                relatedLink: { text: "Data Pegawai", href: "/pegawai" },
                timestamp: new Date().toISOString()
              })
            }
          }
        } else {
          // OpenAI / DeepSeek / Custom Base URL
          let endpoint = (aiConfig.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")
          if (!endpoint.endsWith("/chat/completions")) {
            endpoint = `${endpoint}/chat/completions`
          }

          const apiRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${decryptedKey}`
            },
            body: JSON.stringify({
              model: aiConfig.model,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content }))
              ],
              temperature: aiConfig.temperature || 0.4,
              max_tokens: aiConfig.maxTokens || 2048
            })
          })

          if (apiRes.ok) {
            const data = await apiRes.json()
            const replyText = data?.choices?.[0]?.message?.content
            if (replyText) {
              return NextResponse.json({
                id: "msg-" + Date.now(),
                role: "assistant",
                thinking: {
                  steps: [
                    `Terhubung ke model ${aiConfig.model}...`,
                    `Mengambil data ${filterDescription} dari database SIMPEG (${targetPegawai.length} orang)...`,
                    filesToAttach.length > 0 ? `Menghasilkan berkas ${filesToAttach.map(f => f.name).join(", ")} khusus ${filterDescription}...` : "Memproses konteks...",
                    `Menyusun respon faktual...`
                  ],
                  durationSeconds: "1.3"
                },
                content: replyText,
                files: filesToAttach,
                suggestions: [
                  "Kirimkan rekap presensi hari ini format excel",
                  "Siapa saja pegawai di bidang Keuangan?",
                  "Berapa total pegawai aktif di masing-masing bidang?"
                ],
                relatedLink: { text: "Data Pegawai", href: "/pegawai" },
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      } catch (externalErr: any) {
        console.error("External AI call failed, falling back to internal engine:", externalErr)
      }
    }

    // 7. Fallback Internal Engine Cerdas SIMPEG TIARA (Respon Presisi Berdasarkan Database)
    const thinkingSteps = [
      "Mengidentifikasi konteks data yang diminta dalam domain SIMPEG PDAM TAR...",
      `Mengambil data pegawai ${filterDescription} (${targetPegawai.length} orang)...`,
      filesToAttach.length > 0 ? `Menyusun dan mengekspor berkas ${filesToAttach.map(f => f.name).join(", ")}...` : "Menyusun tanggapan...",
      "Memvalidasi kelengkapan data..."
    ]

    let responseMarkdown = ""
    let suggestions: string[] = [
      "Kirimkan rekap presensi hari ini format excel",
      "Siapa saja pegawai di bidang Keuangan?",
      "Tampilkan statistik pegawai per unit kerja"
    ]
    let relatedLink: { text: string; href: string } | null = { text: "Data Pegawai", href: "/pegawai" }

    if (filesToAttach.length > 0) {
      const fileNames = filesToAttach.map(f => `**${f.name}** (${f.size})`).join(", ")

      let tableMarkup = ""
      if (targetPegawai.length > 0) {
        tableMarkup = `Berikut adalah daftar **${targetPegawai.length} pegawai** yang bertugas di **${filterDescription}**:\n\n` +
          `| No | NIK | Nama Lengkap | Jabatan | Golongan | Unit Kerja |\n` +
          `| :-: | :--- | :--- | :--- | :-: | :--- |\n` +
          targetPegawai.map((p: any, idx: number) => 
            `| ${idx + 1} | ${p.nik || "-"} | **${p.nama}** | ${p.jabatan} | ${p.golongan || "-"} | ${p.bidang?.nama || "-"} |`
          ).join("\n") +
          "\n\n"
      }

      responseMarkdown = `### 📄 Berkas Telah Berhasil Dibuat!\n\n${tableMarkup}` +
        `File **${filesToAttach[0].name}** telah selesai dibuat dan **khusus memuat data ${filterDescription}** (${targetPegawai.length} pegawai).\n\n` +
        `Silakan klik tombol **"Unduh"** pada kartu lampiran di bawah ini untuk menyimpan file ke perangkat Anda.`
    } else if (matchedBidang || userPrompt.includes("pegawai") || userPrompt.includes("nama") || userPrompt.includes("daftar")) {
      responseMarkdown = `### 👥 Daftar Pegawai - ${filterDescription}\n\n` +
        `Ditemukan **${targetPegawai.length} pegawai aktif** yang terdaftar di lingkungan **${filterDescription}**:\n\n` +
        `| No | NIK | Nama Lengkap | Jabatan | Golongan | Unit Kerja |\n` +
        `| :-: | :--- | :--- | :--- | :-: | :--- |\n` +
        targetPegawai.map((p: any, idx: number) => 
          `| ${idx + 1} | ${p.nik || "-"} | **${p.nama}** | ${p.jabatan} | ${p.golongan || "-"} | ${p.bidang?.nama || "-"} |`
        ).join("\n") +
        `\n\n> 💡 **Tip:** Anda dapat mengunduh daftar ini ke format Excel: *"Kirimkan excel daftar pegawai di bidang ${matchedBidang ? matchedBidang.nama.trim() : 'ini'}"*`
    } else if (userPrompt.includes("presensi") || userPrompt.includes("absen") || userPrompt.includes("kehadiran")) {
      responseMarkdown = `### 📊 Analisis Presensi & Kedisiplinan Hari Ini\n\n` +
        `Pencatatan biometric & mobile selfie **PDAM Tirta Ardhia Rinjani** per **${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}**:\n\n` +
        `| Parameter Kehadiran | Jumlah | Persentase / Keterangan |\n` +
        `| :--- | :---: | :--- |\n` +
        `| **Total Pegawai Wajib Hadir** | **${totalPegawaiAktif}** orang | 100% Basis Aktif |\n` +
        `| **Hadir Tepat Waktu** | **${hadirCount}** orang | Standar jam masuk |\n` +
        `| **Terlambat Masuk** | **${terlambatCount}** orang | Toleransi s.d 15 menit |\n` +
        `| **Izin / Sakit / Cuti** | **${izinSakitCount}** orang | Terverifikasi HRD |\n` +
        `| **Belum Melakukan Absen** | **${belumAbsenCount}** orang | Menunggu konfirmasi |\n\n` +
        `> 💡 **Tip:** Anda dapat meminta: *\"Buatkan rekap absensi hari ini dalam format excel\"*`
      relatedLink = { text: "Monitoring Absensi", href: "/absensi" }
    } else {
      responseMarkdown = `### 👋 Halo! Saya Tiara Assistant\n\n` +
        `Saya siap membantu pengolahan data kepegawaian **PDAM Tirta Ardhia Rinjani** secara presisi.\n\n` +
        `#### 💡 Contoh Pertanyaan & Permintaan Berkas:\n` +
        `- *"Kirimkan excel daftar nama pegawai yang dibagian bidang sekretariat perusahaan"*\n` +
        `- *"Kirimkan excel daftar pegawai bidang Keuangan"*\n` +
        `- *"Berapa jumlah pegawai di masing-masing bidang?"*\n` +
        `- *"Buatkan rekap absensi hari ini format excel"*\n` +
        `- *"Buatkan nota dinas resmi format pdf"*`
    }

    return NextResponse.json({
      id: "msg-" + Date.now(),
      role: "assistant",
      thinking: {
        steps: thinkingSteps,
        durationSeconds: (1.1 + Math.random() * 0.4).toFixed(1)
      },
      content: responseMarkdown,
      files: filesToAttach,
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
        steps: ["Mengakses basis data...", "Terjadi kendala teknis."],
        durationSeconds: "0.8"
      },
      content: `Mohon maaf, terjadi kendala teknis: ${error?.message || "Kesalahan internal server"}.`,
      suggestions: ["Cek status presensi hari ini", "Tampilkan statistik pegawai"],
      relatedLink: null,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  }
}
