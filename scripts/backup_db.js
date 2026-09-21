const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('--- Memulai Backup Database Neon PostgreSQL ---');
  
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    'user',
    'bidang',
    'subBidang',
    'formasiJabatan',
    'lokasiAbsensi',
    'standarGajiPangkat',
    'shift',
    'aiConfig',
    'bannerPwa',
    'pengumuman',
    'pengaturan',
    'arsipSurat',
    'importFingerprint',
    'pegawai',
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
    'auditLog',
    'jadwalShift',
    'lembur',
    'pPh21',
    'kontrak',
    'penukaranPoin',
    'indeksPegawai',
    'badgePegawai',
    'penilaianAtasan'
  ];

  const backupData = {};
  let totalRows = 0;

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

  for (const table of tables) {
    if (prisma[table]) {
      try {
        let rows;
        try {
          rows = await prisma[table].findMany();
        } catch (findErr) {
          console.warn(`⚠️ findMany gagal untuk ${table} (${findErr.message}), mencoba raw query...`);
          const sqlTable = modelToTable[table] || table;
          rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${sqlTable}"`);
        }
        backupData[table] = rows;
        totalRows += rows.length;
        console.log(`✓ ${table}: ${rows.length} rows`);
      } catch (err) {
        console.error(`✗ Gagal membaca tabel ${table}:`, err.message);
        backupData[table] = [];
      }
    }
  }

  const backupFile = path.join(backupDir, 'db_backup_pre_uuidv7.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n✅ Backup SELESAI: ${totalRows} baris tersimpan di ${backupFile}`);
}

backup()
  .catch((e) => {
    console.error('Fatal backup error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
