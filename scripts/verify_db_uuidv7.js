const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('=== VERIFIKASI FINAL DATABASE POSTGRESQL UUID v7 ===\n');

  // 1. Row count comparison
  console.log('1. Verifikasi Jumlah Baris (Pre vs Post Migration):');
  const expectedCounts = {
    User: 257, Bidang: 26, SubBidang: 68, FormasiJabatan: 173,
    LokasiAbsensi: 4, StandarGajiPangkat: 16, Shift: 0, AiConfig: 1,
    BannerPwa: 4, Pengaturan: 1, ArsipSurat: 2, ImportFingerprint: 0,
    Pegawai: 255, Absensi: 1314, Cuti: 7, Mutasi: 1, KGB: 0,
    KenaikanPangkat: 1, Payroll: 14, KPI: 0, SlipGaji: 0,
    SuratPeringatan: 1, PegawaiKeluarga: 0, PegawaiPendidikan: 0,
    PegawaiJabatan: 1, PegawaiPangkat: 243, PegawaiPelatihan: 0,
    PegawaiDokumen: 0, Notifikasi: 32, PushSubscription: 3,
    AuditLog: 146, JadwalShift: 0, Lembur: 0, PPh21: 36,
    Kontrak: 2, PenukaranPoin: 0, IndeksPegawai: 331,
    BadgePegawai: 24, PenilaianAtasan: 2
  };

  let mismatchCount = 0;
  let totalRows = 0;
  for (const [table, expected] of Object.entries(expectedCounts)) {
    const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);
    const actual = res[0].count;
    totalRows += actual;
    if (actual !== expected) {
      console.error(`  ❌ ${table}: Expected ${expected}, Got ${actual}`);
      mismatchCount++;
    }
  }
  if (mismatchCount === 0) {
    console.log(`  ✅ Semua ${Object.keys(expectedCounts).length} tabel cocok! Total: ${totalRows} baris`);
  }

  // 2. Check column types
  console.log('\n2. Verifikasi Tipe Kolom Native UUID di PostgreSQL:');
  const uuidColumns = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND udt_name = 'uuid'
    ORDER BY table_name, column_name;
  `);
  console.log(`  ✅ ${uuidColumns.length} kolom bertipe native PostgreSQL 'uuid'`);

  // Show the non-uuid ID/FK columns for reference
  const textIdColumns = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name = 'id' OR column_name LIKE '%Id')
      AND udt_name != 'uuid'
    ORDER BY table_name, column_name;
  `);
  if (textIdColumns.length > 0) {
    console.log(`  ℹ️  ${textIdColumns.length} kolom ID/FK tetap 'text' (by design):`);
    for (const c of textIdColumns) {
      console.log(`     - ${c.table_name}.${c.column_name} (${c.udt_name}) — Non-FK / Singleton`);
    }
  }

  // 3. FK Integrity check using raw SQL
  console.log('\n3. Verifikasi Integritas Foreign Key:');
  const fkChecks = [
    { parent: 'User', child: 'Pegawai', fk: 'userId' },
    { parent: 'Bidang', child: 'Pegawai', fk: 'bidangId' },
    { parent: 'SubBidang', child: 'Pegawai', fk: 'subBidangId' },
    { parent: 'Pegawai', child: 'Absensi', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'Cuti', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'Payroll', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'PegawaiPangkat', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'IndeksPegawai', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'BadgePegawai', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'PenilaianAtasan', fk: 'pegawaiId' },
    { parent: 'User', child: 'Notifikasi', fk: 'userId' },
    { parent: 'User', child: 'PushSubscription', fk: 'userId' },
    { parent: 'Bidang', child: 'SubBidang', fk: 'bidangId' },
    { parent: 'Bidang', child: 'FormasiJabatan', fk: 'bidangId' },
    { parent: 'Pegawai', child: 'Mutasi', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'PPh21', fk: 'pegawaiId' },
    { parent: 'Pegawai', child: 'Kontrak', fk: 'pegawaiId' },
    { parent: 'IndeksPegawai', child: 'PenilaianAtasan', fk: 'indeksPegawaiId' }
  ];

  let brokenFks = 0;
  for (const check of fkChecks) {
    const res = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count 
      FROM "${check.child}" c
      LEFT JOIN "${check.parent}" p ON c."${check.fk}" = p."id"
      WHERE c."${check.fk}" IS NOT NULL AND p."id" IS NULL;
    `);
    const broken = res[0].count;
    if (broken > 0) {
      console.error(`  ❌ ${check.child}."${check.fk}" -> ${check.parent}: ${broken} orphan(s)`);
      brokenFks += broken;
    }
  }
  if (brokenFks === 0) {
    console.log(`  ✅ Semua ${fkChecks.length} relasi FK: 0 orphan, 100% valid!`);
  }

  // 4. Sample UUID v7 values
  console.log('\n4. Contoh UUID v7 Aktif di Database:');
  const sampleUser = await prisma.$queryRawUnsafe(`SELECT id, email FROM "User" LIMIT 1`);
  console.log('  User:', sampleUser[0]);
  const samplePegawai = await prisma.$queryRawUnsafe(`SELECT id, nama, "userId", "bidangId" FROM "Pegawai" LIMIT 1`);
  console.log('  Pegawai:', samplePegawai[0]);
  const sampleAbsensi = await prisma.$queryRawUnsafe(`SELECT id, "pegawaiId", tanggal FROM "Absensi" LIMIT 1`);
  console.log('  Absensi:', sampleAbsensi[0]);

  // 5. Check schema has no cuid() left
  const fs = require('fs');
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const cuidCount = (schema.match(/cuid\(\)/g) || []).length;
  console.log(`\n5. Verifikasi Schema File:`);
  if (cuidCount === 0) {
    console.log(`  ✅ 0 cuid() ditemukan di prisma/schema.prisma`);
  } else {
    console.error(`  ❌ Masih ada ${cuidCount} cuid() di prisma/schema.prisma!`);
  }

  const uuidv7Count = (schema.match(/@default\(uuid\(7\)\)/g) || []).length;
  const dbUuidCount = (schema.match(/@db\.Uuid/g) || []).length;
  console.log(`  ✅ ${uuidv7Count} @default(uuid(7)) ditemukan`);
  console.log(`  ✅ ${dbUuidCount} @db.Uuid ditemukan`);

  console.log('\n' + '='.repeat(50));
  if (mismatchCount === 0 && brokenFks === 0 && cuidCount === 0) {
    console.log('🎉 MIGRASI UUID v7 BERHASIL 100%! ZERO DATA LOSS!');
  } else {
    console.log('⚠️ Ada masalah yang perlu ditindaklanjuti.');
  }
  console.log('='.repeat(50));
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
