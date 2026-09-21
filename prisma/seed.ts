import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync("123456", 10)

  console.log("Seeding Bidang & Unit Kerja...")

  // Data master 25 Unit Kerja beserta Sub Bidang
  const masterBidang = [
    // ──── DIREKSI ────
    {
      nama: "Direksi",
      kode: "DIR",
      kepalaBidang: "-",
      direkturAtasan: "Dewan Pengawas",
      subBidang: [],
    },
    // ──── BIDANG PUSAT ────
    {
      nama: "Satuan Pengawas Intern",
      kode: "SPI",
      kepalaBidang: "LALU RAHMAN HAFIZ WIJAYA",
      direkturAtasan: "Direktur Utama",
      oldNames: ["SPI"],
      subBidang: [
        "Pengawasan Umum & Keuangan",
        "Pengawasan Teknik",
        "Pengawasan Administrasi",
      ],
    },
    {
      nama: "Sekretariat Perusahaan",
      kode: "SEKPER",
      kepalaBidang: "LALU KHAERUL HUDA, SE",
      direkturAtasan: "Direktur Utama",
      oldNames: ["Sekretariat Perusahaan"],
      subBidang: [
        "Humas",
        "Teknologi Informasi",
        "Hukum",
        "Kesekretariatan",
      ],
    },
    {
      nama: "Hubungan Langganan",
      kode: "HL",
      kepalaBidang: "LALU WAHYUDI, S.Sos",
      direkturAtasan: "Direktur Operasional",
      oldNames: ["Hubungan Langganan", "Pelayanan"],
      subBidang: [
        "Penagihan",
        "Pelayanan",
        "Pembaca Meter",
      ],
    },
    {
      nama: "Keuangan",
      kode: "KEU",
      kepalaBidang: "YULI RAHMAWATI, SE",
      direkturAtasan: "Direktur Umum & Keuangan",
      subBidang: [
        "Aset",
        "Akuntansi",
        "Kas",
        "Perencana Keuangan",
      ],
    },
    {
      nama: "Perencana & Pengawasan Teknik",
      kode: "PPT",
      kepalaBidang: "BAKHTIAR RIFA'I",
      direkturAtasan: "Direktur Operasional",
      oldNames: ["Perencana dan Pengawasan Teknik"],
      subBidang: [
        "Pengawasan Teknik",
        "Perencanaan Teknik",
        "Sistem Informasi Geografis (GIS)",
      ],
    },
    {
      nama: "Transmisi & Distribusi",
      kode: "TD",
      kepalaBidang: "SYAIFUL BAHRI",
      direkturAtasan: "Direktur Operasional",
      oldNames: ["Transmisi dan Distribusi", "Distribusi"],
      subBidang: [
        "Transmisi & Distribusi",
        "Kehilangan Air",
        "Meter Segel",
        "Tera Meter",
      ],
    },
    {
      nama: "Produksi",
      kode: "PROD",
      kepalaBidang: "A'AN ALFIAN, ST",
      direkturAtasan: "Direktur Operasional",
      subBidang: [
        "Laboratorium",
        "IPA Mandalika",
        "IPA Penujak",
        "Sistem Grafitasi",
      ],
    },
    {
      nama: "Perawatan",
      kode: "PWT",
      kepalaBidang: "ZULNAIDI",
      direkturAtasan: "Direktur Operasional",
      subBidang: [
        "Pemeliharaan Instalasi",
        "Perawatan Peralatan Teknik",
        "Gudang",
      ],
    },
    {
      nama: "Umum dan SDM",
      kode: "USDM",
      kepalaBidang: "LALU SUDIRMAN, S. Adm",
      direkturAtasan: "Direktur Umum & Keuangan",
      oldNames: ["SDM & Umum"],
      subBidang: [
        "Kepegawaian",
        "Rumah Tangga",
      ],
    },

    // ──── CABANG ────
    {
      nama: "Cabang Praya",
      kode: "CBG-PRA",
      kepalaBidang: "LALU MUH. YUSUP, SE",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Praya Tengah",
      kode: "CBG-PRT",
      kepalaBidang: "SUKRIN",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Praya Barat",
      kode: "CBG-PRB",
      kepalaBidang: "HANDI PRAMONO",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Praya Barat Daya",
      kode: "CBG-PBD",
      kepalaBidang: "ERWANTO",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Praya Timur",
      kode: "CBG-PTM",
      kepalaBidang: "SUNARDI",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Jonggat",
      kode: "CBG-JGT",
      kepalaBidang: "AKHMAD AZHARI, SE",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Pringgarata",
      kode: "CBG-PGR",
      kepalaBidang: "R. JUSMAN ABDUL MAJID",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Kopang",
      kode: "CBG-KPG",
      kepalaBidang: "ZULHAI ANSORI",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Batukliang",
      kode: "CBG-BTK",
      kepalaBidang: "LALU AHMAD FAUZI",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Batukliang Utara",
      kode: "CBG-BKU",
      kepalaBidang: "LALU SUHARDI AMIN",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Janapria",
      kode: "CBG-JNP",
      kepalaBidang: "SYAFA'ATUL KHAIDIR",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },
    {
      nama: "Cabang Pujut",
      kode: "CBG-PJT",
      kepalaBidang: "H. LALU HASNAN HARIADY, ST",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Pos"],
    },
    {
      nama: "Cabang Kuta",
      kode: "CBG-KTA",
      kepalaBidang: "-",
      direkturAtasan: "Direktur Operasional",
      subBidang: ["Teknik", "Administrasi"],
    },

    // ──── POS ────
    {
      nama: "Pos Bodak",
      kode: "POS-BDK",
      kepalaBidang: "-",
      direkturAtasan: "Direktur Operasional",
      subBidang: [],
    },
    {
      nama: "Pos Darmaji",
      kode: "POS-DMJ",
      kepalaBidang: "-",
      direkturAtasan: "Direktur Operasional",
      subBidang: [],
    },
  ]

  for (const b of masterBidang) {
    // 1. Cek apakah ada record lama dengan nama/oldNames atau kode
    let existing = await prisma.bidang.findFirst({
      where: {
        OR: [
          { nama: b.nama },
          { kode: b.kode },
          ...(b.oldNames ? b.oldNames.map(old => ({ nama: old })) : []),
        ]
      }
    })

    let bidangId: string
    if (existing) {
      const updated = await prisma.bidang.update({
        where: { id: existing.id },
        data: {
          nama: b.nama,
          kode: b.kode,
          kepalaBidang: b.kepalaBidang,
          direkturAtasan: b.direkturAtasan,
          aktif: true,
        }
      })
      bidangId = updated.id
      console.log(`  [UPDATE] Bidang: ${b.nama} (${b.kode}) -> ID: ${bidangId}`)
    } else {
      const created = await prisma.bidang.create({
        data: {
          nama: b.nama,
          kode: b.kode,
          kepalaBidang: b.kepalaBidang,
          direkturAtasan: b.direkturAtasan,
          aktif: true,
        }
      })
      bidangId = created.id
      console.log(`  [CREATE] Bidang: ${b.nama} (${b.kode}) -> ID: ${bidangId}`)
    }

    // 2. Upsert Sub Bidang
    if (b.subBidang && b.subBidang.length > 0) {
      for (const sbNama of b.subBidang) {
        await prisma.subBidang.upsert({
          where: {
            bidangId_nama: {
              bidangId,
              nama: sbNama,
            }
          },
          update: {},
          create: {
            bidangId,
            nama: sbNama,
          }
        })
      }
    }
  }

  // Demo Admin users
  const adminUsers = [
    { email: "superadmin@tiara.com", username: "superadmin", role: "SUPERADMIN" },
    { email: "hrd@tiara.com", username: "hrd", role: "HRD" },
    { email: "direksi@tiara.com", username: "direktur", role: "DIREKSI" },
  ]

  for (const u of adminUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        role: u.role as any,
      },
      create: {
        email: u.email,
        username: u.username,
        password: password,
        role: u.role as any,
      }
    })
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
