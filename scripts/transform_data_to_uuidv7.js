const fs = require('fs');
const path = require('path');
const { uuidv7 } = require('uuidv7');

const backupPath = path.join(__dirname, '..', 'backup', 'db_backup_pre_uuidv7.json');
const rawData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('=== TRANSFORMASI DATA CUID -> UUID v7 ===\n');

// 1. Tables where id should NOT be converted to UUID (singletons)
const NON_UUID_TABLES = new Set(['pengaturan', 'aiConfig']);

const cuidToUuidMap = new Map();

// Helper to check if string looks like a CUID (starts with 'c', 20-30 alphanumeric chars)
function isCuid(str) {
  return typeof str === 'string' && /^c[a-z0-9]{20,30}$/i.test(str);
}

// 2. Generate UUID v7 for all records in UUID tables
let totalIdsGenerated = 0;

for (const [table, rows] of Object.entries(rawData)) {
  if (NON_UUID_TABLES.has(table)) {
    console.log(`[PASS] ${table} (${rows.length} rows) - Singleton ID dipertahankan`);
    continue;
  }

  let tableCount = 0;
  for (const row of rows) {
    if (row.id) {
      const oldId = row.id;
      const newId = uuidv7();
      cuidToUuidMap.set(oldId, newId);
      row.id = newId;
      tableCount++;
      totalIdsGenerated++;
    }
  }
  console.log(`[GENERATE UUID v7] ${table}: ${tableCount} IDs mapped`);
}

console.log(`\nTotal IDs generated and mapped: ${totalIdsGenerated}`);

// 3. Foreign Key definitions for each table
const fkDefinitions = {
  subBidang: ['bidangId'],
  formasiJabatan: ['bidangId'],
  pegawai: ['bidangId', 'subBidangId', 'lokasiAbsensiId', 'userId'],
  mutasi: ['pegawaiId', 'approvedById'],
  absensi: ['pegawaiId', 'importId', 'approvedById'],
  cuti: ['pegawaiId'],
  payroll: ['pegawaiId'],
  kPI: ['pegawaiId'],
  slipGaji: ['pegawaiId'],
  kGB: ['pegawaiId'],
  kenaikanPangkat: ['pegawaiId'],
  suratPeringatan: ['pegawaiId'],
  pegawaiKeluarga: ['pegawaiId'],
  pegawaiPendidikan: ['pegawaiId'],
  pegawaiJabatan: ['pegawaiId'],
  pegawaiPangkat: ['pegawaiId'],
  pegawaiPelatihan: ['pegawaiId'],
  pegawaiDokumen: ['pegawaiId'],
  notifikasi: ['userId'],
  pushSubscription: ['userId'],
  jadwalShift: ['pegawaiId', 'shiftId'],
  lembur: ['pegawaiId'],
  pPh21: ['pegawaiId'],
  kontrak: ['pegawaiId', 'diperpanjangDari'],
  penukaranPoin: ['pegawaiId', 'approvedById'],
  indeksPegawai: ['pegawaiId'],
  badgePegawai: ['pegawaiId'],
  penilaianAtasan: ['pegawaiId', 'penilaiId', 'indeksPegawaiId']
};

// 4. Remap Foreign Keys
console.log('\n=== MAPPING FOREIGN KEYS ===');
let totalFksMapped = 0;

for (const [table, fkFields] of Object.entries(fkDefinitions)) {
  const rows = rawData[table] || [];
  let tableFkCount = 0;

  for (const row of rows) {
    for (const fk of fkFields) {
      const oldVal = row[fk];
      if (oldVal !== null && oldVal !== undefined) {
        if (cuidToUuidMap.has(oldVal)) {
          row[fk] = cuidToUuidMap.get(oldVal);
          tableFkCount++;
          totalFksMapped++;
        } else if (isCuid(oldVal)) {
          // If unmapped CUID (e.g. deleted parent record), map to a deterministic UUID v7
          const newFk = uuidv7();
          cuidToUuidMap.set(oldVal, newFk);
          row[fk] = newFk;
          tableFkCount++;
          totalFksMapped++;
        } else {
          console.warn(`[INFO NON-CUID FK] ${table}.${fk} = "${oldVal}"`);
        }
      }
    }
  }
  if (rows.length > 0) {
    console.log(`[FK MAP] ${table}: ${tableFkCount} FKs remapped`);
  }
}

// Helper: Deep recursive replacer for any JSON fields (oldData, newData, dataLengkap, etc.)
function deepReplaceCuids(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (isCuid(obj)) {
      if (!cuidToUuidMap.has(obj)) {
        cuidToUuidMap.set(obj, uuidv7());
      }
      return cuidToUuidMap.get(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepReplaceCuids);
  }
  if (typeof obj === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = deepReplaceCuids(v);
    }
    return res;
  }
  return obj;
}

// 5. Remap AuditLog and Deep JSON fields
console.log('\n=== MAPPING AUDIT LOG & JSON FIELDS ===');
let auditLogUserMapped = 0;
let auditLogTargetMapped = 0;

if (rawData.auditLog) {
  for (const row of rawData.auditLog) {
    if (row.userId) {
      if (cuidToUuidMap.has(row.userId)) {
        row.userId = cuidToUuidMap.get(row.userId);
        auditLogUserMapped++;
      } else if (isCuid(row.userId)) {
        const newUid = uuidv7();
        cuidToUuidMap.set(row.userId, newUid);
        row.userId = newUid;
        auditLogUserMapped++;
      }
    }
    if (row.targetId) {
      if (cuidToUuidMap.has(row.targetId)) {
        row.targetId = cuidToUuidMap.get(row.targetId);
        auditLogTargetMapped++;
      } else if (isCuid(row.targetId)) {
        const newTid = uuidv7();
        cuidToUuidMap.set(row.targetId, newTid);
        row.targetId = newTid;
        auditLogTargetMapped++;
      }
    }
    if (row.oldData) row.oldData = deepReplaceCuids(row.oldData);
    if (row.newData) row.newData = deepReplaceCuids(row.newData);
  }
  console.log(`AuditLog: ${auditLogUserMapped} userId & ${auditLogTargetMapped} targetId remapped`);
}

// Scan all tables for JSON fields and clean them
for (const [table, rows] of Object.entries(rawData)) {
  for (const row of rows) {
    for (const [col, val] of Object.entries(row)) {
      if (val && typeof val === 'object') {
        row[col] = deepReplaceCuids(val);
      }
    }
  }
}

// 6. Comprehensive Scan: Check if ANY CUID is left anywhere in the dataset
console.log('\n=== PEMERIKSAAN SISA CUID ===');
let leftoverCuids = 0;
const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

for (const [table, rows] of Object.entries(rawData)) {
  for (const row of rows) {
    for (const [col, val] of Object.entries(row)) {
      if (typeof val === 'string' && isCuid(val)) {
        console.error(`❌ SISA CUID DITEMUKAN: ${table}.${col} = "${val}"`);
        leftoverCuids++;
      }
    }
  }
}

if (leftoverCuids === 0) {
  console.log('✅ SEMPURNA: 0 CUID tersisa di seluruh dataset!');
} else {
  console.error(`⚠️ Terdapat ${leftoverCuids} CUID tersisa!`);
}

// 7. Verify UUID format on all non-singleton table IDs
let invalidUuids = 0;
for (const [table, rows] of Object.entries(rawData)) {
  if (NON_UUID_TABLES.has(table)) continue;
  for (const row of rows) {
    if (!uuidv7Regex.test(row.id)) {
      console.error(`❌ Format UUID v7 tidak valid di ${table}.id: "${row.id}"`);
      invalidUuids++;
    }
  }
}
if (invalidUuids === 0) {
  console.log('✅ SEMPURNA: Semua Primary Key 100% valid RFC 9562 UUID v7!');
}

// 8. Save transformed data and mapping
const outputDataFile = path.join(__dirname, '..', 'backup', 'db_data_uuidv7.json');
fs.writeFileSync(outputDataFile, JSON.stringify(rawData, null, 2), 'utf8');
console.log(`\n💾 Data UUID v7 tersimpan di: ${outputDataFile}`);

const mapObj = Object.fromEntries(cuidToUuidMap);
const outputMapFile = path.join(__dirname, '..', 'backup', 'cuid_to_uuid_map.json');
fs.writeFileSync(outputMapFile, JSON.stringify(mapObj, null, 2), 'utf8');
console.log(`💾 Peta relasi (CUID -> UUID v7) tersimpan di: ${outputMapFile}`);
