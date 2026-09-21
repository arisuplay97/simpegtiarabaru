const fs = require('fs');

const data = JSON.parse(fs.readFileSync('backup/db_data_uuidv7.json', 'utf8'));

// Collect all existing IDs by table
const idSets = {};
for (const [table, rows] of Object.entries(data)) {
  idSets[table] = new Set(rows.map(r => r.id));
}

console.log('=== CHECKING FK INTEGRITY IN BACKUP ===');

function checkFk(table, fkName, targetTable) {
  const rows = data[table] || [];
  let valid = 0;
  let orphans = 0;
  let nulls = 0;

  for (const r of rows) {
    const val = r[fkName];
    if (val === null || val === undefined) {
      nulls++;
    } else if (idSets[targetTable] && idSets[targetTable].has(val)) {
      valid++;
    } else {
      orphans++;
      console.warn(`[ORPHAN FK] ${table}.${fkName} = "${val}" NOT FOUND in ${targetTable}.id`);
    }
  }
  console.log(`${table}.${fkName} -> ${targetTable}: ${valid} valid, ${orphans} orphans, ${nulls} nulls`);
}

checkFk('subBidang', 'bidangId', 'bidang');
checkFk('formasiJabatan', 'bidangId', 'bidang');
checkFk('pegawai', 'bidangId', 'bidang');
checkFk('pegawai', 'subBidangId', 'subBidang');
checkFk('pegawai', 'userId', 'user');
checkFk('pegawai', 'lokasiAbsensiId', 'lokasiAbsensi');
checkFk('absensi', 'pegawaiId', 'pegawai');
checkFk('cuti', 'pegawaiId', 'pegawai');
checkFk('mutasi', 'pegawaiId', 'pegawai');
checkFk('kenaikanPangkat', 'pegawaiId', 'pegawai');
checkFk('payroll', 'pegawaiId', 'pegawai');
checkFk('suratPeringatan', 'pegawaiId', 'pegawai');
checkFk('pegawaiJabatan', 'pegawaiId', 'pegawai');
checkFk('pegawaiPangkat', 'pegawaiId', 'pegawai');
checkFk('notifikasi', 'userId', 'user');
checkFk('pushSubscription', 'userId', 'user');
checkFk('pPh21', 'pegawaiId', 'pegawai');
checkFk('kontrak', 'pegawaiId', 'pegawai');
checkFk('indeksPegawai', 'pegawaiId', 'pegawai');
checkFk('badgePegawai', 'pegawaiId', 'pegawai');
checkFk('penilaianAtasan', 'pegawaiId', 'pegawai');
checkFk('penilaianAtasan', 'penilaiId', 'pegawai');
checkFk('penilaianAtasan', 'indeksPegawaiId', 'indeksPegawai');
