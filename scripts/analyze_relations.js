const fs = require('fs');

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const lines = schema.split('\n');
let currentModel = null;
const models = {};

for (const line of lines) {
  const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
    models[currentModel] = {
      pks: [],
      fks: [],
      fields: {}
    };
    continue;
  }
  if (line.trim().startsWith('}')) {
    currentModel = null;
    continue;
  }
  if (!currentModel) continue;

  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

  const parts = trimmed.split(/\s+/);
  const fieldName = parts[0];
  const fieldType = parts[1];

  models[currentModel].fields[fieldName] = {
    type: fieldType,
    line: trimmed
  };

  if (trimmed.includes('@id')) {
    models[currentModel].pks.push({ fieldName, type: fieldType, line: trimmed });
  }

  const relationMatch = trimmed.match(/@relation\(([^)]+)\)/);
  if (relationMatch) {
    const relProps = relationMatch[1];
    const fieldsMatch = relProps.match(/fields:\s*\[([^\]]+)\]/);
    const refsMatch = relProps.match(/references:\s*\[([^\]]+)\]/);
    if (fieldsMatch && refsMatch) {
      const fkField = fieldsMatch[1].trim();
      const refField = refsMatch[1].trim();
      models[currentModel].fks.push({
        fkField,
        targetModel: fieldType.replace('?', '').replace('[]', ''),
        refField
      });
    }
  }
}

console.log('--- MODELS & FOREIGN KEYS SUMMARY ---');
for (const [mName, mInfo] of Object.entries(models)) {
  console.log(`\nModel: ${mName}`);
  console.log(`  PKs:`, mInfo.pks.map(p => `${p.fieldName} (${p.type})`).join(', '));
  if (mInfo.fks.length > 0) {
    console.log(`  FKs:`);
    for (const fk of mInfo.fks) {
      console.log(`    - ${fk.fkField} -> ${fk.targetModel}.${fk.refField}`);
    }
  }
}
