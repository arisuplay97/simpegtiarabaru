const fs = require('fs');

const data = JSON.parse(fs.readFileSync('backup/db_backup_pre_uuidv7.json', 'utf8'));

console.log('=== INSPECTING ALL ID AND FK FIELDS ===');
for (const [table, rows] of Object.entries(data)) {
  if (!rows || rows.length === 0) continue;
  const sample = rows[0];
  const idFields = Object.keys(sample).filter(k => k === 'id' || k.endsWith('Id'));
  console.log(`\nTable: ${table} (${rows.length} rows)`);
  for (const f of idFields) {
    const nonNull = rows.filter(r => r[f] !== null && r[f] !== undefined);
    const sampleVal = nonNull[0] ? nonNull[0][f] : 'null';
    console.log(`  ${f}: ${nonNull.length}/${rows.length} non-null (sample: "${sampleVal}")`);
  }
}
