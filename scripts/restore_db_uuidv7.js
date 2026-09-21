const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

const dataFile = path.join(__dirname, '..', 'backup', 'db_data_uuidv7.json');
const dbData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Helper to convert date strings to Date objects
function normalizeRow(row) {
  const norm = { ...row };
  for (const [k, v] of Object.entries(norm)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      norm[k] = new Date(v);
    }
  }
  return norm;
}

// Ordered table list by dependency (Parents first -> Children last)
const insertionOrder = [
  // Level 1: Standalone / Independent parents
  'user',
  'bidang',
  'lokasiAbsensi',
  'standarGajiPangkat',
  'shift',
  'importFingerprint',
  'aiConfig',
  'pengaturan',
  'bannerPwa',
  'arsipSurat',
  
  // Level 2: Depends on Bidang
  'subBidang',
  'formasiJabatan',
  
  // Level 3: Depends on User, Bidang, SubBidang, LokasiAbsensi
  'pegawai',
  
  // Level 4: Depends on Pegawai
  'indeksPegawai',
  
  // Level 5: Depends on Pegawai and/or IndeksPegawai / Shift
  'penilaianAtasan',
  'badgePegawai',
  'absensi',
  'cuti',
  'mutasi',
  'kGB',
  'kenaikanPangkat',
  'payroll',
  'kPI',
  'slipGaji',
  'suratPeringatan',
  'pegawaiKeluarga',
  'pegawaiPendidikan',
  'pegawaiJabatan',
  'pegawaiPangkat',
  'pegawaiPelatihan',
  'pegawaiDokumen',
  'notifikasi',
  'pushSubscription',
  'jadwalShift',
  'lembur',
  'pPh21',
  'kontrak',
  'penukaranPoin',
  'auditLog'
];

const modelToTable = {
  user: 'User',
  bidang: 'Bidang',
  subBidang: 'SubBidang',
  formasiJabatan: 'FormasiJabatan',
  lokasiAbsensi: 'LokasiAbsensi',
  standarGajiPangkat: 'StandarGajiPangkat',
  shift: 'Shift',
  aiConfig: 'AiConfig',
  bannerPwa: 'BannerPwa',
  pengumuman: 'Pengumuman',
  pengaturan: 'Pengaturan',
  arsipSurat: 'ArsipSurat',
  importFingerprint: 'ImportFingerprint',
  pegawai: 'Pegawai',
  absensi: 'Absensi',
  cuti: 'Cuti',
  mutasi: 'Mutasi',
  kGB: 'KGB',
  kenaikanPangkat: 'KenaikanPangkat',
  payroll: 'Payroll',
  kPI: 'KPI',
  slipGaji: 'SlipGaji',
  suratPeringatan: 'SuratPeringatan',
  pegawaiKeluarga: 'PegawaiKeluarga',
  pegawaiPendidikan: 'PegawaiPendidikan',
  pegawaiJabatan: 'PegawaiJabatan',
  pegawaiPangkat: 'PegawaiPangkat',
  pegawaiPelatihan: 'PegawaiPelatihan',
  pegawaiDokumen: 'PegawaiDokumen',
  notifikasi: 'Notifikasi',
  pushSubscription: 'PushSubscription',
  auditLog: 'AuditLog',
  jadwalShift: 'JadwalShift',
  lembur: 'Lembur',
  pPh21: 'PPh21',
  kontrak: 'Kontrak',
  penukaranPoin: 'PenukaranPoin',
  indeksPegawai: 'IndeksPegawai',
  badgePegawai: 'BadgePegawai',
  penilaianAtasan: 'PenilaianAtasan'
};

async function runMigration() {
  console.log('=== 1. TRUNCATE SEMUA TABEL DATABASE (DENGAN CASCADE) ===');
  const existingTables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
  `);
  const allSqlTables = existingTables.map(t => `"${t.table_name}"`).join(', ');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${allSqlTables} CASCADE;`);
    console.log('✓ Semua tabel berhasil dikosongkan.');
  } catch (err) {
    console.error('Gagal truncate:', err.message);
    throw err;
  }

  await prisma.$disconnect();

  console.log('\n=== 2. MENERAPKAN STRUKTUR UUID v7 (PRISMA DB PUSH) ===');
  try {
    const pushOutput = execSync('cmd /c npx prisma db push --accept-data-loss', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(pushOutput);
  } catch (pushErr) {
    console.error('Error saat prisma db push:', pushErr.stdout || pushErr.message);
    throw pushErr;
  }

  // Reconnect prisma client
  const prismaNew = new PrismaClient();

  console.log('\n=== 3. MERESTORE DATA DENGAN UUID v7 ===');
  let totalRestored = 0;

  for (const modelKey of insertionOrder) {
    const rows = dbData[modelKey] || [];
    if (rows.length === 0) {
      console.log(`- ${modelKey}: 0 baris (dilewati)`);
      continue;
    }

    const normalizedRows = rows.map(normalizeRow);

    try {
      // Use createMany in chunks of 100 for maximum performance
      const CHUNK_SIZE = 100;
      for (let i = 0; i < normalizedRows.length; i += CHUNK_SIZE) {
        const chunk = normalizedRows.slice(i, i + CHUNK_SIZE);
        await prismaNew[modelKey].createMany({
          data: chunk
        });
      }
      totalRestored += rows.length;
      console.log(`✓ ${modelKey}: ${rows.length} baris berhasil direstore`);
    } catch (createErr) {
      console.warn(`⚠️ createMany gagal untuk ${modelKey}: ${createErr.message}. Mencoba baris-per-baris...`);
      let singleSuccess = 0;
      for (const row of normalizedRows) {
        try {
          await prismaNew[modelKey].create({ data: row });
          singleSuccess++;
        } catch (singleErr) {
          console.error(`✗ Gagal insert ${modelKey} (id: ${row.id}):`, singleErr.message);
        }
      }
      totalRestored += singleSuccess;
      console.log(`✓ ${modelKey}: ${singleSuccess}/${rows.length} baris berhasil`);
    }
  }

  console.log(`\n✅ RESTORE SELESAI: Total ${totalRestored} baris tersimpan ke database.`);
  await prismaNew.$disconnect();
}

runMigration()
  .catch((err) => {
    console.error('FATAL ERROR MIGRATION:', err);
    process.exit(1);
  });
