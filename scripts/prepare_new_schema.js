const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Replace all @default(cuid()) with @default(uuid(7)) @db.Uuid
schema = schema.replace(/@default\(cuid\(\)\)/g, '@default(uuid(7)) @db.Uuid');

// 2. Specific FK replacements with @db.Uuid
const fkReplacements = [
  // FormasiJabatan
  { from: 'bidangId  String?', to: 'bidangId  String?  @db.Uuid' },
  // SubBidang
  { from: 'bidangId  String\n  bidang    Bidang', to: 'bidangId  String   @db.Uuid\n  bidang    Bidang' },
  // Pegawai
  { from: 'bidangId              String?', to: 'bidangId              String?   @db.Uuid' },
  { from: 'subBidangId           String?', to: 'subBidangId           String?   @db.Uuid' },
  { from: 'lokasiAbsensiId       String?', to: 'lokasiAbsensiId       String?   @db.Uuid' },
  { from: 'userId                String    @unique', to: 'userId                String    @unique @db.Uuid' },
  // Mutasi
  { from: 'pegawaiId       String\n  pegawai         Pegawai', to: 'pegawaiId       String    @db.Uuid\n  pegawai         Pegawai' },
  { from: 'approvedById    String?\n  approvedBy      Pegawai?', to: 'approvedById    String?   @db.Uuid\n  approvedBy      Pegawai?' },
  // Absensi
  { from: 'pegawaiId String\n  tanggal', to: 'pegawaiId String    @db.Uuid\n  tanggal' },
  { from: 'importId  String?\n  jamMasuk', to: 'importId  String?   @db.Uuid\n  jamMasuk' },
  // Cuti
  { from: 'pegawaiId      String\n  jenisCuti', to: 'pegawaiId      String    @db.Uuid\n  jenisCuti' },
  // Payroll
  { from: 'pegawaiId String\n  bulan', to: 'pegawaiId String    @db.Uuid\n  bulan' },
  // KPI
  { from: 'pegawaiId String\n  tahun', to: 'pegawaiId String    @db.Uuid\n  tahun' },
  // SlipGaji
  { from: 'pegawaiId String\n  periode', to: 'pegawaiId String    @db.Uuid\n  periode' },
  // KGB
  { from: 'pegawaiId       String\n  nomorSK', to: 'pegawaiId       String    @db.Uuid\n  nomorSK' },
  // KenaikanPangkat
  { from: 'pegawaiId       String\n  pangkatLama', to: 'pegawaiId       String    @db.Uuid\n  pangkatLama' },
  // SuratPeringatan
  { from: 'pegawaiId       String\n  jenisSP', to: 'pegawaiId       String    @db.Uuid\n  jenisSP' },
  // PegawaiKeluarga
  { from: 'pegawaiId       String\n  hubungan', to: 'pegawaiId       String    @db.Uuid\n  hubungan' },
  // PegawaiPendidikan
  { from: 'pegawaiId       String\n  jenjang', to: 'pegawaiId       String    @db.Uuid\n  jenjang' },
  // PegawaiJabatan
  { from: 'pegawaiId       String\n  namaJabatan', to: 'pegawaiId       String    @db.Uuid\n  namaJabatan' },
  // PegawaiPangkat
  { from: 'pegawaiId       String\n  golongan', to: 'pegawaiId       String    @db.Uuid\n  golongan' },
  // PegawaiPelatihan
  { from: 'pegawaiId       String\n  namaPelatihan', to: 'pegawaiId       String    @db.Uuid\n  namaPelatihan' },
  // PegawaiDokumen
  { from: 'pegawaiId       String\n  jenisDokumen', to: 'pegawaiId       String    @db.Uuid\n  jenisDokumen' },
  // Notifikasi
  { from: 'userId    String\n  tipe', to: 'userId    String    @db.Uuid\n  tipe' },
  // PushSubscription
  { from: 'userId    String\n  endpoint', to: 'userId    String    @db.Uuid\n  endpoint' },
  // JadwalShift
  { from: 'pegawaiId   String\n  shiftId     String', to: 'pegawaiId   String    @db.Uuid\n  shiftId     String    @db.Uuid' },
  // Lembur
  { from: 'pegawaiId       String\n  tanggal', to: 'pegawaiId       String    @db.Uuid\n  tanggal' },
  // PPh21
  { from: 'pegawaiId       String\n  bulan', to: 'pegawaiId       String    @db.Uuid\n  bulan' },
  // Kontrak
  { from: 'pegawaiId       String\n  nomorKontrak', to: 'pegawaiId       String    @db.Uuid\n  nomorKontrak' },
  // PenukaranPoin
  { from: 'pegawaiId       String\n  poinItem', to: 'pegawaiId       String    @db.Uuid\n  poinItem' },
  { from: 'approvedById    String?\n  pegawai', to: 'approvedById    String?   @db.Uuid\n  pegawai' },
  // IndeksPegawai
  { from: 'pegawaiId       String\n  bulan           Int', to: 'pegawaiId       String    @db.Uuid\n  bulan           Int' },
  // BadgePegawai
  { from: 'pegawaiId   String\n  jenis       JenisBadge', to: 'pegawaiId   String    @db.Uuid\n  jenis       JenisBadge' },
  // PenilaianAtasan
  { from: 'pegawaiId           String\n  penilaiId           String\n  indeksPegawaiId     String?', to: 'pegawaiId           String    @db.Uuid\n  penilaiId           String    @db.Uuid\n  indeksPegawaiId     String?   @db.Uuid' }
];

for (const rep of fkReplacements) {
  if (schema.includes(rep.from)) {
    schema = schema.replace(rep.from, rep.to);
    console.log(`✓ Replaced FK: ${rep.from.split('\n')[0]}`);
  } else {
    console.warn(`✗ Pattern not found: ${rep.from}`);
  }
}

fs.writeFileSync('scripts/schema_uuidv7_candidate.prisma', schema, 'utf8');
console.log('Saved to scripts/schema_uuidv7_candidate.prisma');
